import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { cookies } from 'next/headers';
import { api, getConvexClient } from '@/lib/conxed-client';

/**
 * @swagger
 * /staff/auth/login:
 *   post:
 *     summary: Staff Login
 *     description: Authenticate staff members and create session tokens
 *     tags: [Staff, Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Staff email address
 *                 example: "staff@cribnosh.com"
 *               password:
 *                 type: string
 *                 description: Staff password
 *                 example: "securePassword123"
 *     responses:
 *       200:
 *         description: Staff login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     sessionToken:
 *                       type: string
 *                       description: Convex session token
 *                       example: "session_token_here"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *         headers:
 *           Set-Cookie:
 *             description: Convex session token cookie
 *             schema:
 *               type: string
 *               example: "convex-auth-token=session_token_here; HttpOnly; Secure; SameSite=Strict"
 *       401:
 *         description: Unauthorized - invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    console.log('[STAFF LOGIN] Attempting login for:', email);
    const convex = getConvexClient();
    // Call Convex action to validate credentials and create session
    const result = await convex.action(api.actions.users.loginAndCreateSession, { email, password });
    console.log('[STAFF LOGIN] Convex result:', result);
    if (!result || !result.sessionToken) {
      console.log('[STAFF LOGIN] Login failed for:', email, 'Reason:', result?.error);
      return ResponseFactory.unauthorized(result?.error || 'Invalid credentials' );
    }
    // Set convex-auth-token cookie using NextResponse
    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd) {
      console.log('[STAFF LOGIN] Setting cookie with sessionToken:', result.sessionToken);
    }
    const response = ResponseFactory.success({ success: true, sessionToken: result.sessionToken });
    response.cookies.set('convex-auth-token', result.sessionToken, {
      httpOnly: true,
      secure: isProd ? true : false, // Allow cookies over HTTP in dev
      sameSite: 'strict',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/',
    });
    if (!isProd) {
      console.log('[STAFF LOGIN] Cookie set with options:', {
        httpOnly: true,
        secure: isProd ? true : false,
        sameSite: 'strict',
        maxAge: 60 * 60 * 2,
        path: '/',
      });
    }
    console.log('[STAFF LOGIN] Login success for:', email);
    return response;
  } catch (e) {
    console.error('[STAFF LOGIN] Internal Server Error:', e);
    return ResponseFactory.internalError('Login failed');
  }
} 