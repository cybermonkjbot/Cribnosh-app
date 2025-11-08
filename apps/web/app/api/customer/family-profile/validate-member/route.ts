import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /customer/family-profile/validate-member:
 *   post:
 *     summary: Validate if a family member email already has a Cribnosh account
 *     description: Check if an email address is already associated with a Cribnosh user account
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Validation result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 exists:
 *                   type: boolean
 *                 userId:
 *                   type: string
 *                   description: User ID if account exists
 *       400:
 *         description: Invalid email format
 *       401:
 *         description: Unauthorized
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    await getAuthenticatedCustomer(request);

    // Parse and validate request body
    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return createSpecErrorResponse('Invalid JSON body', 'BAD_REQUEST', 400);
    }

    const { email } = body;

    // Validate email format
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return createSpecErrorResponse('Valid email is required', 'BAD_REQUEST', 400);
    }

    const convex = getConvexClientFromRequest(request);

    // Check if user exists by email
    const existingUser = await convex.query(api.queries.users.getUserByEmail, {
      email: email.toLowerCase().trim(),
    });

    if (existingUser) {
      return ResponseFactory.success(
        {
          exists: true,
          userId: existingUser._id,
        },
        'User account found'
      );
    }

    return ResponseFactory.success(
      {
        exists: false,
      },
      'No account found for this email'
    );
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = getErrorMessage(error);
    return createSpecErrorResponse(
      errorMessage || 'Failed to validate member',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

