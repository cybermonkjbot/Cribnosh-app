import { api } from '@/convex/_generated/api';
import { fetchQuery } from 'convex/nextjs';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';

/**
 * @swagger
 * /functions/admin/getLiveReports:
 *   post:
 *     summary: Get Live Session Reports (Admin)
 *     description: Retrieve detailed reports for live streaming sessions with optional filtering by status and channel. This endpoint provides comprehensive reporting data for administrative oversight and compliance monitoring.
 *     tags: [Admin, Live Streaming, Reports]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [active, ended, paused, reported, flagged]
 *                 description: Filter reports by session status
 *                 example: "ended"
 *               channelName:
 *                 type: string
 *                 description: Filter reports by specific channel name
 *                 example: "chef_mario_cooking"
 *               dateRange:
 *                 type: object
 *                 properties:
 *                   start:
 *                     type: string
 *                     format: date-time
 *                     description: Start date for report filtering
 *                     example: "2024-01-01T00:00:00Z"
 *                   end:
 *                     type: string
 *                     format: date-time
 *                     description: End date for report filtering
 *                     example: "2024-01-31T23:59:59Z"
 *     responses:
 *       200:
 *         description: Live session reports retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   description: Array of live session reports
 *                   items:
 *                     type: object
 *                     properties:
 *                       reportId:
 *                         type: string
 *                         description: Unique report identifier
 *                         example: "report_123"
 *                       sessionId:
 *                         type: string
 *                         description: Associated live session ID
 *                         example: "session_456"
 *                       chefId:
 *                         type: string
 *                         description: Chef ID who hosted the session
 *                         example: "j1234567890abcdef"
 *                       channelName:
 *                         type: string
 *                         description: Channel name for the session
 *                         example: "chef_mario_cooking"
 *                       status:
 *                         type: string
 *                         enum: [active, ended, paused, reported, flagged]
 *                         description: Current session status
 *                         example: "ended"
 *                       reportType:
 *                         type: string
 *                         enum: [automated, manual, user_report, system_flag]
 *                         description: Type of report generated
 *                         example: "automated"
 *                       reportReason:
 *                         type: string
 *                         description: Reason for the report
 *                         example: "Content policy violation"
 *                       severity:
 *                         type: string
 *                         enum: [low, medium, high, critical]
 *                         description: Severity level of the report
 *                         example: "medium"
 *                       reportedBy:
 *                         type: string
 *                         nullable: true
 *                         description: User ID who reported (if manual report)
 *                         example: "j0987654321fedcba"
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                         description: Report creation timestamp
 *                         example: "2024-01-15T14:30:00Z"
 *                       sessionDetails:
 *                         type: object
 *                         properties:
 *                           startTime:
 *                             type: string
 *                             format: date-time
 *                             description: Session start time
 *                             example: "2024-01-15T10:00:00Z"
 *                           endTime:
 *                             type: string
 *                             format: date-time
 *                             nullable: true
 *                             description: Session end time
 *                             example: "2024-01-15T12:00:00Z"
 *                           peakViewers:
 *                             type: number
 *                             description: Peak concurrent viewers
 *                             example: 75
 *                           totalViewers:
 *                             type: number
 *                             description: Total unique viewers
 *                             example: 150
 *                           duration:
 *                             type: number
 *                             description: Session duration in minutes
 *                             example: 120
 *                       flaggedContent:
 *                         type: array
 *                         description: Specific content that was flagged
 *                         items:
 *                           type: object
 *                           properties:
 *                             type:
 *                               type: string
 *                               enum: [comment, reaction, video_content, audio_content]
 *                               description: Type of flagged content
 *                               example: "comment"
 *                             content:
 *                               type: string
 *                               description: The flagged content
 *                               example: "Inappropriate language detected"
 *                             timestamp:
 *                               type: number
 *                               description: When the content was flagged (seconds into stream)
 *                               example: 1800
 *                       actions:
 *                         type: array
 *                         description: Actions taken based on the report
 *                         items:
 *                           type: object
 *                           properties:
 *                             action:
 *                               type: string
 *                               enum: [warning_sent, session_ended, user_muted, content_removed, no_action]
 *                               description: Action taken
 *                               example: "warning_sent"
 *                             takenBy:
 *                               type: string
 *                               description: Admin user ID who took the action
 *                               example: "j1122334455fedcba"
 *                             timestamp:
 *                               type: string
 *                               format: date-time
 *                               description: When the action was taken
 *                               example: "2024-01-15T14:35:00Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Bad request - invalid status or date range
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
 *     security: []
 */

export async function POST(req: NextRequest) {
  const { status, channelName } = await req.json();
  const result = await fetchQuery(api.queries.liveSessions.adminGetLiveReports, {
    status,
  });
  return ResponseFactory.success(result);
} 