import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";
import type { FunctionReference } from "convex/server";
import { NextRequest } from "next/server";

let convex: ConvexHttpClient | null = null;

export function getConvexClient() {
  if (!convex) {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!convexUrl) {
      throw new Error(
        "NEXT_PUBLIC_CONVEX_URL is not set. Please check your environment variables."
      );
    }
    convex = new ConvexHttpClient(convexUrl);
  }
  return convex;
}

/**
 * Get Convex client with session token from request
 * Extracts session token from cookies or headers and sets it on the client
 */
export function getConvexClientFromRequest(request: NextRequest): ConvexHttpClient {
  const client = getConvexClient();
  
  // Extract session token from request
  const sessionToken = extractSessionToken(request);
  
  if (sessionToken) {
    // Set auth token on client
    client.setAuth(sessionToken);
  } else {
    // Clear auth if no token found
    client.clearAuth();
  }
  
  return client;
}

/**
 * Extract session token from request (cookie or header)
 * Supports multiple sources for backward compatibility
 */
function extractSessionToken(request: NextRequest): string | null {
  // Priority 1: Cookie (web app)
  const cookieToken = request.cookies.get('convex-auth-token')?.value;
  if (cookieToken) {
    return cookieToken;
  }

  // Priority 2: X-Session-Token header (mobile app)
  const headerToken = request.headers.get('X-Session-Token');
  if (headerToken) {
    return headerToken;
  }

  // Priority 3: Authorization header (mobile app - sessionToken format)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '');
    // SessionToken is typically 43 chars (base64url of 32 bytes)
    // JWT is typically longer (3 parts separated by dots)
    // If it looks like a sessionToken (no dots, ~43 chars), use it
    if (!token.includes('.') && token.length >= 40 && token.length <= 50) {
      return token;
    }
  }

  return null;
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
