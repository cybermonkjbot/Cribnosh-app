import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /live-streaming/reactions:
 *   post:
 *     summary: Send Live Stream Reaction
 *     description: Send a reaction to an active live streaming session. This endpoint allows viewers to express their emotions and engagement during live cooking sessions through various reaction types with different intensity levels.
 *     tags: [Live Streaming, Reactions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - sessionId
 *               - reactionType
 *             properties:
 *               sessionId:
 *                 type: string
 *                 description: Live session ID
 *                 example: "j1234567890abcdef"
 *               reactionType:
 *                 type: string
 *                 enum: [like, love, laugh, wow, sad, angry, fire, clap, heart, star]
 *                 description: Type of reaction to send
 *                 example: "fire"
 *               intensity:
 *                 type: string
 *                 enum: [light, medium, strong]
 *                 default: "medium"
 *                 description: Intensity level of the reaction
 *                 example: "strong"
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *                 description: Additional reaction metadata
 *                 example:
 *                   timestamp: "2024-01-15T14:30:00Z"
 *                   deviceType: "mobile"
 *     responses:
 *       200:
 *         description: Live reaction sent successfully
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
 *                       description: Live session ID
 *                       example: "j1234567890abcdef"
 *                     reaction:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         id:
 *                           type: string
 *                           description: Reaction ID
 *                           example: "reaction_1234567890abcdef"
 *                         reactionType:
 *                           type: string
 *                           example: "fire"
 *                         intensity:
 *                           type: string
 *                           example: "strong"
 *                         sentBy:
 *                           type: string
 *                           description: User ID who sent the reaction
 *                           example: "j1234567890abcdef"
 *                         sentByRole:
 *                           type: string
 *                           description: Role of the user who sent the reaction
 *                           example: "customer"
 *                         sentAt:
 *                           type: string
 *                           format: date-time
 *                           description: Timestamp when reaction was sent
 *                           example: "2024-01-15T14:30:00Z"
 *                         metadata:
 *                           type: object
 *                           additionalProperties: true
 *                           example: {}
 *                     message:
 *                       type: string
 *                       example: "Live reaction sent successfully."
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing required fields or invalid reaction type
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
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
 *       422:
 *         description: Unprocessable entity - session is not active
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
 *   get:
 *     summary: Get Live Stream Reactions
 *     description: Retrieve reactions from a live streaming session. This endpoint allows fetching reaction history with optional filtering by reaction type, pagination, and real-time updates for live session engagement tracking.
 *     tags: [Live Streaming, Reactions]
 *     parameters:
 *       - in: query
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Live session ID
 *         example: "j1234567890abcdef"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of reactions to return
 *         example: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of reactions to skip for pagination
 *         example: 0
 *       - in: query
 *         name: reactionType
 *         schema:
 *           type: string
 *           enum: [like, love, laugh, wow, sad, angry, fire, clap, heart, star]
 *         description: Filter reactions by type
 *         example: "fire"
 *       - in: query
 *         name: since
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Get reactions since this timestamp
 *         example: "2024-01-15T14:00:00Z"
 *     responses:
 *       200:
 *         description: Live reactions retrieved successfully
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
 *                       description: Live session ID
 *                       example: "j1234567890abcdef"
 *                     reactions:
 *                       type: array
 *                       description: Array of reactions
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             description: Reaction ID
 *                             example: "reaction_1234567890abcdef"
 *                           reactionType:
 *                             type: string
 *                             enum: [like, love, laugh, wow, sad, angry, fire, clap, heart, star]
 *                             example: "fire"
 *                           intensity:
 *                             type: string
 *                             enum: [light, medium, strong]
 *                             example: "strong"
 *                           sentBy:
 *                             type: string
 *                             description: User ID who sent the reaction
 *                             example: "j1234567890abcdef"
 *                           sentByRole:
 *                             type: string
 *                             description: Role of the user who sent the reaction
 *                             example: "customer"
 *                           userDisplayName:
 *                             type: string
 *                             nullable: true
 *                             description: Display name of the user
 *                             example: "John Doe"
 *                           sentAt:
 *                             type: string
 *                             format: date-time
 *                             description: Timestamp when reaction was sent
 *                             example: "2024-01-15T14:30:00Z"
 *                           metadata:
 *                             type: object
 *                             additionalProperties: true
 *                             example: {}
 *                     totalReactions:
 *                       type: integer
 *                       description: Total number of reactions returned
 *                       example: 50
 *                     limit:
 *                       type: integer
 *                       description: Maximum reactions per page
 *                       example: 100
 *                     offset:
 *                       type: integer
 *                       description: Number of reactions skipped
 *                       example: 0
 *                     hasMore:
 *                       type: boolean
 *                       description: Whether there are more reactions available
 *                       example: true
 *                     reactionSummary:
 *                       type: object
 *                       nullable: true
 *                       description: Summary of reaction counts by type
 *                       properties:
 *                         like:
 *                           type: integer
 *                           example: 25
 *                         love:
 *                           type: integer
 *                           example: 15
 *                         fire:
 *                           type: integer
 *                           example: 10
 *                         clap:
 *                           type: integer
 *                           example: 8
 *                         heart:
 *                           type: integer
 *                           example: 12
 *                         star:
 *                           type: integer
 *                           example: 5
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing sessionId parameter
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication token
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

interface SendLiveReactionRequest {
  sessionId: string;
  reactionType: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry' | 'fire' | 'clap' | 'heart' | 'star';
  intensity?: 'light' | 'medium' | 'strong';
  metadata?: Record<string, string>;
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);const body: SendLiveReactionRequest = await request.json();
    const { sessionId, reactionType, intensity, metadata } = body;

    if (!sessionId || !reactionType) {
      return ResponseFactory.validationError('Missing required fields: sessionId and reactionType.');
    }

    const convex = getConvexClient();

    // Get live session details first to verify it exists and is active
    const session = await convex.query(api.queries.liveSessions.getLiveSessionById, { sessionId });
    if (!session) {
      return ResponseFactory.notFound('Live session not found.');
    }

    // Check if session is active
    if (session.status !== 'live' && session.status !== 'starting') {
      return ResponseFactory.validationError('Live session is not active. Cannot send reactions.');
    }

    // Check if user is muted in this session
    if (session.mutedUsers && session.mutedUsers.includes(userId)) {
      return ResponseFactory.forbidden('You are muted in this live session.');
    }

    // Send live reaction
    const reactionResult = await convex.mutation(api.mutations.liveSessions.sendLiveReaction, {
      sessionId: session._id,
      sentBy: userId,
      reactionType,
      intensity: intensity || 'medium',
      metadata: {
        sentByRole: user.roles?.[0],
        userDisplayName: payload.displayName || payload.username,
        ...metadata
      }
    });

    console.log(`Live reaction sent for session ${sessionId} by ${userId} (${user.roles?.[0]})`);

    return ResponseFactory.success({
      success: true,
      sessionId,
      reaction: reactionResult ? {
        id: reactionResult._id,
        reactionType,
        intensity: intensity || 'medium',
        sentBy: userId,
        sentByRole: user.roles?.[0],
        sentAt: new Date().toISOString(),
        metadata: metadata || {}
      } : null,
      message: 'Live reaction sent successfully.'
    });

  } catch (error: any) {
    console.error('Send live reaction error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to send live reaction.' 
    );
  }
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify authentication
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');
    const limit = parseInt(searchParams.get('limit') || '100');
    const offset = parseInt(searchParams.get('offset') || '0');
    const reactionType = searchParams.get('reactionType');

    if (!sessionId) {
      return ResponseFactory.validationError('Missing required parameter: sessionId.');
    }

    const convex = getConvexClient();

    // Get live session details first to verify it exists
    const session = await convex.query(api.queries.liveSessions.getLiveSessionById, { sessionId });
    if (!session) {
      return ResponseFactory.notFound('Live session not found.');
    }

    // Get live reactions for the session
    const reactions = await convex.query(api.queries.liveSessions.getLiveReactions, { 
      sessionId: session._id,
      limit,
      offset,
      reactionType: (reactionType === 'like' || reactionType === 'love' || reactionType === 'laugh' || reactionType === 'wow' || reactionType === 'sad' || reactionType === 'angry' || reactionType === 'fire' || reactionType === 'clap' || reactionType === 'heart' || reactionType === 'star') ? reactionType : undefined
    });

    // Format reactions
    const formattedReactions = reactions.map((reaction: any) => ({
      id: reaction._id,
      reactionType: reaction.reactionType,
      intensity: reaction.intensity,
      sentBy: reaction.sent_by,
      sentByRole: reaction.sent_by_role,
      userDisplayName: reaction.user_display_name,
      sentAt: new Date(reaction.sent_at).toISOString(),
      metadata: reaction.metadata || {}
    }));

    return ResponseFactory.success({
      success: true,
      sessionId,
      reactions: formattedReactions,
      totalReactions: formattedReactions.length,
      limit,
      offset
    });

  } catch (error: any) {
    console.error('Get live reactions error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to get live reactions.' 
    );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 