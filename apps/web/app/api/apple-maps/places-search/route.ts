import { withErrorHandling, ErrorFactory, errorHandler, ErrorCode } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /apple-maps/places-search:
 *   post:
 *     summary: Apple Maps Places Search API
 *     description: Search for places using Apple Maps API
 *     tags: [Apple Maps]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - query
 *             properties:
 *               query:
 *                 type: string
 *                 description: Search query for places
 *                 example: "restaurants near me"
 *               location:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     example: 37.7749
 *                   longitude:
 *                     type: number
 *                     example: -122.4194
 *               radius:
 *                 type: number
 *                 description: Search radius in meters
 *                 example: 5000
 *               language:
 *                 type: string
 *                 description: Language code for results
 *                 example: "en"
 *               categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Place categories to filter by
 *                 example: ["restaurant", "food"]
 *     responses:
 *       200:
 *         description: Places search successful
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
 *                     places:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "place_123"
 *                           name:
 *                             type: string
 *                             example: "Joe's Restaurant"
 *                           address:
 *                             type: string
 *                             example: "123 Main St, San Francisco, CA"
 *                           coordinates:
 *                             type: object
 *                             properties:
 *                               latitude:
 *                                 type: number
 *                                 example: 37.7749
 *                               longitude:
 *                                 type: number
 *                                 example: -122.4194
 *                           phoneNumber:
 *                             type: string
 *                             example: "+1-555-123-4567"
 *                           website:
 *                             type: string
 *                             example: "https://joesrestaurant.com"
 *                           categories:
 *                             type: array
 *                             items:
 *                               type: string
 *                             example: ["restaurant", "italian"]
 *                           rating:
 *                             type: number
 *                             example: 4.5
 *                           priceLevel:
 *                             type: number
 *                             example: 2
 *                           distance:
 *                             type: number
 *                             description: Distance in meters
 *                             example: 250
 *                     totalResults:
 *                       type: number
 *                       example: 15
 *                 message:
 *                   type: string
 *                   example: "Places search successful"
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

interface PlacesSearchRequest {
  query: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  radius?: number;
  language?: string;
  categories?: string[];
}

interface AppleMapsPlacesResponse {
  results: Array<{
    placeId: string;
    name: string;
    formattedAddress: string;
    coordinate: {
      latitude: number;
      longitude: number;
    };
    phoneNumber?: string;
    website?: string;
    categories: string[];
    rating?: number;
    priceLevel?: number;
  }>;
  totalResults: number;
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: PlacesSearchRequest = await request.json();
    const { query, location, radius = 5000, language = 'en', categories } = body;

    if (!query || typeof query !== 'string') {
      return ResponseFactory.validationError('Query is required and must be a string');
    }

    const APPLE_MAPS_API_KEY = process.env.APPLE_MAPS_API_KEY;
    if (!APPLE_MAPS_API_KEY) {
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Apple Maps API key not configured');
    }

    // Apple Maps Places Search API endpoint
    const placesUrl = new URL('https://maps-api.apple.com/v1/search');
    placesUrl.searchParams.set('q', query);
    placesUrl.searchParams.set('language', language);
    placesUrl.searchParams.set('radius', radius.toString());

    if (location) {
      placesUrl.searchParams.set('latitude', location.latitude.toString());
      placesUrl.searchParams.set('longitude', location.longitude.toString());
    }

    if (categories && categories.length > 0) {
      placesUrl.searchParams.set('categories', categories.join(','));
    }

    const response = await fetch(placesUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${APPLE_MAPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apple Maps places search error:', errorText);
      throw ErrorFactory.custom(ErrorCode.EXTERNAL_SERVICE_ERROR, `Apple Maps places search failed: ${response.status}`);
    }

    const data: AppleMapsPlacesResponse = await response.json();

    // Transform results to include distance calculation if location is provided
    const places = data.results.map(place => {
      let distance: number | undefined;
      
      if (location) {
        // Calculate distance using Haversine formula
        const R = 6371000; // Earth's radius in meters
        const dLat = toRadians(place.coordinate.latitude - location.latitude);
        const dLon = toRadians(place.coordinate.longitude - location.longitude);
        const lat1 = toRadians(location.latitude);
        const lat2 = toRadians(place.coordinate.latitude);

        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
          Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        distance = R * c;
      }

      return {
        id: place.placeId,
        name: place.name,
        address: place.formattedAddress,
        coordinates: {
          latitude: place.coordinate.latitude,
          longitude: place.coordinate.longitude,
        },
        phoneNumber: place.phoneNumber,
        website: place.website,
        categories: place.categories,
        rating: place.rating,
        priceLevel: place.priceLevel,
        distance,
      };
    });

    return ResponseFactory.success({
      places,
      totalResults: data.totalResults,
    }, 'Places search successful');

  } catch (error) {
    console.error('Places search error:', error);
    return errorHandler.handleError(error);
  }
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export const POST = withErrorHandling(withAPIMiddleware(handlePOST));
