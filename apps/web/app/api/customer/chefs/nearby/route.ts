import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withCaching } from '@/lib/api/cache';
import { api } from '@/convex/_generated/api';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';

// Endpoint: /v1/customer/chefs/nearby
// Group: customer

/**
 * @swagger
 * /customer/chefs/nearby:
 *   get:
 *     summary: Find Nearby Chefs (Customer)
 *     description: Find chefs within a specified distance from given coordinates with pagination
 *     tags: [Customer, Chefs, Location]
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
 *         name: radius
 *         required: false
 *         schema:
 *           type: number
 *           format: float
 *         description: Search radius in kilometers (defaults to 5)
 *         example: 5
 *       - in: query
 *         name: limit
 *         required: false
 *         schema:
 *           type: integer
 *         description: Maximum number of results per page
 *         example: 20
 *       - in: query
 *         name: page
 *         required: false
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *         example: 1
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
 *                   type: object
 *                   properties:
 *                     chefs:
 *                       type: array
 *                       description: Array of nearby chefs
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Chef ID
 *                           name:
 *                             type: string
 *                             description: Chef/Kitchen name
 *                           location:
 *                             type: object
 *                             properties:
 *                               latitude:
 *                                 type: number
 *                               longitude:
 *                                 type: number
 *                               address:
 *                                 type: string
 *                               city:
 *                                 type: string
 *                           distance:
 *                             type: number
 *                             description: Distance in kilometers
 *                           rating:
 *                             type: number
 *                             nullable: true
 *                           cuisine:
 *                             type: string
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         total:
 *                           type: integer
 *                         totalPages:
 *                           type: integer
 *                 message:
 *                   type: string
 *                   example: "Success"
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const latitude = parseFloat(searchParams.get('latitude') || '');
  const longitude = parseFloat(searchParams.get('longitude') || '');
  const radius = searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : 5;
  const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20;
  const page = searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1;

  if (isNaN(latitude) || isNaN(longitude)) {
    return ResponseFactory.validationError('latitude and longitude are required and must be numbers');
  }

  if (isNaN(radius) || radius <= 0) {
    return ResponseFactory.validationError('radius must be a positive number');
  }

  try {
    const convex = getConvexClientFromRequest(request);
  
  // Get nearby chefs using the Convex query
  const nearbyChefs = await convex.query(api.queries.chefs.findNearbyChefs, {
    latitude,
    longitude,
    maxDistanceKm: radius,
  });

  // Apply pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedChefs = nearbyChefs.slice(startIndex, endIndex);

  // Transform to match expected mobile app format
  // Note: coordinates are stored as [latitude, longitude]
  const chefs = paginatedChefs.map((chef: any) => ({
    id: chef._id,
    name: chef.kitchenName || chef.name || 'Unknown Kitchen',
    location: {
      latitude: chef.location?.coordinates?.[0] || latitude,
      longitude: chef.location?.coordinates?.[1] || longitude,
      address: chef.location?.address || '',
      city: chef.location?.city || '',
    },
    distance: chef.distance || 0,
    rating: chef.rating || null,
    cuisine: chef.specialties?.[0] || 'Other',
    image_url: chef.imageUrl || chef.image_url || chef.profileImage || null,
    is_live: chef.isLive || false,
  }));

  const total = nearbyChefs.length;
  const totalPages = Math.ceil(total / limit);

  const response = ResponseFactory.success({
    chefs,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  });
  
  // Add cache headers - location-based queries change more frequently, cache for 5 minutes
  // Cache key includes location params so different locations get different cache entries
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=300');
    
    return response;
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}

// Use caching - the default key generation includes query params, so different locations get different cache entries
export const GET = withAPIMiddleware(withErrorHandling(withCaching(handleGET, {
  ttl: 300, // 5 minutes
})));
