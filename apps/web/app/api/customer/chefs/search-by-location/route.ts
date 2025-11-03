import { withErrorHandling, ErrorFactory, errorHandler, ErrorCode } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { calculateDistanceKm, formatDistanceMiles } from '@/lib/apple-maps/service';

/**
 * @swagger
 * /customer/chefs/search-by-location:
 *   post:
 *     summary: Get Chefs with Location Data
 *     description: Retrieve chefs within a specified radius of the user's location
 *     tags: [Customer, Chefs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - latitude
 *               - longitude
 *             properties:
 *               latitude:
 *                 type: number
 *                 minimum: -90
 *                 maximum: 90
 *                 description: User's current latitude
 *                 example: 37.7749
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: User's current longitude
 *                 example: -122.4194
 *               radius:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 50
 *                 default: 5
 *                 description: Search radius in kilometers
 *                 example: 5
 *               limit:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 100
 *                 default: 20
 *                 description: Number of results to return
 *                 example: 20
 *               page:
 *                 type: number
 *                 minimum: 1
 *                 default: 1
 *                 description: Page number for pagination
 *                 example: 1
 *     responses:
 *       200:
 *         description: Chefs retrieved successfully
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
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page:
 *                           type: number
 *                           example: 1
 *                         limit:
 *                           type: number
 *                           example: 20
 *                         total:
 *                           type: number
 *                           example: 45
 *                         total_pages:
 *                           type: number
 *                           example: 3
 *                 message:
 *                   type: string
 *                   example: "Chefs retrieved successfully"
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

interface SearchByLocationRequest {
  latitude: number;
  longitude: number;
  radius?: number;
  limit?: number;
  page?: number;
}

interface ChefLocationData {
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

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: SearchByLocationRequest = await request.json();
    const { latitude, longitude, radius = 5, limit = 20, page = 1 } = body;

    // Validate coordinates
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return ResponseFactory.validationError('Latitude and longitude must be numbers');
    }

    if (latitude < -90 || latitude > 90) {
      return ResponseFactory.validationError('Latitude must be between -90 and 90');
    }

    if (longitude < -180 || longitude > 180) {
      return ResponseFactory.validationError('Longitude must be between -180 and 180');
    }

    // Validate pagination parameters
    if (radius < 1 || radius > 50) {
      return ResponseFactory.validationError('Radius must be between 1 and 50 kilometers');
    }

    if (limit < 1 || limit > 100) {
      return ResponseFactory.validationError('Limit must be between 1 and 100');
    }

    if (page < 1) {
      return ResponseFactory.validationError('Page must be 1 or greater');
    }

    const convex = getConvexClient();

    // Get chefs with location data
    const chefsData = await convex.query(api.queries.chefs.getChefsByLocation, {
      latitude,
      longitude,
      radiusKm: radius,
      limit,
      page,
    });

    // Transform chefs data to include distance calculations
    const userLocation = { latitude, longitude };
    const chefs: ChefLocationData[] = chefsData.chefs.map((chef: any) => {
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

    // Calculate pagination
    const totalPages = Math.ceil(chefsData.total / limit);
    const pagination: PaginationData = {
      page,
      limit,
      total: chefsData.total,
      total_pages: totalPages,
    };

    return ResponseFactory.success({
      chefs,
      pagination,
    }, 'Chefs retrieved successfully');

  } catch (error) {
    console.error('Error getting chefs by location:', error);
    return errorHandler.handleError(error);
  }
}

export const POST = withErrorHandling(withAPIMiddleware(handlePOST));
