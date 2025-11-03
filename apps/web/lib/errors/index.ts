/**
 * Centralized error handling exports
 */

// Types
export * from './types';

// Standard error classes
export * from './standard-errors';

// Error handlers
export * from './error-handler';

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
  errorHandler,
  withErrorHandling,
  withAsyncErrorHandling,
} from './error-handler';

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
