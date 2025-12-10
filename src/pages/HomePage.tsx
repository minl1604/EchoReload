import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster } from '@/components/ui/sonner';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, BarChart2 } from 'lucide-react';
import { SchedulerForm, ScheduleFormData } from '@/components/SchedulerForm';
import { ReloadCard } from '@/components/ReloadCard';
import { useScheduler } from '@/hooks/use-scheduler';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiResponse, Schedule } from '@shared/types';
import { toast } from 'sonner';
const FeatureCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
  <div className="bg-card/50 p-6 rounded-lg border border-border/30 shadow-sm">
    <div className="flex items-center gap-4">
      <div className="bg-primary/10 text-primary p-3 rounded-full">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <p className="mt-2 text-muted-foreground">{children}</p>
  </div>
);
async function createSchedule(data: ScheduleFormData): Promise<ApiResponse<Schedule>> {
  const response = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create schedule');
  }
  return response.json();
}
export function HomePage() {
  const { start, pause, resume, stop, activeSchedule, countdown, runsCompleted } = useScheduler();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: createSchedule,
    onSuccess: (response) => {
      if (response.success && response.data) {
        toast.success('Schedule created successfully!');
        start(response.data);
        queryClient.invalidateQueries({ queryKey: ['schedules'] });
      } else {
        toast.error(response.error || 'An unknown error occurred.');
      }
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
  const handleStartSchedule = (data: ScheduleFormData) => {
    mutation.mutate(data);
  };
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      <ThemeToggle className="fixed top-4 right-4 z-50" />
      <main className="flex-1">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-b from-background to-transparent bg-opacity-50 z-0"></div>
          <div className="absolute inset-0 opacity-20 dark:opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, hsl(var(--primary) / 0.1), transparent 50%), radial-gradient(circle at 80% 70%, hsl(242,100%,70%,0.1), transparent 50%)' }}></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="py-16 md:py-24 lg:py-32 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Badge variant="outline" className="mb-4">
                  For QA & Testing Purposes
                </Badge>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-balance leading-tight">
                  Ethical Reload
                </h1>
                <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
                  A client-side tool for controlled, consent-based automated testing and performance monitoring.
                  Built for developers and QA teams.
                </p>
                <div className="mt-8 flex justify-center gap-4">
                  <Button asChild size="lg" className="btn-gradient">
                    <Link to="/monitor">View Dashboard</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline">
                    <a href="#scheduler">Get Started</a>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
        <div id="scheduler" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8 md:py-10 lg:py-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <SchedulerForm onStart={handleStartSchedule} isScheduling={mutation.isPending || !!activeSchedule} />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <ReloadCard
                  schedule={activeSchedule}
                  countdown={countdown}
                  runsCompleted={runsCompleted}
                  onPause={pause}
                  onResume={resume}
                  onStop={stop}
                />
              </motion.div>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-16 md:py-24 lg:py-32">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold font-display">Responsible & Transparent Testing</h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Our platform is designed with safety and ethics at its core. We do not facilitate harmful or deceptive practices.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard icon={<ShieldCheck />} title="Consent-Based">
                Every schedule requires explicit confirmation of ownership or permission, with an audit trail.
              </FeatureCard>
              <FeatureCard icon={<Zap />} title="Client-Side Only">
                Reloads are initiated by your browser. Our servers only store metadata, never making requests on your behalf.
              </FeatureCard>
              <FeatureCard icon={<BarChart2 />} title="Built for QA">
                Perfect for load testing, uptime monitoring, and automating repetitive checks in a controlled environment.
              </FeatureCard>
            </div>
          </div>
        </div>
      </main>
      <footer className="bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-muted-foreground">
          <p>Built with ❤️ at Cloudflare. This is a demo for QA and testing purposes only.</p>
        </div>
      </footer>
      <Toaster richColors closeButton />
    </div>
  );
}