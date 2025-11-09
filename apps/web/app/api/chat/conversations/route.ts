import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getUserFromRequest } from '@/lib/auth/session';
import { api } from '@/convex/_generated/api';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getErrorMessage } from '@/types/errors';
import { NextResponse } from 'next/server';

// Endpoint: /v1/chat/conversations/
// Group: chat

/**
 * @swagger
 * /chat/conversations:
 *   get:
 *     summary: Get User Conversations
 *     description: Retrieve paginated list of conversations for the authenticated user
 *     tags: [Chat, Messaging]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of conversations to return
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of conversations to skip
 *         example: 0
 *     responses:
 *       200:
 *         description: Conversations retrieved successfully
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
 *                     conversations:
 *                       type: array
 *                       description: Array of user conversations
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Conversation ID
 *                             example: "j1234567890abcdef"
 *                           participants:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: User IDs participating in the conversation
 *                             example: ["j1234567890abcdef", "j0987654321fedcba"]
 *                           lastMessage:
 *                             type: object
 *                             nullable: true
 *                             description: Last message in the conversation
 *                             properties:
 *                               _id:
 *                                 type: string
 *                                 example: "j1234567890abcdef"
 *                               content:
 *                                 type: string
 *                                 example: "Hello, how can I help you?"
 *                               senderId:
 *                                 type: string
 *                                 example: "j1234567890abcdef"
 *                               timestamp:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2024-01-15T10:30:00.000Z"
 *                           unreadCount:
 *                             type: number
 *                             description: Number of unread messages for current user
 *                             example: 3
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             description: Conversation creation timestamp
 *                             example: "2024-01-15T09:00:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             description: Last update timestamp
 *                             example: "2024-01-15T10:30:00.000Z"
 *                     total:
 *                       type: number
 *                       description: Total number of conversations
 *                       example: 45
 *                     limit:
 *                       type: number
 *                       example: 20
 *                     offset:
 *                       type: number
 *                       example: 0
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - user not authenticated
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
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user._id) {
      return ResponseFactory.unauthorized('Unauthorized');
    }
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    // Pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '') || 20;
    const offset = parseInt(searchParams.get('offset') || '') || 0;
    // Query real conversations for this user
    const result = await convex.query(api.queries.chats.listConversationsForUser, {
      userId: user._id,
      limit,
      offset,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success(result);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to get conversations.'));
  }
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user._id) {
      return ResponseFactory.unauthorized('Unauthorized');
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return ResponseFactory.validationError('Invalid JSON');
    }
    const { participants, metadata } = body;
    if (!Array.isArray(participants) || participants.length < 2) {
      return ResponseFactory.validationError('At least two participants required');
    }
    // Ensure the current user is included
    if (!participants.includes(user._id)) {
      participants.push(user._id);
    }
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const result = await convex.mutation(api.mutations.chats.createConversation, {
      participants,
      metadata,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success(result);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to create conversation.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 