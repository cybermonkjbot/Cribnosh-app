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
 * /customer/family-profile:
 *   get:
 *     summary: Get family profile details
 *     description: Get the family profile for the authenticated user (as parent or member)
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Family profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = getAuthPayload(request);
    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse('Only customers can access family profiles', 'FORBIDDEN', 403);
    }

    const convex = getConvexClient();
    const userId = payload.user_id as string;

    const familyProfile = await convex.query(api.queries.familyProfiles.getByUserId, {
      userId: userId as any,
    });

    if (!familyProfile) {
      return ResponseFactory.success(null, 'No family profile found');
    }

    // Format response
    const formattedProfile = {
      family_profile_id: familyProfile._id,
      parent_user_id: familyProfile.parent_user_id,
      member_user_ids: familyProfile.member_user_ids,
      family_members: familyProfile.family_members.map((member: any) => ({
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
      })),
      settings: familyProfile.settings,
      created_at: new Date(familyProfile.created_at).toISOString(),
      updated_at: familyProfile.updated_at ? new Date(familyProfile.updated_at).toISOString() : null,
    };

    return ResponseFactory.success(formattedProfile, 'Family profile retrieved successfully');
  } catch (error: any) {
    if (error.message === 'Invalid or missing token' || error.message === 'Invalid or expired token') {
      return createSpecErrorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return createSpecErrorResponse(
      error.message || 'Failed to get family profile',
      'INTERNAL_ERROR',
      500
    );
  }
}

/**
 * @swagger
 * /customer/family-profile:
 *   post:
 *     summary: Setup family profile for shared ordering
 *     description: Create a family profile to enable shared ordering with family members
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               family_members:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - email
 *                     - relationship
 *                   properties:
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     phone:
 *                       type: string
 *                     relationship:
 *                       type: string
 *                     budget_settings:
 *                       type: object
 *                       properties:
 *                         daily_limit:
 *                           type: number
 *                         weekly_limit:
 *                           type: number
 *                         monthly_limit:
 *                           type: number
 *                         currency:
 *                           type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   shared_payment_methods:
 *                     type: boolean
 *                   shared_orders:
 *                     type: boolean
 *                   allow_child_ordering:
 *                     type: boolean
 *                   require_approval_for_orders:
 *                     type: boolean
 *                   spending_notifications:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Family profile setup successfully
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const payload = getAuthPayload(request);
    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse('Only customers can setup family profiles', 'FORBIDDEN', 403);
    }

    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return createSpecErrorResponse('Invalid JSON body', 'BAD_REQUEST', 400);
    }

    const { family_members = [], settings } = body;

    // Validate each family member if provided
    if (Array.isArray(family_members)) {
      for (const member of family_members) {
        if (!member.name || typeof member.name !== 'string') {
          return createSpecErrorResponse('Each family member must have a name', 'BAD_REQUEST', 400);
        }
        if (!member.email || typeof member.email !== 'string' || !member.email.includes('@')) {
          return createSpecErrorResponse(
            'Each family member must have a valid email',
            'BAD_REQUEST',
            400
          );
        }
        if (!member.relationship || typeof member.relationship !== 'string') {
          return createSpecErrorResponse(
            'Each family member must have a relationship',
            'BAD_REQUEST',
            400
          );
        }
      }
    }

    const convex = getConvexClient();
    const userId = payload.user_id as string;

    // Check if family profile already exists
    const existingProfile = await convex.query(api.queries.familyProfiles.getByUserId, {
      userId: userId as any,
    });
    if (existingProfile) {
      return createSpecErrorResponse('Family profile already exists', 'CONFLICT', 409);
    }

    // Create family profile
    const familyProfileId = await convex.mutation(api.mutations.familyProfiles.create, {
      userId: userId as any,
      family_members: family_members.length > 0 ? family_members : undefined,
      settings: settings
        ? {
            shared_payment_methods: settings.shared_payment_methods ?? true,
            shared_orders: settings.shared_orders ?? true,
            allow_child_ordering: settings.allow_child_ordering ?? true,
            require_approval_for_orders: settings.require_approval_for_orders ?? false,
            spending_notifications: settings.spending_notifications ?? true,
          }
        : undefined,
    });

    // Get the created profile
    const familyProfileData = await convex.query(api.queries.familyProfiles.getByUserId, {
      userId: userId as any,
    });

    if (!familyProfileData) {
      return createSpecErrorResponse('Failed to create family profile', 'INTERNAL_ERROR', 500);
    }

    // Format response
    const familyProfile = {
      family_profile_id: familyProfileId,
      parent_user_id: familyProfileData.parent_user_id,
      member_user_ids: familyProfileData.member_user_ids,
      family_members: familyProfileData.family_members.map((member: any) => ({
        id: member.id,
        user_id: member.user_id || null,
        name: member.name,
        email: member.email,
        phone: member.phone || null,
        relationship: member.relationship,
        status: member.status,
        budget_settings: member.budget_settings || null,
      })),
      settings: familyProfileData.settings,
      created_at: new Date(familyProfileData.created_at).toISOString(),
    };

    // Send invitation emails to family members
    const inviterUser = await convex.query(api.queries.users.getById, { userId: userId as any });
    const inviterName = inviterUser?.name || 'A family member';

    for (const member of familyProfileData.family_members) {
      if (member.status === 'pending_invitation' && member.email && member.invitation_token) {
        sendFamilyInvitationEmail(member.email, inviterName, familyProfileId, member.invitation_token).catch(
          (error) => {
            console.error(`Failed to send invitation to ${member.email}:`, error);
          }
        );
      }
    }

    return ResponseFactory.success(familyProfile, 'Family profile setup successfully');
  } catch (error: any) {
    if (error.message === 'Invalid or missing token' || error.message === 'Invalid or expired token') {
      return createSpecErrorResponse(error.message, 'UNAUTHORIZED', 401);
    }
    return createSpecErrorResponse(
      error.message || 'Failed to setup family profile',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
