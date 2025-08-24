'use client';

import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, FileText, BookOpen, RefreshCw } from 'lucide-react';
import { UserQuota } from '@/app/state/types';
import { getUsagePercentage, getUsageColor } from './MyStoriesUtils';

interface StorageQuotaInlineProps {
  quota?: UserQuota | null;
  quotaLoading?: boolean;
  quotaError?: string | null;
}

interface QuotaItemProps {
  title: string;
  used: number;
  limit: number;
  unit?: string;
  icon: React.ComponentType<{ className?: string }>;
}

function QuotaItem({ title, used, limit, icon: Icon }: QuotaItemProps) {
  const percentage = getUsagePercentage(used, limit);
  const colorClass = getUsageColor(percentage);

  return (
    <div className='flex items-center gap-2'>
      <div className='flex items-center gap-1 min-w-fit'>
        <Icon className='h-3 w-3 text-muted-foreground' />
        <span className='text-xs font-medium'>{title}:</span>
      </div>
      <div className='flex items-center gap-1'>
        <div className='bg-muted rounded-full h-1.5 w-16'>
          <div
            className={`h-1.5 rounded-full transition-all duration-300 ${colorClass}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className='text-xs text-muted-foreground whitespace-nowrap'>
          {used.toLocaleString()}/{limit.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

export function StorageQuotaInline({ quota, quotaLoading, quotaError }: StorageQuotaInlineProps) {
  if (quotaLoading) {
    return (
      <Card className='border-dashed'>
        <CardContent>
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
        <CardContent>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-destructive'>
              <strong>Error loading quota:</strong> {quotaError}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quota) {
    return (
      <Card className='border-dashed'>
        <CardContent>
          <div className='flex items-center justify-between'>
            <div className='text-sm text-muted-foreground'>Quota information not available</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='mx-auto'>
      <CardContent>
        <div className='flex items-center justify-center gap-4'>
          <div className='flex items-center gap-2'>
            <BarChart3 className='h-4 w-4 text-muted-foreground' />
            <span className='text-sm font-medium'>Storage Quota</span>
          </div>
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
