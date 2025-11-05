import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import jwt from 'jsonwebtoken';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

function getAuthPayload(request: NextRequest): any {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid or missing token');
  }

  const token = authHeader.replace('Bearer ', ');
  try {
    return jwt.verify(token, JWT_SECRET);
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

    let body: any;
    try {
      body = await request.json();
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
  } catch (error: any) {
    if (error.message === 'Invalid or missing token' || error.message === 'Invalid or expired token') {
      return createSpecErrorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return createSpecErrorResponse(
      error.message || 'Failed to accept invitation',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

