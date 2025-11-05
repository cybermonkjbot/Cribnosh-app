import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import jwt from 'jsonwebtoken';
import { Id } from '@/convex/_generated/dataModel';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /customer/support-chat/messages:
 *   get:
 *     summary: Get messages for support chat
 *     description: Retrieve paginated messages from the active support chat
 *     tags: [Customer, Support]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of messages to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of messages to skip
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }

    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }

    // Note: Role check is optional - if roles are not in JWT, we still allow access based on user_id

    const convex = getConvexClient();
    const userId = payload.user_id as Id<'users'>;

    // Get active support chat
    const activeChat = await convex.query(api.queries.supportCases.getActiveSupportChat, {
      userId,
    });

    if (!activeChat || !activeChat.chat) {
      return ResponseFactory.success({
        messages: [],
        total: 0,
        limit: 0,
        offset: 0,
      });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const messagesResult = await convex.query(api.queries.chats.listMessagesForChat, {
      chatId: activeChat.chat._id,
      limit,
      offset,
    });

    return ResponseFactory.success({
      messages: messagesResult.messages.reverse(), // Reverse to show oldest first
      total: messagesResult.total_count,
      limit: messagesResult.limit,
      offset: messagesResult.offset,
    });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to get messages.');
  }
}

/**
 * @swagger
 * /customer/support-chat/messages:
 *   post:
 *     summary: Send message in support chat
 *     description: Send a message in the active support chat and update the support case
 *     tags: [Customer, Support]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content
 *     responses:
 *       200:
 *         description: Message sent successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }

    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }

    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can send messages in support chat.');
    }

    const body = await request.json();
    const { content } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return ResponseFactory.validationError('Message content is required.');
    }

    const convex = getConvexClient();
    const userId = payload.user_id as Id<'users'>;

    // Get active support chat
    const activeChat = await convex.query(api.queries.supportCases.getActiveSupportChat, {
      userId,
    });

    if (!activeChat || !activeChat.chat || !activeChat.supportCase) {
      return ResponseFactory.error(
        'No active support chat found. Please initialize a support chat first.',
        'NOT_FOUND',
        404
      );
    }

    // Send message
    const messageResult = await convex.mutation(api.mutations.chats.sendMessage, {
      chatId: activeChat.chat._id,
      senderId: userId,
      content: content.trim(),
    });

    // Update support case last message
    await convex.mutation(api.mutations.supportCases.addMessageToCase, {
      caseId: activeChat.supportCase._id,
      message: content.trim(),
    });

    return ResponseFactory.success({
      messageId: messageResult.messageId,
      chatId: activeChat.chat._id,
      content: content.trim(),
    });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to send message.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

