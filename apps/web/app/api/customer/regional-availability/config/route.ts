import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /customer/regional-availability/config:
 *   get:
 *     summary: Get Regional Availability Configuration
 *     description: Get the current regional availability configuration for ordering
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
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
 *                     enabled:
 *                       type: boolean
 *                     supportedRegions:
 *                       type: array
 *                       items:
 *                         type: string
 *                     supportedCities:
 *                       type: array
 *                       items:
 *                         type: string
 *                     supportedCountries:
 *                       type: array
 *                       items:
 *                         type: string
 *       500:
 *         description: Internal server error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const convex = getConvexClient();
    
    const config = await convex.query(api.queries.admin.getRegionalAvailabilityConfig, {});
    
    return ResponseFactory.success({
      enabled: config.enabled,
      supportedRegions: config.supportedRegions,
      supportedCities: config.supportedCities,
      supportedCountries: config.supportedCountries,
    });
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to get regional availability configuration'));
  }
}

