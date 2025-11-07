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
 * /customer/allergies:
 *   get:
 *     summary: Get customer's allergies and intolerances
 *     description: Get all allergies and intolerances recorded for the customer
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Allergies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         example: "allergy_123"
 *                       name:
 *                         type: string
 *                         example: "Peanuts"
 *                       type:
 *                         type: string
 *                         enum: [allergy, intolerance]
 *                         example: "allergy"
 *                       severity:
 *                         type: string
 *                         enum: [mild, moderate, severe]
 *                         example: "severe"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2024-01-10T10:00:00Z"
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
        'Only customers can access allergies',
        'FORBIDDEN',
        403
      );
    }

    const convex = getConvexClient();
    const userId = payload.user_id;

    // Query allergies from database
    const allergies = await convex.query(api.queries.allergies.getByUserId, {
      userId,
    });

    return ResponseFactory.success(allergies);
  } catch (error: unknown) {
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to fetch allergies'),
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * @swagger
 * /customer/allergies:
 *   put:
 *     summary: Update customer's allergies and intolerances
 *     description: Update or replace all allergies and intolerances for the customer
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - allergies
 *             properties:
 *               allergies:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - type
 *                     - severity
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "Peanuts"
 *                     type:
 *                       type: string
 *                       enum: [allergy, intolerance]
 *                       example: "allergy"
 *                     severity:
 *                       type: string
 *                       enum: [mild, moderate, severe]
 *                       example: "severe"
 *     responses:
 *       200:
 *         description: Allergies updated successfully
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
 *                   example: "Allergies updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     allergies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "allergy_123"
 *                           name:
 *                             type: string
 *                             example: "Peanuts"
 *                           type:
 *                             type: string
 *                             example: "allergy"
 *                           severity:
 *                             type: string
 *                             example: "severe"
 *                           updated_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Invalid allergy data or validation error
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
        'Only customers can update allergies',
        'FORBIDDEN',
        403
      );
    }

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

    const { allergies } = body;

    // Validation
    if (!Array.isArray(allergies)) {
      return createSpecErrorResponse(
        'allergies must be an array',
        'BAD_REQUEST',
        400
      );
    }

    // Validate each allergy
    for (const allergy of allergies) {
      if (!allergy.name || typeof allergy.name !== 'string') {
        return createSpecErrorResponse(
          'Each allergy must have a name',
          'BAD_REQUEST',
          400
        );
      }
      if (!allergy.type || !['allergy', 'intolerance'].includes(allergy.type)) {
        return createSpecErrorResponse(
          'Each allergy must have a type of "allergy" or "intolerance"',
          'BAD_REQUEST',
          400
        );
      }
      if (!allergy.severity || !['mild', 'moderate', 'severe'].includes(allergy.severity)) {
        return createSpecErrorResponse(
          'Each allergy must have a severity of "mild", "moderate", or "severe"',
          'BAD_REQUEST',
          400
        );
      }
    }

    const convex = getConvexClient();
    const userId = payload.user_id;

    // Update allergies in database
    await convex.mutation(api.mutations.allergies.updateByUserId, {
      userId,
      allergies,
    });

    // Get updated allergies
    const updatedAllergiesData = await convex.query(api.queries.allergies.getByUserId, {
      userId,
    });

    return ResponseFactory.success(
      { allergies: updatedAllergiesData },
      'Allergies updated successfully'
    );
  } catch (error: unknown) {
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to update allergies'),
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));

