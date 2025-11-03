/**
 * Centralized error handling system
 */

import { NextRequest, NextResponse } from 'next/server';
import { CribNoshError, ErrorFactory } from './standard-errors';
import { ErrorCode, ErrorSeverity, StandardError, APIResponse, ErrorContext } from './types';
import { ResponseFactory } from '../api/response-factory';
// import { monitoring } from '@/lib/monitoring';

export class ErrorHandler {
  private static instance: ErrorHandler;

  public static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle errors and convert them to standardized responses
   */
  handleError(error: unknown, request?: NextRequest): NextResponse {
    const requestId = this.generateRequestId();
    const timestamp = new Date().toISOString();

    // Log the error
    this.logError(error, request, requestId);

    // Convert to standardized error
    const standardError = this.convertToStandardError(error, requestId, request);

    // Create response
    return this.createErrorResponse(standardError);
  }

  /**
   * Convert any error to a StandardError
   */
  convertToStandardError(
    error: unknown,
    requestId?: string,
    request?: NextRequest
  ): StandardError {
    const context: ErrorContext = {
      requestId,
      timestamp: new Date().toISOString(),
    };

    if (request) {
      context.endpoint = new URL(request.url).pathname;
      context.method = request.method;
      context.userAgent = request.headers.get('user-agent') || undefined;
      context.ipAddress = this.getClientIP(request);
    }

    // Handle CribNoshError instances
    if (error instanceof CribNoshError) {
      return {
        ...error.toStandardError(),
        context: { ...context, ...error.context },
        requestId: requestId || error.requestId,
      };
    }

    // Handle standard Error instances
    if (error instanceof Error) {
      return {
        code: ErrorCode.INTERNAL_ERROR,
        message: error.message || 'An unexpected error occurred',
        severity: ErrorSeverity.HIGH,
        context,
        timestamp: new Date().toISOString(),
        requestId,
        stack: error.stack,
      };
    }

    // Handle unknown errors
    return {
      code: ErrorCode.INTERNAL_ERROR,
      message: 'An unknown error occurred',
      severity: ErrorSeverity.HIGH,
      context,
      timestamp: new Date().toISOString(),
      requestId,
    };
  }

  /**
   * Create a standardized error response
   */
  createErrorResponse(error: StandardError): NextResponse {
    const statusCode = this.getStatusCode(error.code);
    
    const response: APIResponse = {
      error,
      success: false,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (error.requestId) {
      headers['X-Request-ID'] = error.requestId;
    }

    return NextResponse.json(response, {
      status: statusCode,
      headers,
    });
  }

  /**
   * Create a standardized success response
   * @deprecated Use ResponseFactory.success() instead
   */
  createSuccessResponse<T>(
    data: T,
    statusCode: number = 200,
    requestId?: string
  ): NextResponse {
    return ResponseFactory.success(data, undefined, statusCode, { requestId });
  }

  /**
   * Log error with appropriate level based on severity
   */
  private logError(error: unknown, request?: NextRequest, requestId?: string): void {
    const errorDetails = {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      requestId,
      url: request?.url,
      method: request?.method,
      timestamp: new Date().toISOString(),
    };

    if (error instanceof CribNoshError) {
      switch (error.severity) {
        case ErrorSeverity.LOW:
          console.warn('Low severity error:', errorDetails);
          break;
        case ErrorSeverity.MEDIUM:
          console.error('Medium severity error:', errorDetails);
          break;
        case ErrorSeverity.HIGH:
        case ErrorSeverity.CRITICAL:
          console.error('High/Critical severity error:', errorDetails);
          // Send to monitoring service for critical errors
          // monitoring.logError(error, {
          //   context: 'error_handler',
          //   requestId,
          //   severity: error.severity,
          // });
          break;
      }
    } else {
      console.error('Unhandled error:', errorDetails);
      // Send to monitoring service for unhandled errors
      // monitoring.logError(error as Error, {
      //   context: 'error_handler',
      //   requestId,
      //   severity: ErrorSeverity.HIGH,
      // });
    }
  }

  /**
   * Get HTTP status code for error code
   */
  private getStatusCode(code: ErrorCode): number {
    const statusMap: Record<ErrorCode, number> = {
      [ErrorCode.VALIDATION_ERROR]: 400,
      [ErrorCode.INVALID_INPUT]: 400,
      [ErrorCode.MISSING_REQUIRED_FIELD]: 400,
      [ErrorCode.INVALID_FORMAT]: 400,
      [ErrorCode.BAD_REQUEST]: 400,
      [ErrorCode.UNAUTHORIZED]: 401,
      [ErrorCode.FORBIDDEN]: 403,
      [ErrorCode.NOT_FOUND]: 404,
      [ErrorCode.METHOD_NOT_ALLOWED]: 405,
      [ErrorCode.CONFLICT]: 409,
      [ErrorCode.RATE_LIMITED]: 429,
      [ErrorCode.INTERNAL_ERROR]: 500,
      [ErrorCode.SERVICE_UNAVAILABLE]: 503,
      [ErrorCode.DATABASE_ERROR]: 500,
      [ErrorCode.EXTERNAL_SERVICE_ERROR]: 502,
      [ErrorCode.TIMEOUT]: 504,
      [ErrorCode.BUSINESS_RULE_VIOLATION]: 422,
      [ErrorCode.INSUFFICIENT_PERMISSIONS]: 403,
      [ErrorCode.RESOURCE_EXHAUSTED]: 429,
      [ErrorCode.CONVEX_ERROR]: 500,
      [ErrorCode.CONVEX_VALIDATION_ERROR]: 400,
      [ErrorCode.CONVEX_MUTATION_ERROR]: 500,
      [ErrorCode.CONVEX_QUERY_ERROR]: 500,
    };

    return statusMap[code] || 500;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract client IP from request
   */
  private getClientIP(request: NextRequest): string | undefined {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    
    if (realIP) {
      return realIP;
    }
    
    return undefined;
  }
}

// Export singleton instance
export const errorHandler = ErrorHandler.getInstance();

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
      return errorHandler.handleError(error, request);
    }
  };
}

/**
 * Higher-order function to wrap async functions with error handling
 */
export function withAsyncErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context?: ErrorContext
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const cribNoshError = error instanceof CribNoshError 
        ? error 
        : ErrorFactory.custom(
            ErrorCode.INTERNAL_ERROR,
            error instanceof Error ? error.message : 'Unknown error',
            ErrorSeverity.HIGH,
            context
          );
      
      throw cribNoshError;
    }
  };
}
