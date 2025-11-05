// Type-safe helpers for Convex API access
import { api } from "@/convex/_generated/api";
import type { FunctionReference } from "convex/server";
import { getConvexClient } from "./conxed-client";

// Type-safe accessor for api.queries
// Uses unknown as intermediate type (better than any) and asserts to proper structure
export function getApiQueries() {
  return (api as unknown as { queries: Record<string, Record<string, FunctionReference<"query", "public", unknown, unknown>>> }).queries;
}

// Type-safe accessor for api.mutations
// Uses unknown as intermediate type (better than any) and asserts to proper structure
export function getApiMutations() {
  return (api as unknown as { mutations: Record<string, Record<string, FunctionReference<"mutation", "public", unknown, unknown>>> }).mutations;
}

// Type-safe query helper
export async function convexQuery<
  Args extends Record<string, unknown>,
  Result
>(
  queryRef: FunctionReference<"query", "public", Args, Result>,
  args: Args
): Promise<Result> {
  const client = getConvexClient();
  return await client.query(queryRef, args);
}

// Type-safe mutation helper
export async function convexMutation<
  Args extends Record<string, unknown>,
  Result
>(
  mutationRef: FunctionReference<"mutation", "public", Args, Result>,
  args: Args
): Promise<Result> {
  const client = getConvexClient();
  return await client.mutation(mutationRef, args);
}
