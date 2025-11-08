import { withErrorHandling, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { calculateDistanceKm } from '@/lib/apple-maps/service';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /customer/chefs/{chef_id}:
 *   get:
 *     summary: Get Chef Details with Location
 *     description: Retrieve detailed information about a specific chef including location data
 *     tags: [Customer, Chefs]
 *     parameters:
 *       - in: path
 *         name: chef_id
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the chef
 *         example: "chef-001"
 *       - in: query
 *         name: latitude
 *         schema:
 *           type: number
 *         description: User's current latitude for distance calculation
 *         example: 37.7749
 *       - in: query
 *         name: longitude
 *         schema:
 *           type: number
 *         description: User's current longitude for distance calculation
 *         example: -122.4194
 *     responses:
 *       200:
 *         description: Chef details retrieved successfully
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
 *                     id:
 *                       type: string
 *                       example: "chef-001"
 *                     name:
 *                       type: string
 *                       example: "Chef Maria"
 *                     kitchen_name:
 *                       type: string
 *                       example: "Maria's Authentic Mexican"
 *                     cuisine:
 *                       type: string
 *                       example: "Mexican"
 *                     rating:
 *                       type: number
 *                       example: 4.8
 *                     review_count:
 *                       type: number
 *                       example: 127
 *                     delivery_time:
 *                       type: string
 *                       example: "25-35 mins"
 *                     distance:
 *                       type: string
 *                       example: "0.8km away"
 *                     image_url:
 *                       type: string
 *                       example: "https://example.com/chef-image.jpg"
 *                     is_live:
 *                       type: boolean
 *                       example: true
 *                     live_viewers:
 *                       type: number
 *                       example: 23
 *                     sentiment:
 *                       type: string
 *                       example: "fire"
 *                     location:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                           example: 37.7749
 *                         longitude:
 *                           type: number
 *                           example: -122.4194
 *                         address:
 *                           type: string
 *                           example: "123 Mission St, San Francisco, CA"
 *                     bio:
 *                       type: string
 *                       example: "Authentic Mexican cuisine with 20 years of experience..."
 *                     specialties:
 *                       type: array
 *                       items:
 *                         type: string
 *                       example: ["Tacos", "Burritos", "Quesadillas"]
 *                     delivery_radius:
 *                       type: number
 *                       example: 5
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *                 message:
 *                   type: string
 *                   example: "Chef details retrieved successfully"
 *       404:
 *         description: Chef not found
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

interface ChefDetailsData {
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
  bio: string;
  specialties: string[];
  delivery_radius: number;
  created_at: string;
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const chef_id = url.pathname.split('/').pop();
    const { searchParams } = url;
    
    // Get optional user location for distance calculation
    const userLatitude = searchParams.get('latitude');
    const userLongitude = searchParams.get('longitude');

    if (!chef_id) {
      return ResponseFactory.validationError('Chef ID is required');
    }

    const convex = getConvexClient();

    // Get chef details
    const chefData = await convex.query(api.queries.chefs.getChefById, { 
      chefId: chef_id as any
    });

    if (!chefData) {
      return ResponseFactory.notFound('Chef not found');
    }

    // Calculate distance if user location is provided
    let distanceText = 'Distance not available';
    if (userLatitude && userLongitude) {
      const userLocation = {
        latitude: parseFloat(userLatitude),
        longitude: parseFloat(userLongitude),
      };

      const chefLocation = {
        latitude: chefData.location?.coordinates?.[0] || 0,
        longitude: chefData.location?.coordinates?.[1] || 0,
      };

      const distanceKm = calculateDistanceKm(userLocation, chefLocation);
      distanceText = distanceKm < 1 
        ? `${(distanceKm * 1000).toFixed(0)}m away`
        : `${distanceKm.toFixed(1)}km away`;
    }

    // Transform chef data to match expected format
    const chefDetails: ChefDetailsData = {
      id: chefData._id,
      name: chefData.name || `Chef ${chefData._id.slice(-4)}`,
      kitchen_name: `${chefData.name}'s Kitchen`,
      cuisine: chefData.specialties?.[0] || 'International',
      rating: chefData.rating || 4.5,
      review_count: chefData.performance?.totalOrders || 0,
      delivery_time: '25-35 mins',
      distance: distanceText,
      image_url: chefData.profileImage || '/default-chef.jpg',
      is_live: false,
      live_viewers: 0,
      sentiment: 'good',
      location: {
        latitude: chefData.location?.coordinates?.[0] || 0,
        longitude: chefData.location?.coordinates?.[1] || 0,
        address: chefData.location?.city || 'Address not available',
      },
      bio: chefData.bio || 'No bio available',
      specialties: chefData.specialties || ['Signature Dishes'],
      delivery_radius: 5,
      created_at: chefData._creationTime ? new Date(chefData._creationTime).toISOString() : new Date().toISOString(),
    };

    return ResponseFactory.success(chefDetails, 'Chef details retrieved successfully');

  } catch (error) {
    console.error('Error getting chef details:', error);
    return errorHandler.handleError(error);
  }
}

export const GET = withErrorHandling(withAPIMiddleware(handleGET));
