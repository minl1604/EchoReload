import React from 'react';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info, PlayCircle } from 'lucide-react';
import { useTranslation } from '@/hooks/use-i18n';
const formSchema = z.object({
  targetUrl: z.string().url({ message: 'Please enter a valid URL.' }),
  intervalSeconds: z.preprocess(
    (val) => Number(val),
    z.number().min(5, { message: 'Interval must be at least 5 seconds.' })
  ),
  count: z.preprocess(
    (val) => (val ? Number(val) : undefined),
    z.number().min(1, { message: 'Must run at least once.' }).optional()
  ),
  label: z.string().min(1, { message: 'Label is required.' }),
  consent: z.boolean().refine((val) => val === true, {
    message: 'You must confirm you have permission to run this test.',
  }),
});
export type ScheduleFormData = z.infer<typeof formSchema>;
interface SchedulerFormProps {
  onStart: (data: ScheduleFormData) => void;
  isScheduling: boolean;
  disabled?: boolean;
}
export function SchedulerForm({ onStart, isScheduling, disabled }: SchedulerFormProps) {
  const { t } = useTranslation();
  const form = useForm<ScheduleFormData>({
    resolver: zodResolver(formSchema) as unknown as Resolver<ScheduleFormData>,
    defaultValues: {
      targetUrl: '',
      intervalSeconds: 10,
      count: 100,
      label: 'QA Test Run',
      consent: false,
    },
  });
  function onSubmit(values: ScheduleFormData) {
    onStart(values);
  }
  return (
    <Card className="w-full max-w-lg bg-card/80 backdrop-blur-sm border-border/50 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          <PlayCircle className="text-primary" />
          {t('newScheduleTitle')}
        </CardTitle>
        <CardDescription>{t('scheduleDescription')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="label"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('label')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('labelPlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="targetUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('targetUrl')}</FormLabel>
                  <FormControl>
                    <Input placeholder="https://your-qa-server.com" {...field} />
                  </FormControl>
                  <FormDescription>{t('targetUrlDesc')}</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="intervalSeconds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-1">
                      {t('intervalLabel')}
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="size-3 cursor-help" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{t('intervalTooltip')}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min="5" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('countLabel')}</FormLabel>
                    <FormControl>
                      <Input type="number" min="1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="consent"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-background/50">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      {t('consentLabel')}
                    </FormLabel>
                    <FormDescription>
                      {t('consentDescription')}
                    </FormDescription>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full btn-gradient text-lg" size="lg" disabled={isScheduling || disabled}>
              {isScheduling ? t('scheduling') : t('startButton')}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}