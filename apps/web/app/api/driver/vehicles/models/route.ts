import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/driver/vehicles/models:
 *   get:
 *     summary: Get Vehicle Models
 *     description: Get vehicle models for a specific vehicle type
 *     tags: [Driver]
 *     parameters:
 *       - in: query
 *         name: vehicleType
 *         required: true
 *         schema:
 *           type: string
 *         description: Vehicle type (car, motorcycle, bicycle, scooter, van, truck)
 *         example: "car"
 *     responses:
 *       200:
 *         description: Vehicle models retrieved successfully
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
 *                       id:
 *                         type: string
 *                         example: "toyota-corolla"
 *                       name:
 *                         type: string
 *                         example: "Toyota Corolla"
 *       400:
 *         description: Bad request - vehicleType is required
 *       500:
 *         description: Internal server error
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const vehicleType = searchParams.get('vehicleType');
    
    if (!vehicleType) {
      return ResponseFactory.validationError('vehicleType is required');
    }
    
    const convex = getConvexClientFromRequest(request);
    const vehicleModels = await convex.query(api.queries.vehicles.getVehicleModels, {
      vehicleType,
    });
    
    return ResponseFactory.success(vehicleModels);
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch vehicle models.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

