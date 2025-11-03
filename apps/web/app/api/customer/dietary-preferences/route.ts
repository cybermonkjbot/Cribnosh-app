import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import jwt from 'jsonwebtoken';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return createSpecErrorResponse(
        'Invalid or expired token',
        'UNAUTHORIZED',
        401
      );
    }

    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse(
        'Only customers can access dietary preferences',
        'FORBIDDEN',
        403
      );
    }

    const convex = getConvexClient();
    const userId = payload.user_id;

    // Query dietary preferences from database
    const preferences = await convex.query(api.queries.dietaryPreferences.getByUserId, {
      userId,
    });

    return ResponseFactory.success(preferences);
  } catch (error: any) {
    return createSpecErrorResponse(
      error.message || 'Failed to fetch dietary preferences',
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
 *       - bearerAuth: []
 */
async function handlePUT(request: NextRequest): Promise<NextResponse> {
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
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return createSpecErrorResponse(
        'Invalid or expired token',
        'UNAUTHORIZED',
        401
      );
    }

    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse(
        'Only customers can update dietary preferences',
        'FORBIDDEN',
        403
      );
    }

    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
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
    const userId = payload.user_id;

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
  } catch (error: any) {
    return createSpecErrorResponse(
      error.message || 'Failed to update dietary preferences',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));

