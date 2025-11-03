/**
 * Standard error classes and factory functions
 */

import { ErrorCode, ErrorSeverity, StandardError, ErrorContext } from './types';

export class CribNoshError extends Error {
  public readonly code: ErrorCode;
  public readonly severity: ErrorSeverity;
  public readonly context?: ErrorContext;
  public readonly timestamp: string;
  public readonly requestId?: string;

  constructor(
    code: ErrorCode,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: ErrorContext,
    requestId?: string
  ) {
    super(message);
    this.name = 'CribNoshError';
    this.code = code;
    this.severity = severity;
    this.context = context;
    this.timestamp = new Date().toISOString();
    this.requestId = requestId;

    // Ensure proper prototype chain
    Object.setPrototypeOf(this, CribNoshError.prototype);
  }

  toStandardError(): StandardError {
    return {
      code: this.code,
      message: this.message,
      context: this.context,
      severity: this.severity,
      timestamp: this.timestamp,
      requestId: this.requestId,
      stack: this.stack,
    };
  }
}

export class ValidationError extends CribNoshError {
  constructor(message: string, context?: ErrorContext, requestId?: string) {
    super(ErrorCode.VALIDATION_ERROR, message, ErrorSeverity.LOW, context, requestId);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends CribNoshError {
  constructor(message: string, context?: ErrorContext, requestId?: string) {
    super(ErrorCode.UNAUTHORIZED, message, ErrorSeverity.MEDIUM, context, requestId);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends CribNoshError {
  constructor(message: string, context?: ErrorContext, requestId?: string) {
    super(ErrorCode.FORBIDDEN, message, ErrorSeverity.MEDIUM, context, requestId);
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends CribNoshError {
  constructor(message: string, context?: ErrorContext, requestId?: string) {
    super(ErrorCode.NOT_FOUND, message, ErrorSeverity.LOW, context, requestId);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends CribNoshError {
  constructor(message: string, context?: ErrorContext, requestId?: string) {
    super(ErrorCode.CONFLICT, message, ErrorSeverity.MEDIUM, context, requestId);
    this.name = 'ConflictError';
  }
}

export class BusinessRuleError extends CribNoshError {
  constructor(message: string, context?: ErrorContext, requestId?: string) {
    super(ErrorCode.BUSINESS_RULE_VIOLATION, message, ErrorSeverity.MEDIUM, context, requestId);
    this.name = 'BusinessRuleError';
  }
}

export class ServiceUnavailableError extends CribNoshError {
  constructor(message: string, context?: ErrorContext, requestId?: string) {
    super(ErrorCode.SERVICE_UNAVAILABLE, message, ErrorSeverity.HIGH, context, requestId);
    this.name = 'ServiceUnavailableError';
  }
}

export class DatabaseError extends CribNoshError {
  constructor(message: string, context?: ErrorContext, requestId?: string) {
    super(ErrorCode.DATABASE_ERROR, message, ErrorSeverity.HIGH, context, requestId);
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends CribNoshError {
  constructor(message: string, context?: ErrorContext, requestId?: string) {
    super(ErrorCode.EXTERNAL_SERVICE_ERROR, message, ErrorSeverity.HIGH, context, requestId);
    this.name = 'ExternalServiceError';
  }
}

export class ConvexError extends CribNoshError {
  constructor(message: string, context?: ErrorContext, requestId?: string) {
    super(ErrorCode.CONVEX_ERROR, message, ErrorSeverity.HIGH, context, requestId);
    this.name = 'ConvexError';
  }
}

// Factory functions for common error patterns
export const ErrorFactory = {
  validation: (message: string, context?: ErrorContext, requestId?: string) =>
    new ValidationError(message, context, requestId),
  
  authentication: (message: string, context?: ErrorContext, requestId?: string) =>
    new AuthenticationError(message, context, requestId),
  
  authorization: (message: string, context?: ErrorContext, requestId?: string) =>
    new AuthorizationError(message, context, requestId),
  
  notFound: (message: string, context?: ErrorContext, requestId?: string) =>
    new NotFoundError(message, context, requestId),
  
  conflict: (message: string, context?: ErrorContext, requestId?: string) =>
    new ConflictError(message, context, requestId),
  
  businessRule: (message: string, context?: ErrorContext, requestId?: string) =>
    new BusinessRuleError(message, context, requestId),
  
  serviceUnavailable: (message: string, context?: ErrorContext, requestId?: string) =>
    new ServiceUnavailableError(message, context, requestId),
  
  database: (message: string, context?: ErrorContext, requestId?: string) =>
    new DatabaseError(message, context, requestId),
  
  externalService: (message: string, context?: ErrorContext, requestId?: string) =>
    new ExternalServiceError(message, context, requestId),
  
  convex: (message: string, context?: ErrorContext, requestId?: string) =>
    new ConvexError(message, context, requestId),
  
  // Generic error with custom code
  custom: (
    code: ErrorCode,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context?: ErrorContext,
    requestId?: string
  ) => new CribNoshError(code, message, severity, context, requestId),
};
