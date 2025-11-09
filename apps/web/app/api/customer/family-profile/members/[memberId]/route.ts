import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import type { UpdateMemberBudgetRequest } from '@/types/family-profile';
import { NextRequest, NextResponse } from 'next/server';

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
    const { userId } = await getAuthenticatedCustomer(request);

    let body: UpdateMemberBudgetRequest;
    try {
      body = await request.json() as UpdateMemberBudgetRequest;
    } catch {
      return createSpecErrorResponse('Invalid JSON body', 'BAD_REQUEST', 400);
    }

    const { budget_settings, preferences } = body;
    const { memberId } = params;

    if (!memberId) {
      return createSpecErrorResponse('Member ID is required', 'BAD_REQUEST', 400);
    }

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get family profile
    const familyProfile = await convex.query(api.queries.familyProfiles.getByUserId, {
      userId: userId as any,
      sessionToken: sessionToken || undefined
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
        sessionToken: sessionToken || undefined
      });
    }

    // Update preferences if provided
    if (preferences) {
      await convex.mutation(api.mutations.familyProfiles.updateMemberPreferences, {
        family_profile_id: familyProfile._id,
        member_id: memberId,
        userId: userId as any,
        allergy_ids: preferences.allergy_ids ?? undefined,
        dietary_preference_id: preferences.dietary_preference_id ?? undefined,
        parent_controlled: preferences.parent_controlled ?? undefined,
        sessionToken: sessionToken || undefined
      });
    }

    return ResponseFactory.success({ success: true }, 'Member updated successfully');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = getErrorMessage(error);
    return createSpecErrorResponse(
      errorMessage || 'Failed to update member',
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
    const { userId } = await getAuthenticatedCustomer(request);

    const { memberId } = params;

    if (!memberId) {
      return createSpecErrorResponse('Member ID is required', 'BAD_REQUEST', 400);
    }

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get family profile
    const familyProfile = await convex.query(api.queries.familyProfiles.getByUserId, {
      userId: userId as any,
      sessionToken: sessionToken || undefined
    });

    if (!familyProfile) {
      return createSpecErrorResponse('Family profile not found', 'NOT_FOUND', 404);
    }

    // Remove member
    await convex.mutation(api.mutations.familyProfiles.removeMember, {
      family_profile_id: familyProfile._id,
      member_id: memberId,
      userId: userId as any,
      sessionToken: sessionToken || undefined
    });

    return ResponseFactory.success({ success: true }, 'Member removed successfully');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = getErrorMessage(error);
    return createSpecErrorResponse(
      errorMessage || 'Failed to remove member',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));
export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));

