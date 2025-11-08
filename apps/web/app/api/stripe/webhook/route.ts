import { api } from '@/convex/_generated/api';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { stripe } from '@/lib/stripe';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';

const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * @swagger
 * /stripe/webhook:
 *   post:
 *     summary: Stripe Webhook Handler
 *     description: Handle Stripe webhook events for payment processing, refunds, and subscriptions
 *     tags: [Payments, Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             description: Stripe webhook event payload
 *             properties:
 *               id:
 *                 type: string
 *                 description: Event ID
 *                 example: "evt_1234567890abcdef"
 *               object:
 *                 type: string
 *                 description: Event object type
 *                 example: "event"
 *               type:
 *                 type: string
 *                 description: Event type
 *                 enum: [payment_intent.succeeded, payment_intent.payment_failed, charge.refunded, customer.subscription.created, customer.subscription.deleted, charge.dispute.created]
 *                 example: "payment_intent.succeeded"
 *               data:
 *                 type: object
 *                 description: Event data object
 *               created:
 *                 type: number
 *                 description: Event creation timestamp
 *                 example: 1640995200
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
 *                   properties:
 *                     received:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Webhook signature verification failed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error or Stripe configuration error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 *     x-webhook:
 *       description: |
 *         This endpoint handles Stripe webhook events:
 *         
 *         **Supported Events:**
 *         - `payment_intent.succeeded`: Marks orders as paid
 *         - `payment_intent.payment_failed`: Notifies admins of failed payments
 *         - `charge.refunded`: Marks orders as refunded
 *         - `customer.subscription.created`: Updates user subscription status
 *         - `customer.subscription.deleted`: Cancels user subscription
 *         - `charge.dispute.created`: Notifies admins of payment disputes
 *         
 *         **Webhook Security:**
 *         - Requires valid Stripe signature header
 *         - Verifies webhook secret for authenticity
 *         - Processes events asynchronously
 */
export async function POST(request: NextRequest) {
  const sig = request.headers.get('stripe-signature');
  let event;
  let body: Buffer;
  try {
    body = Buffer.from(await request.arrayBuffer());
    if (!stripe) {
      return ResponseFactory.internalError('Stripe is not configured');
    }
    event = stripe.webhooks.constructEvent(body, sig!, STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    logger.error('Stripe webhook signature verification failed:', err.message);
    return ResponseFactory.validationError('Webhook signature verification failed');
  }

  const convex = getConvexClientFromRequest(request);

  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object as any;
      const { user_id, order_id, chef_id, booking_id } = paymentIntent.metadata || {};
      if (order_id) {
        await convex.mutation(api.mutations.orders.markPaid, { order_id, paymentIntentId: paymentIntent.id });
      }
      // Optionally, update chef or booking records here
      break;
    }
    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object as any;
      const { user_id, order_id, chef_id, booking_id } = paymentIntent.metadata || {};
      // Notify admin for failed payment
      await convex.mutation(api.mutations.notifications.create, {
        type: 'error',
        message: `Payment failed for order ${order_id || 'unknown'}.`,
        global: true,
        roles: ['admin'],
        createdAt: Date.now(),
      });
      break;
    }
    case 'charge.refunded': {
      const charge = event.data.object as any;
      const { user_id, order_id, chef_id, booking_id } = charge.metadata || {};
      if (order_id) {
        await convex.mutation(api.mutations.orders.markRefunded, { order_id, refundId: charge.id });
      }
      break;
    }
    case 'customer.subscription.created': {
      const subscription = event.data.object as any;
      const { user_id } = subscription.metadata || {};
      
      if (user_id) {
        await convex.mutation(api.mutations.users.updateSubscriptionStatus, {
          userId: user_id,
          subscriptionStatus: subscription.status,
        });
      }
      break;
    }
    case 'customer.subscription.deleted': {
      const subscription = event.data.object as any;
      const { user_id } = subscription.metadata || {};
      
      if (user_id) {
        await convex.mutation(api.mutations.users.updateSubscriptionStatus, {
          userId: user_id,
          subscriptionStatus: 'canceled',
        });
      }
      break;
    }
    case 'charge.dispute.created': {
      const charge = event.data.object as any;
      const { user_id, order_id, chef_id, booking_id } = charge.metadata || {};
      // Notify admin for dispute
      await convex.mutation(api.mutations.notifications.create, {
        type: 'warning',
        message: `Dispute created for payment ${charge.id} (order ${order_id || 'unknown'}).`,
        global: true,
        roles: ['admin'],
        createdAt: Date.now(),
      });
      break;
    }
    default:
      logger.log(`Unhandled event type ${event.type}`);
  }

  return ResponseFactory.success({ received: true });
} 