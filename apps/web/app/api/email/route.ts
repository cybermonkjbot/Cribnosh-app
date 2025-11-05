import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling, errorHandler } from '@/lib/errors';
import { EmailService } from '@/lib/email/email.service';
import { OptimisticEmailService } from '@/lib/email/optimistic-email.service';
import { EmailPayload } from '@/lib/email/types';
import { withAPIMiddleware } from '@/lib/api/middleware';

// Fallback for RESEND_API_KEY
const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_EQsb5GpW_HkaiK9VCCYjwAYH2Jd8xP5VN';

// Initialize base email service
const emailService = new EmailService({
  resend: {
    apiKey: RESEND_API_KEY!,
  },
});

// Initialize optimistic email service
const optimisticEmailService = OptimisticEmailService.getInstance(emailService);

// Ensure graceful shutdown
process.on('SIGTERM', async () => {
  // Graceful shutdown handling
  process.exit(0);
});

/**
 * @swagger
 * /email:
 *   post:
 *     summary: Send Email Optimistically
 *     description: Send email using optimistic delivery with fallback handling
 *     tags: [Email]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - to
 *               - subject
 *               - html
 *             properties:
 *               to:
 *                 type: string
 *                 description: Recipient email address
 *                 example: "user@example.com"
 *               subject:
 *                 type: string
 *                 description: Email subject line
 *                 example: "Welcome to CribNosh!"
 *               html:
 *                 type: string
 *                 description: HTML content of the email
 *                 example: "<h1>Welcome!</h1><p>Thank you for joining CribNosh.</p>"
 *               text:
 *                 type: string
 *                 nullable: true
 *                 description: Plain text version of the email
 *                 example: "Welcome! Thank you for joining CribNosh."
 *               from:
 *                 type: string
 *                 nullable: true
 *                 description: Sender email address
 *                 example: "noreply@cribnosh.com"
 *               replyTo:
 *                 type: string
 *                 nullable: true
 *                 description: Reply-to email address
 *                 example: "support@cribnosh.com"
 *               tags:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     name:
 *                       type: string
 *                       example: "template_id"
 *                     value:
 *                       type: string
 *                       example: "welcome_email"
 *                 nullable: true
 *                 description: Email tags for tracking and categorization
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     filename:
 *                       type: string
 *                       example: "menu.pdf"
 *                     content:
 *                       type: string
 *                       format: base64
 *                       example: "JVBERi0xLjQKJcOkw7zDtsO..."
 *                 nullable: true
 *                 description: Email attachments
 *               metadata:
 *                 type: object
 *                 nullable: true
 *                 description: Additional email metadata
 *                 example: {"userId": "j1234567890abcdef", "orderId": "j1234567890abcdef"}
 *     responses:
 *       202:
 *         description: Email queued for sending successfully
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
 *                     operationId:
 *                       type: string
 *                       description: Unique operation ID for tracking
 *                       example: "op_1234567890abcdef"
 *                     status:
 *                       type: string
 *                       enum: [queued, sending, sent, failed]
 *                       description: Current email status
 *                       example: "queued"
 *                     estimatedDelivery:
 *                       type: string
 *                       format: date-time
 *                       description: Estimated delivery time
 *                       example: "2024-01-15T10:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Email queued successfully"
 *       400:
 *         description: Validation error - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error or email service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  // Parse request body
  const payload = await request.json();

  // Send email optimistically
  const result = await optimisticEmailService.sendEmail(payload);

  return errorHandler.createSuccessResponse(result, 202);
}

/**
 * GET /api/email - Get email status or metrics
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const operationId = searchParams.get('operationId');

  if (operationId) {
    // Check specific operation status
    const status = await optimisticEmailService.checkEmailStatus(operationId);
    return errorHandler.createSuccessResponse(status);
  }

  // Get overall metrics
  const metrics = await optimisticEmailService.getMetrics();
  return errorHandler.createSuccessResponse(metrics);
}

/**
 * OPTIONS /api/email - Handle CORS preflight
 */
async function handleOPTIONS(request: NextRequest): Promise<NextResponse> {
  return ResponseFactory.options(['GET', 'POST', 'OPTIONS']);
}

// Export handlers with middleware
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const OPTIONS = withAPIMiddleware(withErrorHandling(handleOPTIONS));