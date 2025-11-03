import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { Id } from '@/convex/_generated/dataModel';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cribnosh-dev-secret';

interface AssignDeliveryRequest {
  orderId: string;
  driverId?: string; // Optional - if not provided, auto-assign
  estimatedPickupTime?: string;
  estimatedDeliveryTime?: string;
  pickupInstructions?: string;
  deliveryInstructions?: string;
  metadata?: Record<string, string>;
}

/**
 * @swagger
 * /delivery/assign:
 *   post:
 *     summary: Assign Delivery Driver
 *     description: Assign a delivery driver to an order (admin/staff only)
 *     tags: [Delivery, Orders]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - orderId
 *             properties:
 *               orderId:
 *                 type: string
 *                 description: Order ID to assign delivery for
 *                 example: "j1234567890abcdef"
 *               driverId:
 *                 type: string
 *                 nullable: true
 *                 description: Specific driver ID (auto-assign if not provided)
 *                 example: "j1234567890abcdef"
 *               estimatedPickupTime:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Estimated pickup time
 *                 example: "2024-01-15T18:00:00.000Z"
 *               estimatedDeliveryTime:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 description: Estimated delivery time
 *                 example: "2024-01-15T18:30:00.000Z"
 *               pickupInstructions:
 *                 type: string
 *                 nullable: true
 *                 description: Special pickup instructions
 *                 example: "Ring doorbell twice, ask for John"
 *               deliveryInstructions:
 *                 type: string
 *                 nullable: true
 *                 description: Special delivery instructions
 *                 example: "Leave at front door if no answer"
 *               metadata:
 *                 type: object
 *                 nullable: true
 *                 description: Additional delivery metadata
 *                 example: {"priority": "high", "fragile": true}
 *     responses:
 *       200:
 *         description: Delivery assigned successfully
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
 *                     assignmentId:
 *                       type: string
 *                       description: Delivery assignment ID
 *                       example: "j1234567890abcdef"
 *                     orderId:
 *                       type: string
 *                       example: "j1234567890abcdef"
 *                     driverId:
 *                       type: string
 *                       description: Assigned driver ID
 *                       example: "j1234567890abcdef"
 *                     status:
 *                       type: string
 *                       enum: [assigned, picked_up, in_transit, delivered, failed]
 *                       description: Delivery status
 *                       example: "assigned"
 *                     estimatedPickupTime:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: "2024-01-15T18:00:00.000Z"
 *                     estimatedDeliveryTime:
 *                       type: string
 *                       format: date-time
 *                       nullable: true
 *                       example: "2024-01-15T18:30:00.000Z"
 *                     assignedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Assignment timestamp
 *                       example: "2024-01-15T17:45:00.000Z"
 *                     assignedBy:
 *                       type: string
 *                       description: User who made the assignment
 *                       example: "j1234567890abcdef"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing required fields
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
 *         description: Forbidden - only admins and staff can assign deliveries
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Order not found
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
async function handlePOST(request: NextRequest) {
  try {
    // Verify authentication
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

    // Check if user has permission to assign deliveries
    if (!['admin', 'staff'].includes(payload.role)) {
      return ResponseFactory.forbidden('Forbidden: Only admins and staff can assign deliveries.');
    }

    const body: AssignDeliveryRequest = await request.json();
    const { orderId, driverId, estimatedPickupTime, estimatedDeliveryTime, pickupInstructions, deliveryInstructions, metadata } = body;

    if (!orderId) {
      return ResponseFactory.validationError('Missing required field: orderId.');
    }

    const convex = getConvexClient();

    // Get order details
    const order = await convex.query(api.queries.orders.getOrderById, { orderId });
    if (!order) {
      return ResponseFactory.notFound('Order not found.');
    }

    // Check if order is ready for delivery assignment
    if (order.order_status !== 'ready') {
      return ResponseFactory.validationError('Order is not ready for delivery assignment. Current status: ${order.order_status}');
    }

    // Check if order already has a delivery assignment
    const existingAssignment = await convex.query(api.queries.delivery.getDeliveryAssignmentByOrder, { orderId });
    if (existingAssignment) {
      return ResponseFactory.validationError('Order already has a delivery assignment.');
    }

    let selectedDriverId = driverId;

    // Auto-assign driver if not specified
    if (!selectedDriverId) {
      // Convert delivery address to coordinates format
      const orderLocation = order.delivery_address && typeof order.delivery_address === 'object' && 'latitude' in order.delivery_address
        ? { 
            latitude: typeof order.delivery_address.latitude === 'number' ? order.delivery_address.latitude : 0, 
            longitude: typeof (order.delivery_address as any).longitude === 'number' ? (order.delivery_address as any).longitude : 0 
          }
        : { latitude: 0, longitude: 0 };

      const availableDrivers = await convex.query(api.queries.delivery.getAvailableDrivers, {
        orderLocation
      });
      
      if (availableDrivers.length === 0) {
        return ResponseFactory.notFound('No available drivers found for this order.');
      }

      // Select the best driver (closest or highest rated)
      selectedDriverId = availableDrivers[0]._id;
    } else {
      // Verify the specified driver exists and is available
      const driver = await convex.query(api.queries.delivery.getDriverById, { driverId: selectedDriverId as Id<'drivers'> });
      if (!driver) {
        return ResponseFactory.notFound('Driver not found.');
      }
      if (driver.availability !== 'available') {
        return ResponseFactory.validationError('Driver is not available. Current status: ${driver.availability}');
      }
    }

    // Create delivery assignment
    const assignmentResult = await convex.mutation(api.mutations.delivery.assignDelivery, {
      orderId: order._id,
      driverId: selectedDriverId as Id<'drivers'>,
      assignedBy: payload.user_id as Id<'users'>,
      estimatedPickupTime: estimatedPickupTime ? new Date(estimatedPickupTime).getTime() : undefined,
      estimatedDeliveryTime: estimatedDeliveryTime ? new Date(estimatedDeliveryTime).getTime() : undefined,
      pickupInstructions,
      deliveryInstructions,
      metadata: {
        assignedByRole: payload.role,
        orderStatus: order.order_status,
        ...metadata
      }
    });

    if (!assignmentResult) {
      return ResponseFactory.error('Failed to create delivery assignment.', 'CUSTOM_ERROR', 500);
    }

    console.log(`Delivery assigned for order ${orderId} to driver ${selectedDriverId} by ${payload.user_id}`);

    return ResponseFactory.success({});
  } catch (error: any) {
    console.error('Error assigning delivery:', error);
    return ResponseFactory.internalError('Failed to assign delivery');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST)); 