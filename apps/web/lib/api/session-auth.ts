/**
 * Unified session authentication utility for all endpoints
 * 
 * Supports session token authentication from:
 * - Cookies: `convex-auth-token` (web app)
 * - Headers: `X-Session-Token` or `Authorization: Bearer <sessionToken>` (mobile app)
 * 
 * Also supports JWT fallback for backward compatibility during migration.
 * Validates session tokens and ensures users have required roles.
 */

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { getConvexClient } from '@/lib/conxed-client';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

interface JWTPayload {
  user_id: string;
  role?: string;
  email?: string;
  iat?: number;
  exp?: number;
}

/**
 * Result type for authenticated user
 */
export interface AuthenticatedUser {
  userId: string;
  user: any; // User object from Convex
}

/**
 * Alias for backward compatibility
 */
export type AuthenticatedCustomer = AuthenticatedUser;

/**
 * Extract session token from request (cookie or header)
 * Supports multiple sources for backward compatibility
 * 
 * This is a fast check that doesn't make any Convex calls.
 * Use this to fail fast before making any Convex queries.
 */
export function extractSessionToken(request: NextRequest): string | null {
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

/**
 * Validate session token using Convex query
 */
async function validateSessionToken(sessionToken: string): Promise<AuthenticatedUser | null> {
  const convex = getConvexClient();
  const user = await convex.query(api.queries.users.getUserBySessionToken, {
    sessionToken
  });

  if (!user) {
    return null;
  }

  // Check session expiry
  if (user.sessionExpiry && user.sessionExpiry < Date.now()) {
    return null;
  }

  return {
    userId: user._id,
    user,
  };
}

/**
 * Validate JWT token (fallback for backward compatibility)
 */
async function validateJWTToken(jwtToken: string): Promise<AuthenticatedUser | null> {
  try {
    const payload = jwt.verify(jwtToken, JWT_SECRET) as JWTPayload;
    if (!payload.user_id) {
      return null;
    }

    const convex = getConvexClient();
    const user = await convex.query(api.queries.users.getUserById, {
      userId: payload.user_id as Id<'users'>,
    });

    if (!user) {
      return null;
    }

    return {
      userId: user._id,
      user,
    };
  } catch {
    return null;
  }
}

/**
 * Base function to get authenticated user from session token or JWT (fallback)
 * 
 * Extracts session token from cookie or headers, validates it,
 * and checks session expiry. Falls back to JWT if sessionToken not found.
 * Does not enforce any role requirements.
 * 
 * IMPORTANT: This function makes Convex calls to validate the token.
 * For fail-fast behavior, check extractSessionToken() first.
 * 
 * @param request - Next.js request object
 * @returns Promise resolving to authenticated user info
 * @throws AuthenticationError if session token is missing or invalid
 */
async function getAuthenticatedUserBase(
  request: NextRequest
): Promise<AuthenticatedUser> {
  // Fast check: Fail immediately if no token exists (no Convex call)
  const sessionToken = extractSessionToken(request);

  if (sessionToken) {
    const user = await validateSessionToken(sessionToken);
    if (user) {
      return user;
    }
  }

  // Fallback to JWT (for backward compatibility during migration)
  const authHeader = request.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const jwtToken = authHeader.replace('Bearer ', '');
    // Only try JWT if it looks like a JWT (has dots)
    if (jwtToken.includes('.')) {
      const user = await validateJWTToken(jwtToken);
      if (user) {
        return user;
      }
    }
  }

  throw new AuthenticationError('Missing or invalid authentication token');
}

/**
 * Get authenticated user from session token (no role requirement)
 * 
 * IMPORTANT: This function makes Convex calls to validate the token.
 * For fail-fast behavior, check extractSessionToken() first.
 * 
 * @param request - Next.js request object
 * @returns Promise resolving to authenticated user info
 * @throws AuthenticationError if session token is missing or invalid
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser> {
  // Fast check: Fail immediately if no token exists (no Convex call)
  const sessionToken = extractSessionToken(request);
  if (!sessionToken) {
    // Also check for JWT in Authorization header (fallback)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid authentication token');
    }
  }

  return getAuthenticatedUserBase(request);
}

/**
 * Get authenticated customer from session token (cookie or header)
 * 
 * Extracts session token from cookie or headers, validates it,
 * checks session expiry, and ensures the user has the `customer` role.
 * Automatically adds the `customer` role if missing.
 * 
 * IMPORTANT: This function makes Convex calls to validate the token.
 * For fail-fast behavior, check extractSessionToken() first or use withCustomerAuth() middleware.
 * 
 * @param request - Next.js request object
 * @returns Promise resolving to authenticated customer info
 * @throws AuthenticationError if session token is missing or invalid
 * @throws AuthorizationError if user doesn't have customer role (after auto-add attempt)
 */
