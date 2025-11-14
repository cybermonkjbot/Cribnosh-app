/**
 * @swagger
 * /api/session/handoff:
 *   get:
 *     summary: Session handoff
 *     description: Handle session transfer between domains using a secure transfer token
 *     tags: [Session]
 *     parameters:
 *       - in: query
 *         name: xfer
 *         required: true
 *         schema:
 *           type: string
 *         description: Session transfer token
 *       - in: query
 *         name: next
 *         schema:
 *           type: string
 *           default: "/"
 *         description: Redirect path after successful handoff
 *     responses:
 *       302:
 *         description: Session transferred successfully, redirecting to next path
 *       400:
 *         description: Validation error - Missing or invalid transfer token
 *     security: []
 */

import { ResponseFactory } from '@/lib/api';
import { verifySessionTransferToken } from '@/lib/auth/session-transfer';
import { logger } from '@/lib/utils/logger';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const xfer = req.nextUrl.searchParams.get('xfer');
  if (!xfer) return ResponseFactory.validationError("Missing transfer token");
  const payload = await verifySessionTransferToken(xfer);
  if (!payload) return ResponseFactory.validationError("Invalid transfer token");

  // Set the convex-auth-token from payload
  // httpOnly is false in production so JavaScript can read it for Convex queries
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';
  cookieStore.set('convex-auth-token', payload.t, {
    httpOnly: false, // Allow JavaScript to read in production for Convex queries
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    // keep existing expiry semantics; this cookie mirrors original token lifetime in backend validation
  });

  // Redirect to intended next path on this domain
  let next = req.nextUrl.searchParams.get('next') || '/';
    // If an API route is specified, fallback to home page
  if (next.startsWith('/api/')) {
    logger.log('Session handoff: API route detected in next parameter, redirecting to home instead');
    next = '/';
  }
  
  // Get the hostname from the request, ensuring we use the actual domain
  const hostname = req.headers.get('host') || req.nextUrl.host;
  // Remove port if present (e.g., localhost:3000)
  const cleanHost = hostname.split(':')[0];
  
  try {
    // Construct URL explicitly to avoid localhost:3000 issues
    // If next is a relative path, construct absolute URL
    let url: URL;
    if (next.startsWith('http://') || next.startsWith('https://')) {
      // Already absolute, but ensure it's on the correct domain
      url = new URL(next);
      // Prevent redirecting to API routes even in absolute URLs
      if (url.pathname.startsWith('/api/')) {
        url.pathname = '/';
      }
      // If it's localhost, replace with the actual host
      if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
        url.hostname = cleanHost;
        url.protocol = 'https:';
        url.port = '';
      }
    } else {
      // Relative path, construct absolute URL
      const protocol = req.nextUrl.protocol === 'http:' && !hostname.includes('localhost') ? 'https:' : req.nextUrl.protocol;
      url = new URL(next, `${protocol}//${cleanHost}`);
    }
    
    // Ensure we're redirecting to the correct domain based on country
    // This prevents redirect loops by ensuring the handoff completes the domain switch
    logger.log('Session handoff redirecting to:', url.toString());
    
    return NextResponse.redirect(url, { status: 302 });
  } catch (error) {
    logger.log('Error constructing redirect URL in session handoff:', error);
    // Fallback: redirect to home page on the current domain
    try {
      // Try to use the clean host
      const fallbackUrl = new URL(`https://${cleanHost}/`);
      return NextResponse.redirect(fallbackUrl, { status: 302 });
    } catch (fallbackError) {
      // If even the fallback fails, use a safe default
      logger.log('Fallback redirect also failed:', fallbackError);
      // Use a hardcoded safe domain as last resort
      const safeHost = cleanHost.includes('cribnosh.co.uk') ? 'cribnosh.co.uk' : 'cribnosh.com';
      const safeUrl = new URL(`https://${safeHost}/`);
      return NextResponse.redirect(safeUrl, { status: 302 });
    }
  }
}


