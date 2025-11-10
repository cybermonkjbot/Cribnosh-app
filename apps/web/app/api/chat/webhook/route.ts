import { NextRequest, NextResponse } from 'next/server';
import { getConvexClient, api, getSessionTokenFromRequest } from '@/lib/conxed-client';
import crypto from 'crypto';
import { ConvexHttpClient } from 'convex/browser';
import { Id } from '@/convex/_generated/dataModel';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

interface WebhookEventData {
  type: string;
  channelId?: string;
  messageId?: string;
  messageType?: string;
  userId?: string;
  name?: string;
  email?: string;
  createdBy?: string;
}

/**
 * @swagger
 * /chat/webhook:
 *   post:
 *     summary: Chat Webhook Handler
 *     description: Handle webhook events from the chat system for message tracking and notifications
 *     tags: [Webhooks, Chat]
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
 *                 description: Event type
 *                 enum: [message.created, channel.created, user.created]
 *                 example: "message.created"
 *               channelId:
 *                 type: string
 *                 description: Channel ID (for message/channel events)
 *                 example: "j1234567890abcdef"
 *               messageId:
 *                 type: string
 *                 description: Message ID (for message events)
 *                 example: "j1234567890abcdef"
 *               messageType:
 *                 type: string
 *                 description: Type of message
 *                 enum: [user, ai, system]
 *                 example: "ai"
 *               userId:
 *                 type: string
 *                 description: User ID
 *                 example: "j1234567890abcdef"
 *               name:
 *                 type: string
 *                 description: Channel or user name
 *                 example: "General Chat"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User email (for user events)
 *                 example: "user@example.com"
 *               createdBy:
 *                 type: string
 *                 description: ID of user who created the channel
 *                 example: "j1234567890abcdef"
 *     parameters:
 *       - in: header
 *         name: x-webhook-signature
 *         required: false
 *         schema:
 *           type: string
 *         description: Webhook signature for verification
 *         example: "sha256=abcdef1234567890"
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
 *       401:
 *         description: Unauthorized - invalid webhook signature
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Invalid signature"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Internal server error"
 *     security: []
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Verify webhook signature if needed
    const signature = request.headers.get('x-webhook-signature');
    if (process.env.WEBHOOK_SECRET && signature) {
      const isValid = await verifyWebhookSignature(
        JSON.stringify(body),
        signature,
        process.env.WEBHOOK_SECRET
      );
      
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    // Process the webhook event
    await processWebhookEvent(body, request);

    return NextResponse.json({ success: true });
  } catch (error) {
    logger.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');
  
  return crypto.timingSafeEqual(
    Buffer.from(signature, 'hex'),
    Buffer.from(expectedSignature, 'hex')
  );
}

async function processWebhookEvent(eventData: WebhookEventData, request: NextRequest) {
  const convex = getConvexClient();
  const sessionToken = getSessionTokenFromRequest(request);
  
  switch (eventData.type) {
    case 'message.created':
      await handleMessageCreated(convex, eventData, sessionToken);
      break;
    case 'channel.created':
      await handleChannelCreated(convex, eventData, sessionToken);
      break;
    case 'user.created':
      await handleUserCreated(convex, eventData, sessionToken);
      break;
    default:
      logger.log('Unknown event type:', eventData.type);
  }
}

async function handleMessageCreated(convex: ConvexHttpClient, eventData: WebhookEventData, sessionToken: string | null) {
  try {
    // Track message creation in analytics
    await convex.mutation(api.mutations.analytics.trackEvent, {
      eventType: 'message_created',
      timestamp: Date.now(),
      metadata: {
        channelId: eventData.channelId,
        messageType: eventData.messageType,
      },
      sessionToken: sessionToken || undefined
    });

    // Create notification if needed
    if (eventData.messageType === 'ai') {
      await convex.mutation(api.mutations.notifications.create, {
        type: 'ai_response',
        message: 'The AI has responded to your message',
        userId: eventData.userId as Id<'users'>,
        createdAt: Date.now(),
        sessionToken: sessionToken || undefined
      });
    }
  } catch (error) {
    logger.error('Error handling message created:', error);
  }
}

async function handleChannelCreated(convex: ConvexHttpClient, eventData: WebhookEventData, sessionToken: string | null) {
  try {
    // Track channel creation in analytics
    await convex.mutation(api.mutations.analytics.trackEvent, {
      eventType: 'channel_created',
      timestamp: Date.now(),
      metadata: {
        channelId: eventData.channelId,
        channelName: eventData.name,
        createdBy: eventData.createdBy,
      },
      sessionToken: sessionToken || undefined
    });

    // Create system notification
    await convex.mutation(api.mutations.notifications.create, {
      type: 'channel_created',
      message: `Channel "${eventData.name}" has been created`,
      userId: eventData.createdBy as Id<'users'>,
      createdAt: Date.now(),
      sessionToken: sessionToken || undefined
    });
  } catch (error) {
    logger.error('Error handling channel created:', error);
  }
}

async function handleUserCreated(convex: ConvexHttpClient, eventData: WebhookEventData, sessionToken: string | null) {
  try {
    // Track user creation in analytics
    await convex.mutation(api.mutations.analytics.trackEvent, {
      eventType: 'user_created',
      timestamp: Date.now(),
      metadata: {
        userId: eventData.userId,
        userName: eventData.name,
        userEmail: eventData.email,
      },
      sessionToken: sessionToken || undefined
    });

    // Send welcome notification
    await convex.mutation(api.mutations.notifications.create, {
      type: 'welcome',
      message: 'Welcome to CribNosh Chat! Start a conversation!',
      userId: eventData.userId as Id<'users'>,
      createdAt: Date.now(),
      sessionToken: sessionToken || undefined
    });
  } catch (error) {
    logger.error('Error handling user created:', error);
  }
}
