import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Pause, Play, Trash2, RefreshCw } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Schedule, ScheduleStatus, ApiResponse, ScheduleLog } from '@shared/types';
import { formatDistanceToNow } from 'date-fns';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, CartesianGrid } from 'recharts';
import { toast } from 'sonner';
const statusVariant: { [key in ScheduleStatus]: 'default' | 'secondary' | 'outline' | 'destructive' } = {
  running: 'default',
  paused: 'secondary',
  completed: 'outline',
  error: 'destructive',
};
async function fetchSchedules(): Promise<Schedule[]> {
  const res = await fetch('/api/schedules');
  const data: ApiResponse<Schedule[]> = await res.json();
  if (!data.success || !data.data) throw new Error(data.error || 'Failed to fetch schedules');
  return data.data;
}
async function fetchLogs(): Promise<ScheduleLog[]> {
  const res = await fetch('/api/logs/all'); // A placeholder, ideally we'd fetch logs per schedule or all
  const data: ApiResponse<ScheduleLog[]> = await res.json();
  if (!data.success || !data.data) return []; // Return empty on failure for chart
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
  const { data: schedules, isLoading, error, refetch } = useQuery({ queryKey: ['schedules'], queryFn: fetchSchedules });
  const { data: logs } = useQuery({ queryKey: ['logs'], queryFn: fetchLogs, initialData: [] });
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
    const now = new Date();
    const dataPoints = Array.from({ length: 10 }, (_, i) => {
      const date = new Date(now.getTime() - (9 - i) * 60000);
      return {
        time: `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`,
        events: (logs || []).filter(log => {
          const logDate = new Date(log.timestamp);
          return logDate > new Date(date.getTime() - 60000) && logDate <= date;
        }).length,
      };
    });
    return dataPoints;
  }, [logs]);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ThemeToggle className="fixed top-4 right-4" />
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
              <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
                <RefreshCw className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </header>
          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>Events reported by clients in the last 10 minutes.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 w-full">
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
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>All Schedules</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ) : error ? (
                  <div className="text-destructive text-center p-4">Failed to load schedules. Please try again.</div>
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
                      {schedules?.map((schedule) => (
                        <TableRow key={schedule.id}>
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
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}