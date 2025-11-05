/**
 * Standardized API response types and interfaces
 */

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  meta?: ResponseMeta;
  errors?: ApiError[];
}

export interface ResponseMeta {
  requestId?: string;
  timestamp: string;
  version: string;
  pagination?: PaginationMeta;
  rateLimit?: RateLimitMeta;
  cache?: CacheMeta;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface RateLimitMeta {
  limit: number;
  remaining: number;
  reset: number;
}

export interface CacheMeta {
  cached: boolean;
  ttl?: number;
  expiresAt?: string;
}

export interface ApiError {
  code: string;
  message: string;
  field?: string;
  details?: Record<string, any>;
}

export interface ListResponse<T> extends ApiResponse<T[]> {
  meta: ResponseMeta & {
    pagination: PaginationMeta;
  };
}

export interface SingleResponse<T> extends ApiResponse<T> {
  data: T;
}

export interface EmptyResponse extends ApiResponse {
  data: null;
}

// HTTP Status Code Constants
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
} as const;

// API Version
export const API_VERSION = '1.0.0';

// Response Headers
export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'X-API-Version': API_VERSION,
  'X-Request-ID': '', // Will be set dynamically
} as const;
