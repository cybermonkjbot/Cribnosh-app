import { NextRequest, NextResponse } from 'next/server';

export function withCSRFProtection(handler: (req: NextRequest) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    if (process.env.NODE_ENV === 'test') {
      // Bypass CSRF in tests
      return handler(req);
    }
    const csrfCookie = req.cookies.get('csrf_token');
    const csrfHeader = req.headers.get('x-csrf-token');
    // Debug log for CSRF troubleshooting
    console.log('[CSRF DEBUG][middleware] Cookie:', csrfCookie?.value, 'Header:', csrfHeader);
    if (!csrfCookie || !csrfHeader || csrfCookie.value !== csrfHeader) {
      return new NextResponse(JSON.stringify({ error: 'Invalid CSRF token' }), { status: 403 });
    }
    return handler(req);
  };
} 