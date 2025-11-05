import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import jwt from 'jsonwebtoken';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

function getAuthPayload(request: NextRequest): any {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid or missing token');
  }

  const token = authHeader.replace('Bearer ', ');
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    throw new Error('Invalid or expired token');
  }
}

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
    const payload = getAuthPayload(request);
    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse('Only customers can validate family members', 'FORBIDDEN', 403);
    }

    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return createSpecErrorResponse('Invalid JSON body', 'BAD_REQUEST', 400);
    }

    const { email } = body;

    // Validate email format
    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return createSpecErrorResponse('Valid email is required', 'BAD_REQUEST', 400);
    }

    const convex = getConvexClient();

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
  } catch (error: any) {
    if (error.message === 'Invalid or missing token' || error.message === 'Invalid or expired token') {
      return createSpecErrorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return createSpecErrorResponse(
      error.message || 'Failed to validate member',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

