'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { API_CONFIG } from '@/lib/config';
import { getHealthStatusIcon, checkEnvironmentHealth, type EnvironmentType } from '@/lib/health-api';
import { isDevelopment, isProduction } from '@/lib/env-config';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/**
 * ApiStatus Component
 *
 * This component provides health monitoring for API endpoints.
 *
 * What it does:
 * - Calls the /health endpoint of the current API
 * - Shows current environment health status in the footer
 * - Automatically refreshes every 30 seconds
 *
 * Environment detection:
 * - Dev: https://mol-view-stories-dev.dyn.cloud.e-infra.cz
 * - Prod: https://stories.molstar.org
 * - Local: http://localhost:5000
 */

export function ApiStatus() {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'unhealthy' | 'unreachable'>('checking');

  const checkHealth = useCallback(async () => {
    try {
      const environment: EnvironmentType = isDevelopment() ? 'development' : isProduction() ? 'production' : 'local';
      const result = await checkEnvironmentHealth(environment, 8000);
      setStatus(result.status);
    } catch {
      setStatus('unreachable');
    }
  }, []);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  const icon = getHealthStatusIcon(status);
  const color =
    status === 'healthy'
      ? 'text-green-600'
      : status === 'unhealthy'
        ? 'text-red-600'
        : status === 'unreachable'
          ? 'text-red-600'
          : 'text-muted-foreground';
  const statusText =
    status === 'checking'
      ? 'Checking...'
      : status === 'healthy'
        ? 'Healthy'
        : status === 'unhealthy'
          ? 'Issues'
          : status === 'unreachable'
            ? 'Unreachable'
            : 'Unknown';

  return (
    <div className='flex items-center gap-2 text-xs'>
      <span className='flex items-center gap-1'>
        <span className={status === 'unreachable' ? 'text-red-600' : ''}>{icon}</span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className='text-muted-foreground cursor-help'>API</span>
            </TooltipTrigger>
            <TooltipContent>
              <span>{API_CONFIG.baseUrl}</span>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <span className={color}>{statusText}</span>
      </span>
    </div>
  );
}
