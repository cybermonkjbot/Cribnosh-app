import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/weather:
 *   get:
 *     summary: Get Weather Data by Location
 *     description: Get current weather conditions for a given latitude and longitude
 *     tags: [Weather]
 *     security: []
 *     parameters:
 *       - in: query
 *         name: latitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Latitude coordinate
 *         example: 51.5074
 *       - in: query
 *         name: longitude
 *         required: true
 *         schema:
 *           type: number
 *         description: Longitude coordinate
 *         example: -0.1278
 *     responses:
 *       200:
 *         description: Weather data retrieved successfully
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
 *                     condition:
 *                       type: string
 *                       example: "sunny"
 *                     temperature:
 *                       type: number
 *                       example: 22
 *                     description:
 *                       type: string
 *                       example: "Clear sky"
 *                     humidity:
 *                       type: number
 *                       example: 65
 *                     windSpeed:
 *                       type: number
 *                       example: 15
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing latitude or longitude
 *       500:
 *         description: Internal server error
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const latitude = parseFloat(searchParams.get('latitude') || '');
    const longitude = parseFloat(searchParams.get('longitude') || '');
    
    // Validate coordinates
    if (isNaN(latitude) || isNaN(longitude)) {
      return ResponseFactory.validationError('Latitude and longitude are required and must be valid numbers');
    }
    
    if (latitude < -90 || latitude > 90) {
      return ResponseFactory.validationError('Latitude must be between -90 and 90');
    }
    
    if (longitude < -180 || longitude > 180) {
      return ResponseFactory.validationError('Longitude must be between -180 and 180');
    }

    const convex = getConvexClientFromRequest(request);
    
    // Get weather data from Convex action
    // Use type assertion to avoid deep type instantiation
    const weatherAction = (api as any).actions.weather.getWeather;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const weatherResult: any = await (convex as any).action(weatherAction, {
      latitude,
      longitude,
    });
    
    // Type assertion for weather result
    const weather = {
      condition: weatherResult.condition || 'clear',
      temperature: weatherResult.temperature || 20,
      description: weatherResult.description,
      humidity: weatherResult.humidity,
      windSpeed: weatherResult.windSpeed,
    };

    return ResponseFactory.success(weather, 'Weather data retrieved successfully');

  } catch (error: unknown) {
    logger.error('Get weather error:', error);
    return ResponseFactory.internalError(
      getErrorMessage(error, 'Failed to retrieve weather data')
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

