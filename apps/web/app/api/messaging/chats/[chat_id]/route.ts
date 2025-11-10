/**
 * @swagger
 * components:
 *   schemas:
 *     ChatResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           description: Chat conversation details
 *         message:
 *           type: string
 *           example: "Success"
 */

import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getErrorMessage } from '@/types/errors';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

// Endpoint: /v1/messaging/chats/{chat_id}
// Group: messaging

/**
 * @swagger
 * /api/messaging/chats/{chat_id}:
 *   get:
 *     summary: Get chat conversation
 *     description: Retrieve details of a specific chat conversation
 *     tags: [Messaging]
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the chat conversation
 *     responses:
 *       200:
 *         description: Chat conversation retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *       400:
 *         description: Validation error - Missing or invalid chat_id
 *       404:
 *         description: Chat not found
 *       500:
 *         description: Internal server error
 *     security: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  const url = new URL(request.url);
  const pathParts = url.pathname.split('/');
  const chat_id = pathParts[pathParts.length - 1];
  
  if (!chat_id) {
    return ResponseFactory.validationError('Missing chat_id');
  }
  let chatId: Id<'chats'>;
  try {
    chatId = chat_id as Id<'chats'>;
  } catch {
    return ResponseFactory.validationError('Invalid chat_id');
  }
  const convex = getConvexClientFromRequest(request);
  const sessionToken = getSessionTokenFromRequest(request);
  const chat = await convex.query(api.queries.chats.getConversationById, {
    chatId,
    sessionToken: sessionToken || undefined
  });
  if (!chat) {
    return ResponseFactory.notFound('Chat not found');
  }
  return ResponseFactory.success(chat);
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 