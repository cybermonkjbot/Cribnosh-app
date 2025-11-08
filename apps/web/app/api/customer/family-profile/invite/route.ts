import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { createSpecErrorResponse } from '@/lib/api/spec-error-response';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { sendFamilyInvitationEmail } from '@/lib/services/email-service';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/types/errors';
import type { InviteFamilyMemberRequest } from '@/types/family-profile';
import { NextRequest, NextResponse } from 'next/server';

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
    const { userId } = await getAuthenticatedCustomer(request);

    let body: InviteFamilyMemberRequest;
    try {
      body = await request.json() as InviteFamilyMemberRequest;
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

    const convex = getConvexClientFromRequest(request);

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
      const invitationToken = typeof result.invitation_token === 'string' ? result.invitation_token : '';
      await sendFamilyInvitationEmail(
        member.email,
        inviterName,
        profileId as string,
        invitationToken
      );
    } catch (error) {
      logger.error(`Failed to send invitation email to ${member.email}:`, error);
      // Don't fail the request if email fails
    }

    return ResponseFactory.success(
      {
        member_id: result.member_id,
        invitation_token: result.invitation_token,
      },
      'Invitation sent successfully'
    );
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    const errorMessage = getErrorMessage(error);
    return createSpecErrorResponse(
      errorMessage || 'Failed to invite family member',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

