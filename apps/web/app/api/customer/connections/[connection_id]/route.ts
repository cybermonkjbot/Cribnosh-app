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
 * /customer/connections/{connection_id}:
 *   delete:
 *     summary: Remove connection
 *     description: Remove a manual connection
 *     tags: [Customer]
 */
async function handleDELETE(
  request: NextRequest,
  { params }: { params: { connection_id: string } }
): Promise<NextResponse> {
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
      return ResponseFactory.forbidden('Forbidden: Only customers can remove connections.');
    }
    
    const { connection_id } = params;
    if (!connection_id) {
      return ResponseFactory.validationError('connection_id is required.');
    }
    
    const convex = getConvexClient();
    await convex.mutation(api.mutations.userConnections.removeConnection, {
      connection_id: connection_id as Id<'user_connections'>,
      user_id: payload.user_id as Id<'users'>,
    });
    
    return ResponseFactory.success({ success: true }, 'Connection removed successfully');
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to remove connection.'));
  }
}

export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));

