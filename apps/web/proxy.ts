import { getUserFromRequest } from "@/lib/auth/session";
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createSessionTransferToken } from '@/lib/auth/session-transfer';

export async function proxy(request: NextRequest) {
  // Extract real client IP from Cloudflare header
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  // Clone the request and set custom headers for downstream usage
  const requestHeaders = new Headers(request.headers);
  if (cfConnectingIp) {
    requestHeaders.set('x-real-ip', cfConnectingIp);
  }

  // Get the user agent
  const userAgent = request.headers.get('user-agent') || '';
  
  const pathname = request.nextUrl.pathname;
  requestHeaders.set('x-pathname', pathname);
  const hostname = request.headers.get('host') || '';
  const country = request.headers.get('cf-ipcountry') || request.headers.get('x-vercel-ip-country') || '';

  // Skip domain redirect logic in development
  const isDevelopment = hostname.includes('localhost') || hostname.includes('127.0.0.1');

  // Handle CORS preflight requests for API routes in development
  if (isDevelopment && pathname.startsWith('/api/') && request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }
  
  if (!isDevelopment) {
    // Domain routing for geo: ensure UK users land on .co.uk; others on .com
    // Only redirect if we have a valid country detection and the domains are properly configured
    const isUK = country && (country.toUpperCase() === 'GB' || country.toUpperCase() === 'UK');
    const isCoUk = hostname.endsWith('cribnosh.co.uk');
    const isCom = hostname.endsWith('cribnosh.com');


    // Only redirect if:
    // 1. We have country detection AND
    // 2. User is UK but on .com domain (redirect to .co.uk)
    // 3. User is NOT UK but on .co.uk domain (redirect to .com)
    // 4. NOT already on a session handoff path (prevents loops)
    if (country && 
        ((isUK && isCom) || (!isUK && isCoUk)) && 
        !pathname.startsWith('/api/session/handoff')) {
      
      const url = new URL(request.url);
      // Preserve path and query; swap host to target apex domain
      url.host = isUK ? 'cribnosh.co.uk' : 'cribnosh.com';
      url.protocol = 'https:';
      url.port = '';


      // Session continuity: pass short‑lived transfer token via query and point to handoff endpoint
      const sessionToken = request.cookies.get('convex-auth-token')?.value;
      if (sessionToken) {
        const xfer = await createSessionTransferToken(sessionToken);
        url.pathname = '/api/session/handoff';
        url.searchParams.set('xfer', xfer);
        url.searchParams.set('next', request.nextUrl.pathname + request.nextUrl.search);
      }

      return NextResponse.redirect(url, { status: 307 });
    }
  }

  // Create response with forwarded headers
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Add CORS headers for API routes in development
  if (isDevelopment && pathname.startsWith('/api/')) {
    response.headers.set('Access-Control-Allow-Origin', '*');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Set security headers
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // Paths that should never be cached
  const NEVER_CACHE_PATHS = [
    '/api/',
    '/admin/',
    '/try-it',
  ];

  // Paths that should be cached with revalidation
  const REVALIDATE_PATHS = [
    '/features',
    '/about',
    '/manifesto',
    '/values',
  ];

  // Paths that should be cached aggressively
  const AGGRESSIVE_CACHE_PATHS = [
    '/_next/',
    '/static/',
    '/images/',
    '/fonts/',
  ];

  // Set cache control headers based on path
  if (NEVER_CACHE_PATHS.some(path => pathname.startsWith(path))) {
    response.headers.set(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
  } else if (REVALIDATE_PATHS.some(path => pathname.startsWith(path))) {
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=60, stale-while-revalidate=300'
    );
    // Add cache tag for Cloudflare
    response.headers.set('Cache-Tag', `page-${pathname.replace(/\//g, '-')}`);
  } else if (AGGRESSIVE_CACHE_PATHS.some(path => pathname.startsWith(path))) {
    response.headers.set(
      'Cache-Control',
      'public, max-age=31536000, immutable'
    );
  } else {
    // Default caching strategy
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=10, stale-while-revalidate=59'
    );
    response.headers.set('Cache-Tag', `page-${pathname.replace(/\//g, '-')}`);
  }

  // Convex Auth protection for /admin and /staff routes
  const isLoginPage = pathname === '/admin/login' || pathname === '/staff/login';
  
  if ((pathname.startsWith('/admin') || pathname.startsWith('/staff')) && !isLoginPage) {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      // Redirect to appropriate login page based on route
      const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/staff/login';
      return NextResponse.redirect(new URL(loginPath, request.url));
    }
    
    // Check session expiry explicitly
    if (user.sessionExpiry && user.sessionExpiry < Date.now()) {
      const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/staff/login';
      return NextResponse.redirect(new URL(loginPath, request.url));
    }
    
    // Enforce admin role on /admin
    if (pathname.startsWith('/admin') && (!user.roles || !Array.isArray(user.roles) || !user.roles.includes('admin'))) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    // Enforce staff role on /staff (must have staff or admin role)
    if (pathname.startsWith('/staff')) {
      const hasStaffRole = user.roles && Array.isArray(user.roles) && (user.roles.includes('staff') || user.roles.includes('admin'));
      if (!hasStaffRole) {
        return NextResponse.redirect(new URL('/staff/login', request.url));
      }
      
      // Check if account is active
      if (user.status && user.status !== 'active') {
        return NextResponse.redirect(new URL('/staff/login', request.url));
      }
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Run on all routes except static files
    '/((?!_next/static|_next/image|favicon.ico|robots.txt).*)',
    '/cities',
    '/cities/:path*',
  ],
};