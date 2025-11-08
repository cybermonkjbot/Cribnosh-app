import { getUserFromRequest } from '@/lib/auth/session';
import { api, getConvexClientFromRequest } from '@/lib/conxed-client';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

/**
 * @swagger
 * /staff/clockin-status:
 *   get:
 *     summary: Get Staff Clock-In Status
 *     description: Retrieve the current clock-in status for the authenticated staff member. This endpoint checks if the staff member has clocked in today and provides their current work status for time tracking and payroll purposes.
 *     tags: [Staff, Time Tracking, Clock-In]
 *     responses:
 *       200:
 *         description: Clock-in status retrieved successfully
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
 *                     clockedIn:
 *                       type: boolean
 *                       description: Whether the staff member is currently clocked in
 *                       example: true
 *                     staffId:
 *                       type: string
 *                       description: ID of the staff member
 *                       example: "j1234567890abcdef"
 *                     currentDate:
 *                       type: string
 *                       format: date
 *                       description: Current date for the status check
 *                       example: "2024-01-15"
 *                     timeLogs:
 *                       type: array
 *                       description: Today's time logs for the staff member
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Time log ID
 *                             example: "timelog_1234567890abcdef"
 *                           staffId:
 *                             type: string
 *                             description: Staff member ID
 *                             example: "j1234567890abcdef"
 *                           clockInTime:
 *                             type: string
 *                             format: date-time
 *                             description: Clock-in timestamp
 *                             example: "2024-01-15T09:00:00Z"
 *                           clockOutTime:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: Clock-out timestamp (if clocked out)
 *                             example: null
 *                           totalHours:
 *                             type: number
 *                             nullable: true
 *                             description: Total hours worked (if clocked out)
 *                             example: null
 *                           status:
 *                             type: string
 *                             enum: [clocked_in, clocked_out, break]
 *                             description: Current work status
 *                             example: "clocked_in"
 *                           location:
 *                             type: string
 *                             nullable: true
 *                             description: Work location
 *                             example: "main_kitchen"
 *                           notes:
 *                             type: string
 *                             nullable: true
 *                             description: Additional notes about the shift
 *                             example: "Regular shift"
 *                     workDayInfo:
 *                       type: object
 *                       description: Information about the current work day
 *                       properties:
 *                         startOfDay:
 *                           type: string
 *                           format: date-time
 *                           description: Start of current work day
 *                           example: "2024-01-15T00:00:00Z"
 *                         endOfDay:
 *                           type: string
 *                           format: date-time
 *                           description: End of current work day
 *                           example: "2024-01-15T23:59:59Z"
 *                         hasActiveShift:
 *                           type: boolean
 *                           description: Whether there's an active shift today
 *                           example: true
 *                         lastClockIn:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           description: Last clock-in time today
 *                           example: "2024-01-15T09:00:00Z"
 *                         lastClockOut:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           description: Last clock-out time today
 *                           example: null
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - staff authentication required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - staff access required
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

export async function GET(request: NextRequest) {
  // Authenticate staff user
  const user = await getUserFromRequest(request);
  if (!user) {
    return ResponseFactory.unauthorized('Unauthorized');
  }
  const convex = getConvexClientFromRequest(request);
  // Fetch today's timelogs for this user
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date();
  endOfDay.setHours(23, 59, 59, 999);
  const logs = await convex.query(api.queries.timelogs.getTimelogs, {
    staffId: user._id,
    start: startOfDay.getTime(),
    end: endOfDay.getTime(),
    limit: 1,
    skip: 0,
  });
  // Determine clock-in status: if there is a log for today, assume clocked in
  // (You can refine this logic if you have explicit clock-in/clock-out events)
  const clockedIn = Array.isArray(logs) && logs.length > 0;
  return ResponseFactory.success({ clockedIn });
} 