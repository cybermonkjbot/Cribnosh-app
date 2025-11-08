// Implements POST, PUT for /admin/dishes/{dish_id}/review
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /admin/dishes/{dish_id}/review:
 *   post:
 *     summary: Review Dish (Admin)
 *     description: Submit an administrative review for a specific dish, including approval/rejection status and optional notes. This endpoint is used for quality control and content moderation of chef-created dishes.
 *     tags: [Admin, Dishes, Meals, Review]
 *     parameters:
 *       - in: path
 *         name: dish_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the dish to review
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, pending, needs_revision]
 *                 description: Review status decision
 *                 example: "approved"
 *               notes:
 *                 type: string
 *                 nullable: true
 *                 description: Optional administrative notes about the review
 *                 example: "Dish meets all quality standards. Approved for public listing."
 *               qualityScore:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *                 nullable: true
 *                 description: Quality score from 1-10 (optional)
 *                 example: 8
 *               issues:
 *                 type: array
 *                 items:
 *                   type: string
 *                 nullable: true
 *                 description: List of issues found during review (if any)
 *                 example: ["Image quality could be improved", "Description needs more detail"]
 *               recommendations:
 *                 type: array
 *                 items:
 *                   type: string
 *                 nullable: true
 *                 description: Recommendations for improvement
 *                 example: ["Add more detailed ingredient list", "Include prep time"]
 *               reviewerComments:
 *                 type: string
 *                 nullable: true
 *                 description: Internal reviewer comments (not visible to chef)
 *                 example: "Chef has good technique, just needs better presentation"
 *     responses:
 *       200:
 *         description: Dish review submitted successfully
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
 *                     reviewId:
 *                       type: string
 *                       description: ID of the created review record
 *                       example: "review_1234567890abcdef"
 *                     dishId:
 *                       type: string
 *                       description: ID of the reviewed dish
 *                       example: "j1234567890abcdef"
 *                     status:
 *                       type: string
 *                       description: Review status that was set
 *                       example: "approved"
 *                     reviewedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when review was submitted
 *                       example: "2024-01-15T14:30:00Z"
 *                     reviewerId:
 *                       type: string
 *                       description: Admin user ID who performed the review
 *                       example: "j0987654321fedcba"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing required fields or invalid data
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
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Dish not found
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
 *   put:
 *     summary: Update Dish Review (Admin)
 *     description: Update an existing administrative review for a dish. This endpoint allows modifying review status, notes, or other review details.
 *     tags: [Admin, Dishes, Meals, Review]
 *     parameters:
 *       - in: path
 *         name: dish_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the dish whose review to update
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected, pending, needs_revision]
 *                 description: Updated review status decision
 *                 example: "needs_revision"
 *               notes:
 *                 type: string
 *                 nullable: true
 *                 description: Updated administrative notes
 *                 example: "Updated: Please improve image quality and add more detailed description."
 *               qualityScore:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 10
 *                 nullable: true
 *                 description: Updated quality score from 1-10
 *                 example: 6
 *               issues:
 *                 type: array
 *                 items:
 *                   type: string
 *                 nullable: true
 *                 description: Updated list of issues found
 *                 example: ["Image resolution too low", "Missing allergen information"]
 *               recommendations:
 *                 type: array
 *                 items:
 *                   type: string
 *                 nullable: true
 *                 description: Updated recommendations for improvement
 *                 example: ["Upload higher resolution images", "Add complete allergen list"]
 *               reviewerComments:
 *                 type: string
 *                 nullable: true
 *                 description: Updated internal reviewer comments
 *                 example: "Chef needs to improve presentation skills"
 *     responses:
 *       200:
 *         description: Dish review updated successfully
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
 *                     reviewId:
 *                       type: string
 *                       description: ID of the updated review record
 *                       example: "review_1234567890abcdef"
 *                     dishId:
 *                       type: string
 *                       description: ID of the reviewed dish
 *                       example: "j1234567890abcdef"
 *                     status:
 *                       type: string
 *                       description: Updated review status
 *                       example: "needs_revision"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when review was updated
 *                       example: "2024-01-15T16:45:00Z"
 *                     reviewerId:
 *                       type: string
 *                       description: Admin user ID who updated the review
 *                       example: "j0987654321fedcba"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing dish_id or invalid data
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
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Dish or review not found
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

function extractDishIdFromUrl(request: NextRequest): Id<'meals'> | undefined {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/meals\/([^/]+)\/review/);
  return match ? (match[1] as Id<'meals'>) : undefined;
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    const dish_id = extractDishIdFromUrl(request);
    if (!dish_id) {
      return ResponseFactory.validationError('Missing dish_id');
    }
    const { status, notes } = await request.json();
    if (!status) {
      return ResponseFactory.validationError('Missing status');
    }
    const convex = getConvexClient();
    await convex.mutation(api.mutations.meals.updateMeal, {
      mealId: dish_id,
      updates: {
        status,
      },
    });
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'review_dish',
      details: { dish_id, status, notes },
      adminId: userId,
    });
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, \'Failed to process request.\'));
  }
}

async function handlePUT(request: NextRequest): Promise<NextResponse> {
  // identical to handlePOST
  return handlePOST(request);
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));
