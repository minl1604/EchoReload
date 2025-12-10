import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Toaster } from '@/components/ui/sonner';
import { motion } from 'framer-motion';
import { ShieldCheck, Zap, BarChart2, Settings } from 'lucide-react';
import { SchedulerForm, ScheduleFormData } from '@/components/SchedulerForm';
import { ReloadCard } from '@/components/ReloadCard';
import { useScheduler } from '@/hooks/use-scheduler';
import { useTranslation } from '@/hooks/use-i18n';
import { Badge } from '@/components/ui/badge';
import { ApiResponse, Schedule } from '@shared/types';
import { toast } from 'sonner';
const FeatureCard = ({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
  <motion.div
    className="bg-card/50 p-6 rounded-lg border border-border/30 shadow-sm"
    whileHover={{ y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
  >
    <div className="flex items-center gap-4">
      <div className="bg-primary/10 text-primary p-3 rounded-full">{icon}</div>
      <h3 className="text-lg font-semibold">{title}</h3>
    </div>
    <p className="mt-2 text-muted-foreground">{children}</p>
  </motion.div>
);
async function createSchedule(data: ScheduleFormData): Promise<ApiResponse<Schedule>> {
  const response = await fetch('/api/schedules', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const responseData = await response.json();
  if (!response.ok) {
    const errorMessage = typeof responseData.error === 'string' ? responseData.error : 'Failed to create schedule';
    throw new Error(errorMessage);
  }
  return responseData;
}
export function HomePage() {
  const openerRef = useRef<Window | null>(null);
  const { start, pause, resume, stop, activeSchedule, countdown, runsCompleted, isRunning } = useScheduler();
  const { t } = useTranslation();
  const [isCreating, setIsCreating] = useState(false);
  const handleStartSchedule = async (data: ScheduleFormData) => {
    try {
      openerRef.current = window.open('about:blank', '_blank');
    } catch (err) {
      console.warn('Failed to open opener window', err);
      openerRef.current = null;
    }
    setIsCreating(true);
    toast.loading('Creating schedule...');
    try {
      const response = await createSchedule(data);
      if (response.success && response.data) {
        toast.dismiss();
        toast.success(t('scheduleCreated'));
        start(response.data, openerRef.current);
        openerRef.current = null;
      } else {
        if (openerRef.current) {
          try { openerRef.current.close(); } catch (err) { console.warn('Failed to close opener window', err); }
          openerRef.current = null;
        }
        toast.error(typeof response.error === 'string' ? response.error : 'An unknown error occurred.');
      }
    } catch (error: any) {
      if (openerRef.current) {
        try { openerRef.current.close(); } catch (err) { console.warn('Failed to close opener window', err); }
        openerRef.current = null;
      }
      toast.error(`Error: ${error?.message ?? 'Unknown error'}`);
    } finally {
      setIsCreating(false);
    }
  };
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      <LanguageToggle />
      <ThemeToggle />
      <main className="flex-1">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-primary opacity-10 dark:opacity-20 [mask-image:radial-gradient(ellipse_at_center,black,transparent_70%)]"></div>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="py-16 md:py-24 lg:py-32 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <Badge variant="outline" className="mb-4 border-primary/50 text-primary">
                  {t('qaBadge')}
                </Badge>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-balance leading-tight">
                  {t('appTitle')}
                </h1>
                <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto text-pretty">
                  {t('heroDescription')}
                </p>
                <div className="mt-8 flex flex-wrap justify-center gap-4">
                  <Button asChild size="lg" className="btn-gradient group transition-transform hover:scale-105">
                    <a href="/monitor" aria-label={t('viewDashboard')}>{t('viewDashboard')}</a>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="transition-transform hover:scale-105">
                    <a href="#scheduler">{t('getStarted')}</a>
                  </Button>
                   <Button asChild size="lg" variant="outline" className="transition-transform hover:scale-105">
                    <a href="/settings" aria-label={t('settings')}><Settings className="size-4 mr-2" /> {t('settings')}</a>
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
                <SchedulerForm onStart={handleStartSchedule} isScheduling={isCreating} disabled={isCreating || isRunning} />
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
        <div className="bg-muted/30">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-16 md:py-24 lg:py-32">
                <div className="text-center max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-4xl font-bold font-display">{t('responsibleTitle')}</h2>
                <p className="mt-4 text-muted-foreground text-lg">
                    {t('responsibleDescription')}
                </p>
                </div>
                <motion.div
                    className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.3 }}
                    transition={{ staggerChildren: 0.2 }}
                >
                    <FeatureCard icon={<ShieldCheck />} title={t('consentBased')}>
                        {t('consentBasedDesc')}
                    </FeatureCard>
                    <FeatureCard icon={<Zap />} title={t('clientSideOnly')}>
                        {t('clientSideOnlyDesc')}
                    </FeatureCard>
                    <FeatureCard icon={<BarChart2 />} title={t('builtForQA')}>
                        {t('builtForQADesc')}
                    </FeatureCard>
                </motion.div>
            </div>
            </div>
        </div>
      </main>
      <footer className="bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center text-sm text-muted-foreground">
          <p>{t('footerText')}</p>
        </div>
      </footer>
      <Toaster richColors closeButton />
    </div>
  );
}