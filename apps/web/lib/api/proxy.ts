import { NextRequest, NextResponse } from 'next/server';
import { authRateLimiter } from '../middleware/rate-limit';
import { securityMiddleware } from './security';
import { MonitoringService } from '../monitoring/monitoring.service';
import { retryCritical } from './retry';

const monitoring = MonitoringService.getInstance();

export interface APIMiddlewareConfig {
  enableRateLimit?: boolean;
  rateLimitConfig?: {
    windowMs: number;
    maxRequests: number;
  };
  enableSecurity?: boolean;
  enableMonitoring?: boolean;
  enableCaching?: boolean;
  cacheConfig?: {
    ttl: number;
    keyPrefix: string;
  };
  enableRetry?: boolean;
  retryConfig?: {
    maxAttempts: number;
    timeout: number;
  };
}

export class APIMiddleware {
  private config: APIMiddlewareConfig;

  constructor(config: APIMiddlewareConfig = {}) {
    this.config = {
      enableRateLimit: true,
      enableSecurity: true,
      enableMonitoring: true,
      enableCaching: false,
      enableRetry: true,
      rateLimitConfig: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        maxRequests: 800,
      },
      cacheConfig: {
        ttl: 300, // 5 minutes
        keyPrefix: 'api-cache:',
      },
      retryConfig: {
        maxAttempts: 3,
        timeout: 25000,  // Reduced from 30s to 25s to stay under App Runner's 120s limit
      },
      ...config,
    };
  }

  async process(
    request: NextRequest,
    handler: (request: NextRequest) => Promise<NextResponse>
  ): Promise<NextResponse> {
    const startTime = Date.now();
    const requestId = this.generateRequestId();

    try {
      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        const response = new NextResponse(null, { status: 200 });
        return securityMiddleware.applyCORSHeaders(response, request);
      }

      // Security checks
      if (this.config.enableSecurity) {
        const securityResult = await this.checkSecurity(request);
        if (securityResult) {
          return securityResult;
        }
      }

      // Rate limiting
      if (this.config.enableRateLimit) {
        const rateLimitResult = await this.checkRateLimit(request);
        if (rateLimitResult) {
          return rateLimitResult;
        }
      }

      // Execute handler with timeout and retry logic for critical operations
      const response = await this.executeWithTimeout(
        this.config.enableRetry 
          ? () => retryCritical(async () => {
              return await handler(request);
            }, {
              maxAttempts: this.config.retryConfig?.maxAttempts || 3,
              baseDelay: 1000,
              maxDelay: 5000
            })
          : () => handler(request),
        this.config.retryConfig?.timeout || 25000
      );

      // Apply CORS headers
      const corsResponse = securityMiddleware.applyCORSHeaders(response, request);

      // Add monitoring headers
      if (this.config.enableMonitoring) {
        corsResponse.headers.set('X-Request-ID', requestId);
        corsResponse.headers.set('X-Response-Time', String(Date.now() - startTime));
      }

      return corsResponse;
    } catch (error) {
      const errorObj = error as Error;
      
      // Enhanced error logging with network error detection
      monitoring.logError(errorObj, { 
        context: 'api_middleware', 
        requestId,
        url: request.url,
        errorType: this.categorizeError(errorObj),
        timestamp: Date.now()
      });

      // Determine appropriate error response based on error type
      const errorResponse = this.createErrorResponse(errorObj, requestId);
      return errorResponse;
    }
  }

  /**
   * Check rate limiting
   */
  private async checkRateLimit(request: NextRequest): Promise<NextResponse | null> {
    try {
      const identifier = this.getClientIdentifier(request);
      const { limited, remaining, resetMs } = await authRateLimiter.isRateLimited(identifier);

      if (limited) {
        return new NextResponse(
          JSON.stringify({
            error: 'Too many requests',
            retryAfter: Math.ceil(resetMs / 1000),
            requestId: this.generateRequestId(),
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

      return null;
    } catch (error) {
      monitoring.logError(error as Error, { context: 'rate_limit_check' });
      return null; // Continue with request if rate limiting fails
    }
  }

  /**
   * Get client identifier for rate limiting
   */
  private getClientIdentifier(request: NextRequest): string {
    // Use IP address as primary identifier
    const ip = securityMiddleware.getClientIP(request);
    const userAgent = request.headers.get('user-agent') || 'unknown';
    return `${ip}:${userAgent}`;
  }

  /**
   * Check security measures
   */
  private async checkSecurity(request: NextRequest): Promise<NextResponse | null> {
    try {
      // Check for suspicious IPs
      if (securityMiddleware.isSuspiciousIP(request)) {
        return new NextResponse(
          JSON.stringify({
            error: 'Access denied',
            requestId: this.generateRequestId(),
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      // Check request size
      if (!securityMiddleware.validateRequestSize(request)) {
        return new NextResponse(
          JSON.stringify({
            error: 'Request too large',
            requestId: this.generateRequestId(),
          }),
          {
            status: 413,
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
      }

      return null;
    } catch (error) {
      monitoring.logError(error as Error, { context: 'security_check' });
      return null; // Continue with request if security check fails
    }
  }

  /**
   * Execute handler with timeout protection
   */
  private async executeWithTimeout(
    handler: () => Promise<NextResponse>,
    timeoutMs: number
  ): Promise<NextResponse> {
    return Promise.race([
      handler(),
      new Promise<NextResponse>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      })
    ]);
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Categorize error for better handling
   */
  private categorizeError(error: Error): string {
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();

    if (errorMessage.includes('networkerror') || errorMessage.includes('fetch')) {
      return 'NETWORK_ERROR';
    }
    if (errorMessage.includes('timeout') || errorMessage.includes('abort') || 
        errorMessage.includes('request timeout') || errorMessage.includes('gateway timeout')) {
      return 'TIMEOUT_ERROR';
    }
    if (errorMessage.includes('convex') || errorMessage.includes('database')) {
      return 'DATABASE_ERROR';
    }
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return 'VALIDATION_ERROR';
    }
    if (errorName.includes('typeerror') || errorName.includes('referenceerror')) {
      return 'RUNTIME_ERROR';
    }
    if (errorMessage.includes('upstream') || errorMessage.includes('504')) {
      return 'UPSTREAM_TIMEOUT';
    }
    
    return 'UNKNOWN_ERROR';
  }

  /**
   * Create appropriate error response based on error type
   */
  private createErrorResponse(error: Error, requestId: string): NextResponse {
    const errorType = this.categorizeError(error);
    
    let status = 500;
    let message = 'Internal server error';
    let retryAfter: number | undefined;

    switch (errorType) {
      case 'NETWORK_ERROR':
        status = 503;
        message = 'Service temporarily unavailable. Please try again in a few moments.';
        retryAfter = 30;
        break;
      case 'TIMEOUT_ERROR':
        status = 504;
        message = 'Request timeout. Please try again.';
        retryAfter = 10;
        break;
      case 'UPSTREAM_TIMEOUT':
        status = 504;
        message = 'Upstream service timeout. Please try again.';
        retryAfter = 15;
        break;
      case 'DATABASE_ERROR':
        status = 503;
        message = 'Database service unavailable. Please try again later.';
        retryAfter = 60;
        break;
      case 'VALIDATION_ERROR':
        status = 400;
        message = error.message;
        break;
      case 'RUNTIME_ERROR':
        status = 500;
        message = 'An unexpected error occurred. Please try again.';
        break;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'X-Request-ID': requestId,
      'X-Error-Type': errorType,
    };

    if (retryAfter) {
      headers['Retry-After'] = String(retryAfter);
    }

    return new NextResponse(
      JSON.stringify({
        error: message,
        requestId,
        errorType,
        timestamp: Date.now(),
        ...(retryAfter && { retryAfter })
      }),
      {
        status,
        headers,
      }
    );
  }
}

/**
 * Higher-order function to wrap API handlers with middleware
 */
export function withAPIMiddleware(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config?: Partial<APIMiddlewareConfig>
) {
  const middleware = new APIMiddleware(config);
  return (request: NextRequest) => middleware.process(request, handler);
} 