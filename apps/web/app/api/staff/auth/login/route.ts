import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { cookies } from 'next/headers';
import { api, getConvexClient } from '@/lib/conxed-client';
import { withCustomSensitiveRateLimit } from '@/lib/api/sensitive-middleware';

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
async function handlePOST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Input validation
    if (!email || typeof email !== 'string') {
      return ResponseFactory.badRequest('Email is required');
    }

    if (!password || typeof password !== 'string') {
      return ResponseFactory.badRequest('Password is required');
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ResponseFactory.badRequest('Invalid email format');
    }

    // Password strength validation (minimum 8 characters)
    if (password.length < 8) {
      return ResponseFactory.badRequest('Password must be at least 8 characters long');
    }

    // Sanitize email (trim whitespace and convert to lowercase)
    const sanitizedEmail = email.trim().toLowerCase();

    const convex = getConvexClient();
    // Call Convex action to validate credentials and create session
    const result = await convex.action(api.actions.users.loginAndCreateSession, { email: sanitizedEmail, password });
    if (!result || !result.sessionToken) {
      return ResponseFactory.unauthorized(result?.error || 'Invalid credentials' );
    }
    // Set convex-auth-token cookie using NextResponse
    const isProd = process.env.NODE_ENV === 'production';
    const response = ResponseFactory.success({ success: true, sessionToken: result.sessionToken });
    response.cookies.set('convex-auth-token', result.sessionToken, {
      httpOnly: true,
      secure: isProd ? true : false, // Allow cookies over HTTP in dev
      sameSite: 'strict',
      maxAge: 60 * 60 * 2, // 2 hours
      path: '/',
    });
    return response;
  } catch (e) {
    return ResponseFactory.internalError('Login failed');
  }
}

// Apply rate limiting by email/IP to prevent brute force attacks
export async function POST(request: NextRequest) {
  // Clone request to read body for rate limiting without consuming it
  const clonedRequest = request.clone();
  return withCustomSensitiveRateLimit(
    request,
    handlePOST,
    async (req) => {
      try {
        const body = await clonedRequest.json();
        const email = body?.email || '';
        const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || req.ip || 'unknown';
        // Rate limit by both email and IP for extra security
        return `staff-login:${email}:${ip}`;
      } catch {
        const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || req.ip || 'unknown';
        return `staff-login:${ip}`;
      }
    }
  );
} 