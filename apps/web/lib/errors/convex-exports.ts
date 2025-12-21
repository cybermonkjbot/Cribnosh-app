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
  AuthenticationError,
  AuthorizationError, BusinessRuleError, ConflictError, ConvexError as CribNoshConvexError, CribNoshError, DatabaseError, ErrorFactory, ExternalServiceError, NotFoundError, ServiceUnavailableError, ValidationError
} from './standard-errors';

// Re-export official ConvexError from convex/values for propagation
export { ConvexError } from 'convex/values';

export {
  CONVEX_ERROR_MESSAGES, createConvexErrorResponse,
  createConvexSuccessResponse, handleConvexError, safeConvexOperation, validateConvexArgs, withConvexErrorHandling,
  withConvexQueryErrorHandling
} from './convex-error-handler';

