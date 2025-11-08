/**
 * Unified session authentication utility for all endpoints
 * 
 * Replaces JWT Bearer token authentication with session token authentication
 * from cookies. Validates session tokens and ensures users have required roles.
 */

import { NextRequest } from 'next/server';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { Id } from '@/convex/_generated/dataModel';

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
export interface AuthenticatedCustomer extends AuthenticatedUser {}

/**
 * Base function to get authenticated user from session token
 * 
 * Extracts session token from `convex-auth-token` cookie, validates it,
 * and checks session expiry. Does not enforce any role requirements.
 * 
 * @param request - Next.js request object
 * @returns Promise resolving to authenticated user info
 * @throws AuthenticationError if session token is missing or invalid
 */
async function getAuthenticatedUserBase(
  request: NextRequest
): Promise<AuthenticatedUser> {
  // Extract session token from cookie
  const sessionToken = request.cookies.get('convex-auth-token')?.value;
  
  if (!sessionToken) {
    throw new AuthenticationError('Missing session token');
  }

  // Validate session token using Convex query
  const convex = getConvexClient();
  const user = await convex.query(api.queries.users.getUserBySessionToken, { 
    sessionToken 
  });

  if (!user) {
    throw new AuthenticationError('Invalid or expired session token');
  }

  // Check session expiry (query already checks this, but double-check for safety)
  if (user.sessionExpiry && user.sessionExpiry < Date.now()) {
    throw new AuthenticationError('Session token has expired');
  }

  return {
    userId: user._id,
    user,
  };
}

/**
 * Get authenticated user from session token (no role requirement)
 * 
 * @param request - Next.js request object
 * @returns Promise resolving to authenticated user info
 * @throws AuthenticationError if session token is missing or invalid
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<AuthenticatedUser> {
  return getAuthenticatedUserBase(request);
}

/**
 * Get authenticated customer from session token in cookies
 * 
 * Extracts session token from `convex-auth-token` cookie, validates it,
 * checks session expiry, and ensures the user has the `customer` role.
 * Automatically adds the `customer` role if missing.
 * 
 * @param request - Next.js request object
 * @returns Promise resolving to authenticated customer info
 * @throws AuthenticationError if session token is missing or invalid
 * @throws AuthorizationError if user doesn't have customer role (after auto-add attempt)
 */
export async function getAuthenticatedCustomer(
  request: NextRequest
): Promise<AuthenticatedCustomer> {
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

    // Fetch updated user
    const updatedUser = await convex.query(api.queries.users.getUserBySessionToken, { 
      sessionToken: request.cookies.get('convex-auth-token')?.value!
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
 * Get authenticated chef from session token in cookies
 * 
 * Extracts session token from `convex-auth-token` cookie, validates it,
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
 * Get authenticated admin from session token in cookies
 * 
 * Extracts session token from `convex-auth-token` cookie, validates it,
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
