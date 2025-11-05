import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { v4 as uuidv4 } from 'uuid';

/**
 * @swagger
 * /csrf:
 *   get:
 *     summary: Get CSRF Token
 *     description: Generate and return a CSRF token for form protection
 *     tags: [System]
 *     responses:
 *       200:
 *         description: CSRF token generated successfully
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
 *                     csrfToken:
 *                       type: string
 *                       format: uuid
 *                       description: Generated CSRF token
 *                       example: "123e4567-e89b-12d3-a456-426614174000"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *         headers:
 *           Set-Cookie:
 *             description: CSRF token cookie
 *             schema:
 *               type: string
 *               example: "csrf_token=123e4567-e89b-12d3-a456-426614174000; Path=/; Max-Age=3600; SameSite=Lax"
 *     security: []
 */
export async function GET(request: NextRequest) {
  const csrfToken = uuidv4();
  const isProd = process.env.NODE_ENV === 'production';
  // In dev, always set secure: false so cookies work on localhost
  const response = ResponseFactory.success({ csrfToken });
  response.cookies.set('csrf_token', csrfToken, {
    httpOnly: false, // must be readable by JS
    secure: isProd ? true : false,
    sameSite: 'lax',
    maxAge: 3600,
    path: '/',
  });
  return response;
} 