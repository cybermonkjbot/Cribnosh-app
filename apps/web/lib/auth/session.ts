import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/conxed-client";
import { cookies as nextCookies } from "next/headers";
import type { NextRequest } from "next/server";
import { logger } from '@/lib/utils/logger';

/**
 * Wraps a Convex query with timeout and retry logic
 */
async function queryWithRetry<T>(
  queryFn: () => Promise<T>,
  options: { timeout?: number; maxRetries?: number } = {}
): Promise<T | null> {
  const { timeout = 15000, maxRetries = 2 } = options;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error("Query timeout")), timeout);
      });
      
      const result = await Promise.race([queryFn(), timeoutPromise]);
      return result;
    } catch (error) {
      const isLastAttempt = attempt === maxRetries;
      const isTimeout = error instanceof Error && error.message === "Query timeout";
      const isConnectionError = 
        error instanceof Error && 
        (error.message.includes("fetch failed") || 
         error.message.includes("Connect Timeout") ||
         error.message.includes("UND_ERR_CONNECT_TIMEOUT"));
      
      // If it's the last attempt or not a retryable error, return null
      if (isLastAttempt || (!isTimeout && !isConnectionError)) {
        // Log error in production for debugging
        if (process.env.NODE_ENV === "production") {
          logger.error("Convex query error:", {
            error: error instanceof Error ? error.message : String(error),
            attempt: attempt + 1,
            maxRetries: maxRetries + 1
          });
        }
        return null;
      }
      
      // Wait before retrying (exponential backoff)
      await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, attempt)));
    }
  }
  
  return null;
}

/**
 * Looks up the user in Convex by session token from cookies.
 * Returns the user object if valid, otherwise null.
 * Explicitly validates session expiry.
 */
export async function getUserFromCookies(cookies: { get: (name: string) => { value: string } | undefined }) {
  const token = cookies.get("convex-auth-token")?.value;
  if (!token) {
    return null;
  }
  
  try {
    const convex = getConvexClient();
    const user = await queryWithRetry(
      () => convex.query(api.queries.users.getUserBySessionToken, { sessionToken: token }),
      { timeout: 15000, maxRetries: 2 }
    );
    
    if (!user) {
      return null;
    }
    
    // Explicitly check session expiry
    if (user.sessionExpiry && user.sessionExpiry < Date.now()) {
      return null;
    }
    
    return user;
  } catch (error) {
    // If getConvexClient throws (e.g., missing env var), return null
    return null;
  }
}

/**
 * For Next.js API routes/middleware: extracts user from request cookies.
 * Explicitly validates session expiry.
 */
export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("convex-auth-token")?.value;
  if (!token) {
    return null;
  }
  
  try {
    const convex = getConvexClient();
    const user = await queryWithRetry(
      () => convex.query(api.queries.users.getUserBySessionToken, { sessionToken: token }),
      { timeout: 15000, maxRetries: 2 }
    );
    
    if (!user) {
      return null;
    }
    
    // Explicitly check session expiry
    if (user.sessionExpiry && user.sessionExpiry < Date.now()) {
      return null;
    }
    
    return user;
  } catch (error) {
    // If getConvexClient throws (e.g., missing env var), return null
    return null;
  }
} 