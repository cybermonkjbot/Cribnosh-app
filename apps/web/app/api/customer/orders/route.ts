import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * @swagger
 * /customer/orders:
 *   get:
 *     summary: Get Customer Orders
 *     description: Get paginated list of orders for the current customer
 *     tags: [Customer]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of orders to return
 *         example: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of orders to skip
 *         example: 0
 *     responses:
 *       200:
 *         description: Orders retrieved successfully
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
 *                     orders:
 *                       type: array
 *                       description: Array of customer orders
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Order ID
 *                             example: "j1234567890abcdef"
 *                           customer_id:
 *                             type: string
 *                             description: Customer ID
 *                             example: "j1234567890abcdef"
 *                           chef_id:
 *                             type: string
 *                             description: Chef ID
 *                             example: "j1234567890abcdef"
 *                           order_items:
 *                             type: array
 *                             description: Items in the order
 *                             items:
 *                               type: object
 *                               properties:
 *                                 dish_id:
 *                                   type: string
 *                                   example: "j1234567890abcdef"
 *                                 quantity:
 *                                   type: number
 *                                   example: 2
 *                                 price:
 *                                   type: number
 *                                   example: 15.99
 *                                 name:
 *                                   type: string
 *                                   example: "Chicken Tikka Masala"
 *                           total_amount:
 *                             type: number
 *                             description: Total order amount
 *                             example: 31.98
 *                           status:
 *                             type: string
 *                             description: Order status
 *                             example: "pending"
 *                           payment_method:
 *                             type: string
 *                             description: Payment method used
 *                             example: "card"
 *                           special_instructions:
 *                             type: string
 *                             nullable: true
 *                             description: Special instructions for the order
 *                             example: "Extra spicy"
 *                           delivery_time:
 *                             type: string
 *                             nullable: true
 *                             description: Requested delivery time
 *                             example: "2024-01-15T18:00:00.000Z"
 *                           createdAt:
 *                             type: number
 *                             description: Order creation timestamp
 *                             example: 1640995200000
 *                     total:
 *                       type: number
 *                       description: Total number of orders
 *                       example: 25
 *                     limit:
 *                       type: number
 *                       description: Number of orders returned
 *                       example: 20
 *                     offset:
 *                       type: number
 *                       description: Number of orders skipped
 *                       example: 0
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only customers can access their orders
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    // Pagination and filtering
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '') || DEFAULT_LIMIT;
    const offset = parseInt(searchParams.get('offset') || '') || 0;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    
    // Get filter parameters
    const statusParam = searchParams.get('status') as 'ongoing' | 'past' | 'all' | null;
    const orderTypeParam = searchParams.get('order_type') as 'individual' | 'group' | 'all' | null;
    
    // Fetch orders with filters
    const orders = await convex.query(api.queries.orders.listByCustomer, { 
      customer_id: userId,
      status: statusParam || 'all',
      order_type: orderTypeParam || 'all',
      limit,
      offset,
      sessionToken: sessionToken || undefined
    });
    
    // Get total count for pagination (without pagination limit)
    const allOrders = await convex.query(api.queries.orders.listByCustomer, {
      customer_id: userId,
      status: statusParam || 'all',
      order_type: orderTypeParam || 'all',
      sessionToken: sessionToken || undefined
    });
    
    return ResponseFactory.success({ 
      orders: orders.map((order: Record<string, unknown>) => ({
        ...order,
        order_status: order.order_status,
        is_group_order: order.is_group_order || false,
        group_order: order.group_order_details || null,
      })),
      total: allOrders.length,
      limit,
      offset,
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch orders.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

/**
 * @swagger
 * /customer/orders:
 *   post:
 *     summary: Create New Order
 *     description: Create a new order with items from a specific chef
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - chef_id
 *               - order_items
 *             properties:
 *               chef_id:
 *                 type: string
 *                 description: ID of the chef
 *                 example: "j1234567890abcdef"
 *               order_items:
 *                 type: array
 *                 description: Array of items to order
 *                 items:
 *                   type: object
 *                   required:
 *                     - dish_id
 *                     - quantity
 *                   properties:
 *                     dish_id:
 *                       type: string
 *                       description: ID of the dish
 *                       example: "j1234567890abcdef"
 *                     quantity:
 *                       type: number
 *                       minimum: 1
 *                       description: Quantity of the dish
 *                       example: 2
 *               special_instructions:
 *                 type: string
 *                 nullable: true
 *                 description: Special instructions for the order
 *                 example: "Extra spicy, no onions"
 *               delivery_time:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Requested delivery time
 *                 example: "2024-01-15T18:00:00.000Z"
 *               payment_method:
 *                 type: string
 *                 description: Payment method
 *                 example: "card"
 *     responses:
 *       200:
 *         description: Order created successfully
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
 *                     order_id:
 *                       type: string
 *                       description: Created order ID
 *                       example: "j1234567890abcdef"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - only customers can create orders
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Dish not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - cookieAuth: []
 */
export const POST = withAPIMiddleware(withErrorHandling(async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);
    const body = await request.json();
    // Support both kitchen_id (mobile API) and chef_id (web API) for compatibility
    const chef_id = body.kitchen_id || body.chef_id;
    // Support both items (mobile API) and order_items (web API) for compatibility
    const order_items = body.items || body.order_items;
    const { delivery_address, special_instructions, delivery_time, payment_method } = body;
    
    if (!chef_id || !Array.isArray(order_items) || order_items.length === 0) {
      return ResponseFactory.validationError('chef_id (or kitchen_id) and items (or order_items) are required.');
    }
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Check regional availability if delivery address is provided
    if (delivery_address) {
      const isRegionSupported = await convex.query(api.queries.admin.checkRegionAvailability, {
        address: {
          city: delivery_address.city,
          country: delivery_address.country,
          coordinates: delivery_address.coordinates,
        },
        sessionToken: sessionToken || undefined
      });
      
      if (!isRegionSupported) {
        return ResponseFactory.validationError(
          'Oops, We do not serve this region yet, Ordering is not available in your region'
        );
      }
    }
    // Calculate total_amount from order_items
    let total_amount = 0;
    for (const item of order_items) {
      if (!item.dish_id || typeof item.quantity !== 'number') {
        return ResponseFactory.validationError('Each order item must have dish_id and quantity.');
      }
      const meals = await convex.query(api.queries.meals.getAll, {
        sessionToken: sessionToken || undefined
      });
      const dish = Array.isArray(meals) ? meals.find((m: any) => m._id === item.dish_id) : null;
      if (!dish) {
        return ResponseFactory.notFound('Dish not found: ${item.dish_id}');
      }
      total_amount += (dish.price || 0) * item.quantity;
    }
    // Prepare order items with dish details
    const orderItems = [];
    for (const item of order_items) {
      const meals = await convex.query(api.queries.meals.getAll, {
        sessionToken: sessionToken || undefined
      });
      const dish = Array.isArray(meals) ? meals.find((m: any) => m._id === item.dish_id) : null;
      if (!dish) {
        return ResponseFactory.notFound('Dish not found: ${item.dish_id}');
      }
      orderItems.push({
        dish_id: item.dish_id,
        quantity: item.quantity,
        price: dish.price,
        name: dish.name,
      });
    }

    // Create the order
    const orderId = await convex.mutation(api.mutations.orders.createOrder, {
      customer_id: userId,
      chef_id,
      order_items: orderItems,
      total_amount,
      payment_method: payment_method,
      special_instructions: special_instructions,
      delivery_time: delivery_time,
      delivery_address: delivery_address,
      sessionToken: sessionToken || undefined
    });

    // Get the order by document ID using a query that fetches all customer orders
    // and finds the one we just created (since orderId is the document _id)
    const allOrders = await convex.query(api.queries.orders.listByCustomer, {
      customer_id: userId,
      sessionToken: sessionToken || undefined
    });
    const order = allOrders.find((o: any) => o._id === orderId);
    
    return ResponseFactory.success({ 
      success: true,
      data: order || {
        _id: orderId,
        customer_id: userId,
        chef_id,
        order_items: orderItems,
        total_amount,
        payment_method,
        special_instructions,
        delivery_time,
        delivery_address,
        order_status: 'pending',
        payment_status: 'pending',
      },
      message: "Order created successfully"
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to create order.'));
  }
})); 