import { api } from '@/convex/_generated/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import jwt from 'jsonwebtoken';
import { Id } from '@/convex/_generated/dataModel';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';

interface CustomOrder {
  _id: Id<'custom_orders'>;
  _creationTime: number;
  userId: Id<'users'>;
  requirements: string;
  serving_size: number;
  desired_delivery_time: string;
  custom_order_id: string;
  order_id: string;
  status?: 'pending' | 'processing' | 'completed' | 'cancelled';
  dietary_restrictions?: string | null;
  estimatedPrice?: number;
  createdAt?: number;
  updatedAt?: number;
}

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

interface JWTPayload {
  user_id: string;
  role: string;
  email?: string;
  iat?: number;
  exp?: number;
}
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * @swagger
 * /custom_orders:
 *   get:
 *     summary: Get Custom Orders
 *     description: Retrieve paginated list of custom orders for the authenticated user
 *     tags: [Orders]
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
 *         description: Custom orders retrieved successfully
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
 *                       description: Array of custom orders
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Custom order ID
 *                             example: "j1234567890abcdef"
 *                           userId:
 *                             type: string
 *                             description: User ID who created the order
 *                             example: "j1234567890abcdef"
 *                           requirements:
 *                             type: string
 *                             description: Custom order requirements
 *                             example: "Gluten-free pasta with vegan cheese"
 *                           serving_size:
 *                             type: number
 *                             description: Number of servings
 *                             example: 4
 *                           desired_delivery_time:
 *                             type: string
 *                             format: date-time
 *                             description: Preferred delivery time
 *                             example: "2024-01-15T18:00:00.000Z"
 *                           custom_order_id:
 *                             type: string
 *                             description: Public custom order ID
 *                             example: "CUST-12345"
 *                           order_id:
 *                             type: string
 *                             description: Associated regular order ID
 *                             example: "ORD-12345"
 *                           status:
 *                             type: string
 *                             enum: [pending, processing, completed, cancelled]
 *                             description: Order status
 *                             example: "processing"
 *                           dietary_restrictions:
 *                             type: string
 *                             nullable: true
 *                             description: Dietary restrictions
 *                             example: "gluten-free, vegan"
 *                           createdAt:
 *                             type: number
 *                             description: Creation timestamp
 *                             example: 1640995200000
 *                           updatedAt:
 *                             type: number
 *                             nullable: true
 *                             description: Last update timestamp
 *                             example: 1640995200000
 *                     total:
 *                       type: number
 *                       description: Total number of custom orders
 *                       example: 25
 *                     limit:
 *                       type: number
 *                       example: 20
 *                     offset:
 *                       type: number
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *     security:
 *       - bearerAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    const convex = getConvexClient();
    // Pagination
    const { searchParams } = new URL(request.url);
    let limit = parseInt(searchParams.get('limit') || '') || DEFAULT_LIMIT;
    const offset = parseInt(searchParams.get('offset') || '') || 0;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;
    // Get orders for the current user with pagination
    const userOrders = await convex.query(api.queries.custom_orders.getByUserId, {
      userId: payload.user_id as Id<'users'>
    }) as CustomOrder[] || [];
    
    // Apply pagination
    const orders = userOrders.slice(offset, offset + limit);
    const total = userOrders.length;
    
    return ResponseFactory.success({ 
      orders: orders, 
      total,
      limit, 
      offset 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch custom orders.';
    return ResponseFactory.internalError(errorMessage);
  }
}

