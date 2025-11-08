import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { Id } from '@/convex/_generated/dataModel';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

/**
 * @swagger
 * /customer/treats/{treat_token}:
 *   get:
 *     summary: Get treat by token
 *     description: Get treat details by share token
 *     tags: [Customer]
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { treat_token: string } }
): Promise<NextResponse> {
  try {
    await getAuthenticatedCustomer(request);
    
    const { treat_token } = params;
    if (!treat_token) {
      return ResponseFactory.validationError('treat_token is required.');
    }
    
    const convex = getConvexClient();
    const treat = await convex.mutation(api.mutations.treats.getTreatByToken, {
      treat_token,
    });
    
    if (!treat) {
      return ResponseFactory.notFound('Treat not found.');
    }
    
    return ResponseFactory.success(treat, 'Treat retrieved successfully');
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch treat.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

