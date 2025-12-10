import { DurableObject } from "cloudflare:workers";
import type { DemoItem, Schedule, ScheduleLog } from '@shared/types';
import { MOCK_ITEMS } from '@shared/mock-data';
const LOG_CAP = 5000;
// **DO NOT MODIFY THE CLASS NAME**
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
    async decrement(amount = 1): Promise<number> {
      let value: number = (await this.ctx.storage.get("counter_value")) || 0;
      value -= amount;
      await this.ctx.storage.put("counter_value", value);
      return value;
    }
    async getDemoItems(): Promise<DemoItem[]> {
      const items = await this.ctx.storage.get<DemoItem[]>("demo_items");
      if (items) {
        return items;
      }
      await this.ctx.storage.put("demo_items", MOCK_ITEMS);
      return MOCK_ITEMS;
    }
    async addDemoItem(item: DemoItem): Promise<DemoItem[]> {
      const items = await this.getDemoItems();
      const updatedItems = [...items, item];
      await this.ctx.storage.put("demo_items", updatedItems);
      return updatedItems;
    }
    async updateDemoItem(id: string, updates: Partial<Omit<DemoItem, 'id'>>): Promise<DemoItem[]> {
      const items = await this.getDemoItems();
      const updatedItems = items.map(item =>
        item.id === id ? { ...item, ...updates } : item
      );
      await this.ctx.storage.put("demo_items", updatedItems);
      return updatedItems;
    }
    async deleteDemoItem(id: string): Promise<DemoItem[]> {
      const items = await this.getDemoItems();
      const updatedItems = items.filter(item => item.id !== id);
      await this.ctx.storage.put("demo_items", updatedItems);
      return updatedItems;
    }
    // --- New Schedule & Log Methods ---
    async getSchedules(): Promise<Schedule[]> {
        return (await this.ctx.storage.get<Schedule[]>("schedules")) || [];
    }
    async addSchedule(schedule: Schedule): Promise<Schedule> {
        const schedules = await this.getSchedules();
        schedules.push(schedule);
        await this.ctx.storage.put("schedules", schedules);
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
        // Cap the logs to the most recent LOG_CAP entries
        const cappedLogs = logs.slice(-LOG_CAP);
        await this.ctx.storage.put("logs", cappedLogs);
    }
}