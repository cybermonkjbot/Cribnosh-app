import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getErrorMessage } from '@/types/errors';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { generateDataDownload } from '@/lib/services/data-compilation';
import { Id } from '@/convex/_generated/dataModel';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { logger } from '@/lib/utils/logger';
const MAX_DOWNLOAD_REQUESTS_PER_24H = 1;
const DOWNLOAD_EXPIRY_HOURS = 48; // Data download link expires in 48 hours

/**
 * @swagger
 * /customer/account/download-data:
 *   post:
 *     summary: Request download of all account data (GDPR compliance)
 *     description: Request download of all account data. The user will receive an email when the data is ready for download.
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Data download request submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Your data download request has been submitted. You'll receive an email when it's ready."
 *                 data:
 *                   type: object
 *                   properties:
 *                     download_url:
 *                       type: string
 *                       format: uri
 *                       example: "https://cribnosh.com/api/customer/account/download-data/abc123def456"
 *                     expires_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-17T10:30:00Z"
 *                     status:
 *                       type: string
 *                       enum: [processing, pending]
 *                       example: "processing"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       429:
 *         description: Too many download requests (max 1 per 24 hours)
 *     security:
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClientFromRequest(request);

    // Check if user exists
    const user = await convex.query(api.queries.users.getById, { userId });
    if (!user) {
      return createSpecErrorResponse(
        'User not found',
        'NOT_FOUND',
        404
      );
    }

    // Check rate limit: max 1 request per 24 hours
    const recentDownloads = await convex.query(
      api.queries.dataDownloads.getRecentByUserId,
      {
        userId,
        hours: 24,
      }
    );

    if (recentDownloads && recentDownloads.length >= MAX_DOWNLOAD_REQUESTS_PER_24H) {
      return createSpecErrorResponse(
        'Too many download requests. Maximum 1 request per 24 hours.',
        'TOO_MANY_REQUESTS',
        429
      );
    }

    // Generate download token and URL
    const downloadToken = `gdpr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = Date.now() + DOWNLOAD_EXPIRY_HOURS * 60 * 60 * 1000;
    const downloadUrl = `https://cribnosh.com/api/customer/account/download-data/${downloadToken}`;

    // Store download request
    await convex.mutation(api.mutations.dataDownloads.create, {
      userId,
      download_token: downloadToken,
      expires_at: expiresAt,
    });

    // Trigger async job to compile user data and send email when ready
    generateDataDownload(userId as Id<'users'>, downloadToken, expiresAt).catch((error) => {
      logger.error('Failed to generate data download:', error);
    });

    return ResponseFactory.success(
      {
        download_url: downloadUrl,
        expires_at: new Date(expiresAt).toISOString(),
        status: 'processing', // or 'pending' if processing asynchronously
      },
      "Your data download request has been submitted. You'll receive an email when it's ready."
    );
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return createSpecErrorResponse(
      getErrorMessage(error, 'Failed to process data download request'),
      'INTERNAL_ERROR',
      500
    );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

