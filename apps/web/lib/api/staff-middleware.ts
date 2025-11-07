import { NextRequest, NextResponse } from 'next/server';
import { getUserFromRequest } from '@/lib/auth/session';
import { ResponseFactory } from '@/lib/api';
import { withCSRFProtection } from '@/lib/middleware/csrf';

/**
 * Middleware helper for staff API routes
 * Validates:
 * - CSRF token (for state-changing operations)
 * - User authentication (via session token)
 * - Staff role (must have 'staff' or 'admin' role)
 * - Active account status
 * - Session expiry
 */
export function withStaffAuth(handler: (req: NextRequest, user: any) => Promise<NextResponse>) {
  // First apply CSRF protection, then authentication
  return withCSRFProtection(async (req: NextRequest): Promise<NextResponse> => {
    try {
      // Authenticate user from session token
      const user = await getUserFromRequest(req);
      
      if (!user) {
        return ResponseFactory.unauthorized('Authentication required');
      }

      // Check session expiry explicitly
      if (user.sessionExpiry && user.sessionExpiry < Date.now()) {
        return ResponseFactory.unauthorized('Session expired');
      }

      // Check if user has staff or admin role
      if (!user.roles || !Array.isArray(user.roles) || (!user.roles.includes('staff') && !user.roles.includes('admin'))) {
        return ResponseFactory.forbidden('Forbidden: Only staff can access this endpoint');
      }

      // Check if account is active
      if (user.status && user.status !== 'active') {
        return ResponseFactory.forbidden('Account is not active');
      }

      return handler(req, user);
    } catch (error) {
      return ResponseFactory.internalError('Authentication failed');
    }
  });
}

