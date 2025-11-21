import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

interface SendLiveCommentRequest {
  sessionId: string;
  content: string;
  commentType: 'general' | 'question' | 'reaction' | 'tip' | 'moderation';
  metadata?: Record<string, string>;
}

/**
 * @swagger
 * /live-streaming/comments:
 *   get:
 *     summary: Get Live Comments
 *     description: Retrieve live comments for a specific streaming session with filtering and pagination
 *     tags: [Live Streaming, Comments]
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the live session
 *         example: "j1234567890abcdef"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of comments to return
 *         example: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of comments to skip
 *         example: 0
 *       - in: query
 *         name: commentType
 *         schema:
 *           type: string
 *           enum: [general, question, reaction, tip, moderation]
 *         description: Filter comments by type
 *         example: "question"
 *     responses:
 *       200:
 *         description: Live comments retrieved successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     sessionId:
 *                       type: string
 *                       example: "j1234567890abcdef"
 *                     comments:
 *                       type: array
 *                       description: Array of live comments
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Comment ID
 *                             example: "j1234567890abcdef"
 *                           content:
 *                             type: string
 *                             description: Comment content
 *                             example: "This looks amazing! Can you share the recipe?"
 *                           commentType:
 *                             type: string
 *                             enum: [general, question, reaction, tip, moderation]
 *                             description: Type of comment
 *                             example: "question"
 *                           sentBy:
 *                             type: string
 *                             description: User ID who sent the comment
 *                             example: "j1234567890abcdef"
 *                           sentByRole:
 *                             type: string
 *                             description: Role of the user who sent the comment
 *                             example: "customer"
 *                           userDisplayName:
 *                             type: string
 *                             description: Display name of the user
 *                             example: "John Doe"
 *                           sentAt:
 *                             type: string
 *                             format: date-time
 *                             description: Comment timestamp
 *                             example: "2024-01-15T10:30:00Z"
 *                           metadata:
 *                             type: object
 *                             description: Additional comment metadata
 *                             example: {"reaction": "heart", "tipAmount": 5.00}
 *                     totalComments:
 *                       type: number
 *                       description: Total number of comments returned
 *                       example: 25
 *                     limit:
 *                       type: number
 *                       description: Number of comments per page
 *                       example: 50
 *                     offset:
 *                       type: number
 *                       description: Number of comments skipped
 *                       example: 0
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing sessionId parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Live session not found
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
 *   post:
 *     summary: Send Live Comment
 *     description: Send a comment to a live streaming session
 *     tags: [Live Streaming]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - content
 *               - commentType
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: ID of the live session
 *                 example: "j1234567890abcdef"
 *               content:
 *                 type: string
 *                 description: Comment content
 *                 example: "This looks amazing! Can you share the recipe?"
 *               commentType:
 *                 type: string
 *                 enum: [general, question, reaction, tip, moderation]
 *                 description: Type of comment
 *                 example: "question"
 *               metadata:
 *                 type: object
 *                 nullable: true
 *                 description: Additional comment metadata
 *                 example: {"reaction": "heart", "tipAmount": 5.00}
 *     responses:
 *       200:
 *         description: Comment sent successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     sessionId:
 *                       type: string
 *                       example: "j1234567890abcdef"
 *                     comment:
 *                       type: object
 *                       nullable: true
 *                       description: Created comment details
 *                       properties:
 *                         id:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         content:
 *                           type: string
 *                           example: "This looks amazing! Can you share the recipe?"
 *                         commentType:
 *                           type: string
 *                           example: "question"
 *                         sentBy:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         sentByRole:
 *                           type: string
 *                           example: "customer"
 *                         sentAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:30:00.000Z"
 *                         metadata:
 *                           type: object
 *                           example: {"reaction": "heart", "tipAmount": 5.00}
 *                     message:
 *                       type: string
 *                       example: "Live comment sent successfully."
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing required fields or session not active
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user is muted in this session
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Live session not found
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
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);const body: SendLiveCommentRequest = await request.json();
    const { sessionId, content, commentType, metadata } = body;

    if (!sessionId || !content || !commentType) {
      return ResponseFactory.validationError('Missing required fields: sessionId, content, and commentType.');
    }

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get live session details first to verify it exists and is active
    const session = await convex.query(api.queries.liveSessions.getLiveSessionById, {
      sessionId,
      sessionToken: sessionToken || undefined
    });
    if (!session) {
      return ResponseFactory.notFound('Live session not found.');
    }

    // Check if session is active
    if (session.status !== 'live' && session.status !== 'starting') {
      return ResponseFactory.validationError('Live session is not active. Cannot send comments.');
    }

    // Check if user is muted in this session
    if (session.mutedUsers && session.mutedUsers.includes(userId)) {
      return ResponseFactory.forbidden('You are muted in this live session.');
    }

    // Send live comment
    const commentResult = await convex.mutation(api.mutations.liveSessions.sendLiveComment, {
      sessionId: session._id,
      sentBy: userId,
      content,
      commentType,
      metadata: {
        sentByRole: user.roles?.[0],
        userDisplayName: user.name || user.email || 'User',
        ...metadata
      },
      sessionToken: sessionToken || undefined
    });

    logger.log(`Live comment sent for session ${sessionId} by ${userId} (${user.roles?.[0]})`);

    return ResponseFactory.success({
      success: true,
      sessionId,
      comment: commentResult ? {
        id: commentResult._id,
        content,
        commentType,
        sentBy: userId,
        sentByRole: user.roles?.[0],
        sentAt: new Date().toISOString(),
        metadata: metadata || {}
      } : null,
      message: 'Live comment sent successfully.'
    });

  } catch (error: any) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Send live comment error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to send live comment.' 
    );
  }
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const commentType = searchParams.get('commentType');

    if (!sessionId) {
      return ResponseFactory.validationError('Missing required parameter: sessionId.');
    }

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get live session details first to verify it exists
    const session = await convex.query(api.queries.liveSessions.getLiveSessionById, {
      sessionId,
      sessionToken: sessionToken || undefined
    });
    if (!session) {
      return ResponseFactory.notFound('Live session not found.');
    }

    // Get live comments for the session
    const comments = await convex.query(api.queries.liveSessions.getLiveComments, { 
      sessionId: session._id,
      limit,
      offset,
      commentType: (commentType === 'general' || commentType === 'question' || commentType === 'reaction' || commentType === 'tip' || commentType === 'moderation') ? commentType : undefined,
    });

    // Format comments
    const formattedComments = comments.map((comment: any) => ({
      id: comment._id,
      content: comment.content,
      commentType: comment.commentType,
      sentBy: comment.sent_by,
      sentByRole: comment.sent_by_role,
      userDisplayName: comment.user_display_name,
      sentAt: new Date(comment.sent_at).toISOString(),
      metadata: comment.metadata || {}
    }));

    return ResponseFactory.success({
      success: true,
      sessionId,
      comments: formattedComments,
      totalComments: formattedComments.length,
      limit,
      offset
    });

  } catch (error: any) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Get live comments error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to get live comments.' 
    );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 