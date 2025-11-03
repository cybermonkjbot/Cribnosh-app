/**
 * Convex Context Types
 * Re-export and extend Convex context types for use throughout the codebase
 */

import type {
  QueryCtx,
  MutationCtx,
  ActionCtx,
  DatabaseReader,
  DatabaseWriter,
} from "@/convex/_generated/server";
import type { DataModel } from "@/convex/_generated/dataModel";

// Re-export context types
export type { QueryCtx, MutationCtx, ActionCtx, DatabaseReader, DatabaseWriter };

/**
 * JWT Payload type for authentication
 * Supports both user_id and userId for backward compatibility
 */
export interface JWTPayload {
  user_id?: string;
  userId?: string;
  role?: string;
  roles?: string[];
  email?: string;
  sub?: string;
  iat?: number;
  exp?: number;
  [key: string]: unknown;
}

/**
 * Generic error type
 */
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

