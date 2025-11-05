import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { getConvexClient } from '@/lib/conxed-client';
import { stripe } from '@/lib/stripe';
import { headers } from 'next/headers';
import { NextRequest } from 'next/server';

/**
 * @swagger
 * /webhooks/stripe:
 *   post:
 *     summary: Stripe Webhook Handler
 *     description: Handle Stripe webhook events for payment processing and order updates
 *     tags: [Webhooks, Payments]
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
 *                 description: Stripe event ID
 *                 example: "evt_1234567890abcdef"
 *               type:
 *                 type: string
 *                 description: Stripe event type
 *                 enum: [payment_intent.succeeded, payment_intent.payment_failed, payment_intent.canceled, charge.succeeded, charge.failed]
 *                 example: "payment_intent.succeeded"
 *               data:
 *                 type: object
 *                 description: Event data object
 *               created:
 *                 type: number
 *                 description: Unix timestamp of event creation
 *                 example: 1640995200
 *     parameters:
 *       - in: header
 *         name: stripe-signature
 *         required: true
 *         schema:
 *           type: string
 *         description: Stripe webhook signature for verification
 *         example: "t=1640995200,v1=abcdef1234567890"
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
 *         description: Bad request - missing signature or invalid payload
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error during webhook processing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security: []
 */

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

async function handlePOST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      return ResponseFactory.validationError('Missing stripe-signature header');
    }

    let event;
    try {
      if (!stripe) {
      return ResponseFactory.error('Stripe is not configured', 'CUSTOM_ERROR', 500);
    }
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      return ResponseFactory.validationError('Invalid signature');
    }

    const convex = getConvexClient();

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSucceeded(event.data.object, convex);
        break;
      
      case 'payment_intent.payment_failed':
        await handlePaymentFailed(event.data.object, convex);
        break;
      
      case 'payment_intent.canceled':
        await handlePaymentCanceled(event.data.object, convex);
        break;
      
      case 'charge.succeeded':
        await handleChargeSucceeded(event.data.object, convex);
        break;
      
      case 'charge.failed':
        await handleChargeFailed(event.data.object, convex);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return ResponseFactory.success({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return ResponseFactory.error('Webhook handler failed', 'CUSTOM_ERROR', 500);
  }
}

