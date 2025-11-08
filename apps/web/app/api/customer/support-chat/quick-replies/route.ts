import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { Id } from '@/convex/_generated/dataModel';
import { getQuickReplies } from '@/lib/support/quickReplies';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

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
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClient();

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
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to get quick replies.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

