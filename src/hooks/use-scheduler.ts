import { useState, useEffect, useRef, useCallback } from 'react';
import { Schedule, ReportBody } from '@shared/types';
import { toast } from 'sonner';
interface SchedulerControls {
  start: (newSchedule: Schedule, opener?: Window | null) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  activeSchedule: Schedule | null;
  countdown: number;
  runsCompleted: number;
  isRunning: boolean;
}
async function reportWithRetry(report: ReportBody, retries = 3): Promise<void> {
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report),
      });
      if (res.ok) {
        console.log('[SCHEDULER] Report sent successfully.');
        return;
      }
      throw new Error(`Server responded with status ${res.status}`);
    } catch (err) {
      console.error(`[SCHEDULER] Report attempt ${i + 1} failed:`, err);
      if (i === retries - 1) {
        toast.error(`Failed to send report after ${retries} attempts.`);
        throw err; // re-throw the last error
      }
      await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s before retrying
    }
  }
}
export function useScheduler(): SchedulerControls {
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [runsCompleted, setRunsCompleted] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const reloadWindowRef = useRef<Window | null>(null);
  const clearTimer = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);
  const stop = useCallback(() => {
    clearTimer();
    if (reloadWindowRef.current && !reloadWindowRef.current.closed) {
      try {
        reloadWindowRef.current.close();
      } catch (e) {
        console.error('[SCHEDULER ERROR] Could not close target window:', e);
      }
      reloadWindowRef.current = null;
    }
    if (activeSchedule) {
      toast.info(`Schedule "${activeSchedule.label}" stopped.`);
    }
    setActiveSchedule(null);
    setRunsCompleted(0);
    setIsRunning(false);
    setCountdown(0);
  }, [activeSchedule, clearTimer]);
  const performReload = useCallback(async () => {
    if (!activeSchedule) return;
    console.log(`[SCHEDULER] Firing reload for: ${activeSchedule.targetUrl}`);
    toast.success(`Reload triggered for ${activeSchedule.label}`);
    try {
      if (!reloadWindowRef.current || reloadWindowRef.current.closed) {
        reloadWindowRef.current = window.open(activeSchedule.targetUrl, '_blank');
      } else {
        reloadWindowRef.current.location.href = activeSchedule.targetUrl;
        reloadWindowRef.current.focus();
      }
    } catch (e) {
      console.error('[SCHEDULER ERROR] Failed to open or navigate window:', e);
      toast.error('Failed to control target window. It might be blocked or cross-origin.');
    }
    const report: ReportBody = {
      scheduleId: activeSchedule.id,
      timestamp: new Date().toISOString(),
      status: 'success',
    };
    await reportWithRetry(report);
    setRunsCompleted(prev => {
      const newCount = prev + 1;
      if (activeSchedule.count && newCount >= activeSchedule.count) {
        toast.success(`Schedule "${activeSchedule.label}" completed.`);
        stop();
      }
      return newCount;
    });
    if (activeSchedule.status === 'running') {
      setCountdown(activeSchedule.intervalSeconds);
    }
  }, [activeSchedule, stop]);
  const tick = useCallback(() => {
    setCountdown(prev => {
      if (prev <= 1) {
        performReload();
        return activeSchedule?.intervalSeconds ?? 0;
      }
      return prev - 1;
    });
  }, [performReload, activeSchedule?.intervalSeconds]);
  const start = useCallback((newSchedule: Schedule, opener?: Window | null) => {
    stop();
    try {
      new URL(newSchedule.targetUrl);
    } catch (e) {
      toast.error("Invalid target URL provided.");
      return;
    }
    toast("Scheduler started!", {
      description: "For best results, keep this tab active. Browsers may slow down timers in background tabs.",
    });
    if (opener) {
      reloadWindowRef.current = opener;
    } else {
      try {
        const opened = window.open('about:blank', '_blank');
        if (opened) {
          reloadWindowRef.current = opened;
        } else {
          throw new Error("window.open returned null");
        }
      } catch (e) {
        console.error('[SCHEDULER ERROR] Could not open control window:', e);
        toast.warning("Could not open control window. Popups may be blocked.");
      }
    }
    const safeInterval = Math.max(5, newSchedule.intervalSeconds);
    setActiveSchedule({ ...newSchedule, intervalSeconds: safeInterval, status: 'running' });
    setCountdown(safeInterval);
    setRunsCompleted(0);
    setIsRunning(true);
    intervalRef.current = setInterval(tick, 1000);
  }, [stop, tick]);
  const pause = useCallback(() => {
    if (activeSchedule && activeSchedule.status === 'running') {
      clearTimer();
      setActiveSchedule(s => s ? { ...s, status: 'paused' } : null);
      setIsRunning(false);
      toast.info(`Schedule "${activeSchedule.label}" paused.`);
    }
  }, [activeSchedule, clearTimer]);
  const resume = useCallback(() => {
    if (activeSchedule && activeSchedule.status === 'paused') {
      setActiveSchedule(s => s ? { ...s, status: 'running' } : null);
      setIsRunning(true);
      intervalRef.current = setInterval(tick, 1000);
      toast.info(`Schedule "${activeSchedule.label}" resumed.`);
    }
  }, [activeSchedule, tick]);
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!activeSchedule || activeSchedule.status !== 'running') return;
      if (document.visibilityState === 'hidden') {
        console.log('[SCHEDULER] Tab hidden, pausing timer to prevent throttling.');
        clearTimer();
      } else {
        console.log('[SCHEDULER] Tab visible, resuming timer.');
        intervalRef.current = setInterval(tick, 1000);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimer();
    };
  }, [activeSchedule, clearTimer, tick]);
  return { start, pause, resume, stop, activeSchedule, countdown, runsCompleted, isRunning };
}