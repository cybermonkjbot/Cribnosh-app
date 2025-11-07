import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /api/customer/kitchens/{kitchenId}/favorite:
 *   get:
 *     summary: Check if kitchen is favorited
 *     description: Check if the current user has favorited a kitchen/chef
 *     tags: [Customer, Kitchens, Favorites]
 *     security:
 *       - Bearer: []
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

    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const convex = getConvexClient();
    const user = await convex.query((api as any).queries.users.getUserByToken, { token });

    if (!user) {
      return ResponseFactory.unauthorized('Invalid token');
    }

    // Check favorite status
    const favoriteStatus = await convex.query(
      (api as any).queries.userFavorites.isKitchenFavorited,
      { userId: user._id, kitchenId }
    );

    return ResponseFactory.success(favoriteStatus, 'Favorite status retrieved successfully');

  } catch (error: unknown) {
    console.error('Favorite status retrieval error:', error);
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
 *       - Bearer: []
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

    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const convex = getConvexClient();
    const user = await convex.query((api as any).queries.users.getUserByToken, { token });

    if (!user) {
      return ResponseFactory.unauthorized('Invalid token');
    }

    // Get chef ID from kitchen
    const chefId = await convex.query(
      (api as any).queries.kitchens.getChefByKitchenId,
      { kitchenId }
    );

    if (!chefId) {
      return ResponseFactory.notFound('Chef not found for this kitchen');
    }

    // Add to favorites
    await convex.mutation((api as any).mutations.userFavorites.addFavorite, {
      userId: user._id,
      chefId,
    });

    return ResponseFactory.success(null, 'Kitchen added to favorites successfully');

  } catch (error: unknown) {
    console.error('Add favorite error:', error);
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
 *       - Bearer: []
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

    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const convex = getConvexClient();
    const user = await convex.query((api as any).queries.users.getUserByToken, { token });

    if (!user) {
      return ResponseFactory.unauthorized('Invalid token');
    }

    // Get chef ID from kitchen
    const chefId = await convex.query(
      (api as any).queries.kitchens.getChefByKitchenId,
      { kitchenId }
    );

    if (!chefId) {
      return ResponseFactory.notFound('Chef not found for this kitchen');
    }

    // Remove from favorites
    await convex.mutation((api as any).mutations.userFavorites.removeFavorite, {
      userId: user._id,
      chefId,
    });

    return ResponseFactory.success(null, 'Kitchen removed from favorites successfully');

  } catch (error: unknown) {
    console.error('Remove favorite error:', error);
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

