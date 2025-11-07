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
    const payload = getAuthPayload(request);
    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse('Only customers can view family orders', 'FORBIDDEN', 403);
    }

    const convex = getConvexClient();
    const userId = payload.user_id as string;

    // Get family profile
    const familyProfile = await convex.query(api.queries.familyProfiles.getByUserId, {
      userId: userId as any,
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
    });

    return ResponseFactory.success(orders, 'Family orders retrieved successfully');
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    if (errorMessage === 'Invalid or missing token' || errorMessage === 'Invalid or expired token') {
      return createSpecErrorResponse(errorMessage, 'UNAUTHORIZED', 401);
    }
    return createSpecErrorResponse(
      errorMessage || 'Failed to get family orders',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

