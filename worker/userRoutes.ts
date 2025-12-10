import { Hono } from "hono";
import { Env } from './core-utils';
import type { DemoItem, ApiResponse, Schedule, ScheduleLog, ReportBody } from '@shared/types';
import { v4 as uuidv4 } from 'uuid';
// Simple hashing function for user agent (non-crypto for privacy)
async function hash(text: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);
    const buffer = await crypto.subtle.digest('SHA-1', data);
    const hashArray = Array.from(new Uint8Array(buffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
export function userRoutes(app: Hono<{ Bindings: Env }>) {
    // --- New Schedule Routes ---
    app.get('/api/schedules', async (c) => {
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.getSchedules();
        return c.json({ success: true, data } satisfies ApiResponse<Schedule[]>);
    });
    app.post('/api/schedules', async (c) => {
        const body = await c.req.json<Omit<Schedule, 'id' | 'createdAt' | 'status'>>();
        if (body.intervalSeconds < 5) {
            return c.json({ success: false, error: 'Interval must be at least 5 seconds.' }, 400);
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
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.addSchedule(newSchedule);
        return c.json({ success: true, data } satisfies ApiResponse<Schedule>, 201);
    });
    app.put('/api/schedules/:id', async (c) => {
        const id = c.req.param('id');
        const body = await c.req.json<Partial<Schedule>>();
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.updateSchedule(id, body);
        if (!data) {
            return c.json({ success: false, error: 'Schedule not found' }, 404);
        }
        return c.json({ success: true, data } satisfies ApiResponse<Schedule>);
    });
    app.delete('/api/schedules/:id', async (c) => {
        const id = c.req.param('id');
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const success = await stub.deleteSchedule(id);
        if (!success) {
            return c.json({ success: false, error: 'Schedule not found' }, 404);
        }
        return c.json({ success: true });
    });
    // --- New Reporting Routes ---
    app.post('/api/reports', async (c) => {
        const body = await c.req.json<ReportBody>();
        const newLog: ScheduleLog = {
            ...body,
            id: uuidv4(),
        };
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        await stub.addLog(newLog);
        return c.json({ success: true });
    });
    app.get('/api/logs/:scheduleId', async (c) => {
        const scheduleId = c.req.param('scheduleId');
        const stub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await stub.getLogs(scheduleId);
        return c.json({ success: true, data } satisfies ApiResponse<ScheduleLog[]>);
    });
    // --- Existing Demo Routes ---
    app.get('/api/test', (c) => c.json({ success: true, data: { name: 'CF Workers Demo' }}));
    app.get('/api/demo', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.getDemoItems();
        return c.json({ success: true, data } satisfies ApiResponse<DemoItem[]>);
    });
    app.get('/api/counter', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.getCounterValue();
        return c.json({ success: true, data } satisfies ApiResponse<number>);
    });
    app.post('/api/counter/increment', async (c) => {
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.increment();
        return c.json({ success: true, data } satisfies ApiResponse<number>);
    });
    app.post('/api/demo', async (c) => {
        const body = await c.req.json() as DemoItem;
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.addDemoItem(body);
        return c.json({ success: true, data } satisfies ApiResponse<DemoItem[]>);
    });
    app.put('/api/demo/:id', async (c) => {
        const id = c.req.param('id');
        const body = await c.req.json() as Partial<Omit<DemoItem, 'id'>>;
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.updateDemoItem(id, body);
        return c.json({ success: true, data } satisfies ApiResponse<DemoItem[]>);
    });
    app.delete('/api/demo/:id', async (c) => {
        const id = c.req.param('id');
        const durableObjectStub = c.env.GlobalDurableObject.get(c.env.GlobalDurableObject.idFromName("global"));
        const data = await durableObjectStub.deleteDemoItem(id);
        return c.json({ success: true, data } satisfies ApiResponse<DemoItem[]>);
    });
}