export interface DemoItem {
  id: string;
  name: string;
  value: number;
}
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string | object;
}
export type ScheduleStatus = 'running' | 'paused' | 'completed' | 'error';
export interface ConsentProof {
  userAgentHash: string;
  timestamp: string;
}
export interface Schedule {
  id: string;
  label: string;
  targetUrl: string;
  intervalSeconds: number;
  count?: number;
  status: ScheduleStatus;
  createdAt: string;
  consentProof?: ConsentProof;
}
export interface ScheduleLog {
  id: string;
  scheduleId: string;
  timestamp: string;
  status: 'success' | 'failure';
  message?: string;
}
export type ReportBody = Omit<ScheduleLog, 'id'>;
export interface Settings {
  minInterval: number;
  dailyCap: number;
  maxConcurrency: number;
}