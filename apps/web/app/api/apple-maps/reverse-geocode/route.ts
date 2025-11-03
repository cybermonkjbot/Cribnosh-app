import { withErrorHandling, ErrorFactory, errorHandler, ErrorCode } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';

/**
 * @swagger
 * /apple-maps/reverse-geocode:
 *   post:
 *     summary: Apple Maps Reverse Geocoding API
 *     description: Convert coordinates to addresses using Apple Maps API
 *     tags: [Apple Maps]
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
 *                 description: Latitude coordinate
 *                 example: 37.7749
 *               longitude:
 *                 type: number
 *                 minimum: -180
 *                 maximum: 180
 *                 description: Longitude coordinate
 *                 example: -122.4194
 *               language:
 *                 type: string
 *                 description: Language code for results
 *                 example: "en"
 *     responses:
 *       200:
 *         description: Reverse geocoding successful
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
 *                   example: "Reverse geocoding successful"
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

interface ReverseGeocodeRequest {
  latitude: number;
  longitude: number;
  language?: string;
}

interface AppleMapsReverseGeocodeResponse {
  results: Array<{
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
    const body: ReverseGeocodeRequest = await request.json();
    const { latitude, longitude, language = 'en' } = body;

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

    const APPLE_MAPS_API_KEY = process.env.APPLE_MAPS_API_KEY;
    if (!APPLE_MAPS_API_KEY) {
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Apple Maps API key not configured');
    }

    // Apple Maps Reverse Geocoding API endpoint
    const reverseGeocodeUrl = new URL('https://maps-api.apple.com/v1/reverseGeocode');
    reverseGeocodeUrl.searchParams.set('latitude', latitude.toString());
    reverseGeocodeUrl.searchParams.set('longitude', longitude.toString());
    reverseGeocodeUrl.searchParams.set('language', language);

    const response = await fetch(reverseGeocodeUrl.toString(), {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${APPLE_MAPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Apple Maps reverse geocoding error:', errorText);
      throw ErrorFactory.custom(ErrorCode.EXTERNAL_SERVICE_ERROR, `Apple Maps reverse geocoding failed: ${response.status}`);
    }

    const data: AppleMapsReverseGeocodeResponse = await response.json();

    if (!data.results || data.results.length === 0) {
      return ResponseFactory.success({
        formattedAddress: null,
        components: null,
      }, 'No results found for the given coordinates');
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
      formattedAddress: result.formattedAddress,
      components,
    }, 'Reverse geocoding successful');

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return errorHandler.handleError(error);
  }
}

export const POST = withErrorHandling(withAPIMiddleware(handlePOST));
