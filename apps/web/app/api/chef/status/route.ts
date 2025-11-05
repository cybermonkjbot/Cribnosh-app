import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getUserFromRequest } from '@/lib/auth/session';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { NextResponse } from 'next/server';

// Endpoint: /v1/chef/status
// Group: chef

/**
 * @swagger
 * /chef/status:
 *   get:
 *     summary: Get Chef Status
 *     description: Check the status of the authenticated chef's profile
 *     tags: [Chef, Status]
 *     responses:
 *       200:
 *         description: Chef status retrieved successfully
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
 *                   description: Empty object indicating chef profile exists
 *                   example: {}
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chef profile not found
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
 *     security:
 *       - bearerAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  const user = await getUserFromRequest(request);
  if (!user || !user._id) {
    return ResponseFactory.unauthorized('Unauthorized');
  }
  const convex = getConvexClient();
  // Find the chef record for the current user
  const chefs = await convex.query(api.queries.chefs.getAllChefLocations, {});
  const chef = chefs.find((c: any) => c.userId === user._id);
  if (!chef) {
    return ResponseFactory.notFound('Chef profile not found');
  }
  return ResponseFactory.success({});
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 