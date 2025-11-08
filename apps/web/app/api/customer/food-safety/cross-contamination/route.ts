import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

/**
 * @swagger
 * /customer/food-safety/cross-contamination:
 *   put:
 *     summary: Update cross-contamination avoidance setting
 *     description: Update whether the customer wants to avoid cross-contamination in food preparation
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - avoid_cross_contamination
 *             properties:
 *               avoid_cross_contamination:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: Cross-contamination setting updated successfully
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
 *                   example: "Cross-contamination setting updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     avoid_cross_contamination:
 *                       type: boolean
 *                       example: true
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized - invalid or missing token
 *     security:
 *       - cookieAuth: []
 */
async function handlePUT(request: NextRequest): Promise<NextResponse> {
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

    const { avoid_cross_contamination } = body;

    // Validation
    if (typeof avoid_cross_contamination !== 'boolean') {
      return createSpecErrorResponse(
        'avoid_cross_contamination must be a boolean',
        'BAD_REQUEST',
        400
      );
    }

    const convex = getConvexClient();
    const userId = payload.user_id;

    // Update cross-contamination setting in database
    await convex.mutation(api.mutations.foodSafetySettings.updateCrossContamination, {
      userId,
      avoid_cross_contamination,
    });

    // Get updated setting
    const settings = await convex.query(api.queries.foodSafetySettings.getByUserId, {
      userId,
    });

    return ResponseFactory.success(
      {
        avoid_cross_contamination: settings?.avoid_cross_contamination ?? avoid_cross_contamination,
        updated_at: new Date(settings?.updated_at || Date.now()).toISOString(),
      },
      'Cross-contamination setting updated successfully'
    );
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return createSpecErrorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to update cross-contamination setting'),
      'INTERNAL_ERROR',
      500
    );
  }
}

export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));

