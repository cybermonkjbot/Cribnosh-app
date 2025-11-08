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

import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { verifySessionTransferToken } from '@/lib/auth/session-transfer';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

export async function GET(req: NextRequest) {
  const xfer = req.nextUrl.searchParams.get('xfer');
  if (!xfer) return ResponseFactory.validationError("Missing transfer token");
  const payload = await verifySessionTransferToken(xfer);
  if (!payload) return ResponseFactory.validationError("Invalid transfer token");

  // Set the convex-auth-token from payload
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === 'production';
  cookieStore.set('convex-auth-token', payload.t, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    // keep existing expiry semantics; this cookie mirrors original token lifetime in backend validation
  });

  // Redirect to intended next path on this domain
  const next = req.nextUrl.searchParams.get('next') || '/';
  const url = new URL(next, `${req.nextUrl.protocol}//${req.nextUrl.host}`);
  
  // Ensure we're redirecting to the correct domain based on country
  // This prevents redirect loops by ensuring the handoff completes the domain switch
  logger.log('Session handoff redirecting to:', url.toString());
  
  return NextResponse.redirect(url, { status: 302 });
}


