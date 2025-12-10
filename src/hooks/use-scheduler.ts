import { useState, useEffect, useRef, useCallback } from 'react';
import { Schedule } from '@shared/types';
import { toast } from 'sonner';
interface SchedulerControls {
  start: (newSchedule: Schedule) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  activeSchedule: Schedule | null;
  countdown: number;
  runsCompleted: number;
}
export function useScheduler(): SchedulerControls {
  const [activeSchedule, setActiveSchedule] = useState<Schedule | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [runsCompleted, setRunsCompleted] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
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
      reloadWindowRef.current.close();
      reloadWindowRef.current = null;
    }
    if (activeSchedule) {
      toast.info(`Schedule "${activeSchedule.label}" stopped.`);
      setActiveSchedule(null);
    }
    setRunsCompleted(0);
  }, [activeSchedule, clearTimer]);
  const performReload = useCallback(() => {
    if (!activeSchedule) return;
    // In a real scenario, you might open a new tab.
    // For this demo, we'll just log it to avoid disruptive reloads.
    console.log(`[SCHEDULER] Firing reload for: ${activeSchedule.targetUrl}`);
    toast.success(`Reload triggered for ${activeSchedule.label}`);
    // Mock reporting to a backend
    fetch('/api/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: crypto.randomUUID(), name: `Log for ${activeSchedule.label}`, value: Date.now() }),
    }).catch(err => console.error("Mock report failed:", err));
    setRunsCompleted(prev => {
      const newCount = prev + 1;
      if (activeSchedule.count && newCount >= activeSchedule.count) {
        toast.success(`Schedule "${activeSchedule.label}" completed.`);
        stop();
      }
      return newCount;
    });
    setCountdown(activeSchedule.intervalSeconds);
  }, [activeSchedule, stop]);
  const tick = useCallback(() => {
    setCountdown(prev => {
      if (prev <= 1) {
        performReload();
        return activeSchedule?.intervalSeconds ?? 0;
      }
      return prev - 1;
    });
  }, [performReload, activeSchedule]);
  const start = useCallback((newSchedule: Schedule) => {
    stop(); // Stop any existing schedule
    // IMPORTANT: Inform user about browser limitations for background tabs.
    toast.warning("Scheduler started!", {
      description: "For best results, keep this tab active or open the target in a new window. Browsers may slow down timers in background tabs.",
    });
    const safeInterval = Math.max(5, newSchedule.intervalSeconds);
    setActiveSchedule({ ...newSchedule, intervalSeconds: safeInterval, status: 'running' });
    setCountdown(safeInterval);
    setRunsCompleted(0);
    intervalRef.current = setInterval(tick, 1000);
  }, [stop, tick]);
  const pause = useCallback(() => {
    if (activeSchedule && activeSchedule.status === 'running') {
      clearTimer();
      setActiveSchedule(s => s ? { ...s, status: 'paused' } : null);
      toast.info(`Schedule "${activeSchedule.label}" paused.`);
    }
  }, [activeSchedule, clearTimer]);
  const resume = useCallback(() => {
    if (activeSchedule && activeSchedule.status === 'paused') {
      setActiveSchedule(s => s ? { ...s, status: 'running' } : null);
      intervalRef.current = setInterval(tick, 1000);
      toast.info(`Schedule "${activeSchedule.label}" resumed.`);
    }
  }, [activeSchedule, tick]);
  useEffect(() => {
    return () => clearTimer();
  }, [clearTimer]);
  return { start, pause, resume, stop, activeSchedule, countdown, runsCompleted };
}