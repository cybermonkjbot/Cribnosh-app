import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedAdmin } from '@/lib/api/session-auth';
import { getConvexClient } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { NextRequest } from 'next/server';

/**
 * @swagger
 * /admin/realtime-broadcast:
 *   post:
 *     summary: Broadcast Real-time Event (Admin)
 *     description: Broadcast real-time events to all connected clients through Convex subscriptions. This endpoint allows administrators to send system-wide notifications, updates, or announcements to all active users in real-time.
 *     tags: [Admin, Real-time, Broadcasting]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *             properties:
 *               event:
 *                 type: string
 *                 description: Event type identifier for real-time broadcasting
 *                 example: "system.announcement"
 *               data:
 *                 type: object
 *                 additionalProperties: true
 *                 description: Event payload data to broadcast
 *                 example:
 *                   title: "System Maintenance"
 *                   message: "Scheduled maintenance will begin in 30 minutes"
 *                   type: "warning"
 *                   duration: 1800
 *               targetAudience:
 *                 type: string
 *                 enum: [all, customers, chefs, admins, staff]
 *                 default: "all"
 *                 description: Target audience for the broadcast
 *                 example: "all"
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 default: "normal"
 *                 description: Priority level of the broadcast
 *                 example: "high"
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Optional expiration time for the broadcast
 *                 example: "2024-01-15T18:00:00Z"
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 description: Additional metadata for the broadcast
 *                 example:
 *                   source: "admin_dashboard"
 *                   category: "maintenance"
 *                   version: "1.0"
 *     responses:
 *       200:
 *         description: Real-time event broadcasted successfully
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
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       description: Success message
 *                       example: "Event broadcasted via Convex"
 *                     event:
 *                       type: string
 *                       description: Event type that was broadcasted
 *                       example: "system.announcement"
 *                     changeId:
 *                       type: string
 *                       description: Unique identifier for the broadcast event
 *                       example: "change_1234567890abcdef"
 *                     timestamp:
 *                       type: number
 *                       description: Unix timestamp when event was broadcasted
 *                       example: 1705334400000
 *                     targetAudience:
 *                       type: string
 *                       description: Target audience for the broadcast
 *                       example: "all"
 *                     estimatedReach:
 *                       type: number
 *                       description: Estimated number of connected clients
 *                       example: 150
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - missing required fields
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
 *         description: Forbidden - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Unprocessable entity - invalid event data
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

async function handlePOST(request: NextRequest) {
  try {
    // Get authenticated admin from session token
    const { userId } = await getAuthenticatedAdmin(request);
    const convex = getConvexClient();
    const { event, data } = await request.json();
    if (!event) {
      return ResponseFactory.error('event is required.', 'CUSTOM_ERROR', 422);
    }
    // Insert a change event into the Convex 'changes' table for real-time subscriptions
    const changeId = await convex.mutation(api.mutations.changes.insert, {
      type: event,
      data,
      synced: false,
      timestamp: Date.now(),
    });
    
    // Audit log
    await convex.mutation(api.mutations.admin.insertAdminLog, {
      action: 'broadcast_realtime',
      details: { event, data, changeId },
      adminId: userId as Id<'users'>,
    });
    return ResponseFactory.success({ success: true, message: 'Event broadcasted via Convex', event, changeId });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to broadcast event.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 