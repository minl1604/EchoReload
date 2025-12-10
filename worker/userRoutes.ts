import { Hono } from "hono";
import { z } from 'zod';
import { Env } from './core-utils';
import type { DemoItem, ApiResponse, Schedule, ScheduleLog, ReportBody, Settings, ConsentProof } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';
// Simple in-memory rate limiter (resets on worker restart)
const rateLimitMap = new Map<string, { count: number, expiry: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 30;
async function hash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const buffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(buffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // Rate Limiting Middleware
    app.use('/api/*', async (c, next) => {
        const ip = c.req.header('cf-connecting-ip') || '127.0.0.1';
        const now = Date.now();
        const record = rateLimitMap.get(ip);
        if (record && now < record.expiry) {
            if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
                return c.json({ success: false, error: 'Rate limit exceeded. Please try again later.' }, 429);
            }
            record.count++;
        } else {
            rateLimitMap.set(ip, { count: 1, expiry: now + RATE_LIMIT_WINDOW_MS });
        }
        await next();
    });
    // --- Schedule Routes ---
    app.get('/api/schedules', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.getSchedules();
        return c.json({ success: true, data } satisfies ApiResponse<Schedule[]>);
    });
    app.post('/api/schedules', async (c) => {
        const body = await c.req.json<Omit<Schedule, 'id' | 'createdAt' | 'status'>>();
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const settings = await stub.getSettings();
        if (body.intervalSeconds < settings.minInterval) {
            return c.json({ success: false, error: `Interval must be at least ${settings.minInterval} seconds.` }, 400);
        }
        const userAgent = c.req.header('user-agent') || 'unknown';
        const userAgentHash = await hash(userAgent);
        const newSchedule: Schedule = {
            ...body,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            status: 'running',
            consentProof: {
                userAgentHash,
                timestamp: new Date().toISOString(),
            }
        };
        const data = await stub.addSchedule(newSchedule);
        return c.json({ success: true, data } satisfies ApiResponse<Schedule>, 201);
    });
    app.put('/api/schedules/:id', async (c) => {
        const id = c.req.param('id');
        const body = await c.req.json<Partial<Schedule>>();
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.updateSchedule(id, body);
        if (!data) return c.json({ success: false, error: 'Schedule not found' }, 404);
        return c.json({ success: true, data } satisfies ApiResponse<Schedule>);
    });
    app.delete('/api/schedules/:id', async (c) => {
        const id = c.req.param('id');
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const success = await stub.deleteSchedule(id);
        if (!success) return c.json({ success: false, error: 'Schedule not found' }, 404);
        return c.json({ success: true });
    });
    // --- Reporting & Log Routes ---
    app.post('/api/reports', async (c) => {
        const body = await c.req.json<ReportBody>();
        const newLog: ScheduleLog = { ...body, id: uuidv4() };
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        await stub.addLog(newLog);
        return c.json({ success: true });
    });
    app.get('/api/logs', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.getLogs();
        return c.json({ success: true, data } satisfies ApiResponse<ScheduleLog[]>);
    });
    // --- Settings & Audit Routes ---
    app.get('/api/settings', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.getSettings();
        return c.json({ success: true, data } satisfies ApiResponse<Settings>);
    });
    app.put('/api/settings', async (c) => {
        const body = await c.req.json();
        const schema = z.object({
            minInterval: z.number().min(5),
            dailyCap: z.number().min(1),
            maxConcurrency: z.number().min(1),
        });
        const validation = schema.safeParse(body);
        if (!validation.success) {
            return c.json({ success: false, error: validation.error.flatten() }, 400);
        }
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.updateSettings(validation.data);
        return c.json({ success: true, data } satisfies ApiResponse<Settings>);
    });
    app.get('/api/audit', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.getAuditLogs();
        return c.json({ success: true, data } satisfies ApiResponse<ConsentProof[]>);
    });
}