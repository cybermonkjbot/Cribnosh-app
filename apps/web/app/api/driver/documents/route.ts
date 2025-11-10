import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedDriver } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /driver/documents:
 *   get:
 *     summary: Get Driver Documents
 *     description: Get all documents for the current driver
 *     tags: [Driver]
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
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
 *                     documents:
 *                       type: array
 *                       description: Array of driver documents
 *                       items:
 *                         type: object
 *                         properties:
 *                           type:
 *                             type: string
 *                             description: Document type (license, registration, insurance, photo)
 *                           url:
 *                             type: string
 *                             description: Document URL
 *                           verified:
 *                             type: boolean
 *                             description: Whether document is verified
 *                           verifiedAt:
 *                             type: number
 *                             nullable: true
 *                             description: Verification timestamp
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only drivers can access this endpoint
 *       404:
 *         description: Driver profile not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedDriver(request);
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get driver profile by user email
    // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
    const driver = await convex.query(api.queries.drivers.getByUserId, {
      userId,
      sessionToken: sessionToken || undefined,
    });

    if (!driver) {
      return ResponseFactory.notFound('Driver profile not found. Please complete your driver registration.');
    }

    // Get driver documents
    // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
    const documents = await convex.query(api.queries.drivers.getDocumentsByDriver, {
      driverId: driver._id,
      sessionToken: sessionToken || undefined,
    });

    return ResponseFactory.success({
      documents: documents || [],
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch driver documents.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

/**
 * @swagger
 * /driver/documents:
 *   post:
 *     summary: Upload Driver Document
 *     description: Upload a document for driver verification (license, registration, insurance, photo)
 *     tags: [Driver]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *               - file
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [license, registration, insurance, photo]
 *                 description: Document type
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: Document file to upload
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
 *                     driver:
 *                       type: object
 *                       description: Updated driver profile with document
 *       400:
 *         description: Validation error - missing required fields or invalid file
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only drivers can upload documents
 *       404:
 *         description: Driver profile not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedDriver(request);
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get driver profile by user email
    // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
    const driver = await convex.query(api.queries.drivers.getByUserId, {
      userId,
      sessionToken: sessionToken || undefined,
    });

    if (!driver) {
      return ResponseFactory.notFound('Driver profile not found. Please complete your driver registration.');
    }

    // Parse FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string;

    // Validate request
    if (!file) {
      return ResponseFactory.validationError('No file uploaded.');
    }

    if (!type || !['license', 'registration', 'insurance', 'photo'].includes(type)) {
      return ResponseFactory.validationError('Invalid document type. Must be one of: license, registration, insurance, photo');
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return ResponseFactory.validationError('File size exceeds 10MB limit.');
    }

    // Validate file type (images and PDFs)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return ResponseFactory.validationError('Invalid file type. Only images (JPEG, PNG, WebP) and PDFs are allowed.');
    }

    // 1. Generate a Convex upload URL
    const uploadUrl = await convex.mutation(api.mutations.documents.generateUploadUrl);

    // 2. Upload the file to Convex storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: buffer,
    });

    if (!uploadRes.ok) {
      return ResponseFactory.validationError('Failed to upload file to storage.');
    }

    const result = await uploadRes.json();
    if (!result.storageId) {
      return ResponseFactory.internalError('No storageId in upload response.');
    }

    const { storageId } = result;
    const fileUrl = `/api/files/${storageId}`;

    // 3. Update driver document via Convex mutation
    const updatedDriver = await convex.mutation(api.mutations.drivers.uploadDocument, {
      driverId: driver._id,
      type,
      url: fileUrl,
      verified: false, // Documents need to be verified by admin
    });

    return ResponseFactory.success({
      driver: updatedDriver,
      message: 'Document uploaded successfully. It will be reviewed by our team.',
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to upload document.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