/**
 * @swagger
 * /custom_orders:
 *   post:
 *     summary: Create Custom Order
 *     description: Create a new custom order with specific requirements
 *     tags: [Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - details
 *             properties:
 *               details:
 *                 type: object
 *                 required:
 *                   - requirements
 *                   - servingSize
 *                   - desiredDeliveryTime
 *                 properties:
 *                   requirements:
 *                     type: string
 *                     description: Detailed requirements for the custom order
 *                     example: "Gluten-free pasta with vegan cheese, extra spicy"
 *                   servingSize:
 *                     type: number
 *                     minimum: 1
 *                     maximum: 20
 *                     description: Number of servings
 *                     example: 4
 *                   desiredDeliveryTime:
 *                     type: string
 *                     format: date-time
 *                     description: Preferred delivery time
 *                     example: "2024-01-15T18:00:00.000Z"
 *                   dietaryRestrictions:
 *                     type: string
 *                     nullable: true
 *                     description: Dietary restrictions or allergies
 *                     example: "gluten-free, vegan, no nuts"
 *     responses:
 *       200:
 *         description: Custom order created successfully
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
 *                     orderId:
 *                       type: string
 *                       description: Created custom order ID
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
 *       422:
 *         description: Invalid input data
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
 *       - bearerAuth: []
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    
    const body = await request.json();
    const { details } = body;
    
    // Enhanced validation
    if (!details || typeof details !== 'object') {
      return ResponseFactory.validationError('Order details are required.');
    }
    
    if (!details.requirements || typeof details.requirements !== 'string' || details.requirements.trim().length === 0) {
      return ResponseFactory.validationError('Requirements are required and cannot be empty.');
    }
    
    if (!details.servingSize || typeof details.servingSize !== 'number' || details.servingSize < 1 || details.servingSize > 20) {
      return ResponseFactory.validationError('Serving size must be a number between 1 and 20.');
    }
    
    if (!details.desiredDeliveryTime || typeof details.desiredDeliveryTime !== 'string') {
      return ResponseFactory.validationError('Desired delivery time is required.');
    }
    
    // Validate date format
    const deliveryDate = new Date(details.desiredDeliveryTime);
    if (isNaN(deliveryDate.getTime())) {
      return ResponseFactory.validationError('Invalid date format for desired delivery time.');
    }
    
    // Check if delivery time is in the future
    if (deliveryDate <= new Date()) {
      return ResponseFactory.validationError('Desired delivery time must be in the future.');
    }
    
    const convex = getConvexClient();
    const customOrderId = `custom_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const orderId = await convex.mutation(api.mutations.customOrders.create, {
      userId: payload.user_id as Id<'users'>,
      requirements: details.requirements.trim(),
      servingSize: details.servingSize,
      desiredDeliveryTime: details.desiredDeliveryTime,
      dietaryRestrictions: details.dietaryRestrictions || null,
      customOrderId,
      orderId: `order_${Date.now()}`
    });
    
    // Fetch the created order to get the estimated price
    // orderId is the document ID returned from the mutation
    const createdOrder = await convex.query(api.queries.custom_orders.getCustomOrderById, { 
      customOrderId: orderId as Id<'custom_orders'>
    });
    
    return ResponseFactory.success({ 
      success: true, 
      orderId,
      estimatedPrice: createdOrder?.estimatedPrice || null
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create custom order.';
    return ResponseFactory.internalError(errorMessage);
  }
}

async function handlePATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    
    const body = await request.json();
    const { order_id, details } = body;
    
    if (!order_id) {
      return ResponseFactory.validationError('order_id is required.');
    }
    
    if (!details || typeof details !== 'object') {
      return ResponseFactory.validationError('Order details are required for update.');
    }
    
    const convex = getConvexClient();
    
    // Get order by ID
    const order = await convex.query(api.queries.custom_orders.getCustomOrderById, { customOrderId: order_id });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }
    
    if (order.userId !== payload.user_id) {
      return ResponseFactory.forbidden('Unauthorized: You can only update your own orders.');
    }
    
    // Check if order can be updated
    if (order.status && order.status !== 'pending') {
      return ResponseFactory.forbidden('Cannot update a processed order.');
    }
    
    // Validate update fields
    const updates: {
      requirements?: string;
      servingSize?: number;
      desiredDeliveryTime?: string;
      dietaryRestrictions?: string | null;
    } = {};
    
    if (details.requirements !== undefined) {
      if (typeof details.requirements !== 'string' || details.requirements.trim().length === 0) {
        return ResponseFactory.validationError('Requirements must be a non-empty string.');
      }
      updates.requirements = details.requirements.trim();
    }
    
    if (details.servingSize !== undefined) {
      if (typeof details.servingSize !== 'number' || details.servingSize < 1 || details.servingSize > 20) {
        return ResponseFactory.validationError('Serving size must be a number between 1 and 20.');
      }
      updates.servingSize = details.servingSize;
    }
    
    if (details.desiredDeliveryTime !== undefined) {
      if (typeof details.desiredDeliveryTime !== 'string') {
        return ResponseFactory.validationError('Desired delivery time must be a string.');
      }
      
      const deliveryDate = new Date(details.desiredDeliveryTime);
      if (isNaN(deliveryDate.getTime())) {
        return ResponseFactory.validationError('Invalid date format for desired delivery time.');
      }
      
      if (deliveryDate <= new Date()) {
        return ResponseFactory.validationError('Desired delivery time must be in the future.');
      }
      
      updates.desiredDeliveryTime = details.desiredDeliveryTime;
    }
    
    if (details.dietaryRestrictions !== undefined) {
      if (details.dietaryRestrictions !== null && typeof details.dietaryRestrictions !== 'string') {
        return ResponseFactory.validationError('Dietary restrictions must be a string or null.');
      }
      updates.dietaryRestrictions = details.dietaryRestrictions;
    }
    
    if (Object.keys(updates).length === 0) {
      return ResponseFactory.validationError('No valid fields to update.');
    }
    
    await convex.mutation(api.mutations.customOrders.update, {
      orderId: order_id as Id<'custom_orders'>,
      updates: updates
    });
    
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to update order.';
    return ResponseFactory.internalError(errorMessage);
  }
}

async function handleDELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    
    const body = await request.json();
    const { order_id } = body;
    
    if (!order_id) {
      return ResponseFactory.validationError('order_id is required.');
    }
    
    const convex = getConvexClient();
    
    // Get order by ID
    const order = await convex.query(api.queries.custom_orders.getCustomOrderById, { customOrderId: order_id });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }
    
    if (order.userId !== payload.user_id && payload.role !== 'admin') {
      return ResponseFactory.forbidden('Forbidden: You can only delete your own orders.');
    }
    
    // Check if order can be deleted
    if ((order.status || 'pending') !== 'pending' && payload.role !== 'admin') {
      return ResponseFactory.forbidden('Cannot delete a processed order unless you are admin.');
    }
    
    // Delete the order
    await convex.mutation(api.mutations.customOrders.deleteOrder, {
      orderId: order_id as Id<'custom_orders'>
    });
    
    // Audit log - only if admin
    if (payload.role === 'admin') {
      await convex.mutation(api.mutations.admin.logActivity, {
        type: 'custom_order_deletion',
        description: `Custom order ${order_id} was deleted`,
        metadata: {
          entityId: order_id,
          entityType: 'custom_order',
          details: { count: 1 }
        },
        userId: payload.user_id
      });
    }
    
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete order.';
    return ResponseFactory.internalError(errorMessage);
  }
}

async function handleBulkDelete(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    const token = authHeader.replace('Bearer ', '');
    let payload: JWTPayload;
    try {
      payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }
    
    if (payload.role !== 'admin') {
      return ResponseFactory.forbidden('Forbidden: Only admins can bulk delete custom orders.');
    }
    
    const body = await request.json();
    const { order_ids } = body;
    
    if (!Array.isArray(order_ids) || order_ids.length === 0) {
      return ResponseFactory.validationError('order_ids array is required and cannot be empty.');
    }
    
    if (order_ids.length > 100) {
      return ResponseFactory.validationError('Cannot delete more than 100 orders at once.');
    }
    
    const convex = getConvexClient();
    
    // Type check order_ids to ensure they're strings
    const validOrderIds = order_ids.filter((id: unknown): id is string => typeof id === 'string');
    
    if (validOrderIds.length !== order_ids.length) {
      return ResponseFactory.validationError('All order IDs must be strings.');
    }
    
    // Delete orders
    await Promise.all(
      validOrderIds.map((orderId) =>
        convex.mutation(api.mutations.customOrders.deleteOrder, { 
          orderId: orderId as Id<'custom_orders'> 
        })
      )
    );
    
    // Audit log
    await convex.mutation(api.mutations.admin.logActivity, {
      type: 'bulk_custom_order_deletion',
      description: `Bulk deleted ${validOrderIds.length} custom orders`,
      metadata: {
        entityId: validOrderIds[0], // Using the first ID as the primary entity
        entityType: 'custom_order',
        details: { 
          count: validOrderIds.length,
          orderIds: validOrderIds // Include all IDs in the details
        }
      }
    });
    
    return ResponseFactory.success({ success: true, deleted: validOrderIds.length });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to bulk delete custom orders.';
    return ResponseFactory.internalError(errorMessage);
  }
}

async function handleExport(request: NextRequest): Promise<NextResponse> {
  try {
    // Authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return ResponseFactory.unauthorized('Missing or invalid Authorization header.');
    }
    
    // Verify JWT token
    const token = authHeader.replace('Bearer ', '');
    let payload: { user_id: string; role?: string };
    try {
      payload = jwt.verify(token, JWT_SECRET) as { user_id: string; role?: string };
    } catch {
      return ResponseFactory.unauthorized('Invalid or expired token.');
    }

    // Authorization check
    if (payload.role !== 'admin') {
      return ResponseFactory.forbidden('Forbidden: Only admins can export custom orders.');
    }

    // Fetch orders
    const convex = getConvexClient();
    const allOrders = await convex.query(api.queries.custom_orders.getAll) as CustomOrder[];
    
    // Convert orders to CSV format
    if (allOrders.length === 0) {
      return ResponseFactory.fileDownload(
        'No orders to export',
        'custom_orders_export.txt',
        'text/plain'
      );
    }

    // Define CSV header and rows
    const headers = [
      'Order ID', 
      'User ID', 
      'Requirements', 
      'Serving Size', 
      'Desired Delivery Time',
      'Status',
      'Dietary Restrictions',
      'Created At',
      'Updated At'
    ];

    const rows = allOrders.map(order => ({
      'Order ID': order._id,
      'User ID': order.userId,
      'Requirements': order.requirements,
      'Serving Size': order.serving_size.toString(),
      'Desired Delivery Time': order.desired_delivery_time,
      'Status': order.status || 'pending',
      'Dietary Restrictions': order.dietary_restrictions || 'None',
      'Created At': order._creationTime ? new Date(order._creationTime).toISOString() : 'N/A',
      'Updated At': order.updatedAt ? new Date(order.updatedAt).toISOString() : 'N/A'
    }));

    // Convert to CSV string
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        headers.map(header => {
          const value = row[header as keyof typeof row];
          // Escape quotes and wrap in quotes if contains comma or newline
          const escaped = String(value).replace(/"/g, '""');
          return escaped.includes(',') || escaped.includes('\n') 
            ? `"${escaped}"` 
            : escaped;
        }).join(',')
      )
    ].join('\n');

    // Return the CSV file
    const filename = `custom-orders-${new Date().toISOString().split('T')[0]}.csv`;
    return ResponseFactory.csvDownload(csvContent, filename);
  } catch (error: unknown) {
    console.error('Export failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to export custom orders.';
    return ResponseFactory.internalError(errorMessage);
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const PATCH = withAPIMiddleware(withErrorHandling(handlePATCH));
export const DELETE = withAPIMiddleware(withErrorHandling(handleDELETE));

export const BULK_DELETE = withAPIMiddleware(withErrorHandling(handleBulkDelete));

export const EXPORT = withAPIMiddleware(withErrorHandling(handleExport));