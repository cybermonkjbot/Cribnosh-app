import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getUserFromRequest } from '@/lib/auth/session';
import { api } from '@/convex/_generated/api';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getErrorMessage } from '@/types/errors';
import { Id } from '@/convex/_generated/dataModel';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /chat/conversations/{chat_id}/messages:
 *   get:
 *     summary: Get Chat Messages
 *     description: Retrieve paginated list of messages from a specific chat conversation. This endpoint allows users to fetch message history with support for pagination and real-time updates.
 *     tags: [Chat, Messaging]
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the chat conversation
 *         example: "j1234567890abcdef"
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
 *                       description: Array of chat messages
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Message ID
 *                             example: "msg_1234567890abcdef"
 *                           chatId:
 *                             type: string
 *                             description: Chat conversation ID
 *                             example: "j1234567890abcdef"
 *                           senderId:
 *                             type: string
 *                             description: ID of the user who sent the message
 *                             example: "j1234567890abcdef"
 *                           content:
 *                             type: string
 *                             description: Message content
 *                             example: "Hello, how can I help you?"
 *                           fileUrl:
 *                             type: string
 *                             nullable: true
 *                             description: URL of attached file
 *                             example: "https://example.com/uploads/image.jpg"
 *                           fileType:
 *                             type: string
 *                             nullable: true
 *                             description: Type of attached file
 *                             example: "image/jpeg"
 *                           fileName:
 *                             type: string
 *                             nullable: true
 *                             description: Name of attached file
 *                             example: "attachment.jpg"
 *                           fileSize:
 *                             type: number
 *                             nullable: true
 *                             description: Size of attached file in bytes
 *                             example: 1024000
 *                           metadata:
 *                             type: object
 *                             additionalProperties: true
 *                             nullable: true
 *                             description: Additional message metadata
 *                             example:
 *                               orderId: "order_123"
 *                               messageType: "text"
 *                           timestamp:
 *                             type: string
 *                             format: date-time
 *                             description: Message creation timestamp
 *                             example: "2024-01-15T14:30:00Z"
 *                           editedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: Last edit timestamp
 *                             example: "2024-01-15T14:35:00Z"
 *                           isDeleted:
 *                             type: boolean
 *                             description: Whether the message is deleted
 *                             example: false
 *                     total:
 *                       type: number
 *                       description: Total number of messages in the chat
 *                       example: 150
 *                     limit:
 *                       type: number
 *                       example: 20
 *                     offset:
 *                       type: number
 *                       example: 0
 *                     hasMore:
 *                       type: boolean
 *                       description: Whether there are more messages to load
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing or invalid chat_id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user not authorized to view this chat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chat not found
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
 *     summary: Send Message to Chat
 *     description: Send a new message to a specific chat conversation. This endpoint allows users to send text messages, file attachments, or both to an existing chat.
 *     tags: [Chat, Messaging]
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the chat conversation
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content/text
 *                 example: "Thank you for the quick response!"
 *               fileUrl:
 *                 type: string
 *                 nullable: true
 *                 description: URL of attached file
 *                 example: "https://example.com/uploads/document.pdf"
 *               fileType:
 *                 type: string
 *                 nullable: true
 *                 description: Type of attached file
 *                 example: "application/pdf"
 *               fileName:
 *                 type: string
 *                 nullable: true
 *                 description: Name of attached file
 *                 example: "receipt.pdf"
 *               fileSize:
 *                 type: number
 *                 nullable: true
 *                 description: Size of attached file in bytes
 *                 example: 2048000
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *                 description: Additional metadata for the message
 *                 example:
 *                   messageType: "confirmation"
 *                   priority: "normal"
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
 *                     messageId:
 *                       type: string
 *                       description: Unique identifier of the sent message
 *                       example: "msg_1234567890abcdef"
 *                     chatId:
 *                       type: string
 *                       description: Chat conversation ID
 *                       example: "j1234567890abcdef"
 *                     senderId:
 *                       type: string
 *                       description: ID of the user who sent the message
 *                       example: "j1234567890abcdef"
 *                     content:
 *                       type: string
 *                       description: Message content
 *                       example: "Thank you for the quick response!"
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                       description: Message creation timestamp
 *                       example: "2024-01-15T14:30:00Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing required fields or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user not authorized to send messages in this chat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chat not found
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
 *   patch:
 *     summary: Edit Message
 *     description: Edit an existing message in a chat conversation. This endpoint allows users to modify the content or metadata of their own messages.
 *     tags: [Chat, Messaging]
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the chat conversation
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageId
 *             properties:
 *               messageId:
 *                 type: string
 *                 description: ID of the message to edit
 *                 example: "msg_1234567890abcdef"
 *               content:
 *                 type: string
 *                 nullable: true
 *                 description: Updated message content
 *                 example: "Thank you for the quick response! (edited)"
 *               fileUrl:
 *                 type: string
 *                 nullable: true
 *                 description: Updated file URL
 *                 example: "https://example.com/uploads/updated_document.pdf"
 *               fileType:
 *                 type: string
 *                 nullable: true
 *                 description: Updated file type
 *                 example: "application/pdf"
 *               fileName:
 *                 type: string
 *                 nullable: true
 *                 description: Updated file name
 *                 example: "updated_receipt.pdf"
 *               fileSize:
 *                 type: number
 *                 nullable: true
 *                 description: Updated file size in bytes
 *                 example: 2048000
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *                 description: Updated metadata
 *                 example:
 *                   messageType: "confirmation"
 *                   priority: "normal"
 *                   edited: true
 *     responses:
 *       200:
 *         description: Message edited successfully
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
 *                     messageId:
 *                       type: string
 *                       description: ID of the edited message
 *                       example: "msg_1234567890abcdef"
 *                     chatId:
 *                       type: string
 *                       description: Chat conversation ID
 *                       example: "j1234567890abcdef"
 *                     editedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when message was edited
 *                       example: "2024-01-15T14:35:00Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing messageId or invalid data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user not authorized to edit this message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Message not found
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
 *   delete:
 *     summary: Delete Message
 *     description: Delete a message from a chat conversation. This endpoint allows users to remove their own messages from the chat.
 *     tags: [Chat, Messaging]
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Unique identifier of the chat conversation
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - messageId
 *             properties:
 *               messageId:
 *                 type: string
 *                 description: ID of the message to delete
 *                 example: "msg_1234567890abcdef"
 *     responses:
 *       200:
 *         description: Message deleted successfully
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
 *                     messageId:
 *                       type: string
 *                       description: ID of the deleted message
 *                       example: "msg_1234567890abcdef"
 *                     chatId:
 *                       type: string
 *                       description: Chat conversation ID
 *                       example: "j1234567890abcdef"
 *                     deletedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when message was deleted
 *                       example: "2024-01-15T14:40:00Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing messageId
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - user not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - user not authorized to delete this message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Message not found
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

