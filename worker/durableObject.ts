import { DurableObject } from "cloudflare:workers";
import type { DemoItem, Schedule, ScheduleLog, Settings, ConsentProof } from '@shared/types';
import { MOCK_ITEMS } from '@shared/mock-data';
const LOG_CAP = 5000;
const AUDIT_CAP = 1000;
export class GlobalDurableObject extends DurableObject {
    // --- Existing Demo Methods ---
    async getCounterValue(): Promise<number> {
      const value = (await this.ctx.storage.get("counter_value")) || 0;
      return value as number;
    }
    async increment(amount = 1): Promise<number> {
      let value: number = (await this.ctx.storage.get("counter_value")) || 0;
      value += amount;
      await this.ctx.storage.put("counter_value", value);
      return value;
    }
    async getDemoItems(): Promise<DemoItem[]> {
      const items = await this.ctx.storage.get<DemoItem[]>("demo_items");
      if (items) return items;
      await this.ctx.storage.put("demo_items", MOCK_ITEMS);
      return MOCK_ITEMS;
    }
    // --- New Schedule & Log Methods ---
    async getSchedules(): Promise<Schedule[]> {
        return (await this.ctx.storage.get<Schedule[]>("schedules")) || [];
    }
    async addSchedule(schedule: Schedule): Promise<Schedule> {
        const schedules = await this.getSchedules();
        schedules.push(schedule);
        await this.ctx.storage.put("schedules", schedules);
        // Add to audit log
        if (schedule.consentProof) {
            const audits = await this.getAuditLogs();
            audits.push(schedule.consentProof);
            const cappedAudits = audits.slice(-AUDIT_CAP);
            await this.ctx.storage.put('audit_logs', cappedAudits);
        }
        return schedule;
    }
    async updateSchedule(id: string, updates: Partial<Schedule>): Promise<Schedule | null> {
        const schedules = await this.getSchedules();
        let updatedSchedule: Schedule | null = null;
        const updatedSchedules = schedules.map(s => {
            if (s.id === id) {
                updatedSchedule = { ...s, ...updates };
                return updatedSchedule;
            }
            return s;
        });
        if (updatedSchedule) {
            await this.ctx.storage.put("schedules", updatedSchedules);
        }
        return updatedSchedule;
    }
    async deleteSchedule(id: string): Promise<boolean> {
        const schedules = await this.getSchedules();
        const newSchedules = schedules.filter(s => s.id !== id);
        if (newSchedules.length < schedules.length) {
            await this.ctx.storage.put("schedules", newSchedules);
            return true;
        }
        return false;
    }
    async getLogs(scheduleId?: string): Promise<ScheduleLog[]> {
        const allLogs = (await this.ctx.storage.get<ScheduleLog[]>("logs")) || [];
        if (scheduleId) {
            return allLogs.filter(log => log.scheduleId === scheduleId);
        }
        return allLogs;
    }
    async addLog(log: ScheduleLog): Promise<void> {
        const logs = await this.getLogs();
        logs.push(log);
        const cappedLogs = logs.slice(-LOG_CAP);
        await this.ctx.storage.put("logs", cappedLogs);
    }
    // --- New Settings & Audit Methods ---
    async getSettings(): Promise<Settings> {
        const settings = await this.ctx.storage.get<Settings>('settings');
        return settings || { minInterval: 5, dailyCap: 1000, maxConcurrency: 5 };
    }
    async updateSettings(updates: Partial<Settings>): Promise<Settings> {
        const current = await this.getSettings();
        const updated = { ...current, ...updates };
        await this.ctx.storage.put('settings', updated);
        return updated;
    }
    async getAuditLogs(): Promise<ConsentProof[]> {
        return (await this.ctx.storage.get<ConsentProof[]>('audit_logs')) || [];
    }
}