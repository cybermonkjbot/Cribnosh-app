/**
 * Standardized error types and interfaces for consistent error handling
 */

export enum ErrorCode {
  // Validation Errors (400-499)
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD = 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',
  BAD_REQUEST = 'BAD_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  NOT_FOUND = 'NOT_FOUND',
  CONFLICT = 'CONFLICT',
  RATE_LIMITED = 'RATE_LIMITED',
  METHOD_NOT_ALLOWED = 'METHOD_NOT_ALLOWED',
  
  // Server Errors (500-599)
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR = 'DATABASE_ERROR',
  EXTERNAL_SERVICE_ERROR = 'EXTERNAL_SERVICE_ERROR',
  TIMEOUT = 'TIMEOUT',
  
  // Business Logic Errors
  BUSINESS_RULE_VIOLATION = 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS',
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  
  // Convex Specific
  CONVEX_ERROR = 'CONVEX_ERROR',
  CONVEX_VALIDATION_ERROR = 'CONVEX_VALIDATION_ERROR',
  CONVEX_MUTATION_ERROR = 'CONVEX_MUTATION_ERROR',
  CONVEX_QUERY_ERROR = 'CONVEX_QUERY_ERROR',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface ErrorContext {
  userId?: string;
  requestId?: string;
  endpoint?: string;
  method?: string;
  timestamp?: string;
  userAgent?: string;
  ipAddress?: string;
  [key: string]: string | number | boolean | string[] | undefined;
}

export interface StandardError {
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
  context?: ErrorContext;
  severity: ErrorSeverity;
  timestamp: string;
  requestId?: string;
  stack?: string;
}

export interface APIErrorResponse {
  error: StandardError;
  success: false;
}

export interface APISuccessResponse<T = unknown> {
  data: T;
  success: true;
  requestId?: string;
}

export type APIResponse<T = unknown> = APIErrorResponse | APISuccessResponse<T>;

// Error categories for easier handling
export const ERROR_CATEGORIES = {
  CLIENT_ERRORS: [
    ErrorCode.VALIDATION_ERROR,
    ErrorCode.INVALID_INPUT,
    ErrorCode.MISSING_REQUIRED_FIELD,
    ErrorCode.INVALID_FORMAT,
    ErrorCode.UNAUTHORIZED,
    ErrorCode.FORBIDDEN,
    ErrorCode.NOT_FOUND,
    ErrorCode.CONFLICT,
    ErrorCode.RATE_LIMITED,
  ],
  SERVER_ERRORS: [
    ErrorCode.INTERNAL_ERROR,
    ErrorCode.SERVICE_UNAVAILABLE,
    ErrorCode.DATABASE_ERROR,
    ErrorCode.EXTERNAL_SERVICE_ERROR,
    ErrorCode.TIMEOUT,
  ],
  BUSINESS_ERRORS: [
    ErrorCode.BUSINESS_RULE_VIOLATION,
    ErrorCode.INSUFFICIENT_PERMISSIONS,
    ErrorCode.RESOURCE_EXHAUSTED,
  ],
  CONVEX_ERRORS: [
    ErrorCode.CONVEX_ERROR,
    ErrorCode.CONVEX_VALIDATION_ERROR,
    ErrorCode.CONVEX_MUTATION_ERROR,
    ErrorCode.CONVEX_QUERY_ERROR,
  ],
} as const;
