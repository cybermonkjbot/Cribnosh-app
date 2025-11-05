import { api } from "@/convex/_generated/api";
import { getConvexClient } from "@/lib/conxed-client";
import { cookies as nextCookies } from "next/headers";
import type { NextRequest } from "next/server";

/**
 * Looks up the user in Convex by session token from cookies.
 * Returns the user object if valid, otherwise null.
 */
export async function getUserFromCookies(cookies: { get: (name: string) => { value: string } | undefined }) {
  const token = cookies.get("convex-auth-token")?.value;
  const isProd = process.env.NODE_ENV === 'production';
  if (!token) {
    if (!isProd) console.log('[SESSION] No convex-auth-token cookie found');
    return null;
  }
  const convex = getConvexClient();
  const user = await convex.query(api.queries.users.getUserBySessionToken, { sessionToken: token });
  if (!isProd) {
    console.log('[SESSION] getUserFromCookies', { token, user });
    if (user && user.sessionExpiry) {
      console.log('[SESSION] sessionExpiry:', user.sessionExpiry, 'now:', Date.now(), 'expired:', user.sessionExpiry < Date.now());
    }
  }
  return user || null;
}

/**
 * For Next.js API routes/middleware: extracts user from request cookies.
 */
export async function getUserFromRequest(req: NextRequest) {
  const token = req.cookies.get("convex-auth-token")?.value;
  const isProd = process.env.NODE_ENV === 'production';
  if (!token) {
    if (!isProd) console.log('[SESSION] No convex-auth-token cookie found in request');
    return null;
  }
  const convex = getConvexClient();
  const user = await convex.query(api.queries.users.getUserBySessionToken, { sessionToken: token });
  if (!isProd) {
    console.log('[SESSION] getUserFromRequest', { token, user });
    if (user && user.sessionExpiry) {
      console.log('[SESSION] sessionExpiry:', user.sessionExpiry, 'now:', Date.now(), 'expired:', user.sessionExpiry < Date.now());
    }
  }
  return user || null;
} 