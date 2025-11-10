import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { logger } from '@/lib/utils/logger';

/**
 * Middleware helper for admin API routes
 * Validates:
 * - User authentication (via session token from cookies)
 * - Admin role (must have 'admin' role)
 * - Session expiry
 */
export function withAdminAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  return async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Authenticate user from session token
      const { user } = await getAuthenticatedAdmin(req);

      // Add user info to request context
      const reqWithUser = req as NextRequest & { user: typeof user };
      reqWithUser.user = user;

      return handler(reqWithUser, user);
    } catch (error) {
      if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
        return ResponseFactory.unauthorized(error.message);
      }
      logger.error('Admin auth middleware error:', error);
      return ResponseFactory.internalError('Authentication failed');
    }
  };
} 