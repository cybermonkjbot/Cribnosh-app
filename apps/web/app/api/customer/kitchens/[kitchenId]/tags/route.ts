import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/customer/kitchens/{kitchenId}/tags:
 *   get:
 *     summary: Get kitchen tags
 *     description: Retrieve unique dietary tags from all meals in a kitchen
 *     tags: [Customer, Kitchens]
 *     security:
 *       - cookieAuth: []
 *     parameters:
 *       - in: path
 *         name: kitchenId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the kitchen
 *     responses:
 *       200:
 *         description: Kitchen tags retrieved successfully
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
 *                       tag:
 *                         type: string
 *                         example: "keto"
 *                       count:
 *                         type: number
 *                         example: 5
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Kitchen not found
 *       500:
 *         description: Internal server error
 */
async function handleGET(
  request: NextRequest,
  { params }: { params: { kitchenId: string } }
): Promise<NextResponse> {
  try {
    const { kitchenId } = params;

    if (!kitchenId) {
      return ResponseFactory.validationError('Kitchen ID is required');
    }

    const convex = getConvexClient();

    const tags = await convex.query(
      (api as any).queries.kitchens.getKitchenTags,
      { kitchenId }
    );

    return ResponseFactory.success(tags, 'Kitchen tags retrieved successfully');

  } catch (error: unknown) {
    logger.error('Get kitchen tags error:', error);
    return ResponseFactory.internalError(
      getErrorMessage(error, 'Failed to retrieve kitchen tags')
    );
  }
}

export const GET = withErrorHandling(withAPIMiddleware(handleGET));

