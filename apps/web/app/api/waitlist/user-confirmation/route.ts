import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { EmailService } from '@/lib/email/email.service';
import { addToBroadcastList } from '@/lib/email/addToBroadcastList';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_EQsb5GpW_HkaiK9VCCYjwAYH2Jd8xP5VN';

const emailService = new EmailService({
  resend: {
    apiKey: RESEND_API_KEY!,
  },
});

/**
 * @swagger
 * /waitlist/user-confirmation:
 *   post:
 *     summary: Send Waitlist Confirmation
 *     description: Send confirmation email to user who joined the waitlist
 *     tags: [Waitlist, Early Access, Email]
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
 *                 description: User email address to send confirmation to
 *                 example: "user@example.com"
 *     responses:
 *       200:
 *         description: Confirmation email sent successfully
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
 *                     email:
 *                       type: string
 *                       example: "user@example.com"
 *                     confirmationSent:
 *                       type: boolean
 *                       example: true
 *                     broadcastListAdded:
 *                       type: boolean
 *                       example: true
 *                     emailDetails:
 *                       type: object
 *                       properties:
 *                         subject:
 *                           type: string
 *                           example: "You are on the waitlist!"
 *                         from:
 *                           type: string
 *                           example: "earlyaccess@emails.cribnosh.com"
 *                         to:
 *                           type: string
 *                           example: "user@example.com"
 *                         timestamp:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T10:00:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Confirmation email sent successfully"
 *       400:
 *         description: Validation error - missing email
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error - email sending failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
export async function POST(request: NextRequest) {
  const data = await request.json();
  const { email } = data;
  if (!email) {
    return ResponseFactory.validationError('Missing email');
  }
  const payload = {
    to: email,
    from: 'earlyaccess@emails.cribnosh.com',
    subject: 'You are on the waitlist!',
    text: `Thank you for joining the CribNosh waitlist! We will notify you as soon as we launch in your area.`,
  };
  try {
    await emailService.send(payload);
    // Add to broadcast list
    await addToBroadcastList({ email });
    return ResponseFactory.success({ success: true });
  } catch (e) {
    return ResponseFactory.error('Failed to send confirmation email', 'CUSTOM_ERROR', 500);
  }
}
