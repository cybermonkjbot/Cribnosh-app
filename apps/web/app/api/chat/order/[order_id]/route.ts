import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

interface Chat {
  _id: Id<'chats'>;
  participants: Id<'users'>[];
  metadata?: {
    order_id?: string;
  };
  createdAt: number;
  lastMessageAt?: number;
}

// Endpoint: /v1/chat/order/{order_id}
// Group: chat

/**
 * @swagger
 * /chat/order/{order_id}:
 *   get:
 *     summary: Get Order Chat
 *     description: Retrieve chat conversation associated with a specific order
 *     tags: [Chat, Orders]
 *     parameters:
 *       - in: path
 *         name: order_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID to get chat for
 *         example: "ORD-12345"
 *     responses:
 *       200:
 *         description: Order chat retrieved successfully
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
 *                     chat:
 *                       type: object
 *                       nullable: true
 *                       description: Chat conversation for the order
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Chat ID
 *                           example: "j1234567890abcdef"
 *                         participants:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: User IDs participating in the chat
 *                           example: ["j1234567890abcdef", "j0987654321fedcba"]
 *                         metadata:
 *                           type: object
 *                           properties:
 *                             order_id:
 *                               type: string
 *                               example: "ORD-12345"
 *                         createdAt:
 *                           type: number
 *                           description: Chat creation timestamp
 *                           example: 1640995200000
 *                         lastMessageAt:
 *                           type: number
 *                           nullable: true
 *                           description: Last message timestamp
 *                           example: 1640995200000
 *                     order_id:
 *                       type: string
 *                       example: "ORD-12345"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing order_id
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
 *         description: Order chat not found
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
  // Extract order_id from the URL
  const url = new URL(request.url);
  const match = url.pathname.match(/\/order\/([^/]+)/);
  const order_id = match ? match[1] : undefined;
  if (!order_id) {
    return ResponseFactory.validationError('Missing order_id');
  }
  // Get authenticated user from session token
  const { userId, user } = await getAuthenticatedUser(request);
  const convex = getConvexClientFromRequest(request);
  // Use the proper Convex query to get chats for the current user
  const chats = await convex.query(api.queries.chats.listConversationsForUser, { 
    userId: userId as Id<'users'> 
  });
  // Find chat with matching order_id in metadata
  const chat = chats.chats.find((c: Chat) => c.metadata?.order_id === order_id);
  if (!chat) {
    return ResponseFactory.notFound('Chat not found for order_id');
  }
  // Only allow if user is a participant or admin
  const isParticipant = Array.isArray(chat.participants) && chat.participants.includes(userId);
  if (!isParticipant && user.roles?.[0] !== 'admin') {
    return ResponseFactory.forbidden('Forbidden: Not a participant or admin.');
  }
  return ResponseFactory.success({
    chat_id: chat._id,
    participants: chat.participants,
    created_at: new Date(chat.createdAt).toISOString(),
    last_message_at: chat.lastMessageAt ? new Date(chat.lastMessageAt).toISOString() : null,
    metadata: chat.metadata || {},
  });
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

export const POST = withAPIMiddleware(withErrorHandling(async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Extract order_id from the URL
    const url = new URL(request.url);
    const match = url.pathname.match(/\/order\/([^/]+)/);
    const order_id = match ? match[1] : undefined;
    if (!order_id) {
      return ResponseFactory.validationError('Missing order_id');
    }
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);
    const convex = getConvexClientFromRequest(request);
    
    // First, try to find an existing chat for this order
    const chatsResponse = await convex.query(api.queries.chats.listConversationsForUser, { 
      userId: userId as Id<'users'> 
    });
    let chat = chatsResponse.chats.find((c: Chat) => c.metadata?.order_id === order_id);
    
    if (!chat) {
      // Find participants: customer and chef from order
      const order = await convex.query(api.queries.orders.getById, { order_id: order_id });
      if (!order) {
        return ResponseFactory.notFound('Order not found');
      }
      
      // Ensure we have valid participant IDs
      const authenticatedUserId = userId as Id<'users'>;
      const otherUserId = order.customer_id === authenticatedUserId ? order.chef_id : order.customer_id;
      const participants = [authenticatedUserId, otherUserId].filter(Boolean) as Id<'users'>[];
      
      if (participants.length < 2) {
        return ResponseFactory.validationError('Could not determine chat participants');
      }
      
      try {
        // Create a new chat using the createConversation mutation
        const result = await convex.mutation(api.mutations.chats.createConversation, {
          participants,
          metadata: { order_id }
        });
        
        // Get the newly created chat using the returned chatId
        const chatResponse = await convex.query(api.queries.chats.listConversationsForUser, { 
          userId,
          limit: 1,
          offset: 0
        });
        
        chat = chatResponse.chats.find((c: any) => c._id === result.chatId);
        if (!chat) {
          return ResponseFactory.error('Failed to create chat', 'CUSTOM_ERROR', 500);
        }
      } catch (error: any) {
        logger.error('Error creating chat:', error);
        return ResponseFactory.internalError('Failed to create chat');
      }
    }
    return ResponseFactory.success(chat);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to process request.'));
  }
}));
