'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { API_CONFIG } from '@/lib/config';
import { getHealthStatusIcon } from '@/lib/health-api';

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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      const response = await fetch(`${API_CONFIG.baseUrl}/health`, { method: 'GET', cache: 'no-store', signal: controller.signal });
      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        if (text.trim() === 'healthy') {
          setStatus('healthy');
        } else {
          try {
            const json = JSON.parse(text);
            setStatus(json.status === 'healthy' ? 'healthy' : 'unhealthy');
          } catch {
            setStatus('unhealthy');
          }
        }
      } else {
        setStatus('unhealthy');
      }
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
  const url = new URL(API_CONFIG.baseUrl).hostname;
  const color = status === 'healthy' ? 'text-green-600' : status === 'unhealthy' ? 'text-red-600' : status === 'unreachable' ? 'text-red-600' : 'text-muted-foreground';
  const statusText = status === 'checking' ? 'Checking...' : status === 'healthy' ? 'Healthy' : status === 'unhealthy' ? 'Issues' : status === 'unreachable' ? 'Unreachable' : 'Unknown';

  return (
    <div className='flex items-center gap-2 text-xs'>
      <span className='flex items-center gap-1'>
        <span className={status === 'unreachable' ? 'text-red-600' : ''}>{icon}</span>
        <span className='text-muted-foreground'>API ({url})</span>
        <span className={color}>{statusText}</span>
      </span>
    </div>
  );
}
