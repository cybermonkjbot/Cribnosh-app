import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { Id } from '@/convex/_generated/dataModel';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

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
    const { userId } = await getAuthenticatedCustomer(request);
    
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const connections = await convex.query(api.queries.userConnections.getAllUserConnections, {
      user_id: userId as Id<'users'>,
      sessionToken: sessionToken || undefined
    });
    
    return ResponseFactory.success(connections, 'Connections retrieved successfully');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
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
    const { userId } = await getAuthenticatedCustomer(request);
    
    const body = await request.json();
    const { connected_user_id, connection_type, company } = body;
    
    if (!connected_user_id || !connection_type) {
      return ResponseFactory.validationError('connected_user_id and connection_type are required.');
    }
    
    if (connection_type !== 'colleague' && connection_type !== 'friend') {
      return ResponseFactory.validationError('connection_type must be either "colleague" or "friend".');
    }
    
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    await convex.mutation(api.mutations.userConnections.createConnection, {
      user_id: userId as Id<'users'>,
      connected_user_id: connected_user_id as Id<'users'>,
      connection_type: connection_type as 'colleague' | 'friend',
      company: company || undefined,
      sessionToken: sessionToken || undefined
    });
    
    return ResponseFactory.success({ success: true }, 'Connection created successfully');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to create connection.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

