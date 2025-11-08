import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /api/reviews/index:
 *   get:
 *     summary: Get reviews index
 *     description: Get the reviews index page with statistics and recent reviews
 *     tags: [Reviews]
 *     responses:
 *       200:
 *         description: Reviews index retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalReviews:
 *                       type: number
 *                     averageRating:
 *                       type: number
 *                     recentReviews:
 *                       type: array
 *                       items:
 *                         type: object
 *                     topRatedChefs:
 *                       type: array
 *                       items:
 *                         type: object
 *                     topRatedDishes:
 *                       type: array
 *                       items:
 *                         type: object
 *       500:
 *         description: Internal server error
 */
export const GET = withErrorHandling(async (request: NextRequest) => {
  const convex = getConvexClient();
  
  try {
    // For now, return mock data until Convex functions are implemented
    return ResponseFactory.success({
      data: {
        totalReviews: 1250,
        averageRating: 4.2,
        recentReviews: [
          {
            id: 'review_1',
            rating: 5,
            comment: 'Amazing food!',
            chefName: 'Chef Maria',
            dishName: 'Spicy Tacos',
            createdAt: new Date().toISOString()
          },
          {
            id: 'review_2',
            rating: 4,
            comment: 'Great flavors',
            chefName: 'Chef John',
            dishName: 'Pasta Carbonara',
            createdAt: new Date().toISOString()
          }
        ],
        topRatedChefs: [
          { id: 'chef_1', name: 'Chef Maria', rating: 4.8, totalReviews: 150 },
          { id: 'chef_2', name: 'Chef John', rating: 4.7, totalReviews: 120 }
        ],
        topRatedDishes: [
          { id: 'dish_1', name: 'Spicy Tacos', rating: 4.9, totalReviews: 85 },
          { id: 'dish_2', name: 'Pasta Carbonara', rating: 4.8, totalReviews: 92 }
        ]
      }
    });
  } catch (error) {
    console.error('Error in reviews index:', error);
    return ResponseFactory.error('Failed to retrieve reviews index', 'REVIEWS_INDEX_ERROR', 500);
  }
});
