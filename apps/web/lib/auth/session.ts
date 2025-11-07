import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/conxed-client";
import { cookies as nextCookies } from "next/headers";
import type { NextRequest } from "next/server";

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
  const convex = getConvexClient();
  const user = await convex.query(api.queries.users.getUserBySessionToken, { sessionToken: token });
  
  if (!user) {
    return null;
  }
  
  // Explicitly check session expiry
  if (user.sessionExpiry && user.sessionExpiry < Date.now()) {
    return null;
  }
  
  return user;
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
  const convex = getConvexClient();
  const user = await convex.query(api.queries.users.getUserBySessionToken, { sessionToken: token });
  
  if (!user) {
    return null;
  }
  
  // Explicitly check session expiry
  if (user.sessionExpiry && user.sessionExpiry < Date.now()) {
    return null;
  }
  
  return user;
} 