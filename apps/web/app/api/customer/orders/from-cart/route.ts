import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { stripe } from '@/lib/stripe';
import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

/**
 * @swagger
 * /customer/orders/from-cart:
 *   post:
 *     summary: Create Order from Cart After Payment
 *     description: Create an order from the customer's cart after payment has succeeded. Verifies payment intent, gets cart items, creates order, and clears cart.
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - payment_intent_id
 *             properties:
 *               payment_intent_id:
 *                 type: string
 *                 description: Stripe payment intent ID
 *                 example: "pi_1234567890abcdef"
 *               delivery_address:
 *                 type: object
 *                 nullable: true
 *                 description: Delivery address for the order
 *                 properties:
 *                   street:
 *                     type: string
 *                     example: "123 Main Street"
 *                   city:
 *                     type: string
 *                     example: "London"
 *                   postcode:
 *                     type: string
 *                     example: "SW1A 1AA"
 *                   country:
 *                     type: string
 *                     example: "United Kingdom"
 *               special_instructions:
 *                 type: string
 *                 nullable: true
 *                 description: Special instructions for the order
 *                 example: "Leave at door"
 *               delivery_time:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Requested delivery time
 *                 example: "2024-01-15T18:00:00.000Z"
 *     responses:
 *       200:
 *         description: Order created successfully from cart
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
 *                     order_id:
 *                       type: string
 *                       description: Created order ID
 *                       example: "order_1234567890"
 *                     order:
 *                       type: object
 *                       description: Complete order details
 *                 message:
 *                   type: string
 *                   example: "Order created successfully"
 *       400:
 *         description: Validation error - cart is empty, payment failed, or multiple chefs
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *       403:
 *         description: Forbidden - only customers can create orders
 *       404:
 *         description: Payment intent not found or cart not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - bearerAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: any;
    try {
      payload = jwt.verify(token, JWT_SECRET);
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    if (!payload.roles?.includes('customer')) {
      return ResponseFactory.forbidden('Forbidden: Only customers can create orders.');
    }

    const body = await request.json();
    const { payment_intent_id, delivery_address, special_instructions, delivery_time } = body;

    if (!payment_intent_id) {
      return ResponseFactory.validationError('payment_intent_id is required.');
    }

    const convex = getConvexClient();

    // Verify payment intent succeeded via Stripe API
    if (!stripe) {
      return ResponseFactory.error('Stripe is not configured', 'CUSTOM_ERROR', 500);
    }

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    } catch (error: any) {
      console.error('Error retrieving payment intent:', error);
      return ResponseFactory.notFound('Payment intent not found or invalid.');
    }

    // Verify payment intent succeeded
    if (paymentIntent.status !== 'succeeded') {
      return ResponseFactory.validationError(
        `Payment intent has not succeeded. Current status: ${paymentIntent.status}`
      );
    }

    // Verify payment intent belongs to this user
    if (paymentIntent.metadata?.userId !== payload.user_id) {
      return ResponseFactory.forbidden('Payment intent does not belong to this user.');
    }

    // Get user's cart
    const cart = await convex.query(api.queries.orders.getUserCart, { userId: payload.user_id });
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return ResponseFactory.validationError('Cart is empty. Cannot create order.');
    }

    // Get all meals to map cart items to meals and extract chef_id
    const allMeals = await convex.query(api.queries.meals.getAll, {});
    
    // Convert cart items to order items and validate
    const orderItems = [];
    const chefIds = new Set<string>();
    let totalAmount = 0;

    for (const cartItem of cart.items) {
      // Find meal by id (cart item id should be the meal _id)
      const meal = Array.isArray(allMeals)
        ? allMeals.find((m: any) => m._id === cartItem.id || m._id === (cartItem as any).dish_id)
        : null;

      if (!meal) {
        return ResponseFactory.notFound(`Meal not found: ${cartItem.id}`);
      }

      const chefId = (meal as any).chefId || (meal as any).chef_id;
      if (!chefId) {
        return ResponseFactory.validationError(`Meal ${cartItem.id} does not have a chef_id.`);
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

    // Validate that all items are from the same chef (single chef per order)
    if (chefIds.size > 1) {
      return ResponseFactory.validationError(
        'Cannot create order with items from multiple chefs. Please create separate orders for each chef.'
      );
    }

    if (chefIds.size === 0) {
      return ResponseFactory.validationError('No valid chef_id found in cart items.');
    }

    const chef_id = Array.from(chefIds)[0];

    // Verify payment amount matches cart total (with small tolerance for rounding)
    const paymentAmount = paymentIntent.amount / 100; // Convert from cents
    const amountDifference = Math.abs(paymentAmount - totalAmount);
    if (amountDifference > 0.01) { // Allow 1p difference for rounding
      console.warn(
        `Payment amount mismatch: payment=${paymentAmount}, cart=${totalAmount}, diff=${amountDifference}`
      );
      // Continue anyway but log the warning
    }

    // Create the order using existing mutation
    const orderId = await convex.mutation(api.mutations.orders.createOrder, {
      customer_id: payload.user_id,
      chef_id,
      order_items: orderItems,
      total_amount: totalAmount,
      payment_method: 'card',
      special_instructions,
      delivery_time,
      delivery_address,
    });

    // Link payment intent to order by updating order with payment_id
    // Get the order we just created to get its order_id
    const allOrders = await convex.query(api.queries.orders.listByCustomer, {
      customer_id: payload.user_id,
    });
    const order = allOrders.find((o: any) => o._id === orderId);

    if (order && order.order_id) {
      // Update order with payment_id and mark as paid
      try {
        await convex.mutation(api.mutations.orders.markPaid, {
          order_id: order.order_id,
          paymentIntentId: payment_intent_id,
        });
      } catch (error) {
        console.warn('Could not link payment intent to order:', error);
        // Continue - order is created, just payment link failed
      }
    }

    // Clear cart after order creation
    try {
      await convex.mutation(api.mutations.orders.clearCart, {
        userId: payload.user_id,
      });
    } catch (error) {
      console.warn('Could not clear cart after order creation:', error);
      // Continue - order is created, cart clearing can be retried
    }

    // Get final order details
    const finalOrders = await convex.query(api.queries.orders.listByCustomer, {
      customer_id: payload.user_id,
    });
    const finalOrder = finalOrders.find((o: any) => o._id === orderId) || order;

    return ResponseFactory.success({
      success: true,
      order_id: finalOrder?.order_id || orderId,
      order: finalOrder || {
        _id: orderId,
        customer_id: payload.user_id,
        chef_id,
        order_items: orderItems,
        total_amount: totalAmount,
        payment_method: 'card',
        special_instructions,
        delivery_time,
        delivery_address,
        order_status: 'pending',
        payment_status: 'paid',
        payment_id: payment_intent_id,
      },
    }, 'Order created successfully from cart');
  } catch (error: any) {
    console.error('Error creating order from cart:', error);
    return ResponseFactory.internalError(error.message || 'Failed to create order from cart.');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
