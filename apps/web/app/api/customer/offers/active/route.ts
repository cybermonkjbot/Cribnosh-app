import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can access offers.');
    }
    
    const { searchParams } = new URL(request.url);
    const targetParam = searchParams.get('target') as 'all' | 'new_users' | 'existing_users' | 'group_orders' | null;
    
    const convex = getConvexClient();
    const offers = await convex.query(api.queries.specialOffers.getActiveOffers, {
      user_id: payload.user_id as any,
      target_audience: targetParam || 'group_orders',
    });
    
    return ResponseFactory.success({ offers }, 'Active offers retrieved successfully');
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch offers.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