function getChatIdFromParams(request: NextRequest): Id<'chats'> | null {
  const url = new URL(request.url);
  const match = url.pathname.match(/\/conversations\/([^/]+)/);
  if (!match) return null;
  try {
    // Convex Ids are just branded strings, so cast is safe if format matches
    return match[1] as Id<'chats'>;
  } catch {
    return null;
  }
}

async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user._id) {
      return ResponseFactory.unauthorized('Unauthorized');
    }
    const chatId = getChatIdFromParams(request);
    if (!chatId) {
      return ResponseFactory.validationError('Missing or invalid chat_id');
    }
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    // Pagination
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '') || 20;
    const offset = parseInt(searchParams.get('offset') || '') || 0;
    // Query real messages for this chat
    const result = await convex.query(api.queries.chats.listMessagesForChat, {
      chatId,
      limit,
      offset,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success(result);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to get messages.'));
  }
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user._id) {
      return ResponseFactory.unauthorized('Unauthorized');
    }
    const chatId = getChatIdFromParams(request);
    if (!chatId) {
      return ResponseFactory.validationError('Missing or invalid chat_id');
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return ResponseFactory.validationError('Invalid JSON');
    }
    const { content, fileUrl, fileType, fileName, fileSize, metadata } = body;
    if (!content && !fileUrl) {
      return ResponseFactory.validationError('Message content or file required');
    }
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const result = await convex.mutation(api.mutations.chats.sendMessage, {
      chatId,
      senderId: user._id,
      content: content || '',
      fileUrl,
      fileType,
      fileName,
      fileSize,
      metadata,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success(result);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to send message.'));
  }
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user._id) {
      return ResponseFactory.unauthorized('Unauthorized');
    }
    const chatId = getChatIdFromParams(request);
    if (!chatId) {
      return ResponseFactory.validationError('Missing or invalid chat_id');
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return ResponseFactory.validationError('Invalid JSON');
    }
    const { messageId } = body;
    if (!messageId) {
      return ResponseFactory.validationError('Missing messageId');
    }
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const result = await convex.mutation(api.mutations.chats.deleteMessage, {
      chatId,
      messageId,
      userId: user._id,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success(result);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to delete message.'));
  }
}

async function handlePATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const user = await getUserFromRequest(request);
    if (!user || !user._id) {
      return ResponseFactory.unauthorized('Unauthorized');
    }
    const chatId = getChatIdFromParams(request);
    if (!chatId) {
      return ResponseFactory.validationError('Missing or invalid chat_id');
    }
    let body;
    try {
      body = await request.json();
    } catch {
      return ResponseFactory.validationError('Invalid JSON');
    }
    const { messageId, content, fileUrl, fileType, fileName, fileSize, metadata } = body;
    if (!messageId) {
      return ResponseFactory.validationError('Missing messageId');
    }
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    const result = await convex.mutation(api.mutations.chats.editMessage, {
      chatId,
      messageId,
      userId: user._id,
      content,
      fileUrl,
      fileType,
      fileName,
      fileSize,
      metadata,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success(result);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to edit message.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));
export const PATCH = withAPIMiddleware(withErrorHandling(handlePATCH));
