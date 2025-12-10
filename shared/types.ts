export interface DemoItem {
  id: string;
  name: string;
  value: number;
}
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
export type ScheduleStatus = 'running' | 'paused' | 'completed' | 'error';
export interface Schedule {
  id: string;
  label: string;
  targetUrl: string;
  intervalSeconds: number;
  count?: number;
  status: ScheduleStatus;
  createdAt: string;
}
export interface ScheduleLog {
  id: string;
  scheduleId: string;
  timestamp: string;
  status: 'success' | 'failure';
  message?: string;
}