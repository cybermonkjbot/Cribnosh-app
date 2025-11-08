import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { EmailService } from '@/lib/email/email.service';
import { withErrorHandling } from '@/lib/errors';
import { mattermostService } from '@/lib/mattermost';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const emailService = new EmailService({
  resend: {
    apiKey: RESEND_API_KEY!,
  },
});

/**
 * @swagger
 * /customer/event-chef-request:
 *   post:
 *     summary: Submit Event Chef Request
 *     description: Submit a request for a chef to cater an event
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event_date
 *               - number_of_guests
 *               - event_type
 *               - event_location
 *               - phone_number
 *               - email
 *             properties:
 *               event_date:
 *                 type: string
 *                 description: Event date
 *                 example: "15 March 2024"
 *               number_of_guests:
 *                 type: number
 *                 description: Number of guests
 *                 example: 50
 *               event_type:
 *                 type: string
 *                 description: Type of event
 *                 example: "Wedding"
 *               event_location:
 *                 type: string
 *                 description: Event location address
 *                 example: "123 Main St, London, UK"
 *               phone_number:
 *                 type: string
 *                 description: Contact phone number
 *                 example: "+44 20 1234 5678"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Contact email address
 *                 example: "customer@example.com"
 *               dietary_requirements:
 *                 type: string
 *                 nullable: true
 *                 description: Dietary requirements
 *                 example: "Vegetarian options, Gluten-free"
 *               additional_notes:
 *                 type: string
 *                 nullable: true
 *                 description: Additional notes about the event
 *                 example: "Outdoor event, need heating equipment"
 *     responses:
 *       200:
 *         description: Event chef request submitted successfully
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
 *                     request_id:
 *                       type: string
 *                       description: Request ID
 *                       example: "j1234567890abcdef"
 *                 message:
 *                   type: string
 *                   example: "Request submitted successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);
    
    const body = await request.json();
    const {
      event_date,
      number_of_guests,
      event_type,
      event_location,
      phone_number,
      email,
      dietary_requirements,
      additional_notes,
    } = body;
    
    // Validation
    if (!event_date || !number_of_guests || !event_type || !event_location || !phone_number || !email) {
      return ResponseFactory.validationError(
        'Missing required fields: event_date, number_of_guests, event_type, event_location, phone_number, email'
      );
    }
    
    if (typeof number_of_guests !== 'number' || number_of_guests <= 0) {
      return ResponseFactory.validationError('number_of_guests must be a positive number.');
    }
    
    const convex = getConvexClient();
    
    // Get customer profile to get name
    // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
    const customerProfile: any = await convex.query(api.queries.customers.getByUserId, {
      userId: userId as any,
    });
    
    const customerName = customerProfile?.name || email.split('@')[0];
    
    // Create event chef request in Convex
    // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
    const requestId: any = await convex.mutation(api.mutations.eventChefRequests.create, {
      customer_id: userId as any,
      event_date,
      number_of_guests,
      event_type,
      event_location,
      phone_number,
      email,
      dietary_requirements: dietary_requirements || undefined,
      additional_notes: additional_notes || undefined,
      status: 'pending',
    });
    
    // Send email to admin
    const adminHtml = await emailService.getTemplateRenderer().renderAdminNotificationEmail({
      title: '[Event Chef Request] New Event Request',
      details: `A new event chef request has been submitted.\n\nCustomer: ${customerName}\nEmail: ${email}\nPhone: ${phone_number}\nEvent Date: ${event_date}\nEvent Type: ${event_type}\nNumber of Guests: ${number_of_guests}\nLocation: ${event_location}\n${dietary_requirements ? `Dietary Requirements: ${dietary_requirements}\n` : ''}${additional_notes ? `Additional Notes: ${additional_notes}` : ''}`,
    });
    
    await emailService.send({
      to: 'support@cribnosh.com',
      from: 'earlyaccess@emails.cribnosh.com',
      subject: '[Event Chef Request] New Event Request',
      html: adminHtml,
    });
    
    // Send Mattermost notification
    await mattermostService.notifyEventChefRequest({
      customerName,
      email,
      phone: phone_number,
      eventDate: event_date,
      eventType: event_type,
      numberOfGuests: number_of_guests,
      location: event_location,
      dietaryRequirements: dietary_requirements,
      additionalNotes: additional_notes,
    });
    
    // Send confirmation email to customer
    const confirmationHtml = await emailService.getTemplateRenderer().renderGenericNotificationEmail({
      title: 'Thank you for your event chef request!',
      message: 'We have received your event chef request and our team will call you within 24 hours to confirm your event coverage and discuss your food requirements.',
    });
    
    await emailService.send({
      to: email,
      from: 'earlyaccess@emails.cribnosh.com',
      subject: 'Thank you for your event chef request!',
      html: confirmationHtml,
    });
    
    return ResponseFactory.success(
      {
        success: true,
        request_id: requestId,
      },
      'Request submitted successfully'
    );
  } catch (error: unknown) {
    if (error instanceof Error && (error.name === 'AuthenticationError' || error.name === 'AuthorizationError')) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to submit event chef request.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

