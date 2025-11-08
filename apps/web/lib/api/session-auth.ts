/**
 * Unified session authentication utility for customer endpoints
 * 
 * Replaces JWT Bearer token authentication with session token authentication
 * from cookies. Validates session tokens and ensures users have the customer role.
 */

import { NextRequest } from 'next/server';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { Id } from '@/convex/_generated/dataModel';

/**
 * Result type for authenticated customer
 */
export interface AuthenticatedCustomer {
  userId: string;
  user: any; // User object from Convex
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
