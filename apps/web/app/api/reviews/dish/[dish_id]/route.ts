import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

// Endpoint: /v1/reviews/dish/{dish_id}
// Group: reviews

/**
 * @swagger
 * /reviews/dish/{dish_id}:
 *   get:
 *     summary: Get Dish Reviews
 *     description: Get all reviews for a specific dish with average rating and customer details
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: dish_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the dish
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Dish reviews retrieved successfully
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
 *                     dish_id:
 *                       type: string
 *                       description: Dish ID
 *                       example: "j1234567890abcdef"
 *                     avg_rating:
 *                       type: number
 *                       description: Average rating for the dish
 *                       example: 4.5
 *                     total_reviews:
 *                       type: number
 *                       description: Total number of reviews
 *                       example: 18
 *                     reviews:
 *                       type: array
 *                       description: Array of reviews for this dish
 *                       items:
 *                         type: object
 *                         properties:
 *                           rating:
 *                             type: number
 *                             minimum: 1
 *                             maximum: 5
 *                             description: Rating from 1 to 5
 *                             example: 5
 *                           comment:
 *                             type: string
 *                             nullable: true
 *                             description: Review comment
 *                             example: "Absolutely delicious! Perfectly cooked and seasoned."
 *                           review_id:
 *                             type: string
 *                             description: Review ID
 *                             example: "j1234567890abcdef"
 *                           created_at:
 *                             type: string
 *                             format: date-time
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
 *                                 example: "Sarah"
 *                               last_name:
 *                                 type: string
 *                                 nullable: true
 *                                 description: Customer's last name
 *                                 example: "Johnson"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing dish_id
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
export async function GET(request: NextRequest, { params }: { params: { dish_id: string } }): Promise<NextResponse> {
  const { dish_id } = params;
  if (!dish_id) {
    return ResponseFactory.validationError('Missing dish_id');
  }
  const convex = getConvexClient();
  const allReviews = await convex.query(api.queries.reviews.getAll);
  // Filter reviews for this dish
  const dishReviews = allReviews.filter((r: any) => r.meal_id === dish_id);
  const total_reviews = dishReviews.length;
  const avg_rating = total_reviews > 0 ? dishReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / total_reviews : 0;
  // Get all user IDs for customer info
  const userIds = [...new Set(dishReviews.map((r: any) => r.user_id))];
  const users = await convex.query(api.queries.users.getAll);
  const userMap = Object.fromEntries(users.map((u: any) => [u._id, u]));
  const reviews = dishReviews.map((r: any) => ({
    rating: r.rating,
    comment: r.comment ?? null,
    review_id: r._id,
    created_at: new Date(r.createdAt).toISOString(),
    customer: {
      customer_id: r.user_id,
      first_name: userMap[r.user_id]?.name?.split(' ')[0] ?? null,
      last_name: userMap[r.user_id]?.name?.split(' ').slice(1).join(' ') || null,
    },
  }));
  return ResponseFactory.success({
    dish_id,
    avg_rating,
    total_reviews,
    reviews,
  });
} 