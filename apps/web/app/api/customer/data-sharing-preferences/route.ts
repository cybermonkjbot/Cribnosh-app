import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { logger } from '@/lib/utils/logger';

interface DataSharingPreferencesBody {
  analytics_enabled?: boolean;
  personalization_enabled?: boolean;
  marketing_enabled?: boolean;
}

/**
 * @swagger
 * /customer/data-sharing-preferences:
 *   get:
 *     summary: Get customer's data sharing preferences
 *     description: Get customer's preferences for data sharing (analytics, personalization, marketing)
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Data sharing preferences retrieved successfully
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
 *                     analytics_enabled:
 *                       type: boolean
 *                       example: true
 *                     personalization_enabled:
 *                       type: boolean
 *                       example: true
 *                     marketing_enabled:
 *                       type: boolean
 *                       example: false
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-10T10:00:00Z"
 *       401:
 *         description: Unauthorized - invalid or missing token
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);

    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Query data sharing preferences from database
    const preferences = await convex.query(api.queries.dataSharingPreferences.getByUserId, {
      userId,
      sessionToken: sessionToken || undefined
    });

    return ResponseFactory.success(preferences);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data sharing preferences';
    return createSpecErrorResponse(
      errorMessage,
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * @swagger
 * /customer/data-sharing-preferences:
 *   put:
 *     summary: Update customer's data sharing preferences
 *     description: Update customer's preferences for data sharing (analytics, personalization, marketing)
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               analytics_enabled:
 *                 type: boolean
 *                 example: true
 *               personalization_enabled:
 *                 type: boolean
 *                 example: true
 *               marketing_enabled:
 *                 type: boolean
 *                 example: false
 *     responses:
 *       200:
 *         description: Data sharing preferences updated successfully
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
 *                   example: "Data sharing preferences updated successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     analytics_enabled:
 *                       type: boolean
 *                       example: true
 *                     personalization_enabled:
 *                       type: boolean
 *                       example: true
 *                     marketing_enabled:
 *                       type: boolean
 *                       example: false
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Invalid preference data
 *       401:
 *         description: Unauthorized - invalid or missing token
 *     security:
 *       - cookieAuth: []
 */
async function handlePUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const { userId } = await getAuthenticatedCustomer(request);

    // Parse and validate request body
    let body: DataSharingPreferencesBody;
    try {
      body = await request.json() as DataSharingPreferencesBody;
    } catch {
      return createSpecErrorResponse(
        'Invalid JSON body',
        'BAD_REQUEST',
        400
      );
    }

    const { analytics_enabled, personalization_enabled, marketing_enabled } = body;

    // Validation
    if (analytics_enabled !== undefined && typeof analytics_enabled !== 'boolean') {
      return createSpecErrorResponse(
        'analytics_enabled must be a boolean',
        'BAD_REQUEST',
        400
      );
    }
    if (personalization_enabled !== undefined && typeof personalization_enabled !== 'boolean') {
      return createSpecErrorResponse(
        'personalization_enabled must be a boolean',
        'BAD_REQUEST',
        400
      );
    }
    if (marketing_enabled !== undefined && typeof marketing_enabled !== 'boolean') {
      return createSpecErrorResponse(
        'marketing_enabled must be a boolean',
        'BAD_REQUEST',
        400
      );
    }

    const convex = getConvexClientFromRequest(request);

    const sessionToken = getSessionTokenFromRequest(request);
    
    // Update data sharing preferences in database
    try {
      await convex.mutation(api.mutations.dataSharingPreferences.updateByUserId, {
        userId,
        analytics_enabled,
        personalization_enabled,
        marketing_enabled,
        sessionToken: sessionToken || undefined
      });
    } catch (mutationError: unknown) {
      logger.error('Error in updateByUserId mutation:', mutationError);
      const mutationErrorMessage = mutationError instanceof Error ? mutationError.message : 'Unknown mutation error';
      throw new Error(`Failed to update data sharing preferences: ${mutationErrorMessage}`);
    }

    // Get updated preferences
    let updatedPreferences;
    try {
      updatedPreferences = await convex.query(api.queries.dataSharingPreferences.getByUserId, {
        userId,
        sessionToken: sessionToken || undefined
      });
    } catch (queryError: unknown) {
      logger.error('Error in getByUserId query:', queryError);
      const queryErrorMessage = queryError instanceof Error ? queryError.message : 'Unknown query error';
      throw new Error(`Failed to retrieve updated preferences: ${queryErrorMessage}`);
    }

    return ResponseFactory.success(
      updatedPreferences,
      'Data sharing preferences updated successfully'
    );
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Error updating data sharing preferences:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to update data sharing preferences';
    return createSpecErrorResponse(
      errorMessage,
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));

