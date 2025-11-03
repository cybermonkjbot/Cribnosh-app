import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import jwt from 'jsonwebtoken';

/**
 * @swagger
 * /test-auth:
 *   get:
 *     summary: Test Authentication Token
 *     description: Validates a JWT token and returns decoded payload information for testing purposes. This endpoint helps verify token structure, roles, and authentication status.
 *     tags: [Authentication]
 *     parameters:
 *       - in: header
 *         name: authorization
 *         required: true
 *         schema:
 *           type: string
 *         description: Bearer token for authentication
 *         example: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token validation successful
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
 *                     payload:
 *                       type: object
 *                       description: Decoded JWT payload
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         email:
 *                           type: string
 *                           example: "user@example.com"
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["user", "chef"]
 *                         iat:
 *                           type: number
 *                           example: 1640995200
 *                         exp:
 *                           type: number
 *                           example: 1641081600
 *                     hasRoles:
 *                       type: boolean
 *                       description: Whether the token contains roles
 *                       example: true
 *                     rolesType:
 *                       type: string
 *                       description: Type of roles field
 *                       example: "object"
 *                     rolesLength:
 *                       type: string
 *                       description: Length of roles array or type description
 *                       example: "2"
 *                     hasChefRole:
 *                       type: boolean
 *                       description: Whether user has chef role
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - missing, invalid, or expired token
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
 *     security:
 *       - bearerAuth: []
 */

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch (error) {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    
    return ResponseFactory.success({ 
      success: true, 
      payload,
      hasRoles: !!payload.roles,
      rolesType: typeof payload.roles,
      rolesLength: Array.isArray(payload.roles) ? payload.roles.length : 'not an array',
      hasChefRole: Array.isArray(payload.roles) ? payload.roles.includes('chef') : false
    });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Test failed.' );
  }
}

export const GET = handleGET; 