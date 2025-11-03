import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getUserFromRequest } from '@/lib/auth/session';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { NextResponse } from 'next/server';

// Endpoint: /v1/images/chef/dish/{dish_id}
// Group: images

/**
 * @swagger
 * /images/chef/dish/{dish_id}:
 *   post:
 *     summary: Upload Dish Image
 *     description: Get presigned URL for uploading dish image or confirm image upload
 *     tags: [Images, Chef, Dishes]
 *     parameters:
 *       - in: path
 *         name: dish_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Dish ID
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             oneOf:
 *               - title: Get Upload URL
 *                 required:
 *                   - filename
 *                   - contentType
 *                 properties:
 *                   filename:
 *                     type: string
 *                     description: Name of the image file
 *                     example: "dish-photo.jpg"
 *                   contentType:
 *                     type: string
 *                     description: MIME type of the image
 *                     example: "image/jpeg"
 *               - title: Confirm Upload
 *                 required:
 *                   - confirm
 *                   - imageUrl
 *                 properties:
 *                   confirm:
 *                     type: boolean
 *                     description: Confirm that image was uploaded
 *                     example: true
 *                   imageUrl:
 *                     type: string
 *                     description: URL of the uploaded image
 *                     example: "https://storage.example.com/chef123/dishes/dish456/image.jpg"
 *     responses:
 *       200:
 *         description: Upload URL generated or image confirmed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               oneOf:
 *                 - title: Upload URL Response
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       type: object
 *                       properties:
 *                         url:
 *                           type: string
 *                           description: Convex upload URL
 *                           example: "https://convex.cloud/upload?signature=..."
 *                         objectKey:
 *                           type: string
 *                           description: Object key for the uploaded file
 *                           example: "chef123/dishes/dish456/1640995200000_dish-photo.jpg"
 *                     message:
 *                       type: string
 *                       example: "Success"
 *                 - title: Confirmation Response
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     data:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                           example: "ok"
 *                         message:
 *                           type: string
 *                           example: "Image added to meal"
 *                     message:
 *                       type: string
 *                       example: "Success"
 *       400:
 *         description: Validation error - missing or invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - authentication required
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
 *       - bearerAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  const user = await getUserFromRequest(request);
  if (!user) {
    return ResponseFactory.unauthorized('Unauthorized');
  }
  // Extract dish_id from the URL
  const url = new URL(request.url);
  const match = url.pathname.match(/\/dish\/([^/]+)/);
  const dish_id = match ? match[1] : undefined;
  if (!dish_id) {
    return ResponseFactory.validationError('Missing dish_id');
  }
  let mealId: Id<'meals'>;
  try {
    mealId = dish_id as Id<'meals'>;
  } catch {
    return ResponseFactory.validationError('Invalid dish_id');
  }
  let body: { filename: string; contentType: string; confirm?: boolean; imageUrl?: string };
  try {
    body = await request.json();
  } catch {
    return ResponseFactory.validationError('Invalid JSON body');
  }
  const { filename, contentType, confirm, imageUrl } = body;
  const convex = getConvexClient();

  // If confirm is true, update the meal's images array in Convex
  if (confirm && imageUrl) {
    await convex.mutation(api.mutations.meals.updateMealImages, { mealId, imageUrl });
    return ResponseFactory.success({ status: 'ok', message: 'Image added to meal' });
  }

  // Otherwise, generate a Convex upload URL
  if (!filename || !contentType) {
    return ResponseFactory.validationError('Missing filename or contentType');
  }
  
  try {
    // Generate an upload URL from Convex
    const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);
    
    // Use a unique object key: chefId/dishes/mealId/filename
    const objectKey = `${user._id}/dishes/${mealId}/${Date.now()}_${filename}`;
    
    return ResponseFactory.success({ url: uploadUrl, objectKey });
  } catch (error) {
    console.error('Failed to generate upload URL:', error);
    return ResponseFactory.internalError('Failed to generate upload URL');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
