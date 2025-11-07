import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { Id } from '@/convex/_generated/dataModel';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /customer/connections:
 *   get:
 *     summary: Get all user connections
 *     description: Get all connections (family, referrals, treats, group orders, colleagues) for the authenticated user
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Connections retrieved successfully
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can access connections.');
    }
    
    const convex = getConvexClient();
    const connections = await convex.query(api.queries.userConnections.getAllUserConnections, {
      user_id: payload.user_id as Id<'users'>,
    });
    
    return ResponseFactory.success(connections, 'Connections retrieved successfully');
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch connections.'));
  }
}

/**
 * @swagger
 * /customer/connections:
 *   post:
 *     summary: Create manual connection
 *     description: Manually add a colleague or friend connection
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - connected_user_id
 *               - connection_type
 *             properties:
 *               connected_user_id:
 *                 type: string
 *               connection_type:
 *                 type: string
 *                 enum: [colleague, friend]
 *               company:
 *                 type: string
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can create connections.');
    }
    
    const body = await request.json();
    const { connected_user_id, connection_type, company } = body;
    
    if (!connected_user_id || !connection_type) {
      return ResponseFactory.validationError('connected_user_id and connection_type are required.');
    }
    
    if (connection_type !== 'colleague' && connection_type !== 'friend') {
      return ResponseFactory.validationError('connection_type must be either "colleague" or "friend".');
    }
    
    const convex = getConvexClient();
    await convex.mutation(api.mutations.userConnections.createConnection, {
      user_id: payload.user_id as Id<'users'>,
      connected_user_id: connected_user_id as Id<'users'>,
      connection_type: connection_type as 'colleague' | 'friend',
      company: company || undefined,
    });
    
    return ResponseFactory.success({ success: true }, 'Connection created successfully');
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to create connection.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

