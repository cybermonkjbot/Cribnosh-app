import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

/**
 * @swagger
 * /customer/family-profile/accept:
 *   post:
 *     summary: Accept family profile invitation
 *     description: Accept an invitation to join a family profile
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - invitation_token
 *             properties:
 *               invitation_token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Invitation accepted successfully
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);

    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return createSpecErrorResponse('Invalid JSON body', 'BAD_REQUEST', 400);
    }

    const { invitation_token } = body;

    if (!invitation_token || typeof invitation_token !== 'string') {
      return createSpecErrorResponse('Invitation token is required', 'BAD_REQUEST', 400);
    }

    const convex = getConvexClient();

    // Accept invitation
    const result = await convex.mutation(api.mutations.familyProfiles.acceptInvitation, {
      invitation_token,
      user_id: userId as any,
    });

    return ResponseFactory.success(
      {
        family_profile_id: result.family_profile_id,
        member_id: result.member_id,
      },
      'Invitation accepted successfully'
    );
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return createSpecErrorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    const errorMessage = getErrorMessage(error);
    return createSpecErrorResponse(
      errorMessage || 'Failed to accept invitation',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

