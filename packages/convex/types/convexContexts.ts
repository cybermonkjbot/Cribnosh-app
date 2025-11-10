/**
 * Convex Context Types
 * Re-export and extend Convex context types for use throughout the codebase
 */

import type {
    ActionCtx,
    DatabaseReader,
    DatabaseWriter,
    MutationCtx,
    QueryCtx,
} from "../_generated/server";

// Re-export context types
export type { ActionCtx, DatabaseReader, DatabaseWriter, MutationCtx, QueryCtx };

/**
 * Generic error type
 */
export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  details?: Record<string, unknown>;
}

