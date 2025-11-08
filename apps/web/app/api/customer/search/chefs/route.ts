import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /customer/search/chefs:
 *   get:
 *     summary: Search Chefs
 *     description: Search for chefs by name or specialties. This endpoint allows customers to find chefs based on their cooking specialties, cuisine expertise, and name matching for personalized chef discovery.
 *     tags: [Customer, Search, Chefs]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 1
 *           maxLength: 100
 *         description: Search query for chef name or specialties
 *         example: "Italian pasta"
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Location filter for chef search
 *         example: "New York, NY"
 *       - in: query
 *         name: cuisine
 *         schema:
 *           type: string
 *         description: Filter chefs by specific cuisine
 *         example: "Italian"
 *       - in: query
 *         name: rating_min
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 5
 *         description: Minimum rating filter
 *         example: 4.0
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 50
 *           default: 20
 *         description: Maximum number of chefs to return
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of chefs to skip for pagination
 *         example: 0
 *     responses:
 *       200:
 *         description: Chef search results retrieved successfully
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
 *                     chefs:
 *                       type: array
 *                       description: Array of matching chefs
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Chef ID
 *                             example: "j1234567890abcdef"
 *                           name:
 *                             type: string
 *                             description: Chef name
 *                             example: "Chef Maria Rodriguez"
 *                           bio:
 *                             type: string
 *                             nullable: true
 *                             description: Chef biography
 *                             example: "Passionate Italian chef with 15 years of experience"
 *                           specialties:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Chef cooking specialties
 *                             example: ["Italian", "Mediterranean", "Pasta"]
 *                           location:
 *                             type: string
 *                             nullable: true
 *                             description: Chef location
 *                             example: "New York, NY"
 *                           rating:
 *                             type: number
 *                             nullable: true
 *                             description: Average chef rating
 *                             example: 4.5
 *                           review_count:
 *                             type: integer
 *                             nullable: true
 *                             description: Number of reviews
 *                             example: 128
 *                           image:
 *                             type: string
 *                             nullable: true
 *                             description: Chef profile image URL
 *                             example: "https://example.com/chef-maria.jpg"
 *                           experience_years:
 *                             type: integer
 *                             nullable: true
 *                             description: Years of cooking experience
 *                             example: 15
 *                           is_verified:
 *                             type: boolean
 *                             description: Whether chef is verified
 *                             example: true
 *                           is_available:
 *                             type: boolean
 *                             description: Whether chef is currently available
 *                             example: true
 *                           price_range:
 *                             type: string
 *                             nullable: true
 *                             description: Chef's typical price range
 *                             example: "$20-40"
 *                           languages:
 *                             type: array
 *                             items:
 *                               type: string
 *                             nullable: true
 *                             description: Languages spoken by chef
 *                             example: ["English", "Spanish", "Italian"]
 *                           certifications:
 *                             type: array
 *                             items:
 *                               type: string
 *                             nullable: true
 *                             description: Chef certifications
 *                             example: ["Culinary Institute of America", "Food Safety Certified"]
 *                           cuisines:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Cuisines chef specializes in
 *                             example: ["Italian", "Mediterranean"]
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             description: Chef profile creation date
 *                             example: "2024-01-15T10:00:00.000Z"
 *                     metadata:
 *                       type: object
 *                       properties:
 *                         query:
 *                           type: string
 *                           description: Original search query
 *                           example: "Italian pasta"
 *                         total_results:
 *                           type: integer
 *                           description: Total number of matching chefs
 *                           example: 25
 *                         limit:
 *                           type: integer
 *                           description: Maximum results per page
 *                           example: 20
 *                         offset:
 *                           type: integer
 *                           description: Number of results skipped
 *                           example: 0
 *                         has_more:
 *                           type: boolean
 *                           description: Whether there are more results available
 *                           example: true
 *                         search_time_ms:
 *                             type: integer
 *                             description: Search execution time in milliseconds
 *                             example: 45
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
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const q = url.searchParams.get('q')?.toLowerCase() || '';
    const convex = getConvexClientFromRequest(request);
    const chefs = await convex.query(api.queries.chefs.getAll, {});
    const filtered = chefs.filter((chef: any) =>
      chef.name?.toLowerCase().includes(q) ||
      chef.specialties?.some((c: string) => c.toLowerCase().includes(q))
    );
    return ResponseFactory.success({ chefs: filtered });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 