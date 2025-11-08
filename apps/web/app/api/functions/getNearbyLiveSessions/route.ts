import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from "@/convex/_generated/api";
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

// Define the interface for location request
interface NearbySessionsRequest {
  latitude: number;
  longitude: number;
  maxDistanceKm?: number;
}

/**
 * @swagger
 * /functions/getNearbyLiveSessions:
 *   post:
 *     summary: Get Nearby Live Sessions
 *     description: Retrieve live sessions within a specified radius of the user's location
 *     tags: [Live Streaming]
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
 *                 description: User's latitude coordinate
 *                 example: 51.5074
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: User's longitude coordinate
 *                 example: -0.1276
 *               maxDistanceKm:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 500
 *                 default: 50
 *                 description: Maximum distance in kilometers to search for sessions
 *                 example: 25
 *     responses:
 *       200:
 *         description: Nearby live sessions retrieved successfully
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
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: "j1234567890abcdef"
 *                       channelName:
 *                         type: string
 *                         example: "live-1640995200000"
 *                       chefId:
 *                         type: string
 *                         example: "j1234567890abcdef"
 *                       title:
 *                         type: string
 *                         example: "Cooking Authentic Italian Pasta"
 *                       description:
 *                         type: string
 *                         example: "Join me as I prepare traditional Italian pasta"
 *                       distance:
 *                         type: number
 *                         description: Distance from user in kilometers
 *                         example: 2.5
 *                       location:
 *                         type: object
 *                         properties:
 *                           coordinates:
 *                             type: array
 *                             items:
 *                               type: number
 *                             example: [-0.1276, 51.5074]
 *                       isActive:
 *                         type: boolean
 *                         example: true
 *                       viewerCount:
 *                         type: number
 *                         example: 15
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                         example: ["italian", "pasta", "cooking"]
 *                 message:
 *                   type: string
 *                   example: "Success"
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
async function handlePOST(req: NextRequest) {
  try {
    const client = getConvexClient();
    const body: NearbySessionsRequest = await req.json();
    const { latitude, longitude, maxDistanceKm } = body;

    // Validate required fields
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      return ResponseFactory.validationError('Latitude and longitude must be numbers');
    }

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90) {
      return ResponseFactory.validationError('Latitude must be between -90 and 90');
    }
    
    if (longitude < -180 || longitude > 180) {
      return ResponseFactory.validationError('Longitude must be between -180 and 180');
    }

    // Validate maxDistanceKm if provided
    if (maxDistanceKm !== undefined && (maxDistanceKm < 1 || maxDistanceKm > 500)) {
      return ResponseFactory.validationError('Max distance must be between 1 and 500 kilometers');
    }

    const result = await client.query(api.queries.liveSessions.getNearbyLiveSessions, {
      latitude,
      longitude,
      maxDistanceKm: maxDistanceKm || 50, // Default 50km radius
    });

    return ResponseFactory.success({
      sessions: result,
      count: result.length,
      userLocation: { latitude, longitude },
      searchRadius: maxDistanceKm || 50,
    }, 'Nearby live sessions retrieved successfully');
  } catch (error) {
    logger.error('Error getting nearby live sessions:', error);
    return ResponseFactory.error('Internal Server Error', 'CUSTOM_ERROR', 500);
  }
}

export const POST = withErrorHandling(handlePOST);