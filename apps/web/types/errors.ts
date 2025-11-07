/**
 * Error Types
 * Standardized error types for error handling throughout the codebase
 */

/**
 * Type guard to check if a value is an Error-like object
 */
export function isErrorLike(value: unknown): value is ErrorLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    ('message' in value || 'name' in value || 'stack' in value)
  );
}

/**
 * Error-like interface for values that might be errors
 */
export interface ErrorLike {
  message?: string;
  name?: string;
  stack?: string;
  code?: string | number;
  statusCode?: number;
  details?: Record<string, unknown>;
}

/**
 * Extract error message from unknown error value
 */
export function getErrorMessage(error: unknown, fallback = 'An unknown error occurred'): string {
  if (error instanceof Error) {
    return error.message || fallback;
  }
  if (isErrorLike(error)) {
    return error.message || fallback;
  }
  if (typeof error === 'string') {
    return error;
  }
  return fallback;
}

/**
 * Extract error code from unknown error value
 */
export function getErrorCode(error: unknown): string | number | undefined {
  if (isErrorLike(error)) {
    return error.code;
  }
  if (error instanceof Error && 'code' in error) {
    return (error as Error & { code: string | number }).code;
  }
  return undefined;
}

/**
 * Extract status code from unknown error value
 */
export function getErrorStatusCode(error: unknown): number | undefined {
  if (isErrorLike(error)) {
    return error.statusCode;
  }
  if (error instanceof Error && 'statusCode' in error) {
    return (error as Error & { statusCode: number }).statusCode;
  }
  return undefined;
}

/**
 * Create a standardized error object from unknown error
 */
export function normalizeError(error: unknown): ErrorLike {
  if (error instanceof Error) {
    return {
      message: error.message,
      name: error.name,
      stack: error.stack,
      ...(error && typeof error === 'object' && 'code' in error && { code: (error as Error & { code: string | number }).code }),
      ...(error && typeof error === 'object' && 'statusCode' in error && { statusCode: (error as Error & { statusCode: number }).statusCode }),
    };
  }
  if (isErrorLike(error)) {
    return error;
  }
  if (typeof error === 'string') {
    return { message: error };
  }
  return { message: 'An unknown error occurred' };
}

