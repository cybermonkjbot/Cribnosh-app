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
 * /customer/family-profile/members/{memberId}/budget:
 *   put:
 *     summary: Update member budget
 *     description: Update budget limits for a family member
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - budget_settings
 *             properties:
 *               budget_settings:
 *                 type: object
 *                 properties:
 *                   daily_limit:
 *                     type: number
 *                   weekly_limit:
 *                     type: number
 *                   monthly_limit:
 *                     type: number
 *                   currency:
 *                     type: string
 */
async function handlePUT(
  request: NextRequest,
  { params }: { params: { memberId: string } }
): Promise<NextResponse> {
  try {
    const payload = getAuthPayload(request);
    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse('Only customers can update budgets', 'FORBIDDEN', 403);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return createSpecErrorResponse('Invalid JSON body', 'BAD_REQUEST', 400);
    }

    const { budget_settings, preferences } = body;
    const { memberId } = params;

    if (!memberId) {
      return createSpecErrorResponse('Member ID is required', 'BAD_REQUEST', 400);
    }

    const convex = getConvexClient();
    const userId = payload.user_id as string;

    // Get family profile
    const familyProfile = await convex.query(api.queries.familyProfiles.getByUserId, {
      userId: userId as any,
    });

    if (!familyProfile) {
      return createSpecErrorResponse('Family profile not found', 'NOT_FOUND', 404);
    }

    // Update budget if provided
    if (budget_settings) {
      await convex.mutation(api.mutations.familyProfiles.updateMemberBudget, {
        family_profile_id: familyProfile._id,
        member_id: memberId,
        userId: userId as any,
        budget_settings,
      });
    }

    // Update preferences if provided
    if (preferences) {
      await convex.mutation(api.mutations.familyProfiles.updateMemberPreferences, {
        family_profile_id: familyProfile._id,
        member_id: memberId,
        userId: userId as any,
        allergy_ids: preferences.allergy_ids,
        dietary_preference_id: preferences.dietary_preference_id,
        parent_controlled: preferences.parent_controlled,
      });
    }

    return ResponseFactory.success({ success: true }, 'Member updated successfully');
  } catch (error: any) {
    if (error.message === 'Invalid or missing token' || error.message === 'Invalid or expired token') {
      return createSpecErrorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return createSpecErrorResponse(
      error.message || 'Failed to update member',
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * @swagger
 * /customer/family-profile/members/{memberId}:
 *   delete:
 *     summary: Remove family member
 *     description: Remove a family member from the family profile
 *     tags: [Customer]
 *     parameters:
 *       - in: path
 *         name: memberId
 *         required: true
 *         schema:
 *           type: string
 */
async function handleDELETE(
  request: NextRequest,
  { params }: { params: { memberId: string } }
): Promise<NextResponse> {
  try {
    const payload = getAuthPayload(request);
    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse('Only customers can remove members', 'FORBIDDEN', 403);
    }

    const { memberId } = params;

    if (!memberId) {
      return createSpecErrorResponse('Member ID is required', 'BAD_REQUEST', 400);
    }

    const convex = getConvexClient();
    const userId = payload.user_id as string;

    // Get family profile
    const familyProfile = await convex.query(api.queries.familyProfiles.getByUserId, {
      userId: userId as any,
    });

    if (!familyProfile) {
      return createSpecErrorResponse('Family profile not found', 'NOT_FOUND', 404);
    }

    // Remove member
    await convex.mutation(api.mutations.familyProfiles.removeMember, {
      family_profile_id: familyProfile._id,
      member_id: memberId,
      userId: userId as any,
    });

    return ResponseFactory.success({ success: true }, 'Member removed successfully');
  } catch (error: any) {
    if (error.message === 'Invalid or missing token' || error.message === 'Invalid or expired token') {
      return createSpecErrorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return createSpecErrorResponse(
      error.message || 'Failed to remove member',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));
export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));

