'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, FileText, BookOpen, RefreshCw } from 'lucide-react';
import { UserQuota } from '@/app/state/types';
import { getUsagePercentage, getUsageColor } from './MyStoriesUtils';

interface StorageQuotaInlineProps {
  quota?: UserQuota | null;
  quotaLoading?: boolean;
  quotaError?: string | null;
  onRefreshQuota?: () => void;
}

interface QuotaItemProps {
  title: string;
  used: number;
  limit: number;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
}

function QuotaItem({ title, used, limit, unit = '', icon: Icon }: QuotaItemProps) {
  const percentage = getUsagePercentage(used, limit);
  const colorClass = getUsageColor(percentage);

  return (
    <div className='flex items-center gap-2'>
      <div className='flex items-center gap-1 min-w-fit'>
        <Icon className='h-4 w-4 text-muted-foreground' />
        <span className='text-sm font-medium'>{title}:</span>
      </div>
      <div className='flex items-center gap-1'>
        <div className='bg-muted rounded-full h-2 w-24'>
          <div
            className={`h-2 rounded-full transition-all duration-300 ${colorClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className='text-sm text-muted-foreground whitespace-nowrap ml-2'>
          {used.toLocaleString()}
          {unit} / {limit.toLocaleString()}
          {unit} ({percentage.toFixed(1)}%)
        </span>
      </div>
    </div>
  );
}

export function StorageQuotaInline({ quota, quotaLoading, quotaError, onRefreshQuota }: StorageQuotaInlineProps) {
  if (quotaLoading) {
    return (
      <Card className='border-dashed'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-center gap-2 text-sm text-muted-foreground'>
            <RefreshCw className='h-4 w-4 animate-spin' />
            Loading quota information...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (quotaError) {
    return (
      <Card className='border-destructive/20'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-destructive'>
              <strong>Error loading quota:</strong> {quotaError}
            </div>
            {onRefreshQuota && (
              <Button variant='outline' size='sm' onClick={onRefreshQuota} className='h-7 px-2 text-xs'>
                <RefreshCw className='h-3 w-3 mr-1' />
                Retry
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quota) {
    return (
      <Card className='border-dashed'>
        <CardContent className='p-3'>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>Quota information not available</div>
            {onRefreshQuota && (
              <Button variant='outline' size='sm' onClick={onRefreshQuota} className='h-7 px-2 text-xs'>
                <BarChart3 className='h-3 w-3 mr-1' />
                Load Quota
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='mx-auto max-w-md'>
      <CardContent className='p-3'>
        <div className='flex items-center justify-start mb-3'>
          <div className='flex items-center gap-2'>
            <BarChart3 className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm font-medium'>Storage Quota</span>
          </div>
          {onRefreshQuota && (
            <Button variant='ghost' size='sm' onClick={onRefreshQuota} className='h-7 w-7 p-0 ml-2'>
              <RefreshCw className='h-3 w-3' />
            </Button>
          )}
        </div>
        <div className='space-y-2'>
          <QuotaItem
            title='Sessions'
            used={quota.sessions?.current ?? 0}
            limit={quota.sessions?.limit ?? 0}
            icon={FileText}
          />
          <QuotaItem
            title='Stories'
            used={quota.stories?.current ?? 0}
            limit={quota.stories?.limit ?? 0}
            icon={BookOpen}
          />
        </div>
      </CardContent>
    </Card>
  );
}
