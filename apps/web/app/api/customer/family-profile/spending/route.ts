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
 * /customer/family-profile/spending:
 *   get:
 *     summary: Get spending summary
 *     description: Get spending summary for all family members
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Spending summary retrieved successfully
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClient();

    // Get family profile
    const familyProfile = await convex.query(api.queries.familyProfiles.getByUserId, {
      userId: userId as any,
    });

    if (!familyProfile) {
      return ResponseFactory.success({ members: [], total_spending: 0 }, 'No family profile found');
    }

    // Get spending for each member
    const memberSpending = await Promise.all(
      familyProfile.member_user_ids.map(async (memberUserId: any) => {
        const dailyBudget = await convex.query(api.queries.familyProfiles.getMemberBudgets, {
          family_profile_id: familyProfile._id,
          member_user_id: memberUserId,
          period_type: 'daily',
        });

        const weeklyBudget = await convex.query(api.queries.familyProfiles.getMemberBudgets, {
          family_profile_id: familyProfile._id,
          member_user_id: memberUserId,
          period_type: 'weekly',
        });

        const monthlyBudget = await convex.query(api.queries.familyProfiles.getMemberBudgets, {
          family_profile_id: familyProfile._id,
          member_user_id: memberUserId,
          period_type: 'monthly',
        });

        const member = familyProfile.family_members.find((m: any) => m.user_id === memberUserId);

        return {
          member_id: member?.id,
          user_id: memberUserId,
          name: member?.name,
          daily_spent: dailyBudget?.spent_amount || 0,
          daily_limit: dailyBudget?.limit_amount || 0,
          weekly_spent: weeklyBudget?.spent_amount || 0,
          weekly_limit: weeklyBudget?.limit_amount || 0,
          monthly_spent: monthlyBudget?.spent_amount || 0,
          monthly_limit: monthlyBudget?.limit_amount || 0,
          currency: dailyBudget?.currency || weeklyBudget?.currency || monthlyBudget?.currency || 'gbp',
        };
      })
    );

    const totalSpending = memberSpending.reduce((sum, m) => sum + (m.monthly_spent || 0), 0);

    return ResponseFactory.success(
      {
        members: memberSpending,
        total_spending: totalSpending,
        currency: 'gbp',
      },
      'Spending summary retrieved successfully'
    );
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return createSpecErrorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    const errorMessage = getErrorMessage(error);
    return createSpecErrorResponse(
      errorMessage || 'Failed to get spending summary',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

