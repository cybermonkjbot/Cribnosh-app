import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { EmailService } from '@/lib/email/email.service';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /notify-staff:
 *   post:
 *     summary: Send Staff Notification
 *     description: Send email notifications to staff members for important updates, alerts, or announcements. This endpoint allows administrators to communicate with staff through email notifications with proper formatting and unsubscribe capabilities.
 *     tags: [Staff, Notifications, Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - message
 *             properties:
 *               to:
 *                 type: string
 *                 format: email
 *                 description: Email address of the staff member to notify
 *                 example: "staff@cribnosh.com"
 *               subject:
 *                 type: string
 *                 description: Email subject line
 *                 example: "Important System Update"
 *               message:
 *                 type: string
 *                 description: Email message content (plain text)
 *                 example: "Please be aware that we will be performing system maintenance tonight from 11 PM to 1 AM EST."
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *                 default: "normal"
 *                 description: Priority level of the notification
 *                 example: "high"
 *               category:
 *                 type: string
 *                 nullable: true
 *                 description: Category of the notification
 *                 example: "system_maintenance"
 *               metadata:
 *                 type: object
 *                 additionalProperties: true
 *                 nullable: true
 *                 description: Additional metadata for the notification
 *                 example:
 *                   department: "operations"
 *                   shift: "night"
 *                   location: "main_kitchen"
 *     responses:
 *       200:
 *         description: Staff notification sent successfully
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
 *                     messageId:
 *                       type: string
 *                       nullable: true
 *                       description: Email service message ID
 *                       example: "msg_1234567890abcdef"
 *                     sentAt:
 *                       type: string
 *                       format: date-time
 *                       description: Timestamp when notification was sent
 *                       example: "2024-01-15T14:30:00Z"
 *                     recipient:
 *                       type: string
 *                       description: Email address of the recipient
 *                       example: "staff@cribnosh.com"
 *                     subject:
 *                       type: string
 *                       description: Email subject that was sent
 *                       example: "Important System Update"
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
 *         description: Unauthorized - admin access required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       422:
 *         description: Unprocessable entity - invalid email format or content
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error - email service failure
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */

async function handlePOST(req: Request) {
  try {
    const { to, subject, message } = await req.json();
    if (!to || !subject || !message) {
      return ResponseFactory.validationError('Missing required fields');
    }
    // You may want to load config from env
    const emailService = new EmailService({ resend: { apiKey: process.env.RESEND_API_KEY! } });
    const html = await emailService.getTemplateRenderer().renderGenericNotificationEmail({
      title: subject,
      message,
      unsubscribeUrl: `https://cribnosh.com/api/email-unsubscribe?email=${encodeURIComponent(to)}`,
    });
    await emailService.send({
      from: 'noreply@cribnosh.com',
      to,
      subject,
      html,
      text: message,
    });
    return ResponseFactory.success({ success: true });
  } catch (error) {
    return ResponseFactory.internalError((error as Error).message);
  }
} 

export const POST = withErrorHandling(handlePOST);