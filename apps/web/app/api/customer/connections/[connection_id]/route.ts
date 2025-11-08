import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { Id } from '@/convex/_generated/dataModel';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

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
    const { userId } = await getAuthenticatedCustomer(request);
    
    const { connection_id } = params;
    if (!connection_id) {
      return ResponseFactory.validationError('connection_id is required.');
    }
    
    const convex = getConvexClientFromRequest(request);
    await convex.mutation(api.mutations.userConnections.removeConnection, {
      connection_id: connection_id as Id<'user_connections'>,
      user_id: userId as Id<'users'>,
    });
    
    return ResponseFactory.success({ success: true }, 'Connection removed successfully');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to remove connection.'));
  }
}

export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));

