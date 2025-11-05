import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '../../lib/api/middleware';
import { MonitoringService } from '../../lib/monitoring/monitoring.service';
import { getUserFromRequest } from "@/lib/auth/session";

const monitoring = MonitoringService.getInstance();

/**
 * Legacy rate limit wrapper for backward compatibility
 * @deprecated Use withAPIMiddleware instead
 */
export async function withRateLimit(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return withAPIMiddleware(handler)(request);
}

/**
 * Next.js middleware for admin authentication and security
 */
export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Handle admin routes
  if (path.startsWith('/admin')) {
    // Use the new session validation utility
    return (async () => {
      const user = await getUserFromRequest(request);
      if (!user) {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
      // Optionally, check for admin role
      // if (user.role !== 'admin') {
      //   return NextResponse.redirect(new URL('/admin/login', request.url));
      // }
      return NextResponse.next();
    })();
  }
  return NextResponse.next();
}
