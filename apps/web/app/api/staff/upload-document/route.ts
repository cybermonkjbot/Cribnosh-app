import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getUserFromRequest } from "@/lib/auth/session";
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { randomUUID } from 'crypto';
import { NextRequest } from 'next/server';

/**
 * @swagger
 * /staff/upload-document:
 *   post:
 *     summary: Upload Staff Document
 *     description: Upload documents for staff onboarding (ID, tax forms, etc.)
 *     tags: [Staff, Documents]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *               - userEmail
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file to upload
 *               userEmail:
 *                 type: string
 *                 format: email
 *                 description: Email of the staff member
 *                 example: "john.doe@cribnosh.com"
 *               type:
 *                 type: string
 *                 description: Type of document being uploaded
 *                 example: "id_document"
 *     responses:
 *       200:
 *         description: Document uploaded successfully
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
 *                     fileUrl:
 *                       type: string
 *                       description: URL to access the uploaded file
 *                       example: "/api/files/storage123456"
 *                     fileName:
 *                       type: string
 *                       description: Generated file name
 *                       example: "john.doe@cribnosh.com/uuid-document.pdf"
 *                 message:
 *                   type: string
 *                   example: "Document uploaded successfully"
 *       400:
 *         description: Validation error - missing file or userEmail
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
 *         description: Internal server error or file storage not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */
export async function POST(request: NextRequest) {
  const user = await getUserFromRequest(request);
  if (!user) {
    return ResponseFactory.unauthorized('Unauthorized');
  }
  const formData = await request.formData();
  const file = (formData as any).get('file') as File;

  const userEmail = (formData as any).get('userEmail') as string;
  const docType = (formData as any).get('type') as string;

  if (!file || !userEmail) {
    return ResponseFactory.validationError('Missing file or userEmail');
  }

  try {
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Generate an upload URL from Convex
    const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);

    // Upload the file to Convex storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: buffer
    });

    if (!uploadRes.ok) {
      throw new Error('Failed to upload to Convex storage');
    }

    const { storageId } = await uploadRes.json();
    if (!storageId) {
      throw new Error('No storageId in upload response');
    }

    const fileName = `${userEmail}/${randomUUID()}-${file.name}`;
    const fileUrl = `/api/files/${storageId}`;

    return ResponseFactory.success({ fileUrl, fileName });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Convex upload error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to upload document'));
  }
} 