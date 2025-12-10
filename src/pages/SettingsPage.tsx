import React, { useEffect } from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Link } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, Save, ShieldCheck } from 'lucide-react';
import { ApiResponse, Settings, ConsentProof } from '@shared/types';
const settingsSchema = z.object({
  minInterval: z.preprocess(
    (val) => Number(val),
    z.number().min(5, "Minimum interval must be at least 5 seconds.")
  ),
  dailyCap: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "Daily cap must be at least 1.")
  ),
  maxConcurrency: z.preprocess(
    (val) => Number(val),
    z.number().min(1, "Max concurrency must be at least 1.")
  ),
});
type SettingsFormData = z.infer<typeof settingsSchema>;
async function fetchSettings(): Promise<Settings> {
  const res = await fetch('/api/settings');
  const data: ApiResponse<Settings> = await res.json();
  if (!data.success || !data.data) throw new Error(data.error as string || 'Failed to fetch settings');
  return data.data;
}
async function updateSettings(settings: SettingsFormData): Promise<ApiResponse<Settings>> {
  const res = await fetch('/api/settings', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settings),
  });
  return res.json();
}
async function fetchAuditLogs(): Promise<ConsentProof[]> {
    const res = await fetch('/api/audit');
    const data: ApiResponse<ConsentProof[]> = await res.json();
    if (!data.success || !data.data) return [];
    return data.data;
}
export function SettingsPage() {

  const { data: settings, isLoading: isLoadingSettings } = useQuery({
    queryKey: ['settings'],
    queryFn: fetchSettings,
  });
  const { data: auditLogs, isLoading: isLoadingAudit } = useQuery({
    queryKey: ['auditLogs'],
    queryFn: fetchAuditLogs,
  });
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema) as unknown as Resolver<SettingsFormData>,
    defaultValues: settings || { minInterval: 5, dailyCap: 1000, maxConcurrency: 5 },
  });
  useEffect(() => {
    if (settings) {
      form.reset(settings);
    }
  }, [settings, form]);
  const mutation = useMutation({
    mutationFn: updateSettings,
    onSuccess: (response) => {
      if (response.success) {
        toast.success('Settings updated successfully!');
        queryClient.invalidateQueries({ queryKey: ['settings'] });
      } else {
        toast.error(response.error as string || 'Failed to update settings.');
      }
    },
    onError: (error: Error) => toast.error(`Error: ${error.message}`),
  });
  function onSubmit(values: SettingsFormData) {
    mutation.mutate(values);
  }
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
            <div>
              <h1 className="text-4xl md:text-5xl font-display font-bold">Settings</h1>
              <p className="text-lg text-muted-foreground">Manage global safety controls and review audit logs.</p>
            </div>
          </header>
          <motion.div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ShieldCheck /> Global Safety Controls</CardTitle>
                <CardDescription>These settings apply to all schedules to prevent misuse.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingSettings ? (
                  <div className="space-y-4">
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-full" />
                    <Skeleton className="h-10 w-1/2" />
                  </div>
                ) : (
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField control={form.control} name="minInterval" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Interval (seconds)</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="dailyCap" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Daily Reload Cap (per user)</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="maxConcurrency" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Concurrent Schedules (per user)</FormLabel>
                          <FormControl><Input type="number" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" disabled={mutation.isPending}>
                        <Save className="size-4 mr-2" />
                        {mutation.isPending ? 'Saving...' : 'Save Settings'}
                      </Button>
                    </form>
                  </Form>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Consent Audit Log</CardTitle>
                <CardDescription>Record of all schedule creation consents.</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingAudit ? (
                  <div className="space-y-2"><Skeleton className="h-8 w-full" /><Skeleton className="h-8 w-full" /></div>
                ) : (
                  <div className="max-h-96 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Timestamp</TableHead>
                          <TableHead>User Agent Hash (SHA-1)</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {auditLogs?.slice().reverse().map((log, i) => (
                          <TableRow key={i}>
                            <TableCell>{format(new Date(log.timestamp), 'yyyy-MM-dd HH:mm:ss')}</TableCell>
                            <TableCell className="font-mono text-xs truncate">{log.userAgentHash}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}