// Implements POST, PUT for /admin/reviews/{review_id}/approval
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

/**
 * @swagger
 * /admin/reviews/{review_id}/approval:
 *   post:
 *     summary: Approve/Reject Review (Admin)
 *     description: Approve or reject a customer review for publication. This endpoint allows administrators to moderate reviews and add approval notes. Changes are logged for audit purposes.
 *     tags: [Admin, Review Management]
 *     parameters:
 *       - in: path
 *         name: review_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the review to approve/reject
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, flagged, pending]
 *                 description: New moderation status for the review
 *                 example: "approved"
 *               approvalNotes:
 *                 type: string
 *                 description: Optional notes from the admin about the approval decision
 *                 example: "Review meets community guidelines"
 *     responses:
 *       200:
 *         description: Review status updated successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing review_id or status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only admins can approve/reject reviews
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 *   put:
 *     summary: Update Review Approval Status (Admin)
 *     description: Update the approval status of a review. This is an alias for the POST endpoint with identical functionality.
 *     tags: [Admin, Review Management]
 *     parameters:
 *       - in: path
 *         name: review_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the review to update
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, flagged, pending]
 *                 description: New moderation status for the review
 *                 example: "approved"
 *               approvalNotes:
 *                 type: string
 *                 description: Optional notes from the admin about the approval decision
 *                 example: "Review meets community guidelines"
 *     responses:
 *       200:
 *         description: Review status updated successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing review_id or status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only admins can update review status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */

function extractReviewIdFromUrl(request: NextRequest): Id<'reviews'> | undefined {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/reviews\/([^/]+)\/approval/);
  return match ? (match[1] as Id<'reviews'>) : undefined;
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    const { userId } = await getAuthenticatedAdmin(request);
    const review_id = extractReviewIdFromUrl(request);
    if (!review_id) {
      return ResponseFactory.validationError('Missing review_id');
    }
    const { status, approvalNotes } = await request.json();
    if (!status) {
      return ResponseFactory.validationError('Missing status');
    }
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    await convex.mutation(api.mutations.reviews.updateReview, {
      reviewId: review_id,
      status,
      approvalNotes: approvalNotes || '',
      sessionToken: sessionToken || undefined
    });
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'review_approval',
      details: { review_id, status, notes: approvalNotes },
      adminId: userId,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

async function handlePUT(request: NextRequest): Promise<NextResponse> {
  // identical to handlePOST
  return handlePOST(request);
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));
