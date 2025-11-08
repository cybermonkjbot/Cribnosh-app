import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

// Endpoint: /v1/chef/cuisines/available
// Group: chef

/**
 * @swagger
 * /chef/cuisines/available:
 *   get:
 *     summary: Get Available Cuisines
 *     description: Retrieve all approved cuisine types that are available for chefs to use
 *     tags: [Chef, Cuisines]
 *     responses:
 *       200:
 *         description: Available cuisines retrieved successfully
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
 *                       description: Array of approved cuisine types
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
  const cuisines = await convex.query(api.queries.chefs.listCuisinesByStatus, { status: 'approved' });
  return ResponseFactory.success({ cuisines });
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 