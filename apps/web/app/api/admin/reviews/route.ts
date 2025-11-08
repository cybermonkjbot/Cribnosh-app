import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
/**
 * @swagger
 * /admin/reviews:
 *   get:
 *     summary: Get All Reviews (Admin)
 *     description: Retrieve all customer reviews in the system for administrative oversight and moderation. Only accessible by administrators.
 *     tags: [Admin, Review Management]
 *     responses:
 *       200:
 *         description: Reviews retrieved successfully
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
 *                     reviews:
 *                       type: array
 *                       description: Array of all reviews in the system
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Review ID
 *                             example: "j1234567890abcdef"
 *                           chefId:
 *                             type: string
 *                             description: Chef ID being reviewed
 *                             example: "j0987654321fedcba"
 *                           mealId:
 *                             type: string
 *                             description: Meal ID being reviewed
 *                             example: "j1122334455fedcba"
 *                           userId:
 *                             type: string
 *                             description: User ID who wrote the review
 *                             example: "j5566778899fedcba"
 *                           rating:
 *                             type: number
 *                             minimum: 1
 *                             maximum: 5
 *                             description: Rating from 1 to 5 stars
 *                             example: 4
 *                           comment:
 *                             type: string
 *                             description: Review text content
 *                             example: "Great food, excellent service!"
 *                           status:
 *                             type: string
 *                             enum: [pending, approved, rejected, flagged]
 *                             description: Review moderation status
 *                             example: "approved"
 *                           createdAt:
 *                             type: number
 *                             description: Review creation timestamp
 *                             example: 1640995200000
 *                           _creationTime:
 *                             type: number
 *                             description: System creation timestamp
 *                             example: 1640995200000
 *                           sentiment:
 *                             type: object
 *                             description: AI-analyzed sentiment data
 *                             properties:
 *                               score:
 *                                 type: number
 *                                 example: 0.85
 *                               label:
 *                                 type: string
 *                                 example: "positive"
 *                               confidence:
 *                                 type: number
 *                                 example: 0.92
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
 *         description: Forbidden - only admins can access this endpoint
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
    // Get authenticated admin from session token
    await getAuthenticatedAdmin(request);
    const convex = getConvexClient();
    const reviews = await convex.query(api.queries.reviews.getAll, {});
    return ResponseFactory.success({ reviews });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, \'Failed to process request.\'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 