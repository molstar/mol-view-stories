'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BarChart3, FileText, Database } from 'lucide-react';
import { UserQuota } from '@/app/state/types';
import { getUsagePercentage, getUsageColor } from './MyStoriesUtils';

interface StorageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quota?: UserQuota | null;
  quotaLoading?: boolean;
  quotaError?: string | null;
  onRefreshQuota?: () => void;
}

interface QuotaCardProps {
  title: string;
  used: number;
  limit: number;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
}

function QuotaCard({ title, used, limit, unit = '', icon: Icon }: QuotaCardProps) {
  const percentage = getUsagePercentage(used, limit);
  const colorClass = getUsageColor(percentage);

  return (
    <Card>
      <CardContent className='p-3'>
        <div className='flex items-center justify-between mb-2'>
          <div className='flex items-center gap-1.5'>
            <Icon className='h-4 w-4 text-muted-foreground' />
            <span className='text-base font-medium'>{title}</span>
          </div>
          <span className='text-base text-muted-foreground'>
            {used.toLocaleString()}
            {unit} / {limit.toLocaleString()}
            {unit}
          </span>
        </div>
        <div className='space-y-2'>
          <div className='w-full bg-muted rounded-full h-2'>
            <div
              className={`h-2 rounded-full transition-all duration-300 ${colorClass}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className='flex justify-between text-sm text-muted-foreground'>
            <span>{percentage.toFixed(1)}% used</span>
            <span>{(limit - used).toLocaleString()} remaining</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StorageDialog({
  open,
  onOpenChange,
  quota,
  quotaLoading,
  quotaError,
  onRefreshQuota,
}: StorageDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <BarChart3 className='h-5 w-5' />
            Storage & Quota
          </DialogTitle>
          <DialogDescription className='text-base'>View your storage usage and account limits</DialogDescription>
        </DialogHeader>
        <div className='space-y-4'>
          {quotaLoading ? (
            <div className='text-center py-8 text-muted-foreground text-sm'>Loading quota information...</div>
          ) : quotaError ? (
            <div className='bg-destructive/15 text-destructive px-3 py-2 rounded-lg text-sm'>
              <strong className='font-medium'>Error loading quota: </strong>
              {quotaError}
            </div>
          ) : quota ? (
            <>
              <div className='grid gap-3 grid-cols-2'>
                <QuotaCard
                  title='Sessions'
                  used={quota.sessions?.current ?? 0}
                  limit={quota.sessions?.limit ?? 0}
                  icon={FileText}
                />
                <QuotaCard
                  title='States'
                  used={quota.states?.current ?? 0}
                  limit={quota.states?.limit ?? 0}
                  icon={Database}
                />
              </div>
              {onRefreshQuota && (
                <div className='flex justify-center'>
                  <Button variant='outline' size='sm' onClick={onRefreshQuota} className='h-8 px-3 text-sm'>
                    Refresh Quota
                  </Button>
                </div>
              )}
            </>
          ) : (
            <div className='text-center py-8 text-muted-foreground'>
              <p className='text-sm'>Quota information not available</p>
              {onRefreshQuota && (
                <Button variant='outline' size='sm' className='mt-2 h-8 px-3 text-sm' onClick={onRefreshQuota}>
                  Load Quota
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
