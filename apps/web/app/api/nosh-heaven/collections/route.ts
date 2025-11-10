import { NextRequest, NextResponse } from 'next/server';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getUserFromRequest } from '@/lib/auth/session';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

/**
 * @swagger
 * /api/nosh-heaven/collections:
 *   post:
 *     summary: Create video collection
 *     description: Creates a new video collection/playlist
 *     tags: [Nosh Heaven, Collections]
 *     security:
 *       - cookieAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - videoIds
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the collection
 *                 example: "My Favorite Recipes"
 *               description:
 *                 type: string
 *                 description: Description of the collection
 *                 example: "A collection of my favorite cooking videos"
 *               isPublic:
 *                 type: boolean
 *                 description: Whether the collection is public
 *                 default: true
 *                 example: true
 *               videoIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Array of video IDs to include
 *                 example: ["j1234567890abcdef", "j0987654321fedcba"]
 *               coverImageUrl:
 *                 type: string
 *                 description: URL of the cover image
 *                 example: "https://cdn.noshheaven.com/collections/cover.jpg"
 *     responses:
 *       201:
 *         description: Collection created successfully
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
 *                     collectionId:
 *                       type: string
 *                       description: ID of the created collection
 *                       example: "j1234567890abcdef"
 *                 message:
 *                   type: string
 *                   example: "Collection created successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    if (!body.name || !body.videoIds || !Array.isArray(body.videoIds)) {
      return ResponseFactory.validationError('name and videoIds array are required');
    }

    // Get user from session token
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const user = await getUserFromRequest(request);
    if (!user) {
      return ResponseFactory.unauthorized('Missing or invalid session token');
    }

    // Create collection
    const collectionId = await convex.mutation((api as any).mutations.videoCollections.createCollection, {
      name: body.name,
      description: body.description,
      isPublic: body.isPublic !== false, // Default to true
      videoIds: body.videoIds,
      coverImageUrl: body.coverImageUrl,
      sessionToken: sessionToken || undefined
    });

    return ResponseFactory.success({
      collectionId,
    }, 'Collection created successfully', 201);

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Collection creation error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to create collection'));
  }
}

/**
 * @swagger
 * /api/nosh-heaven/collections:
 *   get:
 *     summary: Get collections
 *     description: Retrieves video collections with pagination
 *     tags: [Nosh Heaven, Collections]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of collections to return
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination
 *       - in: query
 *         name: publicOnly
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to return only public collections
 *     responses:
 *       200:
 *         description: Collections retrieved successfully
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
 *                     collections:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VideoCollection'
 *                     nextCursor:
 *                       type: string
 *                       description: Cursor for next page
 *                 message:
 *                   type: string
 *                   example: "Collections retrieved successfully"
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const cursor = searchParams.get('cursor') || undefined;
    const publicOnly = searchParams.get('publicOnly') !== 'false';

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const collections = await convex.query((api as any).queries.videoCollections.getCollections, {
      limit,
      cursor,
      publicOnly,
      sessionToken: sessionToken || undefined
    });

    return ResponseFactory.success(collections, 'Collections retrieved successfully');

  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Collections retrieval error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to retrieve collections'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const GET = withAPIMiddleware(withErrorHandling(handleGET));
