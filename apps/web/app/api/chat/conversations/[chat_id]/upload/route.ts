import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getUserFromRequest } from '@/lib/auth/session';
import { randomUUID } from 'crypto';
import { NextResponse } from 'next/server';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';

/**
 * @swagger
 * /chat/conversations/{chat_id}/upload:
 *   post:
 *     summary: Generate File Upload URL for Chat
 *     description: Generate a secure upload URL for file attachments in chat conversations. This endpoint creates a presigned URL that allows users to upload files directly to Convex storage for sharing in chat conversations.
 *     tags: [Chat, File Upload]
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
 *               - fileName
 *               - contentType
 *             properties:
 *               fileName:
 *                 type: string
 *                 description: Name of the file to upload
 *                 example: "document.pdf"
 *               contentType:
 *                 type: string
 *                 description: MIME type of the file
 *                 example: "application/pdf"
 *               fileSize:
 *                 type: integer
 *                 nullable: true
 *                 description: Size of the file in bytes
 *                 example: 1024000
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *                 description: Additional file metadata
 *                 example:
 *                   description: "Important document"
 *                   category: "document"
 *     responses:
 *       200:
 *         description: Upload URL generated successfully
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
 *                     url:
 *                       type: string
 *                       description: Presigned upload URL
 *                       example: "https://convex-storage.example.com/upload/..."
 *                     objectKey:
 *                       type: string
 *                       description: Unique object key for the file
 *                       example: "chat/j1234567890abcdef/u1234567890abcdef/uuid-document.pdf"
 *                     storageType:
 *                       type: string
 *                       description: Storage provider type
 *                       example: "convex"
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *                       description: URL expiration time
 *                       example: "2024-01-15T15:30:00Z"
 *                     maxFileSize:
 *                       type: integer
 *                       description: Maximum allowed file size in bytes
 *                       example: 10485760
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing fileName or contentType
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
 *         description: Forbidden - user not authorized for this chat
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chat conversation not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error - failed to generate upload URL
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
  const urlObj = new URL(request.url);
  const match = urlObj.pathname.match(/\/conversations\/([^/]+)/);
  const chatId = match ? match[1] : undefined;
  if (!chatId) {
    return ResponseFactory.validationError('Missing chat_id');
  }
  let body;
  try {
    body = await request.json();
  } catch {
    return ResponseFactory.validationError('Invalid JSON');
  }
  const { fileName, contentType } = body;
  if (!fileName || !contentType) {
    return ResponseFactory.validationError('Missing fileName or contentType');
  }
  
  try {
    const convex = getConvexClient();
    
    // Generate an upload URL from Convex
    const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);
    
    // Generate a unique object key for this chat/user
    const objectKey = `chat/${chatId}/${user._id}/${randomUUID()}-${fileName}`;
    
    return ResponseFactory.success({ url: uploadUrl, objectKey, storageType: 'convex' });
  } catch (error) {
    console.error('Failed to generate upload URL:', error);
    return ResponseFactory.internalError('Failed to generate upload URL');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
