/**
 * Frontend utilities for handling Convex authentication errors
 */

/**
 * Check if an error is authentication-related
 * @param error - Error to check
 * @returns true if error is authentication-related
 */
export function isAuthenticationError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('not authenticated') ||
      message.includes('missing or invalid token') ||
      message.includes('invalid or expired token') ||
      message.includes('session expired') ||
      message.includes('authentication required') ||
      (message.includes('access denied') && message.includes('not authenticated'))
    );
  }

  return false;
}

/**
 * Check if an error is authorization-related
 * @param error - Error to check
 * @returns true if error is authorization-related
 */
export function isAuthorizationError(error: unknown): boolean {
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('access denied') ||
      message.includes('forbidden') ||
      message.includes('not authorized') ||
      message.includes('insufficient permissions') ||
      message.includes('unauthorized access') ||
      (message.includes('only') && (message.includes('can access') || message.includes('can modify')))
    );
  }

  return false;
}

/**
 * Get user-friendly error message from Convex error
 * @param error - Error from Convex
 * @returns User-friendly error message
 */
export function getConvexErrorMessage(error: unknown): string {
  if (isAuthenticationError(error)) {
    return 'You need to be logged in to perform this action. Please log in and try again.';
  }

  if (isAuthorizationError(error)) {
    return 'You do not have permission to perform this action.';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

