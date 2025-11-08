import { NextRequest, NextResponse } from 'next/server';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/customer/kitchens/{kitchenId}:
 *   get:
 *     summary: Get kitchen details by ID
 *     description: Get kitchen details including chef name and kitchen name for a specific kitchen
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
 *         description: Kitchen details retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Kitchen not found
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

    const convex = getConvexClientFromRequest(request);
    
    // Get kitchen details (including chef name)
    const kitchenDetails = await convex.query(
      (api as any).queries.kitchens.getKitchenDetails,
      { kitchenId }
    );

    if (!kitchenDetails) {
      return ResponseFactory.notFound('Kitchen not found');
    }

    return ResponseFactory.success(kitchenDetails, 'Kitchen details retrieved successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Get kitchen details error:', error);
    return ResponseFactory.internalError(
      getErrorMessage(error, 'Failed to retrieve kitchen details')
    );
  }
}

// Wrapper function to extract params from URL
export const GET = withAPIMiddleware(withErrorHandling(handleGET));

