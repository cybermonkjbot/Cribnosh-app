export const runtime = 'nodejs';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling, ErrorFactory, errorHandler } from '@/lib/errors';
import { EmailService } from '@/lib/email/email.service';
import { EmailPayload } from '@/lib/email/types';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { addToBroadcastList } from '@/lib/email/addToBroadcastList';

const RESEND_API_KEY = process.env.RESEND_API_KEY;

// Lazy initialization to prevent build-time errors
let emailService: EmailService | null = null;

function getEmailService(): EmailService | null {
  if (!emailService && RESEND_API_KEY) {
    try {
      emailService = new EmailService({
        resend: {
          apiKey: RESEND_API_KEY,
        },
      });
    } catch (error) {
      console.error('Failed to initialize EmailService:', error);
      return null;
    }
  }
  return emailService;
}

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Submit contact form
 *     description: Submit a contact form with user details and message
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - subject
 *               - message
 *             properties:
 *               firstName:
 *                 type: string
 *                 description: User's first name
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 description: User's last name
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: "john.doe@example.com"
 *               subject:
 *                 type: string
 *                 description: Subject of the contact message
 *                 example: "Question about CribNosh"
 *               message:
 *                 type: string
 *                 description: The contact message
 *                 example: "I have a question about your meal platform..."
 *     responses:
 *       202:
 *         description: Contact form submitted successfully
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
 *                   example: "Contact form submitted successfully"
 *                 messageId:
 *                   type: string
 *                   description: Email message ID
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       503:
 *         description: Service unavailable
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  const emailService = getEmailService();
  if (!emailService) {
    throw ErrorFactory.serviceUnavailable('Email service not configured', {
      endpoint: '/api/contact',
      method: 'POST'
    });
  }

  // Parse request body
  const data = await request.json();
  const { firstName, lastName, email, subject, message } = data;

  // Validate required fields
  const requiredFields = ['firstName', 'lastName', 'email', 'subject', 'message'];
  const missingFields = requiredFields.filter(field => 
    !data[field] || typeof data[field] !== 'string'
  );

  if (missingFields.length > 0) {
    throw ErrorFactory.validation(
      `Missing required fields: ${missingFields.join(', ')}`,
      { 
        endpoint: '/api/contact',
        method: 'POST',
        missingFields 
      }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    throw ErrorFactory.validation('Invalid email format', {
      endpoint: '/api/contact',
      method: 'POST',
      email
    });
  }

  // Create email payload
  const payload: EmailPayload = {
    to: 'support@cribnosh.com',
    from: 'earlyaccess@emails.cribnosh.com',
    subject: `[Contact] ${subject} from ${firstName} ${lastName}`.trim(),
    text: message,
  };

  // Send email
  const result = await emailService.send(payload);

  // Add to broadcast list
  await addToBroadcastList({ email, firstName, lastName });

  return errorHandler.createSuccessResponse({
    success: true,
    message: 'Contact form submitted successfully',
    messageId: result,
  }, 202);
}

/**
 * GET /api/contact - Get contact information
 */
async function handleGET(): Promise<NextResponse> {
  return errorHandler.createSuccessResponse({
    success: true,
    message: 'Contact API endpoint information',
    data: {
      supportedMethods: ['POST', 'OPTIONS'],
      description: 'Submit contact form with user details and message',
      requiredFields: ['firstName', 'lastName', 'email', 'subject', 'message'],
      endpoint: '/api/contact',
      version: '1.0.0'
    }
  });
}

/**
 * OPTIONS /api/contact - Handle CORS preflight
 */
async function handleOPTIONS(): Promise<NextResponse> {
  return ResponseFactory.options(['GET', 'POST', 'OPTIONS']);
}

// Export handlers with middleware
export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const OPTIONS = withAPIMiddleware(withErrorHandling(handleOPTIONS));
