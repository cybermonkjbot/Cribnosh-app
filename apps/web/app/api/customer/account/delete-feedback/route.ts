import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

const FEEDBACK_OPTIONS = [
  "I'm not using the app.",
  "I found a better alternative.",
  "The app contains too many ads.",
  "The app didn't have the features or functionality I were looking for.",
  "I'm not satisfied with the quality of content.",
  "The app was difficult to navigate.",
  "Other.",
];

/**
 * @swagger
 * /customer/account/delete-feedback:
 *   post:
 *     summary: Submit account deletion feedback
 *     description: Submit feedback about why the user is deleting their account
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - feedback_options
 *             properties:
 *               feedback_options:
 *                 type: array
 *                 items:
 *                   type: integer
 *                   minimum: 0
 *                   maximum: 6
 *                 description: Array of selected feedback option indices (0-based)
 *                 example: [0, 3]
 *     responses:
 *       200:
 *         description: Feedback submitted successfully
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
 *                   example: "Feedback submitted successfully"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       400:
 *         description: Invalid feedback_options format
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);

    // Parse and validate request body
    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return createSpecErrorResponse(
        'Invalid JSON body',
        'BAD_REQUEST',
        400
      );
    }

    const { feedback_options } = body;

    // Validate feedback_options
    if (!Array.isArray(feedback_options)) {
      return createSpecErrorResponse(
        'feedback_options must be an array',
        'BAD_REQUEST',
        400
      );
    }

    if (feedback_options.length === 0) {
      return createSpecErrorResponse(
        'At least one feedback option must be selected',
        'BAD_REQUEST',
        400
      );
    }

    // Validate each option index
    for (const optionIndex of feedback_options) {
      if (typeof optionIndex !== 'number' || 
          !Number.isInteger(optionIndex) || 
          optionIndex < 0 || 
          optionIndex >= FEEDBACK_OPTIONS.length) {
        return createSpecErrorResponse(
          `Invalid feedback option index: ${optionIndex}. Must be between 0 and ${FEEDBACK_OPTIONS.length - 1}`,
          'BAD_REQUEST',
          400
        );
      }
    }

    const convex = getConvexClient();

    // Store feedback in account deletion record
    await convex.mutation(api.mutations.accountDeletions.updateFeedback, {
      userId,
      feedback_options,
    });

    return ResponseFactory.success(
      {},
      'Feedback submitted successfully'
    );
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return createSpecErrorResponse(
        error.message,
        'UNAUTHORIZED',
        401
      );
    }
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to submit feedback'),
      'INTERNAL_ERROR',
      500
    );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

