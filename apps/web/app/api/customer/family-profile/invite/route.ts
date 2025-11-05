import { NextRequest, NextResponse } from 'next/server';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { withErrorHandling } from '@/lib/errors';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import jwt from 'jsonwebtoken';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { sendFamilyInvitationEmail } from '@/lib/services/email-service';

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
 * /customer/family-profile/invite:
 *   post:
 *     summary: Invite a family member
 *     description: Invite a new member to the family profile
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - member
 *             properties:
 *               member:
 *                 type: object
 *                 required:
 *                   - name
 *                   - email
 *                   - relationship
 *                 properties:
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   relationship:
 *                     type: string
 *                   budget_settings:
 *                     type: object
 *     responses:
 *       200:
 *         description: Invitation sent successfully
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = getAuthPayload(request);
    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse('Only customers can invite members', 'FORBIDDEN', 403);
    }

    let body: any;
    try {
      body = await request.json();
    } catch {
      return createSpecErrorResponse('Invalid JSON body', 'BAD_REQUEST', 400);
    }

    const { member, family_profile_id } = body;

    if (!member) {
      return createSpecErrorResponse('Member data is required', 'BAD_REQUEST', 400);
    }

    if (!member.name || typeof member.name !== 'string') {
      return createSpecErrorResponse('Member name is required', 'BAD_REQUEST', 400);
    }

    if (!member.email || typeof member.email !== 'string' || !member.email.includes('@')) {
      return createSpecErrorResponse('Valid member email is required', 'BAD_REQUEST', 400);
    }

    if (!member.relationship || typeof member.relationship !== 'string') {
      return createSpecErrorResponse('Member relationship is required', 'BAD_REQUEST', 400);
    }

    const convex = getConvexClient();
    const userId = payload.user_id as string;

    // Get family profile if not provided
    let profileId = family_profile_id;
    if (!profileId) {
      const profile = await convex.query(api.queries.familyProfiles.getByUserId, {
        userId: userId as any,
      });
      if (!profile) {
        return createSpecErrorResponse('Family profile not found', 'NOT_FOUND', 404);
      }
      profileId = profile._id;
    }

    // Invite member
    const result = await convex.mutation(api.mutations.familyProfiles.inviteMember, {
      family_profile_id: profileId as any,
      userId: userId as any,
      member: {
        name: member.name,
        email: member.email,
        phone: member.phone,
        relationship: member.relationship,
        budget_settings: member.budget_settings || undefined,
      },
    });

    // Send invitation email
    const inviterUser = await convex.query(api.queries.users.getById, { userId: userId as any });
    const inviterName = inviterUser?.name || 'A family member';

    try {
      await sendFamilyInvitationEmail(
        member.email,
        inviterName,
        profileId,
        result.invitation_token
      );
    } catch (error) {
      console.error(`Failed to send invitation email to ${member.email}:`, error);
      // Don't fail the request if email fails
    }

    return ResponseFactory.success(
      {
        member_id: result.member_id,
        invitation_token: result.invitation_token,
      },
      'Invitation sent successfully'
    );
  } catch (error: any) {
    if (error.message === 'Invalid or missing token' || error.message === 'Invalid or expired token') {
      return createSpecErrorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return createSpecErrorResponse(
      error.message || 'Failed to invite family member',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

