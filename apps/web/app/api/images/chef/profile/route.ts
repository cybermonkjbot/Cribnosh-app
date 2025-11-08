import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, ErrorCode, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /images/chef/profile:
 *   post:
 *     summary: Upload Chef Profile Image
 *     description: Upload a profile image for the authenticated chef
 *     tags: [Images, Chef, Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Image file to upload (max 5MB, image formats only)
 *     responses:
 *       200:
 *         description: Profile image uploaded successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     fileUrl:
 *                       type: string
 *                       description: URL of the uploaded profile image
 *                       example: "/api/files/storage123456"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - invalid file or missing parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only chefs or admins can upload images
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chef profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Validation error - file too large, wrong format, or no file uploaded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error or file upload failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedChef(request);if (user.roles?.[0] !== 'chef' && user.roles?.[0] !== 'admin') {
      return ResponseFactory.forbidden('Forbidden: Only chefs or admins can upload images.');
    }
    const formData = await request.formData();
    const file = formData.get('file') as File;
    if (!file) {
      return ResponseFactory.error('No file uploaded.', 'CUSTOM_ERROR', 422);
    }
    if (!file.type.startsWith('image/')) {
      return ResponseFactory.error('Only image files are allowed.', 'CUSTOM_ERROR', 422);
    }
    if (file.size > 5 * 1024 * 1024) {
      return ResponseFactory.error('File size exceeds 5MB.', 'CUSTOM_ERROR', 422);
    }
    // Store file in Convex file storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const convex = getConvexClient();
    
    // First, generate an upload URL
    const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);
    
    // Upload the file to the generated URL
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: buffer,
    });
    
    if (!uploadRes.ok) {
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Failed to upload file to storage');
    }
    
    const { storageId } = await uploadRes.json();
    if (!storageId) {
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'No storageId in upload response');
    }
    
    const fileUrl = `/api/files/${storageId}`;
    
    // Update chef profile with the storage ID
    const chefs = await convex.query(api.queries.chefs.getAllChefLocations, {});
    const chef = chefs.find((c: any) => c.userId === userId);
    
    if (!chef) {
      return ResponseFactory.notFound('Chef profile not found.');
    }
    
    // Update chef with the new image URL
    await convex.mutation(api.mutations.chefs.update, { 
      chefId: chef.chefId, 
      updates: { 
        image: fileUrl
      } 
    });
    return ResponseFactory.success({ success: true, fileUrl });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, \'Failed to process request.\'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 