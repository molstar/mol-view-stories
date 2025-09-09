'use client';

import React, { useEffect, useState } from 'react';
import { API_CONFIG } from '@/lib/config';

interface ApiHealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: {
    minio?: {
      status: string;
      message?: string;
      error?: string;
    };
    flask?: {
      status: string;
      environment?: string;
    };
  };
}

export function SimpleApiStatus() {
  const [status, setStatus] = useState<'checking' | 'healthy' | 'unhealthy' | 'unknown'>('checking');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const checkApiHealth = async () => {
    try {
      // Use the configured API base URL for this environment
      const healthUrl = `${API_CONFIG.baseUrl}/health`;

      const response = await fetch(healthUrl, {
        method: 'GET',
        cache: 'no-store', // Always fresh check
      });

      if (response.ok) {
        const responseText = await response.text();

        // Handle both JSON response (prod) and simple "healthy" text (dev)
        if (responseText.trim() === 'healthy') {
          setStatus('healthy');
        } else {
          try {
            const health: ApiHealthStatus = JSON.parse(responseText);
            setStatus(health.status === 'healthy' ? 'healthy' : 'unhealthy');
          } catch {
            // If it's not JSON and not "healthy", treat as unhealthy
            setStatus('unhealthy');
          }
        }
      } else {
        setStatus('unhealthy');
      }
    } catch (error) {
      console.warn('API health check failed:', error);
      setStatus('unknown');
    } finally {
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    // Don't run health checks for local/test environments
    if (API_CONFIG.isTest || API_CONFIG.baseUrl.includes('localhost')) {
      return;
    }

    // Initial check
    checkApiHealth();

    // Check every 30 seconds
    const interval = setInterval(checkApiHealth, 30000);

    return () => clearInterval(interval);
  }, []);

  // Don't show API status for local/test environments
  if (API_CONFIG.isTest || API_CONFIG.baseUrl.includes('localhost')) {
    return null;
  }

  const getStatusDisplay = () => {
    const envName = API_CONFIG.environment;
    const apiUrl = new URL(API_CONFIG.baseUrl).hostname;

    switch (status) {
      case 'checking':
        return {
          icon: '⏳',
          text: `${envName} API (${apiUrl})`,
          status: 'Checking...',
          color: 'text-muted-foreground',
        };
      case 'healthy':
        return {
          icon: '🟢',
          text: `${envName} API (${apiUrl})`,
          status: 'Healthy',
          color: 'text-green-600',
        };
      case 'unhealthy':
        return {
          icon: '🔴',
          text: `${envName} API (${apiUrl})`,
          status: 'Issues',
          color: 'text-red-600',
        };
      default:
        return {
          icon: '🟡',
          text: `${envName} API (${apiUrl})`,
          status: 'Unknown',
          color: 'text-yellow-600',
        };
    }
  };

  const display = getStatusDisplay();

  const formatLastCheck = () => {
    if (!lastChecked) return null;

    const now = new Date();
    const diffMs = now.getTime() - lastChecked.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);

    if (diffSeconds < 60) {
      return `${diffSeconds}s ago`;
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return `${diffHours}h ago`;
    }
  };

  return (
    <div className='flex items-center gap-2 text-sm'>
      <span className='flex items-center gap-1'>
        <span>{display.icon}</span>
        <span className='text-muted-foreground'>{display.text}</span>
        <span className={display.color}>{display.status}</span>
      </span>

      {/* Show last check time */}
      {lastChecked && <span className='text-muted-foreground text-xs'>(checked {formatLastCheck()})</span>}
    </div>
  );
}
