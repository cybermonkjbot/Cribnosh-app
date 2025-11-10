import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /customer/family-profile/orders:
 *   get:
 *     summary: Get all family orders
 *     description: Get all orders placed by family members
 *     tags: [Customer]
 *     parameters:
 *       - in: query
 *         name: member_user_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Family orders retrieved successfully
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get family profile
    const familyProfile = await convex.query(api.queries.familyProfiles.getByUserId, {
      userId: userId as any,
      sessionToken: sessionToken || undefined
    });

    if (!familyProfile) {
      return ResponseFactory.success([], 'No family profile found');
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const memberUserId = searchParams.get('member_user_id');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    // Get family orders
    const orders = await convex.query(api.queries.familyProfiles.getFamilyOrders, {
      family_profile_id: familyProfile._id,
      member_user_id: memberUserId ? (memberUserId as any) : undefined,
      limit,
      sessionToken: sessionToken || undefined
    });

    return ResponseFactory.success(orders, 'Family orders retrieved successfully');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = getErrorMessage(error);
    return createSpecErrorResponse(
      errorMessage || 'Failed to get family orders',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

