/**
 * @swagger
 * components:
 *   schemas:
 *     DriverApplicationRequest:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         name:
 *           type: string
 *           description: Full name of the applicant
 *         email:
 *           type: string
 *           format: email
 *           description: Email address of the applicant
 *         vehicle:
 *           type: string
 *           description: Vehicle information
 *         experience:
 *           type: string
 *           description: Previous driving experience
 *     DriverApplicationResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         data:
 *           type: object
 *           properties:
 *             success:
 *               type: boolean
 *               example: true
 *         message:
 *           type: string
 *           example: "Success"
 */

import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { EmailService } from '@/lib/email/email.service';
import { addToBroadcastList } from '@/lib/email/addToBroadcastList';
import { mattermostService } from '@/lib/mattermost';

const RESEND_API_KEY = process.env.RESEND_API_KEY || 're_EQsb5GpW_HkaiK9VCCYjwAYH2Jd8xP5VN';

const emailService = new EmailService({
  resend: {
    apiKey: RESEND_API_KEY!,
  },
});

/**
 * @swagger
 * /api/driving/apply:
 *   post:
 *     summary: Apply as a driver
 *     description: Submit a driver application for CribNosh delivery service
 *     tags: [Driver Applications]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/DriverApplicationRequest'
 *     responses:
 *       200:
 *         description: Driver application submitted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DriverApplicationResponse'
 *       400:
 *         description: Validation error - Missing email
 *       500:
 *         description: Internal server error
 */
export async function POST(request: NextRequest) {
  const data = await request.json();
  const { name, email, vehicle, experience } = data;
  if (!email) {
    return ResponseFactory.validationError('Missing email');
  }
  // Email to admin (now templated)
  const adminHtml = await emailService.getTemplateRenderer().renderAdminNotificationEmail({
    title: '[Driver Application] New Driver Signup',
    details: `A new driver applied.\nName: ${name}\nEmail: ${email}\nVehicle: ${vehicle}\nExperience: ${experience}`,
  });
  await emailService.send({
    to: 'support@cribnosh.com',
    from: 'earlyaccess@emails.cribnosh.com',
    subject: '[Driver Application] New Driver Signup',
    html: adminHtml,
  });
  // Add to broadcast list
  await addToBroadcastList({ email, firstName: name });
  
  // Send Mattermost notification
  await mattermostService.notifyDriverApplication({
    name,
    email,
    vehicle,
    experience,
  });
  
  // Confirmation email to driver (already templated)
  const confirmationHtml = await emailService.getTemplateRenderer().renderGenericNotificationEmail({
    title: 'Thank you for applying as a CribNosh driver!',
    message: 'Thank you for your interest in driving with CribNosh. We have received your application and will be in touch soon.',
  });
  await emailService.send({
    to: email,
    from: 'earlyaccess@emails.cribnosh.com',
    subject: 'Thank you for applying as a CribNosh driver!',
    html: confirmationHtml,
  });
  return ResponseFactory.success({ success: true });
}
