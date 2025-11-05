import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import jwt from 'jsonwebtoken';
import { Id } from '@/convex/_generated/dataModel';
import { getQuickReplies } from '@/lib/support/quickReplies';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /customer/support-chat/quick-replies:
 *   get:
 *     summary: Get quick reply suggestions
 *     description: Get contextual quick reply suggestions for support chat based on conversation context
 *     tags: [Customer, Support]
 *     responses:
 *       200:
 *         description: Quick replies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     replies:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           text:
 *                             type: string
 *                           category:
 *                             type: string
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

    // Get active support chat to analyze context
    const activeChat = await convex.query(api.queries.supportCases.getActiveSupportChat, {
      userId,
    });

    let context: {
      category?: string;
      recentMessages?: string[];
    } = {};

    if (activeChat?.supportCase) {
      context.category = activeChat.supportCase.category;

      // Get recent messages for context
      if (activeChat.chat) {
        const messagesResult = await convex.query(api.queries.chats.listMessagesForChat, {
          chatId: activeChat.chat._id,
          limit: 5,
          offset: 0,
        });

        context.recentMessages = messagesResult.messages
          .reverse()
          .slice(-5)
          .map((msg: any) => msg.content);
      }
    }

    const replies = getQuickReplies(context);

    return ResponseFactory.success({
      replies: replies.map((reply) => ({
        text: reply.text,
        category: reply.category,
      })),
    });
  } catch (error: any) {
    return ResponseFactory.internalError(error.message || 'Failed to get quick replies.');
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