export async function getAuthenticatedCustomer(
  request: NextRequest
): Promise<AuthenticatedCustomer> {
  // Fast check: Fail immediately if no token exists (no Convex call)
  const sessionToken = extractSessionToken(request);
  if (!sessionToken) {
    // Also check for JWT in Authorization header (fallback)
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid authentication token');
    }
  }

  const { user } = await getAuthenticatedUserBase(request);
  const convex = getConvexClient();

  // Ensure user has customer role (auto-add if missing)
  if (!user.roles || !user.roles.includes('customer')) {
    // Auto-add customer role
    const updatedRoles = user.roles ? [...user.roles, 'customer'] : ['customer'];
    await convex.mutation(api.mutations.users.updateUser, {
      userId: user._id as Id<'users'>,
      roles: updatedRoles,
    });

    // Fetch updated user using the same token source
    const sessionToken = extractSessionToken(request);
    if (!sessionToken) {
      throw new AuthenticationError('Failed to extract session token for role update');
    }

    const updatedUser = await convex.query(api.queries.users.getUserBySessionToken, {
      sessionToken
    });

    if (!updatedUser || !updatedUser.roles?.includes('customer')) {
      throw new AuthorizationError('Failed to assign customer role');
    }

    return {
      userId: updatedUser._id,
      user: updatedUser,
    };
  }

  return {
    userId: user._id,
    user,
  };
}

/**
 * Get authenticated chef from session token (cookie or header)
 * 
 * Extracts session token from cookie or headers, validates it,
 * checks session expiry, and ensures the user has the `chef` role.
 * 
 * @param request - Next.js request object
 * @returns Promise resolving to authenticated chef info
 * @throws AuthenticationError if session token is missing or invalid
 * @throws AuthorizationError if user doesn't have chef role
 */
export async function getAuthenticatedChef(
  request: NextRequest
): Promise<AuthenticatedUser> {
  const { user } = await getAuthenticatedUserBase(request);

  // Check if user has chef role
  if (!user.roles || !user.roles.includes('chef')) {
    throw new AuthorizationError('Forbidden: Only chefs can access this endpoint');
  }

  return {
    userId: user._id,
    user,
  };
}

/**
 * Get authenticated driver from session token (cookie or header)
 * 
 * Extracts session token from cookie or headers, validates it,
 * checks session expiry, and ensures the user has the `driver` role.
 * 
 * @param request - Next.js request object
 * @returns Promise resolving to authenticated driver info
 * @throws AuthenticationError if session token is missing or invalid
 * @throws AuthorizationError if user doesn't have driver role
 */
export async function getAuthenticatedDriver(
  request: NextRequest
): Promise<AuthenticatedUser> {
  const { user } = await getAuthenticatedUserBase(request);

  // Check if user has driver role
  if (!user.roles || !user.roles.includes('driver')) {
    throw new AuthorizationError('Forbidden: Only drivers can access this endpoint');
  }

  return {
    userId: user._id,
    user,
  };
}

/**
 * Get authenticated admin from session token (cookie or header)
 * 
 * Extracts session token from cookie or headers, validates it,
 * checks session expiry, and ensures the user has the `admin` role.
 * 
 * @param request - Next.js request object
 * @returns Promise resolving to authenticated admin info
 * @throws AuthenticationError if session token is missing or invalid
 * @throws AuthorizationError if user doesn't have admin role
 */
export async function getAuthenticatedAdmin(
  request: NextRequest
): Promise<AuthenticatedUser> {
  const { user } = await getAuthenticatedUserBase(request);

  // Check if user has admin role
  if (!user.roles || !user.roles.includes('admin')) {
    throw new AuthorizationError('Forbidden: Only admins can access this endpoint');
  }

  return {
    userId: user._id,
    user,
  };
}

/**
 * Require authenticated customer (throws if not authenticated)
 * 
 * Same as getAuthenticatedCustomer but with a more explicit name for
 * cases where authentication is required (not optional).
 * 
 * @param request - Next.js request object
 * @returns Promise resolving to authenticated customer info
 * @throws AuthenticationError if session token is missing or invalid
 * @throws AuthorizationError if user doesn't have customer role
 */
export async function requireCustomerAuth(
  request: NextRequest
): Promise<AuthenticatedCustomer> {
  return getAuthenticatedCustomer(request);
}
