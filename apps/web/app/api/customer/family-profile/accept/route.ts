import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

function getAuthPayload(request: NextRequest): JWTPayload {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid or missing token');
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    throw new Error('Invalid or expired token');
  }
}

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
    const payload = getAuthPayload(request);
    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse('Only customers can accept invitations', 'FORBIDDEN', 403);
    }

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
    const userId = payload.user_id as string;

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
    const errorMessage = getErrorMessage(error);
    if (errorMessage === 'Invalid or missing token' || errorMessage === 'Invalid or expired token') {
      return createSpecErrorResponse(errorMessage, 'UNAUTHORIZED', 401);
    }
    return createSpecErrorResponse(
      errorMessage || 'Failed to accept invitation',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

