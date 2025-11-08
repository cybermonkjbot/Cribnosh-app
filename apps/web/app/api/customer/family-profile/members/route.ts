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
 * /customer/family-profile/members:
 *   get:
 *     summary: List all family members
 *     description: Get a list of all family members in the family profile
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Family members retrieved successfully
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClient();

    const familyProfile = await convex.query(api.queries.familyProfiles.getByUserId, {
      userId: userId as any,
    });

    if (!familyProfile) {
      return ResponseFactory.success([], 'No family profile found');
    }

    const members = familyProfile.family_members.map((member: any) => ({
      id: member.id,
      user_id: member.user_id || null,
      name: member.name,
      email: member.email,
      phone: member.phone || null,
      relationship: member.relationship,
      status: member.status,
      invited_at: member.invited_at ? new Date(member.invited_at).toISOString() : null,
      accepted_at: member.accepted_at ? new Date(member.accepted_at).toISOString() : null,
      budget_settings: member.budget_settings || null,
    }));

    return ResponseFactory.success(members, 'Family members retrieved successfully');
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return createSpecErrorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    const errorMessage = getErrorMessage(error);
    return createSpecErrorResponse(
      errorMessage || 'Failed to get family members',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

