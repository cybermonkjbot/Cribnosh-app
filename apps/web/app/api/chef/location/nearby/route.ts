import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { NextResponse } from 'next/server';

// Endpoint: /v1/chef/location/nearby
// Group: chef

/**
 * @swagger
 * /chef/location/nearby:
 *   get:
 *     summary: Find Nearby Chefs
 *     description: Find chefs within a specified distance from given coordinates
 *     tags: [Chef, Location, Search]
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Latitude coordinate
 *         example: 51.5074
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *           format: float
 *         description: Longitude coordinate
 *         example: -0.1278
 *       - in: query
 *         name: maxDistanceKm
 *         required: false
 *         schema:
 *           type: number
 *           format: float
 *           minimum: 0.1
 *           maximum: 100
 *         description: Maximum distance in kilometers to search
 *         example: 10.0
 *     responses:
 *       200:
 *         description: Nearby chefs found successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   description: Array of nearby chefs
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Chef ID
 *                         example: "j1234567890abcdef"
 *                       userId:
 *                         type: string
 *                         description: User ID
 *                         example: "j1234567890abcdef"
 *                       location:
 *                         type: object
 *                         description: Chef location information
 *                         properties:
 *                           coordinates:
 *                             type: array
 *                             items:
 *                               type: number
 *                             description: "Array of [longitude, latitude] coordinates"
 *                             example: [-0.1278, 51.5074]
 *                           city:
 *                             type: string
 *                             description: City name
 *                             example: "London"
 *                           address:
 *                             type: string
 *                             description: Full address
 *                             example: "123 Baker Street, London"
 *                       specialties:
 *                         type: array
 *                         items:
 *                           type: string
 *                         description: Chef specialties
 *                         example: ["italian", "pasta", "seafood"]
 *                       status:
 *                         type: string
 *                         enum: [active, inactive, pending]
 *                         description: Chef status
 *                         example: "active"
 *                       distance:
 *                         type: number
 *                         description: Distance from search point in kilometers
 *                         example: 2.5
 *                       rating:
 *                         type: number
 *                         nullable: true
 *                         description: Average rating
 *                         example: 4.7
 *                       reviewCount:
 *                         type: number
 *                         description: Number of reviews
 *                         example: 25
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing or invalid coordinates
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
  const { searchParams } = new URL(request.url);
  const latitude = parseFloat(searchParams.get('latitude') || '');
  const longitude = parseFloat(searchParams.get('longitude') || '');
  const maxDistanceKm = searchParams.get('maxDistanceKm') ? parseFloat(searchParams.get('maxDistanceKm')!) : undefined;
  if (isNaN(latitude) || isNaN(longitude)) {
    return ResponseFactory.validationError('latitude and longitude are required and must be numbers');
  }
  const convex = getConvexClient();
  const chefs = await convex.query(api.queries.chefs.findNearbyChefs, { latitude, longitude, maxDistanceKm });
  return ResponseFactory.success(chefs);
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 