import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getUserFromRequest } from '@/lib/auth/session';
import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { Id } from '@/convex/_generated/dataModel';
import { NextResponse } from 'next/server';

/**
 * @swagger
 * /chat/conversations/{chat_id}/admin:
 *   post:
 *     summary: Transfer Chat Admin Rights
 *     description: Transfer administrative rights for a chat conversation to another participant. This endpoint allows current chat administrators to transfer their admin privileges to another user in the conversation.
 *     tags: [Chat, Conversations, Admin]
 *     parameters:
 *       - in: path
 *         name: chat_id
 *         required: true
 *         schema:
 *           type: string
 *         description: Chat conversation ID
 *         example: "j1234567890abcdef"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newAdminId
 *             properties:
 *               newAdminId:
 *                 type: string
 *                 description: ID of the user to transfer admin rights to
 *                 example: "j1234567890abcdef"
 *               reason:
 *                 type: string
 *                 nullable: true
 *                 description: Reason for transferring admin rights
 *                 example: "Stepping down as admin"
 *               notifyParticipants:
 *                 type: boolean
 *                 default: true
 *                 description: Whether to notify all participants about the admin change
 *                 example: true
 *     responses:
 *       200:
 *         description: Admin rights transferred successfully
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
 *                     chatId:
 *                       type: string
 *                       description: Chat conversation ID
 *                       example: "j1234567890abcdef"
 *                     previousAdminId:
 *                       type: string
 *                       description: ID of the previous admin
 *                       example: "admin1234567890abcdef"
 *                     newAdminId:
 *                       type: string
 *                       description: ID of the new admin
 *                       example: "j1234567890abcdef"
 *                     transferredAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when admin rights were transferred
 *                       example: "2024-01-15T14:30:00Z"
 *                     reason:
 *                       type: string
 *                       nullable: true
 *                       description: Reason for the transfer
 *                       example: "Stepping down as admin"
 *                     participantsNotified:
 *                       type: integer
 *                       description: Number of participants notified
 *                       example: 5
 *                     adminPermissions:
 *                       type: array
 *                       items:
 *                         type: string
 *                       description: List of admin permissions transferred
 *                       example: ["remove_participants", "manage_settings", "moderate_messages"]
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing newAdminId or invalid chat_id
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions to transfer admin rights
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chat conversation not found or new admin not a participant
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
  const user = await getUserFromRequest(request);
  if (!user || !user._id) {
    return ResponseFactory.unauthorized('Unauthorized');
  }
  // Extract chat_id from the URL
  const url = new URL(request.url);
  const match = url.pathname.match(/\/conversations\/([^/]+)/);
  const chatId = match ? (match[1] as Id<'chats'>) : undefined;
  if (!chatId) {
    return ResponseFactory.validationError('Missing chat_id');
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return ResponseFactory.validationError('Invalid JSON');
  }
  const { newAdminId } = body;
  if (!newAdminId) {
    return ResponseFactory.validationError('Missing newAdminId');
  }
  const convex = getConvexClient();
  const result = await convex.mutation(api.mutations.chats.transferAdmin, {
    chatId,
    userId: user._id,
    newAdminId
  });
  return ResponseFactory.success(result);
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
