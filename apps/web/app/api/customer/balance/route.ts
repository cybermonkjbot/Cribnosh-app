import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

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
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClientFromRequest(request);

    // Query balance from database
    const balance = await convex.query(api.queries.customerBalance.getByUserId, {
      userId,
    });

    return ResponseFactory.success(balance);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to fetch balance'),
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

