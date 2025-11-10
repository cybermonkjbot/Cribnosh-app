/**
 * @swagger
 * /api/reviews/{review_id}/approval:
 *   post:
 *     summary: Approve or disapprove review
 *     description: Update the approval status of a review (admin only)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: review_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - is_approved
 *             properties:
 *               is_approved:
 *                 type: boolean
 *                 description: Whether to approve or disapprove the review
 *     responses:
 *       200:
 *         description: Review approval status updated successfully
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
 *                     review:
 *                       type: object
 *                       description: Updated review data
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - Missing review_id or invalid body
 *       404:
 *         description: Review not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */

import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

// Endpoint: /v1/reviews/{review_id}/approval
// Group: reviews

export async function POST(request: NextRequest, { params }: { params: { review_id: string } }) {
  try {
    const { review_id } = params;
    if (!review_id) {
      return ResponseFactory.validationError('Missing review_id');
    }
    let body: any;
    try {
      body = await request.json();
    } catch {
      return ResponseFactory.validationError('Invalid JSON body');
    }
    const { is_approved } = body;
    if (typeof is_approved !== 'boolean') {
      return ResponseFactory.validationError('is_approved must be a boolean');
    }
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const allReviews = await convex.query(api.queries.reviews.getAll, {
      sessionToken: sessionToken || undefined
    });
    const review = allReviews.find((r: any) => r._id === review_id);
    if (!review) {
      return ResponseFactory.notFound('Review not found');
    }
    // Patch the review with approval status and status string
    let approvalDate: number | null = null;
    if (is_approved) {
      approvalDate = Date.now();
    }
    await convex.mutation(api.mutations.reviews.updateReview, {
      reviewId: review_id as Id<'reviews'>,
      ...(is_approved ? { status: 'approved' } : { status: 'pending' }),
      // approval_date is not in schema, so do not store it in DB,
      sessionToken: sessionToken || undefined
    });
    // Return the updated review
    const updatedAll = await convex.query(api.queries.reviews.getAll, {
      sessionToken: sessionToken || undefined
    });
    const updated = updatedAll.find((r: any) => r._id === review_id);
    if (!updated) {
      return ResponseFactory.notFound('Review not found after update');
    }
    return ResponseFactory.success({ review: updated });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}