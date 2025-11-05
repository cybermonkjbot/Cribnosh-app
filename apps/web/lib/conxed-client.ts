import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference } from "convex/server";

let convex: ConvexHttpClient | null = null;

export function getConvexClient() {
  if (!convex) {
    convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  }
  return convex;
}

export { api };

// Type-safe accessor for api.queries
// Uses unknown as intermediate type (better than any) and asserts to proper structure
export function getApiQueries() {
  return (api as unknown as { queries: Record<string, Record<string, FunctionReference<"query", "public", Record<string, unknown>, unknown>>> }).queries;
}

// Type-safe accessor for api.mutations
// Uses unknown as intermediate type (better than any) and asserts to proper structure
export function getApiMutations() {
  return (api as unknown as { mutations: Record<string, Record<string, FunctionReference<"mutation", "public", Record<string, unknown>, unknown>>> }).mutations;
}

// Helper for dynamic module/function access
export function getApiFunction(module: string, fn: string) {
  // e.g. getApiFunction('mutations/sessions', 'deleteSession')
  // maps to api['mutations']['sessions']['deleteSession']
  const [type, mod] = module.split('/');
  const apiObj = type === 'queries' ? getApiQueries() : type === 'mutations' ? getApiMutations() : null;
  return apiObj?.[mod]?.[fn];
}
