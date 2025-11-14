import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { Webhook } from 'svix';
import { fetchMutation } from 'convex/nextjs';
import { api } from '@/convex/_generated/api';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';
import { getSessionTokenFromRequest } from '@/lib/conxed-client';

/**
 * @swagger
 * /webhooks/resend:
 *   post:
 *     summary: Resend Email Webhook Handler
 *     description: Handle Resend email service webhook events for email analytics and tracking
 *     tags: [Webhooks, Email]
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *             description: Raw webhook payload from Resend
 *             example: '{"type":"email.delivered","data":{"id":"email_123","to":["user@example.com"],"subject":"Welcome"}}'
 *     responses:
 *       200:
 *         description: Webhook processed successfully
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
 *                   description: Empty object on success
 *                   example: {}
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Webhook signature verification failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error or webhook secret not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 *     x-webhook:
 *       description: |
 *         This endpoint handles Resend webhook events for email analytics:
 *         
 *         **Supported Email Events:**
 *         - `email.sent`: Email was sent successfully
 *         - `email.delivered`: Email was delivered to recipient
 *         - `email.delivery_delayed`: Email delivery was delayed
 *         - `email.complained`: Recipient marked email as spam
 *         - `email.bounced`: Email bounced (hard/soft bounce)
 *         - `email.clicked`: Recipient clicked a link in the email
 *         - `email.opened`: Recipient opened the email
 *         - `email.unsubscribed`: Recipient unsubscribed
 *         - `email.failed`: Email failed to send
 *         
 *         **Supported Contact Events:**
 *         - `contact.created`: New contact created
 *         - `contact.updated`: Contact information updated
 *         - `contact.deleted`: Contact deleted
 *         
 *         **Supported Domain Events:**
 *         - `domain.created`: New domain added
 *         - `domain.updated`: Domain settings updated
 *         - `domain.deleted`: Domain removed
 *         
 *         **Webhook Security:**
 *         - Requires valid Resend webhook signature
 *         - Verifies webhook secret for authenticity
 *         - Processes events asynchronously
 *         - Records analytics data in Convex database
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());
    
    // Verify webhook signature
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    if (!webhookSecret) {
      logger.error('RESEND_WEBHOOK_SECRET not configured');
      return ResponseFactory.error('Webhook secret not configured', 'CUSTOM_ERROR', 500);
    }

    const wh = new Webhook(webhookSecret);
    let payload: any;
    
    try {
      payload = wh.verify(body, headers);
    } catch (err) {
      logger.error('Webhook verification failed:', err);
      return ResponseFactory.unauthorized('Invalid signature');
    }

    // Process the webhook event
    const { type, data } = payload;
    
    logger.log('Received Resend webhook:', { type, data });

    const sessionToken = getSessionTokenFromRequest(request);
    
    // Map Resend event types to our analytics event types
    const eventTypeMap: Record<string, string> = {
      // Email events
      'email.sent': 'sent',
      'email.delivered': 'delivered', 
      'email.delivery_delayed': 'delivered',
      'email.complained': 'complained',
      'email.bounced': 'bounced',
      'email.clicked': 'clicked',
      'email.opened': 'opened',
      'email.unsubscribed': 'unsubscribed',
      'email.failed': 'bounced', // Map failed emails to bounced for analytics
      
      // Contact events (optional - for future use)
      'contact.created': 'contact_created',
      'contact.updated': 'contact_updated', 
      'contact.deleted': 'contact_deleted',
      
      // Domain events (optional - for future use)
      'domain.created': 'domain_created',
      'domain.updated': 'domain_updated',
      'domain.deleted': 'domain_deleted',
    };

    const analyticsEventType = eventTypeMap[type];
    if (!analyticsEventType) {
      logger.log('Unhandled event type:', type);
      return ResponseFactory.success({});
    }

    // Helper function to parse user agent and extract device info
    const parseUserAgent = (userAgent?: string) => {
      if (!userAgent) return undefined;
      
      // Basic parsing - can be enhanced with a proper user-agent library
      const ua = userAgent.toLowerCase();
      let deviceType = 'desktop';
      let os = 'unknown';
      let browser = 'unknown';
      let client = 'unknown';
      
      // Detect device type
      if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
        deviceType = 'mobile';
      } else if (ua.includes('tablet') || ua.includes('ipad')) {
        deviceType = 'tablet';
      }
      
      // Detect OS
      if (ua.includes('windows')) os = 'Windows';
      else if (ua.includes('mac os') || ua.includes('macos')) os = 'macOS';
      else if (ua.includes('linux')) os = 'Linux';
      else if (ua.includes('android')) os = 'Android';
      else if (ua.includes('ios') || ua.includes('iphone')) os = 'iOS';
      
      // Detect browser/client
      if (ua.includes('gmail') || ua.includes('google')) client = 'Gmail';
      else if (ua.includes('outlook') || ua.includes('microsoft')) client = 'Outlook';
      else if (ua.includes('apple') || ua.includes('mail.app')) client = 'Apple Mail';
      else if (ua.includes('yahoo')) client = 'Yahoo Mail';
      else if (ua.includes('chrome')) browser = 'Chrome';
      else if (ua.includes('firefox')) browser = 'Firefox';
      else if (ua.includes('safari')) browser = 'Safari';
      else if (ua.includes('edge')) browser = 'Edge';
      
      return {
        type: deviceType,
        os,
        browser: client !== 'unknown' ? client : browser,
        client: client !== 'unknown' ? client : browser,
      };
    };
    
    // Helper function to extract location info
    const extractLocationInfo = (data: any) => {
      const ip = data.ip || data.location?.ip || data.client_ip;
      const location = data.location || {};
      
      if (!ip && !location.country) return undefined;
      
      return {
        country: location.country || data.country || 'unknown',
        region: location.region || data.region || location.state || 'unknown',
        city: location.city || data.city || 'unknown',
        ipAddress: ip || 'unknown',
      };
    };
    
    // Helper function to extract bounce type
    const extractBounceInfo = (data: any) => {
      const bounceType = data.bounce_type || data.type || 'unknown';
      const isHardBounce = bounceType === 'hard' || 
                          data.hard_bounce === true ||
                          (data.error && data.error.includes('permanent'));
      
      return {
        bounceType: isHardBounce ? 'hard' : 'soft',
        bounceReason: data.bounce_reason || data.error || data.reason || 'unknown',
        errorCode: data.error_code || data.code,
      };
    };

    // Handle different event types
    if (type.startsWith('email.')) {
      // Email events - extract email-specific metadata
      const emailId = data.email_id || data.id;
      const recipientEmail = data.to?.[0] || data.recipient;
      const templateId = data.tags?.find((tag: any) => tag.name === 'template_id')?.value || 'unknown';
      
      // Extract device info from user agent
      const deviceInfo = parseUserAgent(data.user_agent || data.userAgent);
      
      // Extract location info
      const locationInfo = extractLocationInfo(data);
      
      // Prepare enhanced metadata
      const metadata: Record<string, any> = {
        resendEventId: data.id,
        resendEventType: type,
        timestamp: data.created_at || new Date().toISOString(),
        subject: data.subject,
        from: data.from,
        tags: data.tags || [],
        // Click tracking
        ...(data.clicked && { 
          clickUrl: data.clicked.url || data.clicked,
          clickTimestamp: data.clicked.timestamp || data.timestamp,
        }),
        // Bounce information
        ...(type === 'email.bounced' && {
          ...extractBounceInfo(data),
        }),
        // Delivery delay information
        ...(type === 'email.delivery_delayed' && {
          delayReason: data.delay_reason || data.reason,
          delayDuration: data.delay_duration || data.duration,
          retryCount: data.retry_count || data.retries,
        }),
        // Time-based metrics
        ...(data.sent_at && {
          sentAt: data.sent_at,
          timeToDeliver: data.delivered_at ? 
            new Date(data.delivered_at).getTime() - new Date(data.sent_at).getTime() : undefined,
          timeToOpen: data.opened_at && data.delivered_at ?
            new Date(data.opened_at).getTime() - new Date(data.delivered_at).getTime() : undefined,
          timeToClick: data.clicked?.timestamp && data.opened_at ?
            new Date(data.clicked.timestamp).getTime() - new Date(data.opened_at).getTime() : undefined,
        }),
        // Additional webhook data
        ...(data.error && { error: data.error }),
        ...(data.error_code && { errorCode: data.error_code }),
        ...(data.reason && { reason: data.reason }),
        ...(data.status && { status: data.status }),
      };

      // Record the event in Convex with enhanced analytics
      await fetchMutation(api.mutations.emailAnalytics.recordEmailEvent, {
        emailId,
        templateId,
        recipientEmail,
        eventType: analyticsEventType as any,
        metadata,
        deviceInfo,
        locationInfo,
        sessionToken: sessionToken || undefined
      });
    } else if (type.startsWith('contact.') || type.startsWith('domain.')) {
      // Contact/Domain events - handle differently
      const eventId = data.id || `event_${Date.now()}`;
      const metadata = {
        resendEventId: data.id,
        resendEventType: type,
        timestamp: data.created_at || new Date().toISOString(),
        ...data, // Include all data for contact/domain events
      };

      // Record the event in Convex
      await fetchMutation(api.mutations.emailAnalytics.recordEmailEvent, {
        emailId: eventId,
        templateId: 'system',
        recipientEmail: 'system@resend.com',
        eventType: analyticsEventType as any,
        metadata,
        sessionToken: sessionToken || undefined
      });
    }

    return ResponseFactory.success({});

  } catch (error) {
    logger.error('Webhook processing error:', error);
    return ResponseFactory.error('Internal server error', 'CUSTOM_ERROR', 500);
  }
}
