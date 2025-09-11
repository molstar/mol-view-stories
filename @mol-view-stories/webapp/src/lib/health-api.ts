/**
 * Health API Client
 * Provides utilities for checking API health across different environments
 */

import { ENV_CONFIGS } from './config';

export interface ApiHealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: {
    minio?: {
      status: string;
      message?: string;
      error?: string;
      buckets_count?: number;
      configured_bucket?: string;
    };
    flask?: {
      status: string;
      environment?: string;
    };
  };
}

export interface HealthCheckResult {
  environment: 'development' | 'production' | 'local';
  url: string;
  status: 'healthy' | 'unhealthy' | 'unreachable' | 'checking';
  data?: ApiHealthStatus;
  error?: string;
  responseTime?: number;
  lastChecked: Date;
}

export type EnvironmentType = 'development' | 'production' | 'local';

/**
 * Check health of a specific environment endpoint
 */
export async function checkEnvironmentHealth(
  environment: EnvironmentType,
  timeoutMs: number = 10000
): Promise<HealthCheckResult> {
  const url = ENV_CONFIGS[environment].apiBaseUrl;
  const healthUrl = `${url}/health`;
  const startTime = Date.now();

  const result: HealthCheckResult = {
    environment,
    url,
    status: 'checking',
    lastChecked: new Date(),
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(healthUrl, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    result.responseTime = Date.now() - startTime;

    if (response.ok) {
      const responseText = await response.text();

      if (responseText.trim() === 'healthy') {
        result.status = 'healthy';
        result.data = {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          checks: {
            flask: {
              status: 'healthy',
              environment: environment,
            },
          },
        };
      } else {
        try {
          const health: ApiHealthStatus = JSON.parse(responseText);
          result.status = health.status === 'healthy' ? 'healthy' : 'unhealthy';
          result.data = health;
        } catch {
          result.status = 'unhealthy';
          result.error = 'Invalid health response format';
        }
      }
    } else {
      result.status = 'unhealthy';
      result.error = `HTTP ${response.status}: ${response.statusText}`;
    }
  } catch (error) {
    result.responseTime = Date.now() - startTime;

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        result.status = 'unreachable';
        result.error = `Timeout after ${timeoutMs}ms`;
      } else {
        result.status = 'unreachable';
        result.error = error.message;
      }
    } else {
      result.status = 'unreachable';
      result.error = 'Unknown error';
    }
  }

  return result;
}

/**
 * Get status icon for display
 */
export function getHealthStatusIcon(status: HealthCheckResult['status']): string {
  switch (status) {
    case 'healthy':
      return '🟢';
    case 'unhealthy':
      return '🔴';
    case 'unreachable':
      return '🔴';
    case 'checking':
      return '⏳';
    default:
      return '🟡';
  }
}
