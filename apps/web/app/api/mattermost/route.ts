import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { ErrorCode, ErrorFactory, errorHandler, ErrorSeverity, withErrorHandling } from '@/lib/errors';
import { mattermostService } from '@/lib/mattermost';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';

/**
 * @swagger
 * /mattermost:
 *   post:
 *     summary: Send Mattermost Notification
 *     description: Send notifications to Mattermost channels for team communication and alerts
 *     tags: [Integrations, Notifications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [test, custom, system-health]
 *                 description: Type of notification to send
 *                 example: "custom"
 *               channel:
 *                 type: string
 *                 nullable: true
 *                 description: Target channel ID (uses default if not provided)
 *                 example: "channel1234567890abcdef"
 *               message:
 *                 type: string
 *                 nullable: true
 *                 description: Custom message content (required for 'custom' type)
 *                 example: "New order received: #12345 for £25.99"
 *               data:
 *                 type: object
 *                 nullable: true
 *                 description: Additional data for system-health notifications
 *                 properties:
 *                   status:
 *                     type: string
 *                     enum: [healthy, degraded, unhealthy]
 *                     example: "healthy"
 *                   message:
 *                     type: string
 *                     example: "System health check completed"
 *                   details:
 *                     type: object
 *                     nullable: true
 *                     description: Additional health check details
 *                     example: {"uptime": 86400, "memory": "512MB"}
 *     responses:
 *       200:
 *         description: Notification sent successfully
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
 *                       example: "Mattermost notification sent successfully"
 *                     type:
 *                       type: string
 *                       example: "custom"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - invalid type or missing message
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Service unavailable - Mattermost not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error or external service error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 *     x-integration:
 *       description: |
 *         This endpoint integrates with Mattermost for team notifications:
 *         
 *         **Notification Types:**
 *         - `test`: Send a test message to verify configuration
 *         - `custom`: Send a custom message with specified content
 *         - `system-health`: Send system health status notifications
 *         
 *         **Configuration:**
 *         - Requires either MATTERMOST_WEBHOOK_URL or MATTERMOST_BOT_TOKEN + MATTERMOST_SERVER_URL
 *         - Uses MATTERMOST_CHANNEL_ID as default channel if not specified
 *         - Supports both webhook and API-based messaging
 *         
 *         **Use Cases:**
 *         - Order notifications for kitchen staff
 *         - System alerts for admin team
 *         - Customer service notifications
 *         - Development team updates
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  const data = await request.json();

  if (!mattermostService.isConfigured()) {
    throw ErrorFactory.custom(
      ErrorCode.SERVICE_UNAVAILABLE,
      'Mattermost is not configured. Please set MATTERMOST_WEBHOOK_URL or MATTERMOST_BOT_TOKEN and MATTERMOST_SERVER_URL',
      ErrorSeverity.HIGH
    );
  }

  let success = false;

  switch (data.type) {
    case 'test':
      success = await mattermostService.sendAPIMessage({
        channel_id: data.channel || process.env.MATTERMOST_CHANNEL_ID!,
        message: ':wave: Hello from CribNosh! This is a test message.',
        props: {},
      });
      break;

    case 'custom':
      if (!data.message) {
        throw ErrorFactory.custom(
          ErrorCode.VALIDATION_ERROR,
          'Message is required for custom notifications',
          ErrorSeverity.MEDIUM
        );
      }
      success = await mattermostService.sendAPIMessage({
        channel_id: data.channel || process.env.MATTERMOST_CHANNEL_ID!,
        message: data.message,
        props: {},
      });
      break;

    case 'system-health':
      success = await mattermostService.notifySystemHealth({
        status: data.data?.status || 'healthy',
        message: data.data?.message || 'System health check completed',
        details: data.data?.details,
      });
      break;

    default:
      throw ErrorFactory.custom(
        ErrorCode.VALIDATION_ERROR,
        'Invalid notification type',
        ErrorSeverity.MEDIUM
      );
  }

  if (!success) {
    throw ErrorFactory.custom(
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      'Failed to send Mattermost notification',
      ErrorSeverity.HIGH
    );
  }

  return errorHandler.createSuccessResponse({
    success: true,
    message: 'Mattermost notification sent successfully',
    type: data.type,
  });
}

/**
 * GET /api/mattermost - Check Mattermost configuration status
 */
async function handleGET(): Promise<NextResponse> {
  const isConfigured = mattermostService.isConfigured();
  
  return errorHandler.createSuccessResponse({
    configured: isConfigured,
    webhook: !!process.env.MATTERMOST_WEBHOOK_URL,
    api: !!(process.env.MATTERMOST_BOT_TOKEN && process.env.MATTERMOST_SERVER_URL),
    channel: process.env.MATTERMOST_CHANNEL_ID,
    team: process.env.MATTERMOST_TEAM_ID,
  });
}

/**
 * OPTIONS /api/mattermost - Handle CORS preflight
 */
async function handleOPTIONS(): Promise<NextResponse> {
  return ResponseFactory.options(['GET', 'POST', 'OPTIONS']);
}

// Export handlers with middleware
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const OPTIONS = withAPIMiddleware(withErrorHandling(handleOPTIONS)); 