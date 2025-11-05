/**
 * @swagger
 * components:
 *   schemas:
 *     DishImageInfo:
 *       type: object
 *       properties:
 *         image_id:
 *           type: string
 *           description: Unique identifier for the image
 *         image_url:
 *           type: string
 *           description: URL to access the image
 *         image_type:
 *           type: string
 *           description: MIME type of the image
 *         display_order:
 *           type: number
 *           description: Order for displaying the image
 *         is_primary:
 *           type: boolean
 *           description: Whether this is the primary image
 *         alt_text:
 *           type: string
 *           nullable: true
 *           description: Alternative text for the image
 *         created_at:
 *           type: string
 *           format: date-time
 *           description: When the image was created
 *     ImageDeleteResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *         message:
 *           type: string
 *           example: "Success"
 */

import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

// Endpoint: /v1/images/dish/image/{image_id}
// Group: images

/**
 * @swagger
 * /api/images/dish/image/{image_id}:
 *   get:
 *     summary: Get dish image information
 *     description: Retrieve information about a specific dish image
 *     tags: [Images]
 *     parameters:
 *       - in: path
 *         name: image_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the image
 *     responses:
 *       200:
 *         description: Image information retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/DishImageInfo'
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - Missing image_id
 *       404:
 *         description: Image not found
 *       500:
 *         description: Internal server error
 *   delete:
 *     summary: Delete dish image
 *     description: Delete a specific dish image (chef or admin only)
 *     tags: [Images]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: image_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the image to delete
 *     responses:
 *       200:
 *         description: Image deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ImageDeleteResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       403:
 *         description: Forbidden - Only chef or admin can delete images
 *       404:
 *         description: Image not found
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest, { params }: { params: { image_id: string } }): Promise<NextResponse> {
  const { image_id } = params;
  if (!image_id) {
    return ResponseFactory.validationError('Missing image_id');
  }
  const convex = getConvexClient();
  // Get all meals using the proper query
  const allMeals = await convex.query(api.queries.meals.getAll);
  let found = null;
  for (const meal of allMeals) {
    if (Array.isArray(meal.images) && meal.images.includes(image_id)) {
      found = meal;
      break;
    }
  }
  if (!found) {
    return ResponseFactory.notFound('Image not found');
  }
  
  // For Convex file storage, we'll use the storageId directly
  const imageInfo = {
    image_id,
    image_url: `/api/files/${image_id}`,
    image_type: 'image/jpeg', // Default type, could be enhanced with metadata
    display_order: 0,
    is_primary: false,
    alt_text: null,
    created_at: new Date().toISOString(),
  };
  return ResponseFactory.success(imageInfo);
}

export async function DELETE(request: NextRequest, { params }: { params: { image_id: string } }): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    const { image_id } = params;
    const convex = getConvexClient();
    // Find the meal containing this image
    const meals = await convex.query(api.queries.meals.getAll);
    const meal = meals?.find((m: { images: string[]; _id: string }) => 
      m.images?.includes(image_id)
    );
    
    if (!meal || !Array.isArray(meal.images)) {
      return ResponseFactory.notFound('Image not found in any dish.');
    }
    if (!meal) {
      return ResponseFactory.notFound('Image not found in any dish.');
    }
    // Only allow if user is the chef
    if (meal.chefId !== payload.user_id && payload.role !== 'admin') {
      return ResponseFactory.forbidden('Forbidden: Only the chef or admin can delete this image.');
    }
    // Remove image from meal's images array in Convex
    const updatedImages = meal.images.filter((img: string) => img !== image_id);
    await convex.mutation(api.mutations.meals.updateMeal, {
      mealId: meal._id,
      updates: {
        images: updatedImages
      }
    });
    // Note: Convex file storage handles cleanup automatically
    // No need to manually delete files as they're managed by Convex
    return ResponseFactory.success({ success: true });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to delete image.' );
  }
}
