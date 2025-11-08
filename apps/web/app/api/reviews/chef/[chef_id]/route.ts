import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

// Endpoint: /v1/reviews/chef/{chef_id}
// Group: reviews

/**
 * @swagger
 * /reviews/chef/{chef_id}:
 *   get:
 *     summary: Get Chef Reviews
 *     description: Get all reviews for a specific chef with average rating and customer details
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: chef_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chef
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Chef reviews retrieved successfully
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
 *                     chef_id:
 *                       type: string
 *                       description: Chef ID
 *                       example: "j1234567890abcdef"
 *                     avg_rating:
 *                       type: number
 *                       description: Average rating for the chef
 *                       example: 4.2
 *                     total_reviews:
 *                       type: number
 *                       description: Total number of reviews
 *                       example: 25
 *                     reviews:
 *                       type: array
 *                       description: Array of reviews for this chef
 *                       items:
 *                         type: object
 *                         properties:
 *                           rating:
 *                             type: number
 *                             minimum: 1
 *                             maximum: 5
 *                             description: Rating from 1 to 5
 *                             example: 4
 *                           comment:
 *                             type: string
 *                             nullable: true
 *                             description: Review comment
 *                             example: "Excellent chef, amazing flavors!"
 *                           review_id:
 *                             type: string
 *                             description: Review ID
 *                             example: "j1234567890abcdef"
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: Review creation date
 *                             example: "2024-01-15T10:30:00.000Z"
 *                           customer:
 *                             type: object
 *                             description: Customer information
 *                             properties:
 *                               customer_id:
 *                                 type: string
 *                                 description: Customer ID
 *                                 example: "j1234567890abcdef"
 *                               first_name:
 *                                 type: string
 *                                 nullable: true
 *                                 description: Customer's first name
 *                                 example: "John"
 *                               last_name:
 *                                 type: string
 *                                 nullable: true
 *                                 description: Customer's last name
 *                                 example: "Doe"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing chef_id
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
 */
export async function GET(request: NextRequest, { params }: { params: { chef_id: string } }): Promise<NextResponse> {
  try {
    const { chef_id } = params;
    if (!chef_id) {
      return ResponseFactory.validationError('Missing chef_id');
    }
    const convex = getConvexClientFromRequest(request);
    const allReviews = await convex.query(api.queries.reviews.getAll, {});
    // Filter reviews for this chef
    const chefReviews = allReviews.filter((r: any) => r.chef_id === chef_id);
    const total_reviews = chefReviews.length;
    const avg_rating = total_reviews > 0 ? chefReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / total_reviews : 0;
    // Fetch all users for customer info join
    const allUsers = await convex.query(api.queries.users.getAll, {});
    const reviews = chefReviews.map((r: any) => {
      const customer = allUsers.find((u: any) => u._id === r.user_id) || {};
      return {
        rating: r.rating,
        comment: r.comment || null,
        review_id: r._id,
        created_at: r.createdAt ? new Date(r.createdAt).toISOString() : null,
        customer: {
          customer_id: (customer as any)._id || '',
          first_name: (customer as any).first_name || null,
          last_name: (customer as any).last_name || null,
        },
      };
    });
    return ResponseFactory.success({ chef_id, avg_rating, total_reviews, reviews });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
} 