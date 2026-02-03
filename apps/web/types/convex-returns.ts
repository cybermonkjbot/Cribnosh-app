/**
 * Convex Return Types
 * Type definitions and helpers for Convex query/mutation return types
 */

import type { FunctionReference } from 'convex/server';

/**
 * Extract return type from a Convex function reference
 */
export type ConvexReturnType<T extends FunctionReference<'query' | 'mutation' | 'action', 'public' | 'internal', Record<string, unknown>, unknown>> =
  T extends FunctionReference<infer _Type, infer _Visibility, infer _Args, infer Return, infer _Optional>
  ? Return
  : never;

/**
 * Extract argument type from a Convex function reference
 */
export type ConvexArgsType<T extends FunctionReference<'query' | 'mutation' | 'action', 'public' | 'internal', Record<string, unknown>, unknown>> =
  T extends FunctionReference<infer _Type, infer _Visibility, infer Args, infer _Return, infer _Optional>
  ? Args
  : never;

/**
 * Helper type for Convex query results
 */
export type ConvexQueryResult<T> = T extends Promise<infer U> ? U : T;

/**
 * Helper type for Convex mutation results
 */
export type ConvexMutationResult<T> = T extends Promise<infer U> ? U : T;

/**
 * Helper type for Convex action results
 */
export type ConvexActionResult<T> = T extends Promise<infer U> ? U : T;

/**
 * Type for Convex document with ID
 */
export interface ConvexDocument {
  _id: any;
  _creationTime: number;
  [key: string]: unknown;
}

/**
 * Type guard for Convex document
 */
export function isConvexDocument(value: unknown): value is ConvexDocument {
  return (
    typeof value === 'object' &&
    value !== null &&
    '_id' in value &&
    '_creationTime' in value &&
    typeof (value as ConvexDocument)._id === 'string' &&
    typeof (value as ConvexDocument)._creationTime === 'number'
  );
}

