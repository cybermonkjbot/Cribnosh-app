import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

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

    const convex = getConvexClientFromRequest(request);

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
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
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

