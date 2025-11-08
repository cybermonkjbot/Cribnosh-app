import { withErrorHandling, ErrorFactory, errorHandler, ErrorCode } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /apple-maps/directions:
 *   post:
 *     summary: Apple Maps Directions API
 *     description: Get directions between two points using Apple Maps API
 *     tags: [Apple Maps]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - origin
 *               - destination
 *             properties:
 *               origin:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 37.7749
 *                   longitude:
 *                     type: number
 *                     example: -122.4194
 *               destination:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 37.7849
 *                   longitude:
 *                     type: number
 *                     example: -122.4094
 *               mode:
 *                 type: string
 *                 enum: [driving, walking, transit]
 *                 description: Transportation mode
 *                 example: "driving"
 *               language:
 *                 type: string
 *                 description: Language code for results
 *                 example: "en"
 *     responses:
 *       200:
 *         description: Directions retrieved successfully
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
 *                     routes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           distance:
 *                             type: object
 *                             properties:
 *                               value:
 *                                 type: number
 *                                 example: 1500
 *                               text:
 *                                 type: string
 *                                 example: "1.5 km"
 *                           duration:
 *                             type: object
 *                             properties:
 *                               value:
 *                                 type: number
 *                                 example: 300
 *                               text:
 *                                 type: string
 *                                 example: "5 mins"
 *                           steps:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 instruction:
 *                                   type: string
 *                                   example: "Head north on Main St"
 *                                 distance:
 *                                   type: object
 *                                   properties:
 *                                     value:
 *                                       type: number
 *                                       example: 200
 *                                     text:
 *                                       type: string
 *                                       example: "200 m"
 *                                 duration:
 *                                   type: object
 *                                   properties:
 *                                     value:
 *                                       type: number
 *                                       example: 60
 *                                     text:
 *                                       type: string
 *                                       example: "1 min"
 *                                 coordinates:
 *                                   type: array
 *                                   items:
 *                                     type: object
 *                                     properties:
 *                                       latitude:
 *                                         type: number
 *                                         example: 37.7750
 *                                       longitude:
 *                                         type: number
 *                                         example: -122.4190
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalDistance:
 *                           type: number
 *                           example: 1500
 *                         totalDuration:
 *                           type: number
 *                           example: 300
 *                         mode:
 *                           type: string
 *                           example: "driving"
 *                 message:
 *                   type: string
 *                   example: "Directions retrieved successfully"
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

interface DirectionsRequest {
  origin: {
    latitude: number;
    longitude: number;
  };
  destination: {
    latitude: number;
    longitude: number;
  };
  mode?: 'driving' | 'walking' | 'transit';
  language?: string;
}

interface AppleMapsDirectionsResponse {
  routes: Array<{
    distance: {
      value: number;
      text: string;
    };
    duration: {
      value: number;
      text: string;
    };
    legs: Array<{
      steps: Array<{
        instruction: string;
        distance: {
          value: number;
          text: string;
        };
        duration: {
          value: number;
          text: string;
        };
        polyline: {
          coordinates: Array<{
            latitude: number;
            longitude: number;
          }>;
        };
      }>;
    }>;
  }>;
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: DirectionsRequest = await request.json();
    const { origin, destination, mode = 'driving', language = 'en' } = body;

    // Validate coordinates
    if (!origin || !destination) {
      return ResponseFactory.validationError('Origin and destination are required');
    }

    if (typeof origin.latitude !== 'number' || typeof origin.longitude !== 'number') {
      return ResponseFactory.validationError('Origin coordinates must be numbers');
    }

    if (typeof destination.latitude !== 'number' || typeof destination.longitude !== 'number') {
      return ResponseFactory.validationError('Destination coordinates must be numbers');
    }

    // Validate coordinate ranges
    if (origin.latitude < -90 || origin.latitude > 90 || destination.latitude < -90 || destination.latitude > 90) {
      return ResponseFactory.validationError('Latitude must be between -90 and 90');
    }

    if (origin.longitude < -180 || origin.longitude > 180 || destination.longitude < -180 || destination.longitude > 180) {
      return ResponseFactory.validationError('Longitude must be between -180 and 180');
    }

    const APPLE_MAPS_API_KEY = process.env.APPLE_MAPS_API_KEY;
    if (!APPLE_MAPS_API_KEY) {
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Apple Maps API key not configured');
    }

    // Apple Maps Directions API endpoint
    const directionsUrl = new URL('https://maps-api.apple.com/v1/directions');
    directionsUrl.searchParams.set('origin', `${origin.latitude},${origin.longitude}`);
    directionsUrl.searchParams.set('destination', `${destination.latitude},${destination.longitude}`);
    directionsUrl.searchParams.set('mode', mode);
    directionsUrl.searchParams.set('language', language);

    const response = await fetch(directionsUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${APPLE_MAPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apple Maps directions error:', errorText);
      throw ErrorFactory.custom(ErrorCode.EXTERNAL_SERVICE_ERROR, `Apple Maps directions failed: ${response.status}`);
    }

    const data: AppleMapsDirectionsResponse = await response.json();

    if (!data.routes || data.routes.length === 0) {
      return ResponseFactory.success({
        routes: [],
        summary: {
          totalDistance: 0,
          totalDuration: 0,
          mode,
        },
      }, 'No routes found');
    }

    // Transform the response to match our API format
    const routes = data.routes.map(route => {
      const steps = route.legs.flatMap(leg => 
        leg.steps.map(step => ({
          instruction: step.instruction,
          distance: step.distance,
          duration: step.duration,
          coordinates: step.polyline.coordinates,
        }))
      );

      return {
        distance: route.distance,
        duration: route.duration,
        steps,
      };
    });

    const summary = {
      totalDistance: routes[0]?.distance.value || 0,
      totalDuration: routes[0]?.duration.value || 0,
      mode,
    };

    return ResponseFactory.success({
      routes,
      summary,
    }, 'Directions retrieved successfully');

  } catch (error) {
    console.error('Directions error:', error);
    return errorHandler.handleError(error);
  }
}

export const POST = withErrorHandling(withAPIMiddleware(handlePOST));
