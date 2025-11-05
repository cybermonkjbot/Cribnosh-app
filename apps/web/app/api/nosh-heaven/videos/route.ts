import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getApiFunction, getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /api/nosh-heaven/videos:
 *   post:
 *     summary: Create a new video post
 *     description: Creates a new video post in Nosh Heaven
 *     tags: [Nosh Heaven, Videos]
 *     security:
 *       - Bearer: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - videoUrl
 *               - duration
 *               - fileSize
 *               - resolution
 *               - tags
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the video
 *                 example: "How to Make Perfect Pasta"
 *               description:
 *                 type: string
 *                 description: Description of the video
 *                 example: "Learn the secret to making restaurant-quality pasta at home"
 *               videoUrl:
 *                 type: string
 *                 description: S3 URL of the uploaded video
 *                 example: "https://cdn.noshheaven.com/videos/user123/1234567890_my-cooking-video.mp4"
 *               thumbnailUrl:
 *                 type: string
 *                 description: S3 URL of the thumbnail image
 *                 example: "https://cdn.noshheaven.com/thumbnails/user123/video123_1234567890_thumbnail.jpg"
 *               duration:
 *                 type: number
 *                 description: Duration in seconds
 *                 example: 300
 *               fileSize:
 *                 type: number
 *                 description: File size in bytes
 *                 example: 52428800
 *               resolution:
 *                 type: object
 *                 properties:
 *                   width:
 *                     type: number
 *                     example: 1920
 *                   height:
 *                     type: number
 *                     example: 1080
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["pasta", "italian", "cooking", "tutorial"]
 *               cuisine:
 *                 type: string
 *                 description: Type of cuisine
 *                 example: "Italian"
 *               difficulty:
 *                 type: string
 *                 enum: [beginner, intermediate, advanced]
 *                 example: "intermediate"
 *               visibility:
 *                 type: string
 *                 enum: [public, followers, private]
 *                 default: "public"
 *                 example: "public"
 *               isLive:
 *                 type: boolean
 *                 description: Whether this is a live cooking session
 *                 example: false
 *               liveSessionId:
 *                 type: string
 *                 description: ID of associated live session
 *                 example: "j1234567890abcdef"
 *     responses:
 *       201:
 *         description: Video post created successfully
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
 *                     videoId:
 *                       type: string
 *                       description: ID of the created video post
 *                       example: "j1234567890abcdef"
 *                 message:
 *                   type: string
 *                   example: "Video post created successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate required fields
    const requiredFields = ['title', 'videoStorageId', 'duration', 'fileSize', 'resolution', 'tags'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return ResponseFactory.validationError(`${field} is required`);
      }
    }

    // Validate resolution object
    if (!body.resolution.width || !body.resolution.height) {
      return ResponseFactory.validationError('Resolution must have width and height');
    }

    // Get user from token
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const convex = getConvexClient();
    const getUserByToken = getApiFunction('queries/users', 'getUserByToken');
    const user = await convex.query(getUserByToken, { token });

    if (!user) {
      return ResponseFactory.unauthorized('Invalid token');
    }

    // Check if user is a chef or food creator
    const isChef = user.roles?.includes('chef') || user.roles?.includes('staff') || user.roles?.includes('admin');
    if (!isChef) {
      return ResponseFactory.forbidden('Only chefs and food creators can create video posts');
    }

    // Create video post with storage IDs
    const createVideoPost = getApiFunction('mutations/videoPosts', 'createVideoPost');
    const videoId = await convex.mutation(createVideoPost, {
      title: body.title,
      description: body.description,
      videoStorageId: body.videoStorageId,
      thumbnailStorageId: body.thumbnailStorageId,
      kitchenId: body.kitchenId,
      duration: body.duration,
      fileSize: body.fileSize,
      resolution: body.resolution,
      tags: body.tags,
      cuisine: body.cuisine,
      difficulty: body.difficulty,
      visibility: body.visibility || 'public',
      isLive: body.isLive || false,
      liveSessionId: body.liveSessionId,
    });

    return ResponseFactory.success({
      videoId,
    }, 'Video post created successfully', 201);

  } catch (error: unknown) {
    console.error('Video creation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to create video post';
    return ResponseFactory.internalError(message);
  }
}

/**
 * @swagger
 * /api/nosh-heaven/videos:
 *   get:
 *     summary: Get video feed
 *     description: Retrieves the video feed with pagination
 *     tags: [Nosh Heaven, Videos]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Number of videos to return
 *       - in: query
 *         name: cursor
 *         schema:
 *           type: string
 *         description: Cursor for pagination
 *     responses:
 *       200:
 *         description: Video feed retrieved successfully
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
 *                     videos:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/VideoPost'
 *                     nextCursor:
 *                       type: string
 *                       description: Cursor for next page
 *                 message:
 *                   type: string
 *                   example: "Video feed retrieved successfully"
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined;
    const cursor = searchParams.get('cursor') || undefined;

    const convex = getConvexClient();
    const getVideoFeed = getApiFunction('queries/videoPosts', 'getVideoFeed');
    const feed = await convex.query(getVideoFeed, {
      limit,
      cursor,
    });

    return ResponseFactory.success(feed, 'Video feed retrieved successfully');

  } catch (error: unknown) {
    console.error('Video feed retrieval error:', error);
    const message = error instanceof Error ? error.message : 'Failed to retrieve video feed';
    return ResponseFactory.internalError(message);
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const GET = withAPIMiddleware(withErrorHandling(handleGET));
