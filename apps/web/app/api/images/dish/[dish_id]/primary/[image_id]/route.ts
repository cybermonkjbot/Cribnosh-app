/**
 * @swagger
 * components:
 *   schemas:
 *     SetPrimaryImageResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             status:
 *               type: string
 *               example: "ok"
 *             images:
 *               type: array
 *               items:
 *                 type: string
 *               description: Updated images array for the dish
 *         message:
 *           type: string
 *           example: "Success"
 */

import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

// Endpoint: /v1/images/dish/{dish_id}/primary/{image_id}
// Group: images

/**
 * @swagger
 * /api/images/dish/{dish_id}/primary/{image_id}:
 *   post:
 *     summary: Set primary dish image
 *     description: Set a specific image as the primary image for a dish (chef or admin only)
 *     tags: [Images]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: dish_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the dish
 *       - in: path
 *         name: image_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the image to set as primary
 *     responses:
 *       200:
 *         description: Primary image set successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SetPrimaryImageResponse'
 *       400:
 *         description: Validation error - Missing dish_id or image_id
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Only chef or admin can set primary image
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest, { params }: { params: { dish_id: string, image_id: string } }): Promise<NextResponse> {
  const { dish_id, image_id } = params;
  if (!dish_id || !image_id) {
    return ResponseFactory.validationError('Missing dish_id or image_id');
  }
  // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);if (user.roles?.[0] !== 'chef' && user.roles?.[0] !== 'admin') {
    return ResponseFactory.forbidden('Forbidden: Only chefs or admins can set primary image.');
  }
  const convex = getConvexClient();
  try {
    await convex.mutation(api.mutations.meals.setPrimaryMealImage, { 
      mealId: dish_id as Id<"meals">, 
      imageId: image_id 
    });
    const meal = await convex.query(api.queries.meals.get, { mealId: dish_id as Id<'meals'> });
    return ResponseFactory.success({ status: 'ok', images: meal?.images || [] });
  } catch (e: any) {
    return ResponseFactory.internalError(e.message || 'Failed to set primary image' );
  }
}
