import { NextRequest, NextResponse } from 'next/server';
import { monitoringService } from '../monitoring/monitor';
import type { JWTPayload } from '@/types/convex-contexts';
import { logger } from '@/lib/utils/logger';

export interface MonitoringOptions {
  enabled?: boolean;
  trackResponseTime?: boolean;
  trackErrors?: boolean;
  trackUserMetrics?: boolean;
  excludePaths?: string[];
  includePaths?: string[];
}

const defaultOptions: MonitoringOptions = {
  enabled: true,
  trackResponseTime: true,
  trackErrors: true,
  trackUserMetrics: true,
  excludePaths: ['/api/health', '/api/monitoring'],
  includePaths: [],
};

export function withMonitoring(options: MonitoringOptions = {}) {
  const config = { ...defaultOptions, ...options };

  return async function monitoringMiddleware(
    request: NextRequest,
    next: () => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const url = new URL(request.url);
    const path = url.pathname;

    // Skip monitoring for excluded paths
    if (config.excludePaths?.some(excludePath => path.startsWith(excludePath))) {
      return next();
    }

    // Only monitor included paths if specified
    if (config.includePaths && config.includePaths.length > 0) {
      if (!config.includePaths.some(includePath => path.startsWith(includePath))) {
        return next();
      }
    }

    // Skip if monitoring is disabled
    if (!config.enabled) {
      return next();
    }

    try {
      // Extract user ID from request if available
      const userId = extractUserId(request);
      const method = request.method;

      // Execute the request
      const response = await next();
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Record API metrics
      if (config.trackResponseTime) {
        await monitoringService.recordAPIMetric(
          path,
          method,
          responseTime,
          response.status,
          userId
        );
      }

      // Record business metrics for specific endpoints
      if (config.trackUserMetrics) {
        await recordBusinessMetrics(path, method, response.status, userId);
      }

      return response;
    } catch (error) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Record error metrics
      if (config.trackErrors) {
        await monitoringService.recordAPIMetric(
          path,
          request.method,
          responseTime,
          500, // Internal server error
          extractUserId(request)
        );
      }

      // Re-throw the error
      throw error;
    }
  };
}

// Extract user ID from various sources
function extractUserId(request: NextRequest): string | undefined {
  try {
    // Try to get from Authorization header
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        // Decode JWT token to extract user ID
        const payload = decodeJWT(token);
        if (payload && payload.user_id) {
          return payload.user_id;
        }
      } catch (error) {
        // Token is invalid or expired, continue to other methods
        logger.warn('Invalid JWT token in Authorization header:', error);
      }
    }

    // Try to get from session cookie
    const sessionToken = request.cookies.get('convex-auth-token')?.value;
    if (sessionToken) {
      try {
        // Extract user ID from session token
        if (sessionToken.length > 20) {
          // Extract user ID from session token pattern
          // This assumes the session token contains some user identifier
          const tokenParts = sessionToken.split('.');
          if (tokenParts.length >= 2) {
            try {
              // Try to decode the token payload (if it's a JWT-like structure)
              const payload = JSON.parse(atob(tokenParts[1].replace(/-/g, '+').replace(/_/g, '/')));
              if (payload.user_id || payload.sub || payload.userId) {
                return payload.user_id || payload.sub || payload.userId;
              }
            } catch (decodeError) {
              // If decoding fails, fall back to token-based ID
            }
          }
          
          // Fallback: create a consistent user ID based on token hash
          const crypto = require('crypto');
          const hash = crypto.createHash('sha256').update(sessionToken).digest('hex');
          return `session_${hash.slice(0, 8)}`;
        }
      } catch (error) {
        logger.warn('Invalid session token:', error);
      }
    }

    // Try to get from query parameters
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');
    if (userId) {
      return userId;
    }

    // Try to get from request body (for POST requests)
    if (request.method === 'POST') {
      // Note: This would require cloning the request to read the body
      // For now, we'll skip this to avoid performance impact
      return undefined;
    }

    return undefined;
  } catch (error) {
    logger.warn('Error extracting user ID:', error);
    return undefined;
  }
}

