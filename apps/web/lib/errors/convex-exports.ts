/**
 * Convex-specific error handling exports
 * This file only exports what's needed for Convex functions
 * DO NOT import from the main index.ts to avoid Next.js dependencies
 */

// Types
export * from './types';

// Standard error classes
export * from './standard-errors';

// Convex-specific error handling
export * from './convex-error-handler';

// Re-export commonly used items for convenience
export {
  ErrorFactory,
  CribNoshError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  BusinessRuleError,
  ServiceUnavailableError,
  DatabaseError,
  ExternalServiceError,
  ConvexError,
} from './standard-errors';

export {
  handleConvexError,
  validateConvexArgs,
  safeConvexOperation,
  createConvexErrorResponse,
  createConvexSuccessResponse,
  withConvexErrorHandling,
  withConvexQueryErrorHandling,
  CONVEX_ERROR_MESSAGES,
} from './convex-error-handler';
