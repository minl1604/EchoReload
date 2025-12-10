import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PauseCircle, PlayCircle, StopCircle, Timer } from 'lucide-react';
import { Schedule } from '@shared/types';
interface ReloadCardProps {
  schedule: Schedule | null;
  countdown: number;
  runsCompleted: number;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
}
export function ReloadCard({ schedule, countdown, runsCompleted, onPause, onResume, onStop }: ReloadCardProps) {
  if (!schedule) {
    return (
      <Card className="w-full max-w-lg h-full flex flex-col items-center justify-center text-center bg-card/80 backdrop-blur-sm border-border/50 shadow-lg p-8">
        <Timer className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-xl font-semibold">Awaiting Schedule</h3>
        <p className="text-muted-foreground mt-2">Configure and start a new schedule to see its live status here.</p>
      </Card>
    );
  }
  const isPaused = schedule.status === 'paused';
  return (
    <Card className="w-full max-w-lg bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-bold">Live Monitor</CardTitle>
            <CardDescription className="truncate max-w-xs" title={schedule.label}>
              {schedule.label}
            </CardDescription>
          </div>
          <Badge variant={isPaused ? 'secondary' : 'default'} className={`capitalize ${schedule.status === 'running' ? 'animate-pulse' : ''}`}>
            {schedule.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Next reload in</p>
          <div className="text-6xl font-bold tabular-nums text-primary relative h-16 flex items-center justify-center">
            {isPaused ? (
              <motion.div
                key="paused"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative flex items-center justify-center"
              >
                <span>{countdown}s</span>
                <PauseCircle className="absolute size-8 text-muted-foreground opacity-50" />
              </motion.div>
            ) : (
              <AnimatePresence mode="popLayout">
                <motion.div
                  key={countdown}
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -20, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {countdown}s
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-sm text-muted-foreground">Completed</p>
            <p className="text-2xl font-semibold">{runsCompleted}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Runs</p>
            <p className="text-2xl font-semibold">{schedule.count ?? '∞'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isPaused ? (
            <Button onClick={onResume} className="w-full" variant="outline">
              <PlayCircle className="size-4 mr-2" /> Resume
            </Button>
          ) : (
            <Button onClick={onPause} className="w-full" variant="outline">
              <PauseCircle className="size-4 mr-2" /> Pause
            </Button>
          )}
          <Button onClick={onStop} className="w-full" variant="destructive">
            <StopCircle className="size-4 mr-2" /> Stop
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}