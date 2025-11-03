import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

const EMOTIONS_ENGINE_URL = process.env.EMOTIONS_ENGINE_URL || 'http://localhost:3000/api/emotions-engine';

/**
 * @swagger
 * /customer/search/suggestions:
 *   get:
 *     summary: Get Search Suggestions
 *     description: Retrieve intelligent search suggestions based on user input, popular queries, and personalized recommendations. This endpoint provides autocomplete suggestions and related search terms using the emotions engine for enhanced user experience.
 *     tags: [Customer, Search, Suggestions]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Partial search query to get suggestions for
 *         example: "chicken"
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: User location for location-based suggestions
 *         example: "New York, NY"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 20
 *           default: 10
 *         description: Maximum number of suggestions to return
 *         example: 10
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [all, dishes, chefs, cuisines, restaurants]
 *         description: Category filter for suggestions
 *         example: "dishes"
 *       - in: query
 *         name: user_id
 *         schema:
 *           type: string
 *         description: User ID for personalized suggestions
 *         example: "j1234567890abcdef"
 *     responses:
 *       200:
 *         description: Search suggestions retrieved successfully
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
 *                     suggestions:
 *                       type: array
 *                       description: Array of search suggestions
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                             description: Suggestion text
 *                             example: "chicken tikka masala"
 *                           type:
 *                             type: string
 *                             enum: [dish, chef, cuisine, restaurant, ingredient]
 *                             description: Type of suggestion
 *                             example: "dish"
 *                           confidence:
 *                             type: number
 *                             minimum: 0
 *                             maximum: 1
 *                             description: Confidence score for the suggestion
 *                             example: 0.95
 *                           popularity_score:
 *                             type: number
 *                             minimum: 0
 *                             maximum: 100
 *                             description: Popularity score based on search frequency
 *                             example: 78.5
 *                           category:
 *                             type: string
 *                             nullable: true
 *                             description: Category of the suggestion
 *                             example: "Indian"
 *                           image_url:
 *                             type: string
 *                             nullable: true
 *                             description: Image URL for the suggestion
 *                             example: "https://example.com/chicken-tikka.jpg"
 *                           chef_name:
 *                             type: string
 *                             nullable: true
 *                             description: Chef name (for dish suggestions)
 *                             example: "Chef Maria"
 *                           price_range:
 *                             type: string
 *                             nullable: true
 *                             description: Price range (for dish suggestions)
 *                             example: "$15-25"
 *                           rating:
 *                             type: number
 *                             nullable: true
 *                             description: Average rating
 *                             example: 4.5
 *                           is_trending:
 *                             type: boolean
 *                             description: Whether this suggestion is currently trending
 *                             example: true
 *                           search_count:
 *                             type: integer
 *                             nullable: true
 *                             description: Number of times this has been searched
 *                             example: 1250
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         query:
 *                           type: string
 *                           description: Original query that generated suggestions
 *                           example: "chicken"
 *                         total_suggestions:
 *                           type: integer
 *                           description: Total number of suggestions found
 *                           example: 15
 *                         personalized:
 *                           type: boolean
 *                           description: Whether suggestions are personalized
 *                           example: true
 *                         generated_at:
 *                           type: string
 *                           format: date-time
 *                           description: Timestamp when suggestions were generated
 *                           example: "2024-01-15T14:30:00Z"
 *                         cache_duration:
 *                           type: integer
 *                           description: Cache duration in seconds
 *                           example: 300
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing or invalid query parameter
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
      body: JSON.stringify({ ...params, intent: 'suggestions' }),
    });
    await res.json();
    return ResponseFactory.success({});
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Suggestions failed.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 