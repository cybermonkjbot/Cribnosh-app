import type { Id } from '@/convex/_generated/dataModel';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getApiMutations, getApiQueries, getConvexClientFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { stripe } from '@/lib/stripe';
import { getErrorMessage } from '@/types/errors';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import type { FunctionReference } from 'convex/server';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { logger } from '@/lib/utils/logger';

// Type definitions for data structures
interface RegionAvailabilityArgs extends Record<string, unknown> {
  address: {
    city: string;
    country: string;
    coordinates: number[];
  };
}

interface CartData {
  items?: Array<{
    id: string;
    dish_id?: string;
    quantity: number;
    price: number;
    name?: string;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

interface MealData {
  _id: Id<'meals'>;
  chefId?: Id<'chefs'>;
  chef_id?: Id<'chefs'>;
  price?: number;
  name?: string;
  [key: string]: unknown;
}

interface OrderData {
  _id: Id<'orders'>;
  order_id?: string;
  [key: string]: unknown;
}

interface CreateOrderArgs extends Record<string, unknown> {
  customer_id: string;
  chef_id: string;
  order_items: Array<{
    dish_id: string;
    quantity: number;
    price: number;
    name: string;
  }>;
  total_amount: number;
  payment_method: string;
  special_instructions?: string;
  delivery_time?: string;
  delivery_address?: {
    city: string;
    country: string;
    coordinates: number[];
    street?: string;
    postal_code?: string;
  };
}

interface MarkPaidArgs extends Record<string, unknown> {
  order_id: string;
  paymentIntentId: string;
}

interface ClearCartArgs extends Record<string, unknown> {
  userId: string;
}

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
 *       - cookieAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    // Authenticate user
    const { userId } = await getAuthenticatedCustomer(request);

    const body = await request.json();
    const { payment_intent_id, delivery_address, special_instructions, delivery_time } = body;

    if (!payment_intent_id) {
      return ResponseFactory.validationError('payment_intent_id is required.');
    }

    const convex = getConvexClientFromRequest(request);

    // Verify payment intent succeeded via Stripe API
    if (!stripe) {
      return ResponseFactory.error('Stripe is not configured', 'CUSTOM_ERROR', 500);
    }

    let paymentIntent;
    try {
      paymentIntent = await stripe.paymentIntents.retrieve(payment_intent_id);
    } catch (error: unknown) {
      logger.error('Error retrieving payment intent:', error);
      return ResponseFactory.notFound('Payment intent not found or invalid.');
    }

    // Verify payment intent succeeded
    if (paymentIntent.status !== 'succeeded') {
      return ResponseFactory.validationError(
        `Payment intent has not succeeded. Current status: ${paymentIntent.status}`
      );
    }

    // Verify payment intent belongs to this user
    if (paymentIntent.metadata?.userId !== userId) {
      return ResponseFactory.forbidden('Payment intent does not belong to this user.');
    }

    // Get type-safe accessors
    const apiQueries = getApiQueries();
    const apiMutations = getApiMutations();
    
    // Check regional availability if delivery address is provided
    if (delivery_address) {
      type RegionAvailabilityQuery = FunctionReference<"query", "public", RegionAvailabilityArgs, boolean>;
      const isRegionSupported = await convex.query(
        (apiQueries.admin.checkRegionAvailability as unknown as RegionAvailabilityQuery),
        {
          address: {
            city: delivery_address.city,
            country: delivery_address.country,
            coordinates: delivery_address.coordinates,
          },
        }
      ) as boolean;
      
      if (!isRegionSupported) {
        return ResponseFactory.validationError(
          'Oops, We do not serve this region yet, Ordering is not available in your region'
        );
      }
    }

    // Get user's cart
    type GetUserCartQuery = FunctionReference<"query", "public", { userId: string }, CartData>;
    const cart = await convex.query(
      (apiQueries.orders.getUserCart as unknown as GetUserCartQuery),
      { userId }
    ) as CartData;
    
    if (!cart || !cart.items || cart.items.length === 0) {
      return ResponseFactory.validationError('Cart is empty. Cannot create order.');
    }

    // Check if any chefs in the cart are offline
    type CheckChefAvailabilityQuery = FunctionReference<"query", "public", { userId: string }, { allChefsOnline: boolean; offlineChefs: Array<{ chefId: string; chefName: string; itemNames: string[] }> }>;
    const chefAvailability = await convex.query(
      (apiQueries.orders.checkCartChefAvailability as unknown as CheckChefAvailabilityQuery),
      { userId }
    ) as { allChefsOnline: boolean; offlineChefs: Array<{ chefId: string; chefName: string; itemNames: string[] }> };
    
    if (!chefAvailability.allChefsOnline && chefAvailability.offlineChefs.length > 0) {
      const offlineChefNames = chefAvailability.offlineChefs.map(c => c.chefName).join(', ');
      return ResponseFactory.validationError(
        `Cannot create order. The following food creator(s) are currently offline: ${offlineChefNames}. Please remove their items from your cart or wait until they come online.`
      );
    }

    // Get all meals to map cart items to meals and extract chef_id
    type MealsQuery = FunctionReference<"query", "public", Record<string, never>, MealData[]>;
    const allMeals = await convex.query(
      (apiQueries.meals.getAll as unknown as MealsQuery),
      {}
    ) as MealData[];
    
    // Group cart items by chef
    const itemsByChef = new Map<string, Array<{
      dish_id: string;
      quantity: number;
      price: number;
      name: string;
    }>>();

    let totalAmount = 0;

    for (const cartItem of cart.items) {
      // Find meal by id (cart item id should be the meal _id)
      const meal = Array.isArray(allMeals)
        ? allMeals.find((m: MealData) => m._id === cartItem.id || m._id === cartItem.dish_id)
        : null;

      if (!meal) {
        return ResponseFactory.notFound(`Meal not found: ${cartItem.id}`);
      }

      const chefId = meal.chefId || meal.chef_id;
      if (!chefId) {
        return ResponseFactory.validationError(`Meal ${cartItem.id} does not have a chef_id.`);
      }

      const chefIdStr = chefId.toString();
      if (!itemsByChef.has(chefIdStr)) {
        itemsByChef.set(chefIdStr, []);
      }
      
      const itemPrice = meal.price || cartItem.price;
      const itemQuantity = cartItem.quantity;
      const itemTotal = itemPrice * itemQuantity;
      totalAmount += itemTotal;

      itemsByChef.get(chefIdStr)!.push({
        dish_id: cartItem.id,
        quantity: itemQuantity,
        price: itemPrice,
        name: cartItem.name || meal.name || 'Unknown Item',
      });
    }

    if (itemsByChef.size === 0) {
      return ResponseFactory.validationError('No valid chef_id found in cart items.');
    }

    // Verify payment amount matches cart total (with small tolerance for rounding)
    const paymentAmount = paymentIntent.amount / 100; // Convert from cents
    const amountDifference = Math.abs(paymentAmount - totalAmount);
    if (amountDifference > 0.01) { // Allow 1p difference for rounding
      logger.warn(
        `Payment amount mismatch: payment=${paymentAmount}, cart=${totalAmount}, diff=${amountDifference}`
      );
      // Continue anyway but log the warning
    }

    // Create separate orders for each chef
    const createdOrderIds: Id<'orders'>[] = [];
    let firstOrder: OrderData | null = null;

    type CreateOrderMutation = FunctionReference<"mutation", "public", CreateOrderArgs, Id<'orders'>>;
    type ListOrdersQuery = FunctionReference<"query", "public", { customer_id: string }, OrderData[]>;
    type MarkPaidMutation = FunctionReference<"mutation", "public", MarkPaidArgs, void>;

    for (const [chefId, orderItems] of itemsByChef.entries()) {
      // Calculate total for this chef's items
      const chefTotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Create the order using existing mutation
      const orderId = await convex.mutation(
        (apiMutations.orders.createOrder as unknown as CreateOrderMutation),
        {
          customer_id: userId,
          chef_id: chefId,
          order_items: orderItems,
          total_amount: chefTotal,
          payment_method: 'card',
          special_instructions,
          delivery_time,
          delivery_address,
        }
      ) as Id<'orders'>;

      createdOrderIds.push(orderId);

      // Link payment intent to order by updating order with payment_id
      // Get the order we just created to get its order_id
      const allOrders = await convex.query(
        (apiQueries.orders.listByCustomer as unknown as ListOrdersQuery),
        { customer_id: userId }
      ) as OrderData[];
      const order = allOrders.find((o: OrderData) => o._id === orderId);

      if (order && order.order_id) {
        // Update order with payment_id and mark as paid
        try {
          await convex.mutation(
            (apiMutations.orders.markPaid as unknown as MarkPaidMutation),
            {
              order_id: order.order_id,
              paymentIntentId: payment_intent_id,
            }
          );
        } catch (error) {
          logger.warn('Could not link payment intent to order:', error);
          // Continue - order is created, just payment link failed
        }
      }

      if (!firstOrder) {
        firstOrder = order || null;
      }
    }

    // Clear cart after all orders are created
    try {
      type ClearCartMutation = FunctionReference<"mutation", "public", ClearCartArgs, void>;
      await convex.mutation(
        (apiMutations.orders.clearCart as unknown as ClearCartMutation),
        { userId }
      );
    } catch (error) {
      logger.warn('Could not clear cart after order creation:', error);
      // Continue - orders are created, cart clearing can be retried
    }

    // Get final order details for the first order
    const finalOrders = await convex.query(
      (apiQueries.orders.listByCustomer as unknown as ListOrdersQuery),
      { customer_id: userId }
    ) as OrderData[];
    const finalOrder = firstOrder 
      ? finalOrders.find((o: OrderData) => o._id === firstOrder!._id) || firstOrder
      : null;

    if (!finalOrder && createdOrderIds.length > 0) {
      // Fallback: create a basic order object from the first order ID
      const firstOrderId = createdOrderIds[0];
      const firstChefId = Array.from(itemsByChef.keys())[0];
      const firstOrderItems = itemsByChef.get(firstChefId) || [];
      const firstChefTotal = firstOrderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      return ResponseFactory.success({
        success: true,
        order_id: firstOrderId,
        order: {
          _id: firstOrderId,
          customer_id: userId,
          chef_id: firstChefId,
          order_items: firstOrderItems,
          total_amount: firstChefTotal,
          payment_method: 'card',
          special_instructions,
          delivery_time,
          delivery_address,
          order_status: 'pending',
          payment_status: 'paid',
          payment_id: payment_intent_id,
        },
      }, `Order${createdOrderIds.length > 1 ? 's' : ''} created successfully from cart`);
    }

    return ResponseFactory.success({
      success: true,
      order_id: finalOrder?.order_id || createdOrderIds[0],
      order: finalOrder,
    }, `Order${createdOrderIds.length > 1 ? 's' : ''} created successfully from cart`);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    logger.error('Error creating order from cart:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to create order from cart.'));
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
