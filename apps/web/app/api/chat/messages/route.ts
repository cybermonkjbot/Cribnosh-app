import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getUserFromRequest } from '@/lib/auth/session';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getErrorMessage } from '@/types/errors';

// Endpoint: /v1/chat/messages/
// Group: chat

/**
 * @swagger
 * /chat/messages:
 *   get:
 *     summary: Get User Messages
 *     description: Retrieve all messages from all conversations for the authenticated user
 *     tags: [Chat, Messaging]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of messages to return
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of messages to skip
 *         example: 0
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
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
 *                     messages:
 *                       type: array
 *                       description: Array of user messages from all conversations
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Message ID
 *                             example: "j1234567890abcdef"
 *                           chatId:
 *                             type: string
 *                             description: Conversation ID this message belongs to
 *                             example: "j1234567890abcdef"
 *                           content:
 *                             type: string
 *                             description: Message content
 *                             example: "Hello, how can I help you today?"
 *                           senderId:
 *                             type: string
 *                             description: User ID who sent the message
 *                             example: "j1234567890abcdef"
 *                           messageType:
 *                             type: string
 *                             enum: [text, image, file, system, notification]
 *                             description: Type of message
 *                             example: "text"
 *                           metadata:
 *                             type: object
 *                             nullable: true
 *                             description: Additional message metadata
 *                             example: {"fileUrl": "https://example.com/file.pdf", "fileSize": 1024}
 *                           isRead:
 *                             type: boolean
 *                             description: Whether the message has been read
 *                             example: true
 *                           createdAt:
 *                             type: number
 *                             description: Message creation timestamp
 *                             example: 1640995200000
 *                           updatedAt:
 *                             type: number
 *                             nullable: true
 *                             description: Last update timestamp
 *                             example: 1640995200000
 *                     total_count:
 *                       type: number
 *                       description: Total number of messages across all conversations
 *                       example: 150
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
  const user = await getUserFromRequest(request);
  if (!user || !user._id) {
    return ResponseFactory.unauthorized('Unauthorized');
  }
  const convex = getConvexClientFromRequest(request);
  // Get all conversations for the user
  const chatResult = await convex.query(api.queries.chats.listConversationsForUser, { userId: user._id });
  // Aggregate all messages from all conversations
  let allMessages: Array<{_id: string; chatId: string; content: string; createdAt: number; [key: string]: any}> = [];
  const chats = chatResult?.chats || [];
  for (const chat of chats) {
    const { messages } = await convex.query(api.queries.chats.listMessagesForChat, { chatId: chat._id, limit: 100 });
    allMessages = allMessages.concat(messages.map((msg: any) => ({ ...msg, chatId: chat._id })));
  }
  // Sort by createdAt desc
  allMessages.sort((a, b) => b.createdAt - a.createdAt);
  // Pagination (limit/offset from query params)
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);
  const paged = allMessages.slice(offset, offset + limit);
  return ResponseFactory.success({
    messages: paged,
    total_count: allMessages.length,
    limit,
    offset
  });
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

/**
 * @swagger
 * /chat/messages:
 *   post:
 *     summary: Send Message
 *     description: Send a message to a user (creates conversation if needed)
 *     tags: [Chat, Messaging]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recipient_id
 *             properties:
 *               recipient_id:
 *                 type: string
 *                 description: User ID of the message recipient
 *                 example: "j1234567890abcdef"
 *               content:
 *                 type: string
 *                 nullable: true
 *                 description: Text content of the message
 *                 example: "Hello, how can I help you today?"
 *               fileUrl:
 *                 type: string
 *                 nullable: true
 *                 description: URL of attached file
 *                 example: "https://example.com/file.pdf"
 *               fileType:
 *                 type: string
 *                 nullable: true
 *                 description: Type of attached file
 *                 example: "application/pdf"
 *               fileName:
 *                 type: string
 *                 nullable: true
 *                 description: Name of attached file
 *                 example: "document.pdf"
 *               fileSize:
 *                 type: number
 *                 nullable: true
 *                 description: Size of attached file in bytes
 *                 example: 1024
 *               metadata:
 *                 type: object
 *                 nullable: true
 *                 description: Additional message metadata
 *                 example: {"priority": "high"}
 *     responses:
 *       200:
 *         description: Message sent successfully
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
 *                     _id:
 *                       type: string
 *                       description: Message ID
 *                       example: "j1234567890abcdef"
 *                     chatId:
 *                       type: string
 *                       description: Conversation ID
 *                       example: "j1234567890abcdef"
 *                     content:
 *                       type: string
 *                       example: "Hello, how can I help you today?"
 *                     senderId:
 *                       type: string
 *                       example: "j1234567890abcdef"
 *                     recipientId:
 *                       type: string
 *                       example: "j0987654321fedcba"
 *                     fileUrl:
 *                       type: string
 *                       nullable: true
 *                       example: "https://example.com/file.pdf"
 *                     fileType:
 *                       type: string
 *                       nullable: true
 *                       example: "application/pdf"
 *                     fileName:
 *                       type: string
 *                       nullable: true
 *                       example: "document.pdf"
 *                     fileSize:
 *                       type: number
 *                       nullable: true
 *                       example: 1024
 *                     createdAt:
 *                       type: number
 *                       example: 1640995200000
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing required fields
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */
export const POST = withAPIMiddleware(withErrorHandling(async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId } = await getAuthenticatedUser(request);
    
    const { recipient_id, content, fileUrl, fileType, fileName, fileSize, metadata } = await request.json();
    if (!recipient_id || (!content && !fileUrl)) {
      return ResponseFactory.validationError('recipient_id and content or file required');
    }
    const convex = getConvexClientFromRequest(request);
    // Find or create chat between sender and recipient
    const chats = await convex.query(api.queries.chats.listConversationsForUser, { userId });
    // Access the chats array from the chats object and find an existing chat
    let chatId: string;
    const existingChat = chats.chats.find((c: any) => 
      Array.isArray(c.participants) && 
      c.participants.includes(userId) && 
      c.participants.includes(recipient_id)
    );

    if (existingChat && existingChat._id) {
      chatId = existingChat._id;
    } else {
      const newChat = await convex.mutation(api.mutations.chats.createConversation, {
        participants: [userId, recipient_id],
        metadata: {},
      });
      // Handle both cases where createConversation might return the full chat or just the ID
      chatId = (newChat as any)._id || (newChat as any).chatId;
    }
    const typedChatId = chatId as Id<"chats">;
    const message = await convex.mutation(api.mutations.chats.sendMessage, {
      chatId: typedChatId,
      senderId: userId,
      content: content || '',
      fileUrl,
      fileType,
      fileName,
      fileSize,
      metadata,
    });
    return ResponseFactory.success(message);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to send message'));
  }
})); 