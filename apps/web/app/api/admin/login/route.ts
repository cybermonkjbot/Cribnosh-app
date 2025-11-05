const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';
import { api, getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { retryCritical } from '@/lib/api/retry';

/**
 * @swagger
 * /admin/login:
 *   post:
 *     summary: Admin Login
 *     description: Authenticate admin users and create session tokens
 *     tags: [Admin, Authentication]
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
 *                 description: Admin email address
 *                 example: "admin@cribnosh.com"
 *               password:
 *                 type: string
 *                 description: Admin password
 *                 example: "securePassword123"
 *     responses:
 *       200:
 *         description: Admin login successful
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           description: Admin user ID
 *                           example: "j1234567890abcdef"
 *                         email:
 *                           type: string
 *                           example: "admin@cribnosh.com"
 *                         name:
 *                           type: string
 *                           example: "Admin User"
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["admin"]
 *                 message:
 *                   type: string
 *                   example: "Success"
 *         headers:
 *           Set-Cookie:
 *             description: Convex session token cookie
 *             schema:
 *               type: string
 *               example: "convex-auth-token=session_token_here; HttpOnly; Secure; SameSite=Strict"
 *       400:
 *         description: Validation error - missing required fields or invalid JSON
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid credentials or not an admin
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Service unavailable - authentication service down
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
    // Parse and validate request body
    let requestBody;
    try {
      requestBody = await request.json();
    } catch (error) {
      console.error('[ADMIN LOGIN] Invalid JSON in request body');
      return ResponseFactory.validationError('Invalid request body. Expected JSON.');
    }

    const { email, password } = requestBody;
    
    // Validate required fields
    if (!email || !password) {
      console.error('[ADMIN LOGIN] Missing required fields');
      return ResponseFactory.validationError('Email and password are required');
    }
    console.log('[ADMIN LOGIN] Attempting login for:', email);
    const convex = getConvexClient();
    // Call Convex action to validate credentials and create session
    let result;
    try {
      // Use retry logic for critical authentication calls
      result = await retryCritical(async () => {
        return await convex.action(api.actions.users.loginAndCreateSession, { email, password });
      });
    } catch (convexErr) {
      console.error('[ADMIN LOGIN] Convex connection error:', convexErr);
      // Type guard for error object
      const errObj = convexErr as Record<string, any>;
      if (errObj && typeof errObj === 'object' && 'code' in errObj && String(errObj.code).includes('CONNECT_TIMEOUT')) {
        return ResponseFactory.error('Cannot connect to authentication service. Please check your network and try again.', 'CUSTOM_ERROR', 503);
      }
      return ResponseFactory.error('Authentication service unavailable. Please try again later.', 'CUSTOM_ERROR', 503);
    }
    console.log('[ADMIN LOGIN] Convex result:', result);
    if (!result || !result.sessionToken) {
      console.log('[ADMIN LOGIN] Login failed for:', email, 'Reason:', result?.error);
      return ResponseFactory.unauthorized(result?.error || 'Invalid credentials' );
    }
    // Now, fetch the user to check their role
    const user = await retryCritical(async () => {
      return await convex.query(api.queries.users.getUserByEmail, { email });
    });
    if (!user || !user.roles || !Array.isArray(user.roles) || !user.roles.includes('admin')) {
      console.log('[ADMIN LOGIN] Not an admin:', email);
      return ResponseFactory.unauthorized('Not an admin');
    }
    
    // Create response with success
    const response = ResponseFactory.success({ 
      user: { 
        user_id: user._id, 
        email: user.email, 
        name: user.name, 
        roles: user.roles 
      } 
    });
    
    // Set the Convex session token in cookies for middleware authentication
    // Set cookie to expire in 1 year for long-term persistence
    const ONE_YEAR_SECONDS = 365 * 24 * 60 * 60; // 1 year in seconds
    response.cookies.set('convex-auth-token', result.sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Changed from 'lax' to 'strict' to match staff login
      maxAge: ONE_YEAR_SECONDS, // 1 year for persistent login
      path: '/',
    });
    
    // Also set a non-httpOnly cookie for debugging in development
    if (process.env.NODE_ENV !== 'production') {
      response.cookies.set('convex-auth-token-debug', result.sessionToken, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: ONE_YEAR_SECONDS, // 1 year for persistent login
        path: '/',
      });
    }
    
    return response;
  } catch (e) {
    console.error('[ADMIN LOGIN] Internal Server Error:', e);
    return ResponseFactory.internalError('Login failed');
  }
} 