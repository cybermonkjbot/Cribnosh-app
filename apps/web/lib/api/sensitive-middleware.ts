import { NextRequest, NextResponse } from 'next/server';
import { APIMiddlewareConfig, withAPIMiddleware } from './middleware';
import { sensitiveRateLimiter, authRateLimiter, moderationRateLimiter } from '../middleware/sensitive-rate-limit';
import { securityMiddleware } from './security';
import { MonitoringService } from '../monitoring/monitoring.service';

const monitoring = MonitoringService.getInstance();

/**
 * Rate limit configuration for sensitive endpoints
 */
const sensitiveConfig: Partial<APIMiddlewareConfig> = {
  enableRateLimit: true,
  rateLimitConfig: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 100 : 50, // Much higher limit for development/testing
  },
};

/**
 * Rate limit configuration for authentication endpoints
 */
const authConfig: Partial<APIMiddlewareConfig> = {
  enableRateLimit: true,
  rateLimitConfig: {
    windowMs: 5 * 60 * 1000, // 5 minutes
    maxRequests: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 200 : 125, // Much higher limit for development/testing (25x increase)
  },
};

/**
 * Rate limit configuration for moderation endpoints
 */
const moderationConfig: Partial<APIMiddlewareConfig> = {
  enableRateLimit: true,
  rateLimitConfig: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 100 : 100, // Much higher limit for development/testing (5x increase)
  },
};

/**
 * Higher-order function to wrap sensitive API handlers with stricter rate limiting
 */
export function withSensitiveRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withAPIMiddleware(handler, sensitiveConfig);
}

/**
 * Higher-order function to wrap authentication API handlers with very strict rate limiting
 */
export function withAuthRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withAPIMiddleware(handler, authConfig);
}

/**
 * Higher-order function to wrap moderation API handlers with moderate rate limiting
 */
export function withModerationRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withAPIMiddleware(handler, moderationConfig);
}

/**
 * Custom rate limiter for sensitive endpoints that uses a different identifier strategy
 * This is useful for endpoints that need to be rate limited by user ID or other identifiers
 */
export async function withCustomSensitiveRateLimit(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>,
  getIdentifier: (request: NextRequest) => string | Promise<string>
): Promise<NextResponse> {
  try {
    // Get custom identifier
    const identifier = await getIdentifier(request);
    
    // Check rate limit
    const { limited, remaining, resetMs } = await sensitiveRateLimiter.isRateLimited(identifier);
    
    if (limited) {
      monitoring.incrementMetric('sensitive_rate_limit_exceeded_total');
      monitoring.logWarning('Sensitive rate limit exceeded', {
        identifier,
        path: request.nextUrl.pathname,
      });
      
      return new NextResponse(
        JSON.stringify({
          error: 'Too many requests',
          retryAfter: Math.ceil(resetMs / 1000),
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': String(Math.ceil(resetMs / 1000)),
            'X-RateLimit-Remaining': String(remaining),
            'X-RateLimit-Reset': String(Math.ceil(Date.now() + resetMs)),
          },
        }
      );
    }
    
    // Execute handler if not rate limited
    return handler(request);
  } catch (error) {
    monitoring.logError(error as Error, { context: 'custom_rate_limit' });
    return handler(request); // Continue with request if rate limiting fails
  }
}