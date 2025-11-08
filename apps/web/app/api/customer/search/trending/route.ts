import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

const EMOTIONS_ENGINE_URL = process.env.EMOTIONS_ENGINE_URL || 'http://localhost:3000/api/emotions-engine';

/**
 * @swagger
 * /customer/search/trending:
 *   get:
 *     summary: Get Trending Search Results
 *     description: Retrieve trending search results based on popular queries, user behavior, and current food trends. This endpoint provides personalized trending content using the emotions engine to surface popular dishes, chefs, and cuisines.
 *     tags: [Customer, Search, Trending]
 *     parameters:
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: User location for location-based trending results
 *         example: "New York, NY"
 *       - in: query
 *         name: cuisine
 *         schema:
 *           type: string
 *         description: Filter trending results by specific cuisine
 *         example: "Italian"
 *       - in: query
 *         name: time_range
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *         description: Time range for trending analysis
 *         example: "day"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of trending results to return
 *         example: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [dishes, chefs, cuisines, restaurants]
 *         description: Category of trending content
 *         example: "dishes"
 *     responses:
 *       200:
 *         description: Trending search results retrieved successfully
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
 *                     trending:
 *                       type: array
 *                       description: Array of trending items
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Item ID
 *                             example: "j1234567890abcdef"
 *                           name:
 *                             type: string
 *                             description: Item name
 *                             example: "Chicken Tikka Masala"
 *                           type:
 *                             type: string
 *                             enum: [dish, chef, cuisine, restaurant]
 *                             description: Type of trending item
 *                             example: "dish"
 *                           popularity_score:
 *                             type: number
 *                             description: Popularity score (0-100)
 *                             example: 85.5
 *                           trend_direction:
 *                             type: string
 *                             enum: [up, down, stable]
 *                             description: Trend direction
 *                             example: "up"
 *                           search_count:
 *                             type: integer
 *                             description: Number of searches in time period
 *                             example: 245
 *                           image_url:
 *                             type: string
 *                             nullable: true
 *                             description: Item image URL
 *                             example: "https://example.com/dish-image.jpg"
 *                           chef_name:
 *                             type: string
 *                             nullable: true
 *                             description: Chef name (for dishes)
 *                             example: "Chef Maria"
 *                           cuisine:
 *                             type: string
 *                             nullable: true
 *                             description: Cuisine type
 *                             example: "Indian"
 *                           price_range:
 *                             type: string
 *                             nullable: true
 *                             description: Price range
 *                             example: "$15-25"
 *                           rating:
 *                             type: number
 *                             nullable: true
 *                             description: Average rating
 *                             example: 4.5
 *                           review_count:
 *                             type: integer
 *                             nullable: true
 *                             description: Number of reviews
 *                             example: 128
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         time_range:
 *                           type: string
 *                           description: Time range used for trending analysis
 *                           example: "day"
 *                         location:
 *                           type: string
 *                           nullable: true
 *                           description: Location used for filtering
 *                           example: "New York, NY"
 *                         total_items:
 *                           type: integer
 *                           description: Total number of trending items found
 *                           example: 25
 *                         generated_at:
 *                           type: string
 *                           format: date-time
 *                           description: Timestamp when trending data was generated
 *                           example: "2024-01-15T14:30:00Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - invalid parameters
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error - emotions engine failure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const params = Object.fromEntries(url.searchParams.entries());
    const res = await fetch(EMOTIONS_ENGINE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...params, intent: 'trending' }),
    });
    const data = await res.json();
    return ResponseFactory.success({});
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, \'Failed to process request.\'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 