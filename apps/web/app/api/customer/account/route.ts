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
import { sendAccountDeletionEmail } from '@/lib/services/email-service';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /customer/account:
 *   delete:
 *     summary: Delete customer account permanently
 *     description: Delete customer account permanently. Account deletion will be scheduled and the user will receive an email confirmation.
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Account deletion request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Account deletion request has been submitted. You will receive an email confirmation shortly."
 *                 data:
 *                   type: object
 *                   properties:
 *                     deletion_requested_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *                     deletion_will_complete_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-22T10:30:00Z"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       404:
 *         description: Account not found
 *       400:
 *         description: Account deletion already in progress
 *     security:
 *       - bearerAuth: []
 */
async function handleDELETE(request: NextRequest): Promise<NextResponse> {
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
        'Only customers can delete their account',
        'FORBIDDEN',
        403
      );
    }

    const convex = getConvexClient();
    const userId = payload.user_id;

    // Check if user exists
    const user = await convex.query(api.queries.users.getById, { userId });
    if (!user) {
      return createSpecErrorResponse(
        'Account not found',
        'NOT_FOUND',
        404
      );
    }

    // Check if deletion is already in progress
    const existingDeletion = await convex
      .query(api.queries.accountDeletions.getByUserId, { userId })
      .catch(() => null);
    
    if (existingDeletion && (existingDeletion.status === 'pending' || existingDeletion.status === 'processing')) {
      return createSpecErrorResponse(
        'Account deletion already in progress',
        'BAD_REQUEST',
        400
      );
    }

    // Schedule account deletion (7 days from now)
    const deletionWillCompleteAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
    const deletionRequestedAt = Date.now();

    // Create account deletion record
    await convex.mutation(api.mutations.accountDeletions.create, {
      userId,
      deletion_will_complete_at: deletionWillCompleteAt,
    });

    // Send email confirmation about account deletion (async)
    if (user.email) {
      sendAccountDeletionEmail(
        user.email,
        new Date(deletionWillCompleteAt).toISOString()
      ).catch((error) => {
        console.error('Failed to send account deletion email:', error);
      });
    }

    // Note: Actual deletion after 7 days should be scheduled via Convex cron job
    // This can be implemented in convex/crons/accountDeletions.ts

    return ResponseFactory.success(
      {
        deletion_requested_at: new Date(deletionRequestedAt).toISOString(),
        deletion_will_complete_at: new Date(deletionWillCompleteAt).toISOString(),
      },
      'Account deletion request has been submitted. You will receive an email confirmation shortly.'
    );
  } catch (error: unknown) {
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to process account deletion request'),
      'INTERNAL_ERROR',
      500
    );
  }
}

export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));

