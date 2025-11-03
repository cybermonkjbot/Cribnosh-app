import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

// Endpoint: /v1/chef/cuisines/
// Group: chef

/**
 * @swagger
 * /chef/cuisines:
 *   get:
 *     summary: Get All Cuisines
 *     description: Retrieve all available cuisine types
 *     tags: [Chef, Cuisines]
 *     responses:
 *       200:
 *         description: Cuisines retrieved successfully
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
 *                     cuisines:
 *                       type: array
 *                       description: Array of available cuisine types
 *                       items:
 *                         type: string
 *                       example: ["italian", "chinese", "indian", "mexican", "thai", "french", "japanese", "mediterranean"]
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  const convex = getConvexClient();
  const cuisines = await convex.query(api.queries.chefs.listAllCuisines, {});
  return ResponseFactory.success({ cuisines });
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 