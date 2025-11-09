/**
 * @swagger
 * /api/images/dish/{dish_id}:
 *   get:
 *     summary: Get dish images
 *     description: Retrieve all images associated with a specific dish
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: dish_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the dish
 *     responses:
 *       200:
 *         description: Dish images retrieved successfully
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
 *                     images:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           image_id:
 *                             type: string
 *                           image_url:
 *                             type: string
 *                           image_type:
 *                             type: string
 *                           display_order:
 *                             type: number
 *                           is_primary:
 *                             type: boolean
 *                           alt_text:
 *                             type: string
 *                             nullable: true
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - Missing dish_id
 *       404:
 *         description: Dish not found
 *       500:
 *         description: Internal server error
 *     security: []
 */

import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { Id } from '@/convex/_generated/dataModel';
import { api } from '@/convex/_generated/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

// Endpoint: /v1/images/dish/{dish_id}
// Group: images

export async function GET(request: NextRequest, { params }: { params: { dish_id: string } }): Promise<NextResponse> {
  const { dish_id } = params;
  if (!dish_id) {
    return ResponseFactory.validationError('Missing dish_id');
  }
  const convex = getConvexClient();
  const sessionToken = getSessionTokenFromRequest(request);
  // Use the correct API function to get the meal by ID
  const meal = await convex.query(api.queries.meals.get, {
    mealId: dish_id as Id<'meals'>,
    sessionToken: sessionToken || undefined
  });
  if (!meal) {
    return ResponseFactory.notFound('Dish not found');
  }
  const images = (meal.images || []).map((image_id: string, idx: number) => {
    return {
      image_id,
      image_url: `/api/files/${image_id}`,
      image_type: 'image/jpeg', // Default type, could be enhanced with metadata
      display_order: idx,
      is_primary: idx === 0,
      alt_text: null,
      created_at: new Date().toISOString(),
    };
  });
  return ResponseFactory.success({ images });
}
