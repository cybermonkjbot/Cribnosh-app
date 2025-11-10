import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/driver/vehicles/types:
 *   get:
 *     summary: Get Vehicle Types
 *     description: Get all available vehicle types for driver registration
 *     tags: [Driver]
 *     responses:
 *       200:
 *         description: Vehicle types retrieved successfully
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
 *                         example: "car"
 *                       name:
 *                         type: string
 *                         example: "Car"
 *       500:
 *         description: Internal server error
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const convex = getConvexClientFromRequest(request);
    const vehicleTypes = await convex.query(api.queries.vehicles.getVehicleTypes, {});
    
    return ResponseFactory.success(vehicleTypes);
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch vehicle types.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

