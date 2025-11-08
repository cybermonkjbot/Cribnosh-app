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
 * /customer/dietary-preferences:
 *   get:
 *     summary: Get customer's dietary preferences
 *     description: Get all dietary preferences including preferences, religious requirements, and health-driven choices
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Dietary preferences retrieved successfully
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
 *                     preferences:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["vegetarian", "gluten_free"]
 *                     religious_requirements:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["halal"]
 *                     health_driven:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["low_sodium", "low_fat"]
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-10T10:00:00Z"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClient();

    // Query dietary preferences from database
    const preferences = await convex.query(api.queries.dietaryPreferences.getByUserId, {
      userId,
    });

    return ResponseFactory.success(preferences);
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return createSpecErrorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to fetch dietary preferences'),
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * @swagger
 * /customer/dietary-preferences:
 *   put:
 *     summary: Update customer's dietary preferences
 *     description: Update dietary preferences including preferences, religious requirements, and health-driven choices
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferences:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["vegetarian", "gluten_free"]
 *               religious_requirements:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["halal"]
 *               health_driven:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["low_sodium", "low_fat"]
 *     responses:
 *       200:
 *         description: Dietary preferences updated successfully
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
 *                   example: "Dietary preferences updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     preferences:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["vegetarian", "gluten_free"]
 *                     religious_requirements:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["halal"]
 *                     health_driven:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["low_sodium", "low_fat"]
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Invalid preference data or validation error
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

    const { preferences = [], religious_requirements = [], health_driven = [] } = body;

    // Validation - ensure arrays
    if (!Array.isArray(preferences) || !Array.isArray(religious_requirements) || !Array.isArray(health_driven)) {
      return createSpecErrorResponse(
        'preferences, religious_requirements, and health_driven must be arrays',
        'BAD_REQUEST',
        400
      );
    }

    const convex = getConvexClient();

    // Update dietary preferences in database
    await convex.mutation(api.mutations.dietaryPreferences.updateByUserId, {
      userId,
      preferences,
      religious_requirements,
      health_driven,
    });

    // Get updated preferences
    const updatedPreferences = await convex.query(api.queries.dietaryPreferences.getByUserId, {
      userId,
    });

    return ResponseFactory.success(
      updatedPreferences,
      'Dietary preferences updated successfully'
    );
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return createSpecErrorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to update dietary preferences'),
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));

