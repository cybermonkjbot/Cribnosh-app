import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { getUserFromCookies } from '@/lib/auth/session';
import { cookies } from 'next/headers';

/**
 * @swagger
 * /staff/waitlist:
 *   post:
 *     summary: Add Lead to Waitlist (Staff)
 *     description: Allow staff to directly add leads to the waitlist without email verification
 *     tags: [Staff, Waitlist]
 *     security:
 *       - bearerAuth: []
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
 *                 description: Lead email address
 *                 example: "lead@example.com"
 *     responses:
 *       200:
 *         description: Lead successfully added to waitlist
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
 *                     waitlistId:
 *                       type: string
 *                       description: ID of the created waitlist entry
 *                       example: "j1234567890abcdef"
 *                     email:
 *                       type: string
 *                       example: "lead@example.com"
 *                     isExisting:
 *                       type: boolean
 *                       description: Whether the email was already in the waitlist
 *                       example: false
 *                 message:
 *                   type: string
 *                   example: "Lead successfully added to waitlist"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only staff can access this endpoint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify staff authentication using Convex session
    const cookieStore = await cookies();
    const user = await getUserFromCookies(cookieStore);
    
    if (!user) {
      return ResponseFactory.unauthorized('Please log in to access this endpoint.');
    }

    // Check if user has staff role
    if (!user.roles || !Array.isArray(user.roles) || !user.roles.includes('staff')) {
      return ResponseFactory.forbidden('Forbidden: Only staff can access this endpoint.');
    }

    const data = await request.json();
    const { email } = data;

    // Validate required fields
    if (!email) {
      return ResponseFactory.badRequest('Email is required.');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return ResponseFactory.badRequest('Invalid email format.');
    }

    const convex = getConvexClient();

    // Add directly to waitlist using the mutation
    const result = await convex.mutation(api.mutations.waitlist.addToWaitlist, {
      email,
      name: undefined,
      phone: undefined,
      location: undefined,
      source: 'staff_referral',
      referralCode: undefined, // Staff-added leads don't have referral codes
      addedBy: user._id,
      addedByName: user.email,
    });

    if (!result.success) {
      return ResponseFactory.internalError('Failed to add lead to waitlist.');
    }

    // Log the staff action
    await convex.mutation(api.mutations.admin.logActivity, {
      type: 'staff_added_lead',
      description: `Staff member added lead ${email} to waitlist`,
      userId: user._id,
      metadata: {
        entityId: result.waitlistId,
        entityType: 'waitlist',
        details: {
          staffEmail: user.email,
          leadEmail: email,
          source: 'staff_referral',
          priority: 'medium',
        },
      },
    });

    return ResponseFactory.success({
      waitlistId: result.waitlistId,
      email,
      isExisting: result.isExisting,
    }, 'Lead successfully added to waitlist');

  } catch (error: unknown) {
    console.error('[STAFF WAITLIST] Error:', error);
    return ResponseFactory.internalError(
      error instanceof Error ? error.message : 'Failed to add lead to waitlist.'
    );
  }
}

/**
 * @swagger
 * /staff/waitlist:
 *   get:
 *     summary: Get Waitlist Entries (Staff)
 *     description: Retrieve waitlist entries for staff viewing
 *     tags: [Staff, Waitlist]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [active, converted, inactive, all]
 *           default: all
 *         description: Filter by waitlist status
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by email or name
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of entries to return
 *     responses:
 *       200:
 *         description: Waitlist entries retrieved successfully
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
 *                     entries:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Waitlist entry ID
 *                           email:
 *                             type: string
 *                             format: email
 *                           name:
 *                             type: string
 *                           phone:
 *                             type: string
 *                           location:
 *                             type: string
 *                           source:
 *                             type: string
 *                           status:
 *                             type: string
 *                             enum: [active, converted, inactive]
 *                           priority:
 *                             type: string
 *                             enum: [low, medium, high, vip]
 *                           joinedAt:
 *                             type: number
 *                           notes:
 *                             type: string
 *                     total:
 *                       type: number
 *                       description: Total number of entries
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only staff can access
 *       500:
 *         description: Internal server error
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verify staff authentication using Convex session
    const cookieStore = await cookies();
    const user = await getUserFromCookies(cookieStore);
    
    if (!user) {
      console.error('[STAFF WAITLIST GET] No user found in cookies');
      return ResponseFactory.unauthorized('Please log in to access this endpoint.');
    }

    console.log('[STAFF WAITLIST GET] User found:', { 
      id: user._id, 
      email: user.email, 
      roles: user.roles 
    });

    // Check if user has staff or admin role (admins can also access staff features)
    const hasStaffAccess = user.roles && Array.isArray(user.roles) && 
      (user.roles.includes('staff') || user.roles.includes('admin'));
    
    if (!hasStaffAccess) {
      console.error('[STAFF WAITLIST GET] User does not have staff access:', user.roles);
      return ResponseFactory.forbidden('Forbidden: Only staff can access this endpoint.');
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'all';
    const search = searchParams.get('search') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    const convex = getConvexClient();

    console.log('[STAFF WAITLIST GET] Querying waitlist with params:', {
      status: status === 'all' ? undefined : status,
      search,
      limit
    });

    // Get waitlist entries
    const entries = await convex.query(api.queries.waitlist.getWaitlistEntries, {
      status: status === 'all' ? undefined : status,
      search,
      limit,
    });

    console.log('[STAFF WAITLIST GET] Retrieved entries:', entries.length);

    return ResponseFactory.success({
      entries,
      total: entries.length,
    }, 'Waitlist entries retrieved successfully');

  } catch (error: unknown) {
    console.error('[STAFF WAITLIST GET] Error:', error);
    return ResponseFactory.internalError(
      error instanceof Error ? error.message : 'Failed to retrieve waitlist entries.'
    );
  }
}

export const POST = withErrorHandling(handlePOST);
export const GET = withErrorHandling(handleGET);
