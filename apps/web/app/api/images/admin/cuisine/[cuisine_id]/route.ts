/**
 * @swagger
 * /api/images/admin/cuisine/{cuisine_id}:
 *   post:
 *     summary: Upload cuisine image
 *     description: Generate an upload URL for a cuisine image or confirm the uploaded image
 *     tags: [Admin - Images]
 *     parameters:
 *       - in: path
 *         name: cuisine_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the cuisine
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               filename:
 *                 type: string
 *                 description: Name of the file to upload
 *               contentType:
 *                 type: string
 *                 description: MIME type of the file
 *               confirm:
 *                 type: boolean
 *                 description: Whether to confirm and attach the uploaded image
 *               imageUrl:
 *                 type: string
 *                 description: URL of the uploaded image (required if confirm is true)
 *     responses:
 *       200:
 *         description: Upload URL generated or image confirmed successfully
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
 *                     url:
 *                       type: string
 *                       description: Upload URL (if not confirming)
 *                     objectKey:
 *                       type: string
 *                       description: Object key for the uploaded file
 *                     status:
 *                       type: string
 *                       example: "ok"
 *                     message:
 *                       type: string
 *                       example: "Image added to cuisine"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - Missing required fields
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */

import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getUserFromRequest } from '@/lib/auth/session';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

// Endpoint: /v1/images/admin/cuisine/{cuisine_id}
// Group: images

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  const user = await getUserFromRequest(request);
  if (!user) {
    return ResponseFactory.unauthorized('Unauthorized');
  }
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const cuisine_id = pathParts[pathParts.length - 1];
  
  if (!cuisine_id) {
    return ResponseFactory.validationError('Missing cuisine_id');
  }
  let cuisineId: Id<'cuisines'>;
  try {
    cuisineId = cuisine_id as Id<'cuisines'>;
  } catch {
    return ResponseFactory.validationError('Invalid cuisine_id');
  }
  let body: { filename: string; contentType: string; confirm?: boolean; imageUrl?: string };
  try {
    body = await request.json();
  } catch {
    return ResponseFactory.validationError('Invalid JSON body');
  }
  const { filename, contentType, confirm, imageUrl } = body;
  const convex = getConvexClient();

  // If confirm is true, update the cuisine's image in Convex
  if (confirm && imageUrl) {
    await convex.mutation(api.mutations.chefs.updateCuisine, { cuisineId, image: imageUrl });
    return ResponseFactory.success({ status: 'ok', message: 'Image added to cuisine' });
  }

  // Otherwise, generate a Convex upload URL
  if (!filename || !contentType) {
    return ResponseFactory.validationError('Missing filename or contentType');
  }
  
  try {
    // Generate an upload URL from Convex
    const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);
    
    // Use a unique object key: admin/cuisines/cuisineId/filename
    const objectKey = `admin/cuisines/${cuisineId}/${Date.now()}_${filename}`;
    
    return ResponseFactory.success({ url: uploadUrl, objectKey });
  } catch (error) {
    console.error('Failed to generate upload URL:', error);
    return ResponseFactory.internalError('Failed to generate upload URL');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
