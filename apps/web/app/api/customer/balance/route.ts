import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /customer/balance:
 *   get:
 *     summary: Get customer's Cribnosh balance
 *     description: Get the current balance in the customer's Cribnosh account
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     balance:
 *                       type: integer
 *                       description: Balance in smallest currency unit (pence for GBP, cents for USD)
 *                       example: 5000
 *                     currency:
 *                       type: string
 *                       example: "GBP"
 *                     is_available:
 *                       type: boolean
 *                       example: true
 *                     last_updated:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *     security:
 *       - bearerAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createSpecErrorResponse(
        'Invalid or missing token',
        'UNAUTHORIZED',
        401
      );
    }

    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return createSpecErrorResponse(
        'Invalid or expired token',
        'UNAUTHORIZED',
        401
      );
    }

    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse(
        'Only customers can access balance',
        'FORBIDDEN',
        403
      );
    }

    const convex = getConvexClient();
    const userId = payload.user_id;

    // Query balance from database
    const balance = await convex.query(api.queries.customerBalance.getByUserId, {
      userId,
    });

    return ResponseFactory.success(balance);
  } catch (error: unknown) {
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to fetch balance'),
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

