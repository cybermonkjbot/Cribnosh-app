import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/driver/vehicles/years:
 *   get:
 *     summary: Get Vehicle Years
 *     description: Get available vehicle years (last 30 years)
 *     tags: [Driver]
 *     responses:
 *       200:
 *         description: Vehicle years retrieved successfully
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
 *                         example: "2024"
 *                       name:
 *                         type: string
 *                         example: "2024"
 *       500:
 *         description: Internal server error
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const convex = getConvexClientFromRequest(request);
    const vehicleYears = await convex.query(api.queries.vehicles.getVehicleYears, {});
    
    return ResponseFactory.success(vehicleYears);
  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch vehicle years.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

