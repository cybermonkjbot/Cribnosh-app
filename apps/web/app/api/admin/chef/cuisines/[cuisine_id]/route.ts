import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { Id } from '@/convex/_generated/dataModel';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
/**
 * @swagger
 * /admin/chef/cuisines/{cuisine_id}:
 *   get:
 *     summary: Get Cuisine by ID (Admin)
 *     description: Retrieve detailed information about a specific cuisine type. Only accessible by administrators.
 *     tags: [Admin, Chef Management, Cuisines]
 *     parameters:
 *       - in: path
 *         name: cuisine_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the cuisine
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Cuisine retrieved successfully
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
 *                     name:
 *                       type: string
 *                       description: Cuisine name
 *                       example: "Italian"
 *                     description:
 *                       type: string
 *                       nullable: true
 *                       description: Cuisine description
 *                       example: "Traditional Italian cuisine with authentic flavors"
 *                     cuisine_image:
 *                       type: string
 *                       nullable: true
 *                       description: Cuisine image URL
 *                       example: "https://example.com/images/italian.jpg"
 *                     cuisine_id:
 *                       type: string
 *                       description: Cuisine ID
 *                       example: "j1234567890abcdef"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       description: Creation timestamp
 *                       example: "2024-01-15T10:30:00Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       description: Last update timestamp
 *                       example: "2024-01-15T10:30:00Z"
 *                     cuisine_image_url:
 *                       type: string
 *                       nullable: true
 *                       description: Cuisine image URL
 *                       example: "https://example.com/images/italian.jpg"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing cuisine_id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Cuisine not found
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
 *     security: []
 *   put:
 *     summary: Update Cuisine (Admin)
 *     description: Update cuisine information including name, description, and image. Only accessible by administrators.
 *     tags: [Admin, Chef Management, Cuisines]
 *     parameters:
 *       - in: path
 *         name: cuisine_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the cuisine to update
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Updated cuisine name
 *                 example: "Italian Cuisine"
 *               description:
 *                 type: string
 *                 description: Updated cuisine description
 *                 example: "Authentic Italian dishes with traditional recipes"
 *               image:
 *                 type: string
 *                 description: Updated cuisine image URL
 *                 example: "https://example.com/images/italian-updated.jpg"
 *     responses:
 *       200:
 *         description: Cuisine updated successfully
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
 *       400:
 *         description: Bad request - missing cuisine_id or invalid data
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
 *         description: Forbidden - only admins can update cuisines
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
 *   delete:
 *     summary: Delete Cuisine (Admin)
 *     description: Permanently delete a cuisine type. Only accessible by administrators. This action cannot be undone.
 *     tags: [Admin, Chef Management, Cuisines]
 *     parameters:
 *       - in: path
 *         name: cuisine_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the cuisine to delete
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Cuisine deleted successfully
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
 *       400:
 *         description: Bad request - missing cuisine_id
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
 *         description: Forbidden - only admins can delete cuisines
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
    // Extract cuisine_id from the URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/cuisines\/([^/]+)/);
    const cuisine_id = match ? (match[1] as Id<'cuisines'>) : undefined;
    if (!cuisine_id) {
      return ResponseFactory.validationError('Missing cuisine_id');
    }
    const convex = getConvexClientFromRequest(request);
    const cuisine = await convex.query(api.queries.chefs.getCuisineById, { cuisineId: cuisine_id });
    if (!cuisine) {
      return ResponseFactory.notFound('Cuisine not found');
    }
    return ResponseFactory.success({
      name: cuisine.name,
      description: cuisine.description || null,
      cuisine_image: cuisine.image || null,
      cuisine_id: cuisine._id,
      created_at: new Date(cuisine.createdAt).toISOString(),
      updated_at: new Date(cuisine.updatedAt).toISOString(),
      cuisine_image_url: cuisine.image || null,
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

async function handlePUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    const url = new URL(request.url);
    const match = url.pathname.match(/\/cuisines\/([^/]+)/);
    const cuisine_id = match ? (match[1] as Id<'cuisines'>) : undefined;
    if (!cuisine_id) {
      return ResponseFactory.validationError('Missing cuisine_id');
    }
    const updates = await request.json();
    const convex = getConvexClientFromRequest(request);
    await convex.mutation(api.mutations.chefs.updateCuisine, {
      cuisineId: cuisine_id,
      ...updates,
    });
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    const url = new URL(request.url);
    const match = url.pathname.match(/\/cuisines\/([^/]+)/);
    const cuisine_id = match ? (match[1] as Id<'cuisines'>) : undefined;
    if (!cuisine_id) {
      return ResponseFactory.validationError('Missing cuisine_id');
    }
    const convex = getConvexClientFromRequest(request);
    await convex.mutation(api.mutations.chefs.deleteCuisine, { cuisineId: cuisine_id });
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));
export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));
