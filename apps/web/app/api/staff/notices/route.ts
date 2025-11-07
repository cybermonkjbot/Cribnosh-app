import { api } from '@/convex/_generated/api';
import { getConvexClient } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withStaffAuth } from '@/lib/api/staff-middleware';

/**
 * @swagger
 * /staff/notices:
 *   get:
 *     summary: Get Staff Notices
 *     description: Retrieve active notices and announcements for the authenticated staff member
 *     tags: [Staff, Notices, Announcements]
 *     responses:
 *       200:
 *         description: Staff notices retrieved successfully
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
 *                     notices:
 *                       type: array
 *                       description: Array of active staff notices
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Notice ID
 *                             example: "j1234567890abcdef"
 *                           title:
 *                             type: string
 *                             description: Notice title
 *                             example: "System Maintenance Scheduled"
 *                           content:
 *                             type: string
 *                             description: Notice content
 *                             example: "Scheduled maintenance will occur on Sunday from 2-4 AM"
 *                           type:
 *                             type: string
 *                             enum: [info, warning, urgent, maintenance, policy, training]
 *                             description: Notice type
 *                             example: "maintenance"
 *                           priority:
 *                             type: string
 *                             enum: [low, medium, high, critical]
 *                             description: Notice priority
 *                             example: "high"
 *                           department:
 *                             type: string
 *                             nullable: true
 *                             description: Target department (null for all departments)
 *                             example: "customer_support"
 *                           position:
 *                             type: string
 *                             nullable: true
 *                             description: Target position (null for all positions)
 *                             example: "manager"
 *                           isActive:
 *                             type: boolean
 *                             description: Whether the notice is currently active
 *                             example: true
 *                           startDate:
 *                             type: string
 *                             format: date-time
 *                             description: Notice start date
 *                             example: "2024-01-15T00:00:00.000Z"
 *                           endDate:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: Notice end date (null for indefinite)
 *                             example: "2024-01-20T23:59:59.999Z"
 *                           createdBy:
 *                             type: string
 *                             description: User ID who created the notice
 *                             example: "j1234567890abcdef"
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             description: Notice creation timestamp
 *                             example: "2024-01-15T10:00:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: Last update timestamp
 *                             example: "2024-01-15T15:30:00.000Z"
 *                           metadata:
 *                             type: object
 *                             nullable: true
 *                             description: Additional notice metadata
 *                             example: {"requiresAcknowledgment": true, "externalLink": "https://example.com/more-info"}
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Staff user not found
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
async function handleGET(request: NextRequest, user: any) {
  const convex = getConvexClient();
  // Fetch user document by userId
  const staff = await convex.query(api.queries.users.getById, { userId: user._id });
  if (!staff) {
    return ResponseFactory.notFound('Staff user not found');
  }
  // Fetch staff assignment (department, position) from staffAssignments table
  const assignment = await convex.query(api.queries.staff.getStaffAssignmentByUser, { userId: user._id });
  // Use undefined instead of null for optional parameters
  const department = assignment?.department || staff.department || undefined;
  const position = assignment?.position || staff.position || undefined;
  // Fetch active staff notices
  const notices = await convex.query(api.queries.staff.getActiveStaffNotices, { department, position });
  return ResponseFactory.success({ notices });
}

export const GET = withErrorHandling(withStaffAuth(handleGET)); 