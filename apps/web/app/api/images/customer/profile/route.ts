import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, ErrorCode, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /images/customer/profile:
 *   post:
 *     summary: Upload Customer Profile Image
 *     description: Upload a profile image for the authenticated customer. This endpoint allows customers to upload and update their profile pictures with automatic resizing and optimization for display across the platform.
 *     tags: [Images, Customer, Profile]
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
 *                 description: Image file to upload (JPEG, PNG, WebP)
 *                 example: "profile-image.jpg"
 *               cropData:
 *                 type: object
 *                 nullable: true
 *                 description: Optional crop data for image editing
 *                 properties:
 *                   x:
 *                     type: number
 *                     example: 100
 *                   y:
 *                     type: number
 *                     example: 50
 *                   width:
 *                     type: number
 *                     example: 200
 *                   height:
 *                     type: number
 *                     example: 200
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
 *                     first_name:
 *                       type: string
 *                       description: Customer's first name
 *                       example: "John"
 *                     last_name:
 *                       type: string
 *                       description: Customer's last name
 *                       example: "Doe"
 *                     bio:
 *                       type: string
 *                       nullable: true
 *                       description: Customer's bio
 *                       example: null
 *                     profile_image:
 *                       type: string
 *                       description: URL of the uploaded profile image
 *                       example: "/api/files/storage_id_1234567890abcdef"
 *                     location_coordinates:
 *                       type: object
 *                       nullable: true
 *                       description: Customer's location coordinates
 *                       example: null
 *                     address:
 *                       type: string
 *                       nullable: true
 *                       description: Customer's address
 *                       example: "123 Main St, New York, NY"
 *                     profile_id:
 *                       type: string
 *                       description: Customer profile ID
 *                       example: "j1234567890abcdef"
 *                     user_id:
 *                       type: string
 *                       description: User ID
 *                       example: "j1234567890abcdef"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Profile creation date
 *                       example: "2024-01-15T10:00:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Last update date
 *                       example: "2024-01-15T14:30:00.000Z"
 *                     profile_image_url:
 *                       type: string
 *                       description: Full URL of the profile image
 *                       example: "/api/files/storage_id_1234567890abcdef"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only customers and admins can upload images
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Unprocessable entity - invalid file or file too large
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error - upload failed
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
    const { userId, user } = await getAuthenticatedCustomer(request);if (user.roles?.[0] !== 'customer' && user.roles?.[0] !== 'admin') {
      return ResponseFactory.forbidden('Forbidden: Only customers or admins can upload images.');
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
    const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);
    
    // Upload the file to Convex storage
    const uploadResponse = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: buffer,
    });
    
    if (!uploadResponse.ok) {
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Failed to upload to Convex storage');
    }
    
    const { storageId } = await uploadResponse.json();
    const fileUrl = `/api/files/${storageId}`;
    // Update user profile with Convex file URL
    await convex.mutation(api.mutations.users.updateUser, { userId: userId, avatar: fileUrl });
    const user = await convex.query(api.queries.users.getUserById, { userId: userId as any });
    if (!user) {
      return ResponseFactory.notFound('User not found.');
    }
    // Compose CustomerProfileResponse
    const [first_name, ...rest] = (user.name || '').split(' ');
    const last_name = rest.join(' ');
    return ResponseFactory.success({
      first_name: first_name || '',
      last_name: last_name || '',
      bio: null,
      profile_image: fileUrl,
      location_coordinates: null,
      address: user.address?.street || null,
      profile_id: user._id,
      user_id: user._id,
      created_at: new Date(user._creationTime || Date.now()).toISOString(),
      updated_at: new Date(user.lastModified || Date.now()).toISOString(),
      profile_image_url: fileUrl,
    });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, \'Failed to process request.\'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 