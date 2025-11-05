import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '../monitoring/monitoring.service';

const monitoring = MonitoringService.getInstance();

export interface APIError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

export class APIErrorHandler {
  private static instance: APIErrorHandler;

  private constructor() {}

  public static getInstance(): APIErrorHandler {
    if (!APIErrorHandler.instance) {
      APIErrorHandler.instance = new APIErrorHandler();
    }
    return APIErrorHandler.instance;
  }

  /**
   * Handle different types of errors and return appropriate responses
   */
  handleError(error: unknown, request: NextRequest): NextResponse {
    const requestId = this.generateRequestId();
    const timestamp = new Date().toISOString();

    // Log the error
    this.logError(error, request, requestId);

    // Handle different error types
    if (error instanceof Error) {
      return this.handleGenericError(error, requestId, timestamp);
    }

    // Handle unknown errors
    return this.handleUnknownError(error, requestId, timestamp);
  }

  /**
   * Handle generic errors
   */
  private handleGenericError(error: Error, requestId: string, timestamp: string): NextResponse {
    let statusCode = 500;
    let errorCode = 'INTERNAL_SERVER_ERROR';

    // Map common error messages to appropriate status codes
    if (error.message.includes('not found') || error.message.includes('Not found')) {
      statusCode = 404;
      errorCode = 'NOT_FOUND';
    } else if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
      statusCode = 401;
      errorCode = 'UNAUTHORIZED';
    } else if (error.message.includes('forbidden') || error.message.includes('Forbidden')) {
      statusCode = 403;
      errorCode = 'FORBIDDEN';
    } else if (error.message.includes('conflict') || error.message.includes('Conflict')) {
      statusCode = 409;
      errorCode = 'CONFLICT';
    } else if (error.message.includes('rate limit') || error.message.includes('Too many requests')) {
      statusCode = 429;
      errorCode = 'RATE_LIMIT_EXCEEDED';
    }

    const apiError: APIError = {
      code: errorCode,
      message: this.sanitizeErrorMessage(error.message),
      timestamp,
      requestId,
    };

    return NextResponse.json(apiError, {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    });
  }

  /**
   * Handle unknown errors
   */
  private handleUnknownError(error: unknown, requestId: string, timestamp: string): NextResponse {
    const apiError: APIError = {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
      timestamp,
      requestId,
    };

    return NextResponse.json(apiError, {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId,
      },
    });
  }

  /**
   * Log error with context
   */
  private logError(error: unknown, request: NextRequest, requestId: string): void {
    const errorContext = {
      requestId,
      method: request.method,
      url: request.url,
      userAgent: request.headers.get('user-agent'),
      ip: this.getClientIP(request),
      timestamp: new Date().toISOString(),
    };

    if (error instanceof Error) {
      monitoring.logError(error, {
        context: 'api_error',
        ...errorContext,
      });
    } else {
      monitoring.logError(new Error('Unknown error occurred'), {
        context: 'api_unknown_error',
        error: String(error),
        ...errorContext,
      });
    }

    // Increment error metrics
    monitoring.incrementMetric('api_errors_total');
  }

  /**
   * Sanitize error messages for production
   */
  private sanitizeErrorMessage(message: string): string {
    // In production, we don't want to expose internal error details
    if (process.env.NODE_ENV === 'production') {
      // Replace sensitive information
      return message
        .replace(/password|secret|key|token/gi, '[REDACTED]')
        .replace(/\/\/.*@.*\//g, '//[REDACTED]@[REDACTED]/')
        .replace(/\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/g, '[IP_REDACTED]');
    }

    return message;
  }

  /**
   * Get client IP address
   */
  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get('cf-connecting-ip') ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      'unknown'
    );
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Create a standardized success response
   */
  createSuccessResponse(data: any, status: number = 200, requestId?: string): NextResponse {
    const response = {
      success: true,
      data,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requestId) {
      headers['X-Request-ID'] = requestId;
    }

    return NextResponse.json(response, {
      status,
      headers,
    });
  }

  /**
   * Create a standardized error response
   */
  createErrorResponse(
    code: string,
    message: string,
    status: number = 500,
    details?: any,
    requestId?: string
  ): NextResponse {
    const error: APIError = {
      code,
      message,
      details,
      timestamp: new Date().toISOString(),
      ...(requestId && { requestId }),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (requestId) {
      headers['X-Request-ID'] = requestId;
    }

    return NextResponse.json(error, {
      status,
      headers,
    });
  }
}

// Export singleton instance
export const apiErrorHandler = APIErrorHandler.getInstance();

/**
 * Higher-order function to wrap API handlers with error handling
 */
export function withErrorHandling<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      return apiErrorHandler.handleError(error, request);
    }
  };
} 