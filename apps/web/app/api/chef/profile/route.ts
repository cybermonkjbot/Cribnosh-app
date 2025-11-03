import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

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
 *       - bearerAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
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
    
    if (!payload.roles?.includes('chef')) {
      return ResponseFactory.forbidden('Forbidden: Only chefs can access this endpoint.');
    }
    
    const convex = getConvexClient();
    
    // Get chef profile by userId
    const chef = await convex.query(api.queries.chefs.getByUserId, { userId: payload.user_id });
    if (!chef) {
      return ResponseFactory.notFound('Chef profile not found.');
    }
    
    return ResponseFactory.success({ chef });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to fetch chef profile.' );
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
 *       - bearerAuth: []
 */
async function handlePUT(request: NextRequest): Promise<NextResponse> {
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
    
    if (!payload.roles?.includes('chef')) {
      return ResponseFactory.forbidden('Forbidden: Only chefs can access this endpoint.');
    }
    
    const body = await request.json();
    const { name, bio, specialties, location, image, rating } = body;
    
    const convex = getConvexClient();
    
    // Get chef profile by userId
    const chef = await convex.query(api.queries.chefs.getByUserId, { userId: payload.user_id });
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
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to update chef profile.' );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const PUT = withAPIMiddleware(withErrorHandling(handlePUT)); 