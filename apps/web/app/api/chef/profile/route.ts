import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

/**
 * @swagger
 * /chef/profile:
 *   get:
 *     summary: Get Chef Profile
 *     description: Retrieve the current authenticated chef's profile information
 *     tags: [Chef, Profile]
 *     responses:
 *       200:
 *         description: Chef profile retrieved successfully
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
 *                     chef:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Chef profile ID
 *                           example: "j1234567890abcdef"
 *                         userId:
 *                           type: string
 *                           description: Associated user ID
 *                           example: "j1234567890abcdef"
 *                         name:
 *                           type: string
 *                           example: "Chef Mario"
 *                         bio:
 *                           type: string
 *                           example: "Passionate Italian chef with 15 years of experience"
 *                         specialties:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["italian", "pasta", "pizza"]
 *                         location:
 *                           type: object
 *                           properties:
 *                             coordinates:
 *                               type: array
 *                               items:
 *                                 type: number
 *                               example: [-0.1276, 51.5074]
 *                             address:
 *                               type: string
 *                               example: "123 Baker Street, London"
 *                         image:
 *                           type: string
 *                           nullable: true
 *                           example: "https://example.com/chef-image.jpg"
 *                         rating:
 *                           type: number
 *                           example: 4.8
 *                         status:
 *                           type: string
 *                           example: "active"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only chefs can access this endpoint
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated chef from session token
    const { userId } = await getAuthenticatedChef(request);
    
    const convex = getConvexClientFromRequest(request);
    
    // Get chef profile by userId
    const chef = await convex.query(api.queries.chefs.getByUserId, { userId });
    if (!chef) {
      return ResponseFactory.notFound('Chef profile not found.');
    }
    
    return ResponseFactory.success({ chef });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch chef profile.'));
  }
}

/**
 * @swagger
 * /chef/profile:
 *   put:
 *     summary: Update Chef Profile
 *     description: Update the current authenticated chef's profile information
 *     tags: [Chef, Profile]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 nullable: true
 *                 description: Chef display name
 *                 example: "Chef Mario"
 *               bio:
 *                 type: string
 *                 nullable: true
 *                 description: Chef biography
 *                 example: "Passionate Italian chef with 15 years of experience"
 *               specialties:
 *                 type: array
 *                 items:
 *                   type: string
 *                 nullable: true
 *                 description: Chef's cooking specialties
 *                 example: ["italian", "pasta", "pizza"]
 *               location:
 *                 type: object
 *                 nullable: true
 *                 description: Chef's location
 *                 properties:
 *                   coordinates:
 *                     type: array
 *                     items:
 *                       type: number
 *                     example: [-0.1276, 51.5074]
 *                   address:
 *                     type: string
 *                     example: "123 Baker Street, London"
 *               image:
 *                 type: string
 *                 nullable: true
 *                 description: Chef profile image URL
 *                 example: "https://example.com/chef-image.jpg"
 *               rating:
 *                 type: number
 *                 nullable: true
 *                 description: Chef rating (0-5)
 *                 example: 4.8
 *     responses:
 *       200:
 *         description: Chef profile updated successfully
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
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only chefs can access this endpoint
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */
async function handlePUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated chef from session token
    const { userId } = await getAuthenticatedChef(request);
    
    const body = await request.json();
    const { name, bio, specialties, location, image, rating } = body;
    
    const convex = getConvexClientFromRequest(request);
    
    // Get chef profile by userId
    const chef = await convex.query(api.queries.chefs.getByUserId, { userId });
    if (!chef) {
      return ResponseFactory.notFound('Chef profile not found.');
    }
    
    // Update chef profile
    await convex.mutation(api.mutations.chefs.updateChef, {
      chefId: chef._id,
      ...(name && { name }),
      ...(bio && { bio }),
      ...(specialties && { specialties }),
      ...(location && { location }),
      ...(image !== undefined && { image }),
      ...(rating !== undefined && { rating })
    });
    
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to update chef profile.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const PUT = withAPIMiddleware(withErrorHandling(handlePUT)); 