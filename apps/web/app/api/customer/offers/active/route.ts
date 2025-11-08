import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

/**
 * @swagger
 * /customer/offers/active:
 *   get:
 *     summary: Get Active Special Offers
 *     description: Get active special offers for the current user
 *     tags: [Customer]
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);
    
    const { searchParams } = new URL(request.url);
    const targetParam = searchParams.get('target') as 'all' | 'new_users' | 'existing_users' | 'group_orders' | null;
    
    const convex = getConvexClient();
    const offers = await convex.query(api.queries.specialOffers.getActiveOffers, {
      user_id: userId as any,
      target_audience: targetParam || 'group_orders',
    });
    
    return ResponseFactory.success({ offers }, 'Active offers retrieved successfully');
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch offers.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

