import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Pause, Play, Trash2, RefreshCw, Download } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Schedule, ScheduleStatus, ApiResponse, ScheduleLog } from '@shared/types';
import { format, formatDistanceToNow } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
const statusVariant: { [key in ScheduleStatus]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
  running: 'default',
  paused: 'secondary',
  completed: 'outline',
  error: 'destructive',
};
async function fetchSchedules(): Promise<Schedule[]> {
  const res = await fetch('/api/schedules');
  const data: ApiResponse<Schedule[]> = await res.json();
  if (!data.success || !data.data) throw new Error(data.error as string || 'Failed to fetch schedules');
  return data.data;
}
async function fetchLogs(): Promise<ScheduleLog[]> {
  const res = await fetch('/api/logs');
  const data: ApiResponse<ScheduleLog[]> = await res.json();
  if (!data.success || !data.data) return [];
  return data.data;
}
async function updateScheduleStatus(schedule: Schedule): Promise<ApiResponse<Schedule>> {
  const res = await fetch(`/api/schedules/${schedule.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: schedule.status === 'running' ? 'paused' : 'running' }),
  });
  return res.json();
}
async function deleteSchedule(id: string): Promise<ApiResponse<void>> {
  const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
  return res.json();
}
export function MonitorPage() {
  const queryClient = useQueryClient();
  const [isDownloading, setIsDownloading] = useState(false);
  const { data: schedules, isLoading: isLoadingSchedules, error: schedulesError, refetch } = useQuery({ queryKey: ['schedules'], queryFn: fetchSchedules });
  const { data: logs, isLoading: isLoadingLogs } = useQuery({ queryKey: ['logs'], queryFn: fetchLogs, initialData: [] });
  const updateMutation = useMutation({
    mutationFn: updateScheduleStatus,
    onSuccess: () => {
      toast.success('Schedule status updated.');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: () => toast.error('Failed to update schedule.'),
  });
  const deleteMutation = useMutation({
    mutationFn: deleteSchedule,
    onSuccess: () => {
      toast.success('Schedule deleted.');
      queryClient.invalidateQueries({ queryKey: ['schedules'] });
    },
    onError: () => toast.error('Failed to delete schedule.'),
  });
  const chartData = useMemo(() => {
    if (!logs || logs.length === 0) return [];
    const now = new Date();
    const dataPoints = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(now.getTime() - (29 - i) * 60000);
      return {
        time: format(date, 'HH:mm'),
        events: logs.filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate > new Date(date.getTime() - 60000) && logDate <= date;
        }).length,
      };
    });
    return dataPoints;
  }, [logs]);
  const downloadLogs = () => {
    if (!logs || logs.length === 0) {
      toast.info("No logs to export.");
      return;
    }
    setIsDownloading(true);
    try {
      const csvHeader = "id,scheduleId,timestamp,status,message\n";
      const csvRows = logs.map(log =>
        `${log.id},${log.scheduleId},"${log.timestamp}","${log.status}","${log.message || ''}"`
      ).join("\n");
      const csvContent = csvHeader + csvRows;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `ethical_reload_logs_${new Date().toISOString()}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      toast.success("Logs exported successfully.");
    } catch (error) {
      toast.error("Failed to export logs.");
    } finally {
      setIsDownloading(false);
    }
  };
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12">
          <header className="space-y-4 mb-8">
            <Link to="/">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Button>
            </Link>
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-4xl md:text-5xl font-display font-bold">Monitor Dashboard</h1>
                <p className="text-lg text-muted-foreground">View and manage all active and past QA schedules.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoadingSchedules}>
                  <RefreshCw className={`size-4 ${isLoadingSchedules ? 'animate-spin' : ''}`} />
                </Button>
                <Button variant="outline" onClick={downloadLogs} disabled={isDownloading}>
                  {isDownloading ? <Skeleton className="h-5 w-20" /> : <><Download className="size-4 mr-2" /> Export Logs</>}
                </Button>
              </div>
            </div>
          </header>
          <motion.div
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Events reported by clients in the last 30 minutes.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
                  {isLoadingLogs ? <Skeleton className="h-full w-full" /> : (
                    <ResponsiveContainer>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} allowDecimals={false} />
                        <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }} />
                        <Area type="monotone" dataKey="events" stroke="hsl(var(--primary))" fill="url(#colorEvents)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>All Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingSchedules ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : schedulesError ? (
                  <div className="text-destructive text-center p-4 rounded-md border border-destructive/50 bg-destructive/10">
                    <p>Failed to load schedules. Please try again.</p>
                    <Button variant="destructive" className="mt-2" onClick={() => refetch()}>Retry</Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Label</TableHead>
                        <TableHead className="hidden md:table-cell">Target</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schedules?.map((schedule, index) => (
                        <motion.tr
                          key={schedule.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.05 }}
                          className="hover:bg-muted/50"
                        >
                          <TableCell className="font-medium">{schedule.label}</TableCell>
                          <TableCell className="hidden md:table-cell text-muted-foreground truncate max-w-xs">{schedule.targetUrl}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant[schedule.status]} className="capitalize">{schedule.status}</Badge>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell text-muted-foreground">
                            {formatDistanceToNow(new Date(schedule.createdAt), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" onClick={() => updateMutation.mutate(schedule)} disabled={schedule.status === 'completed' || updateMutation.isPending}>
                              {schedule.status === 'running' ? <Pause className="size-4" /> : <Play className="size-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(schedule.id)} disabled={deleteMutation.isPending}>
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </motion.tr>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}