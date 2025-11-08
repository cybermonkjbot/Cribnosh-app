import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { calculateDistanceKm } from '@/lib/apple-maps/service';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { errorHandler, withErrorHandling } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /customer/chefs/search:
 *   post:
 *     summary: Search Chefs by Location/Address
 *     description: Search for chefs using a query string and location
 *     tags: [Customer, Chefs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *               - location
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query (e.g., "restaurants near Union Square")
 *                 example: "restaurants near Union Square"
 *               location:
 *                 type: object
 *                 required:
 *                   - latitude
 *                   - longitude
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 37.7879
 *                   longitude:
 *                     type: number
 *                     example: -122.4075
 *               radius:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 3
 *                 description: Search radius in kilometers
 *                 example: 3
 *               cuisine:
 *                 type: string
 *                 description: Filter by cuisine type
 *                 example: "Mexican"
 *               limit:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 10
 *                 description: Number of results to return
 *                 example: 10
 *     responses:
 *       200:
 *         description: Search completed successfully
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
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "chef-001"
 *                           name:
 *                             type: string
 *                             example: "Chef Maria"
 *                           kitchen_name:
 *                             type: string
 *                             example: "Maria's Authentic Mexican"
 *                           cuisine:
 *                             type: string
 *                             example: "Mexican"
 *                           rating:
 *                             type: number
 *                             example: 4.8
 *                           review_count:
 *                             type: number
 *                             example: 127
 *                           delivery_time:
 *                             type: string
 *                             example: "25-35 mins"
 *                           distance:
 *                             type: string
 *                             example: "0.8km away"
 *                           image_url:
 *                             type: string
 *                             example: "https://example.com/chef-image.jpg"
 *                           is_live:
 *                             type: boolean
 *                             example: true
 *                           live_viewers:
 *                             type: number
 *                             example: 23
 *                           sentiment:
 *                             type: string
 *                             example: "fire"
 *                           location:
 *                             type: object
 *                             properties:
 *                               latitude:
 *                                 type: number
 *                                 example: 37.7749
 *                               longitude:
 *                                 type: number
 *                                 example: -122.4194
 *                               address:
 *                                 type: string
 *                                 example: "123 Mission St, San Francisco, CA"
 *                           created_at:
 *                             type: string
 *                             format: date-time
 *                             example: "2024-01-15T10:30:00Z"
 *                     search_metadata:
 *                       type: object
 *                       properties:
 *                         query:
 *                           type: string
 *                           example: "restaurants near Union Square"
 *                         total_results:
 *                           type: number
 *                           example: 8
 *                         search_time_ms:
 *                           type: number
 *                           example: 150
 *                 message:
 *                   type: string
 *                   example: "Search completed successfully"
 *       400:
 *         description: Validation error
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

interface SearchChefsRequest {
  query: string;
  location: {
    latitude: number;
    longitude: number;
  };
  radius?: number;
  cuisine?: string;
  limit?: number;
}

interface ChefSearchData {
  id: string;
  name: string;
  kitchen_name: string;
  cuisine: string;
  rating: number;
  review_count: number;
  delivery_time: string;
  distance: string;
  image_url: string;
  is_live: boolean;
  live_viewers: number;
  sentiment: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  created_at: string;
}

interface SearchMetadata {
  query: string;
  total_results: number;
  search_time_ms: number;
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: SearchChefsRequest = await request.json();
    const { query, location, radius = 3, cuisine, limit = 10 } = body;

    // Validate required fields
    if (!query || typeof query !== 'string') {
      return ResponseFactory.validationError('Query is required and must be a string');
    }

    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      return ResponseFactory.validationError('Location with latitude and longitude is required');
    }

    // Validate coordinates
    if (location.latitude < -90 || location.latitude > 90) {
      return ResponseFactory.validationError('Latitude must be between -90 and 90');
    }

    if (location.longitude < -180 || location.longitude > 180) {
      return ResponseFactory.validationError('Longitude must be between -180 and 180');
    }

    // Validate other parameters
    if (radius < 1 || radius > 50) {
      return ResponseFactory.validationError('Radius must be between 1 and 50 kilometers');
    }

    if (limit < 1 || limit > 100) {
      return ResponseFactory.validationError('Limit must be between 1 and 100');
    }

    const startTime = Date.now();
    const convex = getConvexClientFromRequest(request);

    // Search chefs using the query and location
    const searchResults = await convex.query(api.queries.chefs.searchChefsByQuery, {
      query,
      latitude: location.latitude,
      longitude: location.longitude,
      radiusKm: radius,
      cuisine,
      limit,
    });

    // Transform search results to include distance calculations
    const userLocation = { latitude: location.latitude, longitude: location.longitude };
    const chefs: ChefSearchData[] = searchResults.chefs.map((chef: any) => {
      const chefLocation = {
        latitude: chef.location?.coordinates?.[0] || 0,
        longitude: chef.location?.coordinates?.[1] || 0,
      };

      const distanceKm = calculateDistanceKm(userLocation, chefLocation);
      const distanceText = distanceKm < 1 
        ? `${(distanceKm * 1000).toFixed(0)}m away`
        : `${distanceKm.toFixed(1)}km away`;

      return {
        id: chef._id,
        name: chef.name || `Chef ${chef._id.slice(-4)}`,
        kitchen_name: `${chef.name}'s Kitchen`,
        cuisine: chef.specialties?.[0] || 'International',
        rating: chef.rating || 4.5,
        review_count: chef.performance?.totalOrders || 0,
        delivery_time: '25-35 mins',
        distance: distanceText,
        image_url: chef.profileImage || '/default-chef.jpg',
        is_live: false,
        live_viewers: 0,
        sentiment: 'good',
        location: {
          latitude: chefLocation.latitude,
          longitude: chefLocation.longitude,
          address: chef.location?.city || 'Address not available',
        },
        created_at: chef._creationTime ? new Date(chef._creationTime).toISOString() : new Date().toISOString(),
      };
    });

    const searchTime = Date.now() - startTime;
    const searchMetadata: SearchMetadata = {
      query,
      total_results: searchResults.total,
      search_time_ms: searchTime,
    };

    return ResponseFactory.success({
      chefs,
      search_metadata: searchMetadata,
    }, 'Search completed successfully');

  } catch (error) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Error searching chefs:', error);
    return errorHandler.handleError(error);
  }
}

export const POST = withErrorHandling(withAPIMiddleware(handlePOST));
