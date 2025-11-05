import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { Id } from '@/convex/_generated/dataModel';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can access treats.');
    }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    
    const convex = getConvexClient();
    const userId = payload.user_id as Id<'users'>;
    
    let treats: any[] = [];
    
    if (type === 'given' || type === 'all') {
      const given = await convex.query(api.queries.treats.getTreatsByTreater, {
        treater_id: userId,
      });
      treats = [...treats, ...given.map(t => ({ ...t, direction: 'given' }))];
    }
    
    if (type === 'received' || type === 'all') {
      const received = await convex.query(api.queries.treats.getTreatsByRecipient, {
        treated_user_id: userId,
      });
      treats = [...treats, ...received.map(t => ({ ...t, direction: 'received' }))];
    }
    
    return ResponseFactory.success(treats, 'Treats retrieved successfully');
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch treats.');
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
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can create treats.');
    }
    
    const body = await request.json();
    const { treated_user_id, order_id, expires_in_hours, metadata } = body;
    
    const convex = getConvexClient();
    const result = await convex.mutation(api.mutations.treats.createTreat, {
      treater_id: payload.user_id as Id<'users'>,
      treated_user_id: treated_user_id ? (treated_user_id as Id<'users'>) : undefined,
      order_id: order_id ? (order_id as Id<'orders'>) : undefined,
      expires_in_hours,
      metadata,
    });
    
    return ResponseFactory.success(result, 'Treat created successfully');
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to create treat.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

