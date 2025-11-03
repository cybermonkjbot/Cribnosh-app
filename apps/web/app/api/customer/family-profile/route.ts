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
 *             required:
 *               - family_members
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
 *                       example: "John Doe"
 *                     email:
 *                       type: string
 *                       format: email
 *                       example: "john@example.com"
 *                     phone:
 *                       type: string
 *                       example: "+44123456789"
 *                     relationship:
 *                       type: string
 *                       example: "spouse"
 *               shared_payment_methods:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *               shared_orders:
 *                 type: boolean
 *                 default: true
 *                 example: true
 *     responses:
 *       200:
 *         description: Family profile setup successfully
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
 *                   example: "Family profile setup successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     family_profile_id:
 *                       type: string
 *                       example: "fp_123456"
 *                     family_members:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                             example: "fm_123"
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             example: "john@example.com"
 *                           phone:
 *                             type: string
 *                             example: "+44123456789"
 *                           relationship:
 *                             type: string
 *                             example: "spouse"
 *                           status:
 *                             type: string
 *                             enum: [pending_invitation, accepted, declined]
 *                             example: "pending_invitation"
 *                     settings:
 *                       type: object
 *                       properties:
 *                         shared_payment_methods:
 *                           type: boolean
 *                           example: true
 *                         shared_orders:
 *                           type: boolean
 *                           example: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-15T10:30:00Z"
 *       400:
 *         description: Invalid family member data or validation error
 *       401:
 *         description: Unauthorized - invalid or missing token
 *       409:
 *         description: Family profile already exists
 *     security:
 *       - bearerAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return createSpecErrorResponse(
        'Invalid or missing token',
        'UNAUTHORIZED',
        401
      );
    }

    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return createSpecErrorResponse(
        'Invalid or expired token',
        'UNAUTHORIZED',
        401
      );
    }

    if (!payload.roles?.includes('customer')) {
      return createSpecErrorResponse(
        'Only customers can setup family profiles',
        'FORBIDDEN',
        403
      );
    }

    // Parse and validate request body
    let body: any;
    try {
      body = await request.json();
    } catch {
      return createSpecErrorResponse(
        'Invalid JSON body',
        'BAD_REQUEST',
        400
      );
    }

    const { family_members, shared_payment_methods = true, shared_orders = true } = body;

    // Validation
    if (!Array.isArray(family_members) || family_members.length === 0) {
      return createSpecErrorResponse(
        'family_members is required and must be a non-empty array',
        'BAD_REQUEST',
        400
      );
    }

    // Validate each family member
    for (const member of family_members) {
      if (!member.name || typeof member.name !== 'string') {
        return createSpecErrorResponse(
          'Each family member must have a name',
          'BAD_REQUEST',
          400
        );
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

    const convex = getConvexClient();
    const userId = payload.user_id;

    // Check if family profile already exists
    const existingProfile = await convex.query(api.queries.familyProfiles.getByUserId, {
      userId,
    });
    if (existingProfile) {
      return createSpecErrorResponse(
        'Family profile already exists',
        'CONFLICT',
        409
      );
    }

    // Create family profile
    const familyProfileId = await convex.mutation(api.mutations.familyProfiles.create, {
      userId,
      family_members,
      shared_payment_methods,
      shared_orders,
    });

    // Get the created profile
    const familyProfileData = await convex.query(api.queries.familyProfiles.getByUserId, {
      userId,
    });

    if (!familyProfileData) {
      return createSpecErrorResponse(
        'Failed to create family profile',
        'INTERNAL_ERROR',
        500
      );
    }

    // Format response
    const familyProfile = {
      family_profile_id: familyProfileId,
      family_members: familyProfileData.family_members.map((member: any) => ({
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone || null,
        relationship: member.relationship,
        status: member.status,
      })),
      settings: {
        shared_payment_methods: familyProfileData.shared_payment_methods,
        shared_orders: familyProfileData.shared_orders,
      },
      created_at: new Date(familyProfileData.created_at).toISOString(),
    };

    // Send invitation emails to family members
    const inviterUser = await convex.query(api.queries.users.getById, { userId });
    const inviterName = inviterUser?.name || 'A family member';

    for (const member of familyProfileData.family_members) {
      if (member.status === 'pending_invitation' && member.email) {
        sendFamilyInvitationEmail(
          member.email,
          inviterName,
          familyProfileId
        ).catch((error) => {
          console.error(`Failed to send invitation to ${member.email}:`, error);
        });
      }
    }

    return ResponseFactory.success(
      familyProfile,
      'Family profile setup successfully'
    );
  } catch (error: any) {
    return createSpecErrorResponse(
      error.message || 'Failed to setup family profile',
      'INTERNAL_ERROR',
      500
    );
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

