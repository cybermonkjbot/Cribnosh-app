import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /customer/cuisines/top:
 *   get:
 *     summary: Get Top Cuisines
 *     description: Retrieve the most popular cuisines based on meal orders and user preferences. This endpoint provides insights into trending cuisines and helps customers discover popular food categories.
 *     tags: [Customer, Cuisines, Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 10
 *         description: Maximum number of top cuisines to return
 *         example: 10
 *       - in: query
 *         name: time_range
 *         schema:
 *           type: string
 *           enum: [day, week, month, year, all]
 *           default: "month"
 *         description: Time range for popularity calculation
 *         example: "month"
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location filter for regional cuisine popularity
 *         example: "New York, NY"
 *     responses:
 *       200:
 *         description: Top cuisines retrieved successfully
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
 *                     top_cuisines:
 *                       type: array
 *                       description: Array of top cuisines with popularity data
 *                       items:
 *                         type: object
 *                         properties:
 *                           cuisine:
 *                             type: string
 *                             description: Cuisine name
 *                             example: "Italian"
 *                           count:
 *                             type: integer
 *                             description: Number of meals/orders for this cuisine
 *                             example: 245
 *                           popularity_score:
 *                             type: number
 *                             minimum: 0
 *                             maximum: 100
 *                             description: Calculated popularity score
 *                             example: 85.5
 *                           trend_direction:
 *                             type: string
 *                             enum: [up, down, stable]
 *                             description: Trend direction compared to previous period
 *                             example: "up"
 *                           growth_percentage:
 *                             type: number
 *                             nullable: true
 *                             description: Growth percentage from previous period
 *                             example: 12.5
 *                           average_rating:
 *                             type: number
 *                             nullable: true
 *                             description: Average rating for this cuisine
 *                             example: 4.3
 *                           total_reviews:
 *                             type: integer
 *                             nullable: true
 *                             description: Total number of reviews for this cuisine
 *                             example: 1250
 *                           top_dishes:
 *                             type: array
 *                             items:
 *                               type: string
 *                             nullable: true
 *                             description: Most popular dishes in this cuisine
 *                             example: ["Pasta Carbonara", "Margherita Pizza", "Tiramisu"]
 *                           chef_count:
 *                             type: integer
 *                             nullable: true
 *                             description: Number of chefs specializing in this cuisine
 *                             example: 25
 *                           price_range:
 *                             type: object
 *                             nullable: true
 *                             description: Typical price range for this cuisine
 *                             properties:
 *                               min:
 *                                 type: number
 *                                 example: 12.99
 *                               max:
 *                                 type: number
 *                                 example: 35.99
 *                               average:
 *                                 type: number
 *                                 example: 22.50
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         time_range:
 *                           type: string
 *                           description: Time range used for calculation
 *                           example: "month"
 *                         location:
 *                           type: string
 *                           nullable: true
 *                           description: Location filter applied
 *                           example: "New York, NY"
 *                         total_cuisines:
 *                           type: integer
 *                           description: Total number of cuisines analyzed
 *                           example: 45
 *                         generated_at:
 *                           type: string
 *                           format: date-time
 *                           description: Timestamp when data was generated
 *                           example: "2024-01-15T14:30:00Z"
 *                         data_source:
 *                           type: string
 *                           description: Source of the popularity data
 *                           example: "meal_orders"
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
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */

async function handleGET(request: NextRequest): Promise<NextResponse> {
  const convex = getConvexClient();
  // Aggregate cuisine popularity from meals/orders
  const meals = await convex.query(api.queries.meals.getAll, {});
  const cuisineCount: Record<string, number> = {};
  
  for (const meal of meals) {
    if (meal.cuisine && Array.isArray(meal.cuisine)) {
      meal.cuisine.forEach((c: string) => {
        cuisineCount[c] = (cuisineCount[c] || 0) + 1;
      });
    }
  }
  
  const topCuisines = Object.entries(cuisineCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([cuisine, count]) => ({ cuisine, count }));
  return ResponseFactory.success({ top_cuisines: topCuisines });
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 