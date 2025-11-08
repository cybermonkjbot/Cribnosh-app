import { withErrorHandling, ErrorFactory, errorHandler, ErrorCode } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /apple-maps/geocode:
 *   post:
 *     summary: Apple Maps Geocoding API
 *     description: Convert addresses to coordinates using Apple Maps API
 *     tags: [Apple Maps]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - address
 *             properties:
 *               address:
 *                 type: string
 *                 description: Address to geocode
 *                 example: "123 Main St, San Francisco, CA"
 *               countryCode:
 *                 type: string
 *                 description: ISO country code for better results
 *                 example: "US"
 *               language:
 *                 type: string
 *                 description: Language code for results
 *                 example: "en"
 *     responses:
 *       200:
 *         description: Geocoding successful
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
 *                     coordinates:
 *                       type: object
 *                       properties:
 *                         latitude:
 *                           type: number
 *                           example: 37.7749
 *                         longitude:
 *                           type: number
 *                           example: -122.4194
 *                     formattedAddress:
 *                       type: string
 *                       example: "123 Main St, San Francisco, CA 94102, USA"
 *                     components:
 *                       type: object
 *                       properties:
 *                         streetNumber:
 *                           type: string
 *                           example: "123"
 *                         streetName:
 *                           type: string
 *                           example: "Main St"
 *                         city:
 *                           type: string
 *                           example: "San Francisco"
 *                         state:
 *                           type: string
 *                           example: "CA"
 *                         postalCode:
 *                           type: string
 *                           example: "94102"
 *                         country:
 *                           type: string
 *                           example: "United States"
 *                 message:
 *                   type: string
 *                   example: "Geocoding successful"
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

interface GeocodeRequest {
  address: string;
  countryCode?: string;
  language?: string;
}

interface AppleMapsGeocodeResponse {
  results: Array<{
    coordinate: {
      latitude: number;
      longitude: number;
    };
    formattedAddress: string;
    addressComponents: Array<{
      longName: string;
      shortName: string;
      types: string[];
    }>;
  }>;
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: GeocodeRequest = await request.json();
    const { address, countryCode = 'US', language = 'en' } = body;

    if (!address || typeof address !== 'string') {
      return ResponseFactory.validationError('Address is required and must be a string');
    }

    const APPLE_MAPS_API_KEY = process.env.APPLE_MAPS_API_KEY;
    if (!APPLE_MAPS_API_KEY) {
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Apple Maps API key not configured');
    }

    // Apple Maps Geocoding API endpoint
    const geocodeUrl = new URL('https://maps-api.apple.com/v1/geocode');
    geocodeUrl.searchParams.set('q', address);
    geocodeUrl.searchParams.set('countryCode', countryCode);
    geocodeUrl.searchParams.set('language', language);

    const response = await fetch(geocodeUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${APPLE_MAPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apple Maps geocoding error:', errorText);
      throw ErrorFactory.custom(ErrorCode.EXTERNAL_SERVICE_ERROR, `Apple Maps geocoding failed: ${response.status}`);
    }

    const data: AppleMapsGeocodeResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      return ResponseFactory.success({
        coordinates: null,
        formattedAddress: null,
        components: null,
      }, 'No results found for the given address');
    }

    const result = data.results[0];
    
    // Parse address components
    const components: Record<string, string> = {};
    result.addressComponents.forEach(component => {
      if (component.types.includes('street_number')) {
        components.streetNumber = component.longName;
      } else if (component.types.includes('route')) {
        components.streetName = component.longName;
      } else if (component.types.includes('locality')) {
        components.city = component.longName;
      } else if (component.types.includes('administrative_area_level_1')) {
        components.state = component.shortName;
      } else if (component.types.includes('postal_code')) {
        components.postalCode = component.longName;
      } else if (component.types.includes('country')) {
        components.country = component.longName;
      }
    });

    return ResponseFactory.success({
      coordinates: {
        latitude: result.coordinate.latitude,
        longitude: result.coordinate.longitude,
      },
      formattedAddress: result.formattedAddress,
      components,
    }, 'Geocoding successful');

  } catch (error) {
    console.error('Geocoding error:', error);
    return errorHandler.handleError(error);
  }
}

export const POST = withErrorHandling(withAPIMiddleware(handlePOST));
