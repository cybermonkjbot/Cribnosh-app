import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { logger } from '@/lib/utils/logger';
import { extractSessionToken } from '@/lib/api/session-auth';

/**
 * Middleware helper for customer API routes
 * Validates:
 * - Token exists (fast check, no Convex call)
 * - User authentication (via session token from cookies/headers)
 * - Customer role (must have 'customer' role, auto-added if missing)
 * - Session expiry
 * 
 * Fails fast if no token is present - no Convex calls are made
 */
export function withCustomerAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Fast check: Fail immediately if no token exists (no Convex call)
      const sessionToken = extractSessionToken(req);
      if (!sessionToken) {
        return ResponseFactory.unauthorized('Authentication required');
      }

      // Now validate the token with Convex (only if token exists)
      const { user } = await getAuthenticatedCustomer(req);

      // Add user info to request context
      const reqWithUser = req as NextRequest & { user: typeof user };
      reqWithUser.user = user;

      return handler(reqWithUser, user);
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return ResponseFactory.unauthorized(error.message);
      }
      logger.error('Customer auth middleware error:', error);
      return ResponseFactory.internalError('Authentication failed');
    }
  };
}

