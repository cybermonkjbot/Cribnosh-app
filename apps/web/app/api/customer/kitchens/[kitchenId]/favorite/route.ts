import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/customer/kitchens/{kitchenId}/favorite:
 *   get:
 *     summary: Check if kitchen is favorited
 *     description: Check if the current user has favorited a kitchen/chef
 *     tags: [Customer, Kitchens, Favorites]
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
 *         description: Favorite status retrieved successfully
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
 *                     isFavorited:
 *                       type: boolean
 *                       example: true
 *                     favoriteId:
 *                       type: string
 *                       nullable: true
 *                     chefId:
 *                       type: string
 *                       nullable: true
 *                 message:
 *                   type: string
 *                   example: "Favorite status retrieved successfully"
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

    // Get authenticated customer from session token
    const { userId } = await getAuthenticatedCustomer(request);
    
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Check favorite status
    const favoriteStatus = await convex.query(
      (api as any).queries.userFavorites.isKitchenFavorited,
      {
      userId,
      kitchenId,
      sessionToken: sessionToken || undefined
    }
    );

    return ResponseFactory.success(favoriteStatus, 'Favorite status retrieved successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Favorite status retrieval error:', error);
    return ResponseFactory.internalError(
      getErrorMessage(error, 'Failed to retrieve favorite status')
    );
  }
}

/**
 * @swagger
 * /api/customer/kitchens/{kitchenId}/favorite:
 *   post:
 *     summary: Add kitchen to favorites
 *     description: Add a kitchen/chef to the user's favorites
 *     tags: [Customer, Kitchens, Favorites]
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
 *         description: Kitchen added to favorites successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Kitchen not found
 */
async function handlePOST(
  request: NextRequest,
  { params }: { params: { kitchenId: string } }
): Promise<NextResponse> {
  try {
    const { kitchenId } = params;

    if (!kitchenId) {
      return ResponseFactory.validationError('Kitchen ID is required');
    }

    // Get authenticated customer from session token
    const { userId } = await getAuthenticatedCustomer(request);
    
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Get chef ID from kitchen
    const chefId = await convex.query(
      (api as any).queries.kitchens.getChefByKitchenId,
      {
      kitchenId,
      sessionToken: sessionToken || undefined
    }
    );

    if (!chefId) {
      return ResponseFactory.notFound('Chef not found for this kitchen');
    }

    // Add to favorites
    await convex.mutation((api as any).mutations.userFavorites.addFavorite, {
      userId,
      chefId,
      sessionToken: sessionToken || undefined
    });

    return ResponseFactory.success(null, 'Kitchen added to favorites successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Add favorite error:', error);
    return ResponseFactory.internalError(
      getErrorMessage(error, 'Failed to add kitchen to favorites')
    );
  }
}

/**
 * @swagger
 * /api/customer/kitchens/{kitchenId}/favorite:
 *   delete:
 *     summary: Remove kitchen from favorites
 *     description: Remove a kitchen/chef from the user's favorites
 *     tags: [Customer, Kitchens, Favorites]
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
 *         description: Kitchen removed from favorites successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Kitchen not found
 */
async function handleDELETE(
  request: NextRequest,
  { params }: { params: { kitchenId: string } }
): Promise<NextResponse> {
  try {
    const { kitchenId } = params;

    if (!kitchenId) {
      return ResponseFactory.validationError('Kitchen ID is required');
    }

    // Get authenticated customer from session token
    const { userId } = await getAuthenticatedCustomer(request);
    
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Get chef ID from kitchen
    const chefId = await convex.query(
      (api as any).queries.kitchens.getChefByKitchenId,
      {
      kitchenId,
      sessionToken: sessionToken || undefined
    }
    );

    if (!chefId) {
      return ResponseFactory.notFound('Chef not found for this kitchen');
    }

    // Remove from favorites
    await convex.mutation((api as any).mutations.userFavorites.removeFavorite, {
      userId,
      chefId,
      sessionToken: sessionToken || undefined
    });

    return ResponseFactory.success(null, 'Kitchen removed from favorites successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Remove favorite error:', error);
    return ResponseFactory.internalError(
      getErrorMessage(error, 'Failed to remove kitchen from favorites')
    );
  }
}

// Wrapper functions to extract params from URL
export const GET = withAPIMiddleware(
  withErrorHandling(async (request: NextRequest) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const kitchenIdIndex = pathParts.indexOf('kitchens') + 1;
    const kitchenId = pathParts[kitchenIdIndex];
    return handleGET(request, { params: { kitchenId } });
  })
);

export const POST = withAPIMiddleware(
  withErrorHandling(async (request: NextRequest) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const kitchenIdIndex = pathParts.indexOf('kitchens') + 1;
    const kitchenId = pathParts[kitchenIdIndex];
    return handlePOST(request, { params: { kitchenId } });
  })
);

export const DELETE = withAPIMiddleware(
  withErrorHandling(async (request: NextRequest) => {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const kitchenIdIndex = pathParts.indexOf('kitchens') + 1;
    const kitchenId = pathParts[kitchenIdIndex];
    return handleDELETE(request, { params: { kitchenId } });
  })
);

