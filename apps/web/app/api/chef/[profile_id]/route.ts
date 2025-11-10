/**
 * @swagger
 * /api/chef/{profile_id}:
 *   get:
 *     summary: Get chef profile
 *     description: Retrieve the profile details of a specific chef
 *     tags: [Chef]
 *     parameters:
 *       - in: path
 *         name: profile_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chef profile
 *     responses:
 *       200:
 *         description: Chef profile retrieved successfully
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
 *                   description: Chef profile data
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - Missing or invalid profile_id
 *       404:
 *         description: Chef not found
 *       500:
 *         description: Internal server error
 *     security: []
 */

import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
import { NextResponse } from 'next/server';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

// Endpoint: /v1/chef/{profile_id}
// Group: chef

async function handleGET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const profile_id = pathParts[pathParts.length - 1];
  
  if (!profile_id) {
    return ResponseFactory.validationError('Missing profile_id');
  }
  let chefId: Id<'chefs'>;
  try {
    chefId = profile_id as Id<'chefs'>;
  } catch {
    return ResponseFactory.validationError('Invalid profile_id');
  }
  const convex = getConvexClient();
  const sessionToken = getSessionTokenFromRequest(request);
  const chef = await convex.query(api.queries.chefs.getChefById, {
    chefId,
    sessionToken: sessionToken || undefined
  });
  if (!chef) {
    return ResponseFactory.notFound('Chef not found');
  }
  return ResponseFactory.success(chef);
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
