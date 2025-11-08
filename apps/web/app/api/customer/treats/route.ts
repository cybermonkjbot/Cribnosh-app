import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /customer/treats:
 *   get:
 *     summary: Get user's treats
 *     description: Get all treats given by or received by the authenticated user
 *     tags: [Customer]
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [given, received, all]
 *         description: Filter treats by type
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    
    const convex = getConvexClientFromRequest(request);
    
    let treats: Array<Record<string, unknown>> = [];
    
    if (type === 'given' || type === 'all') {
      const given = await convex.query(api.queries.treats.getTreatsByTreater, {
        treater_id: userId,
      });
      treats = [...treats, ...given.map((t: any) => ({ ...t, direction: 'given' }))];
    }
    
    if (type === 'received' || type === 'all') {
      const received = await convex.query(api.queries.treats.getTreatsByRecipient, {
        treated_user_id: userId,
      });
      treats = [...treats, ...received.map((t: any) => ({ ...t, direction: 'received' }))];
    }
    
    return ResponseFactory.success(treats, 'Treats retrieved successfully');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch treats.'));
  }
}

/**
 * @swagger
 * /customer/treats:
 *   post:
 *     summary: Create new treat
 *     description: Create a treat relationship when user treats someone
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               treated_user_id:
 *                 type: string
 *               order_id:
 *                 type: string
 *               expires_in_hours:
 *                 type: number
 *               metadata:
 *                 type: object
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);
    
    const body = await request.json();
    const { treated_user_id, order_id, expires_in_hours, metadata } = body;
    
    const convex = getConvexClientFromRequest(request);
    const result = await convex.mutation(api.mutations.treats.createTreat, {
      treater_id: userId as Id<'users'>,
      treated_user_id: treated_user_id ? (treated_user_id as Id<'users'>) : undefined,
      order_id: order_id ? (order_id as Id<'orders'>) : undefined,
      expires_in_hours,
      metadata,
    });
    
    return ResponseFactory.success(result, 'Treat created successfully');
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to create treat.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

