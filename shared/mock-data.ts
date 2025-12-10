import type { DemoItem, Schedule, ScheduleLog } from './types';
export const MOCK_ITEMS: DemoItem[] = [
  { id: '1', name: 'Demo Item A', value: 42 },
  { id: '2', name: 'Demo Item B', value: 73 }
];
export const MOCK_SCHEDULES: Schedule[] = [
  {
    id: 'sch_1',
    label: 'Production Health Check',
    targetUrl: 'https://cloudflare.com',
    intervalSeconds: 60,
    count: 100,
    status: 'running',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 'sch_2',
    label: 'Staging API Test',
    targetUrl: 'https://staging.api.example.dev',
    intervalSeconds: 15,
    status: 'paused',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 'sch_3',
    label: 'Daily QA Pass (Completed)',
    targetUrl: 'https://qa.example.com',
    intervalSeconds: 10,
    count: 50,
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
];
export const MOCK_LOGS: ScheduleLog[] = [
  { id: 'log_1', scheduleId: 'sch_1', timestamp: new Date().toISOString(), status: 'success' },
  { id: 'log_2', scheduleId: 'sch_1', timestamp: new Date(Date.now() - 1000 * 60).toISOString(), status: 'success' },
  { id: 'log_3', scheduleId: 'sch_3', timestamp: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(), status: 'success' },
  { id: 'log_4', scheduleId: 'sch_1', timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(), status: 'failure', message: 'Timeout after 5000ms' },
];