async function handlePaymentSucceeded(paymentIntent: any, convex: any) {
  try {
    const { userId, orderType, type } = paymentIntent.metadata;
    
    // Handle balance top-up payments
    if (type === 'balance_topup' && userId) {
      const amount = paymentIntent.amount; // Amount in pence
      const userIdFromMetadata = userId;
      
      // Create balance transaction with type "credit" and status "completed"
      await convex.mutation(api.mutations.customerBalance.addTransaction, {
        userId: userIdFromMetadata as Id<'users'>,
        type: 'credit',
        amount: amount, // Positive amount for credit
        currency: paymentIntent.currency.toUpperCase(),
        description: `Top-up balance via payment`,
        status: 'completed',
        reference: paymentIntent.id,
      });
      
      console.log(`Balance top-up succeeded for user ${userIdFromMetadata}, amount: £${(amount / 100).toFixed(2)}`);
      return; // Early return to avoid processing as order payment
    }
    
    if (orderType === 'customer_checkout' && userId) {
      // First, check if an order already exists for this payment intent
      const existingOrders = await convex.query(api.queries.orders.listByCustomer, {
        customer_id: userId as Id<'users'>,
      });
      
      const orderExists = existingOrders?.some((order: any) => 
        order.payment_id === paymentIntent.id || 
        order.order_id === paymentIntent.metadata?.order_id
      );

      if (!orderExists) {
        // Order doesn't exist - try to create it from cart as backup
        console.log(`No order found for payment intent ${paymentIntent.id}. Attempting to create from cart...`);
        
        try {
          await createOrderFromCartBackup(paymentIntent, convex, userId);
        } catch (cartError: any) {
          console.error('Failed to create order from cart in webhook:', cartError);
          // If cart creation fails, just try to update status (which might find pending order)
        }
      }

      // Update order status to confirmed (works even if order was just created)
      try {
        await convex.mutation(api.mutations.orders.updateOrderStatus, {
          userId: userId as Id<'users'>,
          paymentIntentId: paymentIntent.id,
          status: 'confirmed',
          amount: paymentIntent.amount / 100, // Convert from cents
          currency: paymentIntent.currency
        });
      } catch (updateError) {
        console.warn('Failed to update order status, order may have been created from cart:', updateError);
      }
      
      // Also try to mark as paid directly if we can find the order
      try {
        const allOrders = await convex.query(api.queries.orders.listByCustomer, {
          customer_id: userId as Id<'users'>,
        });
        const orderToUpdate = allOrders?.find((o: any) => 
          o.payment_id === paymentIntent.id ||
          (!o.payment_id && o.payment_status === 'pending')
        );
        if (orderToUpdate) {
          await convex.mutation(api.mutations.orders.markPaid, {
            order_id: orderToUpdate.order_id,
            paymentIntentId: paymentIntent.id,
          });
        }
      } catch (markPaidError) {
        console.warn('Failed to mark order as paid:', markPaidError);
      }
      
      console.log(`Payment succeeded for user ${userId}, amount: ${paymentIntent.amount / 100} ${paymentIntent.currency}`);
    }
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

/**
 * Backup function to create order from cart when client-side creation fails
 */
async function createOrderFromCartBackup(paymentIntent: any, convex: any, userId: string) {
  // Get user's cart
  const cart = await convex.query(api.queries.orders.getUserCart, { userId: userId as Id<'users'> });
  
  if (!cart || !cart.items || cart.items.length === 0) {
    console.log('Cart is empty, cannot create order from cart in webhook');
    return;
  }

  // Get all meals to map cart items to meals and extract chef_id
  const allMeals = await convex.query(api.queries.meals.getAll, {});
  
  // Convert cart items to order items and validate
  const orderItems = [];
  const chefIds = new Set<string>();
  let totalAmount = 0;

  for (const cartItem of cart.items) {
    // Find meal by id
    const meal = Array.isArray(allMeals)
      ? allMeals.find((m: any) => m._id === cartItem.id || m._id === (cartItem as any).dish_id)
      : null;

    if (!meal) {
      console.warn(`Meal not found for cart item: ${cartItem.id}`);
      continue; // Skip invalid items instead of failing
    }

    const chefId = (meal as any).chefId || (meal as any).chef_id;
    if (!chefId) {
      console.warn(`Meal ${cartItem.id} does not have a chef_id`);
      continue;
    }

    chefIds.add(chefId);
    
    const itemPrice = meal.price || cartItem.price;
    const itemQuantity = cartItem.quantity;
    const itemTotal = itemPrice * itemQuantity;
    totalAmount += itemTotal;

    orderItems.push({
      dish_id: cartItem.id,
      quantity: itemQuantity,
      price: itemPrice,
      name: cartItem.name || meal.name || 'Unknown Item',
    });
  }

  // Validate that all items are from the same chef
  if (chefIds.size === 0 || orderItems.length === 0) {
    console.warn('No valid items found in cart for order creation');
    return;
  }

  if (chefIds.size > 1) {
    console.warn('Cannot create order with items from multiple chefs in webhook backup');
    return;
  }

  const chef_id = Array.from(chefIds)[0];

  // Create the order using existing mutation
  const orderId = await convex.mutation(api.mutations.orders.createOrder, {
    customer_id: userId as Id<'users'>,
    chef_id: chef_id as Id<'chefs'>,
    order_items: orderItems,
    total_amount: totalAmount,
    payment_method: 'card',
    special_instructions: undefined,
    delivery_time: undefined,
    delivery_address: undefined,
  });

  // Link payment intent to order
  const allOrders = await convex.query(api.queries.orders.listByCustomer, {
    customer_id: userId as Id<'users'>,
  });
  const order = allOrders.find((o: any) => o._id === orderId);

  if (order && order.order_id) {
    try {
      await convex.mutation(api.mutations.orders.markPaid, {
        order_id: order.order_id,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      console.warn('Could not link payment intent to order in webhook:', error);
    }
  }

  // Clear cart after order creation
  try {
    await convex.mutation(api.mutations.orders.clearCart, {
      userId: userId as Id<'users'>,
    });
  } catch (error) {
    console.warn('Could not clear cart after order creation in webhook:', error);
  }

  console.log(`Created order ${order?.order_id || orderId} from cart in webhook backup for payment intent ${paymentIntent.id}`);
}

async function handlePaymentFailed(paymentIntent: any, convex: any) {
  try {
    const { userId, orderType } = paymentIntent.metadata;
    
    if (orderType === 'customer_checkout') {
      // Update order status to failed
      await convex.mutation(api.mutations.orders.updateOrderStatus, {
        userId: userId as Id<'users'>,
        paymentIntentId: paymentIntent.id,
        status: 'failed',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      });
      
      console.log(`Payment failed for user ${userId}, amount: ${paymentIntent.amount / 100} ${paymentIntent.currency}`);
    }
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}

async function handlePaymentCanceled(paymentIntent: any, convex: any) {
  try {
    const { userId, orderType } = paymentIntent.metadata;
    
    if (orderType === 'customer_checkout') {
      // Update order status to canceled
      await convex.mutation(api.mutations.orders.updateOrderStatus, {
        userId: userId as Id<'users'>,
        paymentIntentId: paymentIntent.id,
        status: 'canceled',
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      });
      
      console.log(`Payment canceled for user ${userId}, amount: ${paymentIntent.amount / 100} ${paymentIntent.currency}`);
    }
  } catch (error) {
    console.error('Error handling payment canceled:', error);
  }
}

async function handleChargeSucceeded(charge: any, convex: any) {
  try {
    // Handle successful charge events
    console.log(`Charge succeeded: ${charge.id}, amount: ${charge.amount / 100} ${charge.currency}`);
  } catch (error) {
    console.error('Error handling charge succeeded:', error);
  }
}

async function handleChargeFailed(charge: any, convex: any) {
  try {
    // Handle failed charge events
    console.log(`Charge failed: ${charge.id}, amount: ${charge.amount / 100} ${charge.currency}`);
  } catch (error) {
    console.error('Error handling charge failed:', error);
  }
}

export const POST = handlePOST; 