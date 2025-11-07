import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import type { JWTPayload } from '@/types/convex-contexts';
import { getErrorMessage } from '@/types/errors';
import jwt from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

function getAuthPayload(request: NextRequest): JWTPayload {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Invalid or missing token');
  }

  const token = authHeader.replace('Bearer ', '');
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    throw new Error('Invalid or expired token');
  }
}

/**
 * @swagger
 * /customer/family-profile/members:
 *   get:
 *     summary: List all family members
 *     description: Get a list of all family members in the family profile
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Family members retrieved successfully
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = getAuthPayload(request);
    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse('Only customers can view family members', 'FORBIDDEN', 403);
    }

    const convex = getConvexClient();
    const userId = payload.user_id as string;

    const familyProfile = await convex.query(api.queries.familyProfiles.getByUserId, {
      userId: userId as any,
    });

    if (!familyProfile) {
      return ResponseFactory.success([], 'No family profile found');
    }

    const members = familyProfile.family_members.map((member: any) => ({
      id: member.id,
      user_id: member.user_id || null,
      name: member.name,
      email: member.email,
      phone: member.phone || null,
      relationship: member.relationship,
      status: member.status,
      invited_at: member.invited_at ? new Date(member.invited_at).toISOString() : null,
      accepted_at: member.accepted_at ? new Date(member.accepted_at).toISOString() : null,
      budget_settings: member.budget_settings || null,
    }));

    return ResponseFactory.success(members, 'Family members retrieved successfully');
  } catch (error: unknown) {
    const errorMessage = getErrorMessage(error);
    if (errorMessage === 'Invalid or missing token' || errorMessage === 'Invalid or expired token') {
      return createSpecErrorResponse(errorMessage, 'UNAUTHORIZED', 401);
    }
    return createSpecErrorResponse(
      errorMessage || 'Failed to get family members',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

