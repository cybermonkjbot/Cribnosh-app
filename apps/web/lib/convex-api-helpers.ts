// Type-safe helpers for Convex API access
import { api } from "@/convex/_generated/api";
import type { FunctionReference } from "convex/server";
import { getConvexClient } from "./conxed-client";

// Type-safe accessor for api.queries
// Uses any as intermediate type for dynamic access
export function getApiQueries() {
  return (api as any).queries;
}

// Type-safe accessor for api.mutations
// Uses any as intermediate type for dynamic access
export function getApiMutations() {
  return (api as any).mutations;
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
  return await client.query(queryRef as any, args);
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
  return await client.mutation(mutationRef as any, args);
}
