import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /admin/chef/cuisines/pending:
 *   get:
 *     summary: Get Pending Chef Cuisines (Admin)
 *     description: Retrieve all chef cuisine specializations that are pending approval. Only accessible by administrators for review purposes.
 *     tags: [Admin, Chef Management, Cuisines]
 *     responses:
 *       200:
 *         description: Pending chef cuisines retrieved successfully
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
 *                       description: Array of pending chef cuisines
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Chef cuisine ID
 *                             example: "j1234567890abcdef"
 *                           chefId:
 *                             type: string
 *                             description: Chef ID
 *                             example: "j0987654321fedcba"
 *                           cuisineId:
 *                             type: string
 *                             description: Cuisine type ID
 *                             example: "j1122334455fedcba"
 *                           status:
 *                             type: string
 *                             enum: [pending, approved, rejected]
 *                             description: Approval status
 *                             example: "pending"
 *                           chefName:
 *                             type: string
 *                             description: Chef's name
 *                             example: "Chef Mario"
 *                           cuisineName:
 *                             type: string
 *                             description: Cuisine type name
 *                             example: "Italian"
 *                           submittedAt:
 *                             type: string
 *                             format: date-time
 *                             description: When the cuisine was submitted for approval
 *                             example: "2024-01-15T10:30:00Z"
 *                           experience:
 *                             type: number
 *                             description: Years of experience in this cuisine
 *                             example: 5
 *                           specialties:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Specific specialties within the cuisine
 *                             example: ["pasta", "risotto", "pizza"]
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only admins can access this endpoint
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
 *       - cookieAuth: []
 */

async function handleGET(request: NextRequest): Promise<NextResponse> {
  const convex = getConvexClient();
  const sessionToken = getSessionTokenFromRequest(request);
  const pending = await convex.query(api.queries.chefs.getPendingCuisines, {
    sessionToken: sessionToken || undefined
  });
  return ResponseFactory.success({ cuisines: pending });
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 