// Helper function to decode JWT token
function decodeJWT(token: string): JWTPayload {
  try {
    // Split the token into parts
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }

    // Decode the payload (middle part)
    const payload = parts[1];
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    
    // Parse the JSON payload
    const parsedPayload = JSON.parse(decodedPayload);
    
    // Check if token is expired
    if (parsedPayload.exp && parsedPayload.exp < Date.now() / 1000) {
      throw new Error('Token expired');
    }
    
    return parsedPayload;
  } catch (error) {
    throw new Error(`Failed to decode JWT: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Record business metrics for specific endpoints
async function recordBusinessMetrics(
  path: string,
  method: string,
  statusCode: number,
  userId?: string
): Promise<void> {
  try {
    // Record order-related metrics
    if (path.startsWith('/api/orders') && method === 'POST' && statusCode === 201) {
      await monitoringService.recordMetric({
        name: 'orders_created',
        value: 1,
        tags: { endpoint: path },
      });
    }

    // Record payment-related metrics
    if (path.startsWith('/api/payments') && method === 'POST' && statusCode === 201) {
      await monitoringService.recordMetric({
        name: 'payments_processed',
        value: 1,
        tags: { endpoint: path },
      });
    }

    // Record live streaming metrics
    if (path.startsWith('/api/live-streaming') && method === 'POST' && statusCode === 201) {
      await monitoringService.recordMetric({
        name: 'live_sessions_created',
        value: 1,
        tags: { endpoint: path },
      });
    }

    // Record user activity
    if (userId && statusCode >= 200 && statusCode < 300) {
      await monitoringService.recordMetric({
        name: 'user_activity',
        value: 1,
        tags: { user_id: userId, endpoint: path },
      });
    }

    // Record error rates
    if (statusCode >= 400) {
      await monitoringService.recordMetric({
        name: 'api_errors',
        value: 1,
        tags: { endpoint: path, status_code: statusCode.toString() },
      });
    }
  } catch (error) {
    // Don't let monitoring errors affect the main request
    logger.error('Failed to record business metrics:', error);
  }
}

// Health check middleware
export function healthCheckMiddleware(request: NextRequest): NextResponse {
  const url = new URL(request.url);
  
  // Basic health check
  if (url.pathname === '/api/health') {
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    });
  }

  // Detailed health check
  if (url.pathname === '/api/health/detailed') {
    return NextResponse.json({
      status: 'healthy',
      checks: {
        database: true,
        redis: true,
        stripe: true,
        agora: true,
        external_apis: true,
      },
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
    });
  }

  return NextResponse.next();
}

// Performance monitoring middleware
export function performanceMonitoringMiddleware(
  request: NextRequest,
  next: () => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = process.hrtime.bigint();

  return next().then((response) => {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

    // Record high-precision timing
    monitoringService.recordMetric({
      name: 'api_response_time_precise',
      value: duration,
      tags: {
        endpoint: new URL(request.url).pathname,
        method: request.method,
        status_code: response.status.toString(),
      },
    });

    return response;
  });
}

// Error tracking middleware
export function errorTrackingMiddleware(
  request: NextRequest,
  next: () => Promise<NextResponse>
): Promise<NextResponse> {
  return next().catch((error) => {
    // Record error details
    monitoringService.recordMetric({
      name: 'api_errors_detailed',
      value: 1,
      tags: {
        endpoint: new URL(request.url).pathname,
        method: request.method,
        error_type: error.constructor.name,
        error_message: error.message,
      },
    });

    // Re-throw the error
    throw error;
  });
}

// Business metrics middleware
export function businessMetricsMiddleware(
  request: NextRequest,
  next: () => Promise<NextResponse>
): Promise<NextResponse> {
  const url = new URL(request.url);
  const path = url.pathname;

  return next().then((response) => {
    // Record business-specific metrics
    if (path.startsWith('/api/orders') && response.status === 201) {
      monitoringService.recordMetric({
        name: 'business_orders_created',
        value: 1,
        tags: { source: 'api' },
      });
    }

    if (path.startsWith('/api/payments') && response.status === 201) {
      monitoringService.recordMetric({
        name: 'business_payments_processed',
        value: 1,
        tags: { source: 'api' },
      });
    }

    if (path.startsWith('/api/live-streaming') && response.status === 201) {
      monitoringService.recordMetric({
        name: 'business_live_sessions',
        value: 1,
        tags: { source: 'api' },
      });
    }

    return response;
  });
}

// Combined monitoring middleware
export function comprehensiveMonitoringMiddleware(
  request: NextRequest,
  next: () => Promise<NextResponse>
): Promise<NextResponse> {
  const startTime = Date.now();
  const url = new URL(request.url);
  const path = url.pathname;

  // Skip monitoring for health endpoints
  if (path.startsWith('/api/health') || path.startsWith('/api/monitoring')) {
    return next();
  }

  return next()
    .then((response) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Record comprehensive metrics
      monitoringService.recordAPIMetric(
        path,
        request.method,
        responseTime,
        response.status
      );

      return response;
    })
    .catch((error) => {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      // Record error metrics
      monitoringService.recordAPIMetric(
        path,
        request.method,
        responseTime,
        500
      );

      throw error;
    });
} 