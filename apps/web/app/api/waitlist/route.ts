// Waitlist API endpoints for managing waitlist entries
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

interface JWTPayload {
  user_id: string;
  role: string;
  roles?: string[];
  email?: string;
  iat?: number;
  exp?: number;
}
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * @swagger
 * /waitlist:
 *   get:
 *     summary: Get Waitlist Entries (Admin)
 *     description: Retrieve paginated list of waitlist entries (admin only)
 *     tags: [Admin, Waitlist]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of waitlist entries to return
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of waitlist entries to skip
 *         example: 0
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
 *                     waitlist:
 *                       type: array
 *                       description: Array of waitlist entries
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Waitlist entry ID
 *                             example: "j1234567890abcdef"
 *                           email:
 *                             type: string
 *                             format: email
 *                             description: User email address
 *                             example: "user@example.com"
 *                           source:
 *                             type: string
 *                             description: How the user joined the waitlist
 *                             example: "website"
 *                           location:
 *                             type: object
 *                             nullable: true
 *                             description: User's location information
 *                             properties:
 *                               city:
 *                                 type: string
 *                                 example: "London"
 *                               country:
 *                                 type: string
 *                                 example: "UK"
 *                               coordinates:
 *                                 type: array
 *                                 items:
 *                                   type: number
 *                                 example: [-0.1276, 51.5074]
 *                           status:
 *                             type: string
 *                             enum: [pending, contacted, converted, removed]
 *                             description: Waitlist entry status
 *                             example: "pending"
 *                           priority:
 *                             type: string
 *                             enum: [low, medium, high, vip]
 *                             description: Priority level
 *                             example: "medium"
 *                           joinedAt:
 *                             type: number
 *                             description: Timestamp when user joined waitlist
 *                             example: 1640995200000
 *                           contactedAt:
 *                             type: number
 *                             nullable: true
 *                             description: Timestamp when user was contacted
 *                             example: 1641081600000
 *                           convertedAt:
 *                             type: number
 *                             nullable: true
 *                             description: Timestamp when user converted to customer
 *                             example: 1641168000000
 *                           metadata:
 *                             type: object
 *                             nullable: true
 *                             description: Additional waitlist metadata
 *                             example: {"referralCode": "FRIEND123", "interest": "italian_cuisine"}
 *                     total:
 *                       type: number
 *                       description: Total number of waitlist entries
 *                       example: 1250
 *                     limit:
 *                       type: number
 *                       example: 20
 *                     offset:
 *                       type: number
 *                       example: 0
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only admins can access this endpoint
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
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);if (!user.roles || !Array.isArray(user.roles) || !user.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can access this endpoint.');
    }
    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    // Pagination
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '') || DEFAULT_LIMIT;
    const offset = parseInt(searchParams.get('offset') || '') || 0;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    // Use paginated query and count query in parallel for better performance
    // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
    const paginatedPromise = convex.query(api.queries.waitlist.getAll, {
      sessionToken: sessionToken || undefined,
      limit,
      offset
    });
    // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
    const totalPromise = convex.query(api.queries.waitlist.getWaitlistCount, {
      sessionToken: sessionToken || undefined
    });
    const [paginated, total] = await Promise.all([paginatedPromise, totalPromise]) as [any[], number];
    return ResponseFactory.success({ waitlist: paginated, total, limit, offset });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch waitlist.';
    return ResponseFactory.internalError(errorMessage);
  }
}

async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, source, location } = await request.json();
    if (!email) {
      return ResponseFactory.error('Email is required.', 'CUSTOM_ERROR', 422);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ResponseFactory.error('Invalid email format.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    const waitlistId = await convex.mutation(api.mutations.waitlist.addToWaitlist, {
      email,
      source: source || '',
      location: location || null,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success({ success: true, waitlistId });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to join waitlist.';
    return ResponseFactory.internalError(errorMessage);
  }
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);if (!user.roles || !Array.isArray(user.roles) || !user.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can delete waitlist entries.');
    }
    const { waitlist_id } = await request.json();
    if (!waitlist_id) {
      return ResponseFactory.error('waitlist_id is required.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Use the existing deleteWaitlistEntry mutation
    await convex.mutation(api.mutations.waitlist.deleteWaitlistEntry, {
      entryId: waitlist_id as Id<'waitlist'>,
      sessionToken: sessionToken || undefined
    });
    
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'delete_waitlist_entry',
      details: { waitlist_id },
      adminId: userId as Id<'users'>,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete waitlist entry.';
    return ResponseFactory.internalError(errorMessage);
  }
}

async function handleBulkDelete(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);if (!user.roles || !Array.isArray(user.roles) || !user.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can bulk delete waitlist entries.');
    }
    const { waitlist_ids } = await request.json();
    if (!waitlist_ids || !Array.isArray(waitlist_ids) || waitlist_ids.length === 0) {
      return ResponseFactory.error('waitlist_ids array is required and must not be empty.', 'CUSTOM_ERROR', 422);
    }
    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Delete each waitlist entry
    const deletePromises = waitlist_ids.map((id: string) => 
      convex.mutation(api.mutations.waitlist.deleteWaitlistEntry, {
        entryId: id as Id<'waitlist'>,
        sessionToken: sessionToken || undefined
      })
    );
    await Promise.all(deletePromises);
    
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'bulk_delete_waitlist_entries',
      details: { waitlist_ids, count: waitlist_ids.length },
      adminId: userId as Id<'users'>,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.success({ success: true, deletedCount: waitlist_ids.length });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to bulk delete waitlist entries.';
    return ResponseFactory.internalError(errorMessage);
  }
}

async function handleExport(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);if (!user.roles || !Array.isArray(user.roles) || !user.roles.includes('admin')) {
      return ResponseFactory.forbidden('Forbidden: Only admins can export waitlist.');
    }
    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    const allWaitlist = await convex.query(api.queries.waitlist.getAll, {
      sessionToken: sessionToken || undefined
    });
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'export_waitlist',
      details: {},
      adminId: userId as Id<'users'>,
      sessionToken: sessionToken || undefined
    });
    return ResponseFactory.jsonDownload(allWaitlist, 'waitlist-export.json');
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to export waitlist.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));
export const BULK_DELETE = withAPIMiddleware(withErrorHandling(handleBulkDelete));
export const EXPORT = withAPIMiddleware(withErrorHandling(handleExport)); 