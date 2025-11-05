import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /auth/check-integration:
 *   get:
 *     summary: Check Integration Status
 *     description: Verify which third-party authentication integrations are properly configured and available. Returns the status of various OAuth providers and authentication services.
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Integration status retrieved successfully
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
 *                     integrations:
 *                       type: object
 *                       description: Status of available authentication integrations
 *                       properties:
 *                         logto:
 *                           type: boolean
 *                           description: Logto authentication service status
 *                           example: true
 *                         google:
 *                           type: boolean
 *                           description: Google OAuth integration status
 *                           example: true
 *                         facebook:
 *                           type: boolean
 *                           description: Facebook OAuth integration status
 *                           example: false
 *                         github:
 *                           type: boolean
 *                           description: GitHub OAuth integration status
 *                           example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */

async function handleGET(request: NextRequest): Promise<NextResponse> {
  const integrations = {
    logto: !!process.env.LOGTO_CLIENT_ID && !!process.env.LOGTO_CLIENT_SECRET && !!process.env.LOGTO_ENDPOINT,
    google: !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET,
    facebook: !!process.env.FACEBOOK_CLIENT_ID && !!process.env.FACEBOOK_CLIENT_SECRET,
    github: !!process.env.GITHUB_CLIENT_ID && !!process.env.GITHUB_CLIENT_SECRET,
    // Add more integrations as needed
  };
  return ResponseFactory.success({ integrations });
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 