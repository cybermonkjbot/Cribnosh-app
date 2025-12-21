import { ConvexError } from 'convex/values';
import { CribNoshError, ErrorFactory } from './standard-errors';
import { ErrorCode, ErrorContext } from './types';

/**
 * Handle Convex errors and convert them to standardized errors
 */
export function handleConvexError(
  error: unknown,
  _context?: ErrorContext
): ConvexError<any> {
  // If it's already a ConvexError, return it
  if (error instanceof ConvexError) {
    return error as ConvexError<any>;
  }

  // If it's a CribNosh error with a code, wrap its message
  if (error instanceof CribNoshError) {
    return new ConvexError(error.message);
  }

  // Handle standard Error instances
  if (error instanceof Error) {
    return new ConvexError(error.message);
  }

  // Handle unknown errors
  return new ConvexError('An unknown Convex error occurred');
}

/**
 * Validate Convex function arguments and throw appropriate errors
 */
export function validateConvexArgs(args: Record<string, unknown>, requiredFields: string[]): void {
  const missingFields = requiredFields.filter(field =>
    args[field] === undefined || args[field] === null || args[field] === ''
  );

  if (missingFields.length > 0) {
    throw ErrorFactory.validation(
      `Missing required fields: ${missingFields.join(', ')}`,
      { missingFields }
    );
  }
}

/**
 * Handle Convex database operations with proper error handling
 */
export async function safeConvexOperation<T>(
  operation: () => Promise<T>,
  context?: ErrorContext
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (error instanceof Error) {
      // Check for common Convex error patterns
      if (error.message.includes('not found')) {
        throw ErrorFactory.notFound(error.message, context);
      }
      if (error.message.includes('already exists') || error.message.includes('duplicate')) {
        throw ErrorFactory.conflict(error.message, context);
      }
      if (error.message.includes('permission') || error.message.includes('unauthorized')) {
        throw ErrorFactory.authorization(error.message, context);
      }
      if (error.message.includes('validation') || error.message.includes('invalid')) {
        throw ErrorFactory.validation(error.message, context);
      }
    }

    throw handleConvexError(error, context);
  }
}

/**
 * Create a standardized Convex error response
 */
export function createConvexErrorResponse(
  error: unknown,
  context?: ErrorContext
): { success: false; error: string; code: string } {
  const convexError = handleConvexError(error, context);
  const data = convexError.data;

  return {
    success: false,
    error: typeof data === 'string' ? data : (data?.message || convexError.message),
    code: (typeof data === 'object' && data?.code) || ErrorCode.CONVEX_ERROR,
  };
}

/**
 * Create a standardized Convex success response
 */
export function createConvexSuccessResponse<T>(
  data: T
): { success: true; data: T } {
  return {
    success: true,
    data,
  };
}

/**
 * Wrap Convex mutations with error handling
 */
export function withConvexErrorHandling<Ctx, Args, R>(
  mutation: (ctx: Ctx, args: Args) => Promise<R>,
  context?: ErrorContext
) {
  return async (ctx: Ctx, args: Args): Promise<R> => {
    try {
      return await mutation(ctx, args);
    } catch (error) {
      throw handleConvexError(error, context);
    }
  };
}

/**
 * Wrap Convex queries with error handling
 */
export function withConvexQueryErrorHandling<T extends readonly unknown[], R>(
  query: (...args: T) => Promise<R>,
  context?: ErrorContext
) {
  return async (...args: T): Promise<R> => {
    try {
      return await query(...args);
    } catch (error) {
      throw handleConvexError(error, context);
    }
  };
}

/**
 * Common Convex error messages
 */
export const CONVEX_ERROR_MESSAGES = {
  NOT_FOUND: 'Resource not found',
  ALREADY_EXISTS: 'Resource already exists',
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Access forbidden',
  VALIDATION_FAILED: 'Validation failed',
  DATABASE_ERROR: 'Database operation failed',
  INTERNAL_ERROR: 'Internal server error',
} as const;
