import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
import { logger } from '@/lib/utils/logger';
interface UpdateDeliveryStatusRequest {
  assignmentId: string;
  status: 'accepted' | 'picked_up' | 'in_transit' | 'delivered' | 'failed';
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  notes?: string;
  metadata?: Record<string, string>;
}

/**
 * @swagger
 * /delivery/track:
 *   post:
 *     summary: Update Delivery Status
 *     description: Update the status and location of a delivery assignment
 *     tags: [Delivery, Tracking]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - assignmentId
 *               - status
 *             properties:
 *               assignmentId:
 *                 type: string
 *                 description: Delivery assignment ID
 *                 example: "j1234567890abcdef"
 *               status:
 *                 type: string
 *                 enum: [accepted, picked_up, in_transit, delivered, failed]
 *                 description: New delivery status
 *                 example: "in_transit"
 *               location:
 *                 type: object
 *                 nullable: true
 *                 description: Current location coordinates
 *                 properties:
 *                   latitude:
 *                     type: number
 *                     minimum: -90
 *                     maximum: 90
 *                     description: Latitude coordinate
 *                     example: 51.5074
 *                   longitude:
 *                     type: number
 *                     minimum: -180
 *                     maximum: 180
 *                     description: Longitude coordinate
 *                     example: -0.1276
 *                   accuracy:
 *                     type: number
 *                     minimum: 0
 *                     description: Location accuracy in meters
 *                     example: 10
 *               notes:
 *                 type: string
 *                 nullable: true
 *                 description: Additional notes about the delivery status
 *                 example: "Delivered to front door as requested"
 *               metadata:
 *                 type: object
 *                 nullable: true
 *                 description: Additional delivery metadata
 *                 example: {"deliveryTime": "18:30", "customerRating": 5}
 *     responses:
 *       200:
 *         description: Delivery status updated successfully
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
 *                       example: "j1234567890abcdef"
 *                     status:
 *                       type: string
 *                       example: "in_transit"
 *                     location:
 *                       type: object
 *                       nullable: true
 *                       properties:
 *                         latitude:
 *                           type: number
 *                           example: 51.5074
 *                         longitude:
 *                           type: number
 *                           example: -0.1276
 *                         accuracy:
 *                           type: number
 *                           example: 10
 *                     notes:
 *                       type: string
 *                       nullable: true
 *                       example: "Delivered to front door as requested"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Status update timestamp
 *                       example: "2024-01-15T18:30:00.000Z"
 *                     updatedBy:
 *                       type: string
 *                       description: User who updated the status
 *                       example: "j1234567890abcdef"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing required fields or invalid status
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
 *       404:
 *         description: Delivery assignment not found
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
async function handlePOST(request: NextRequest) {
  try {
    // Verify authentication
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);const body: UpdateDeliveryStatusRequest = await request.json();
    const { assignmentId, status, location, notes, metadata } = body;

    if (!assignmentId || !status) {
      return ResponseFactory.validationError('Missing required fields: assignmentId and status.');
    }

    const convex = getConvexClient();

    // Get delivery assignment details
    const assignment = await convex.query(api.queries.delivery.getDeliveryAssignmentById, { assignmentId: assignmentId as any });
    if (!assignment) {
      return ResponseFactory.notFound('Delivery assignment not found.');
    }

    // Verify user has permission to update this delivery
    if (user.roles?.[0] === 'driver' && assignment.driver_id !== userId) {
      return ResponseFactory.forbidden('Forbidden: You can only update your own deliveries.');
    }

    // Update delivery status
    const updateResult = await convex.mutation(api.mutations.delivery.updateDeliveryStatus, {
      assignmentId: assignment._id,
      driverId: assignment.driver_id,
      status,
      location,
      notes,
      metadata: {
        updatedByRole: user.roles?.[0],
        updatedBy: userId,
        ...metadata
      }
    });

    logger.log(`Delivery status updated for assignment ${assignmentId} to ${status} by ${userId}`);

    return ResponseFactory.success({
      success: true,
      assignmentId,
      status,
      location,
      updatedAt: new Date().toISOString(),
      message: 'Delivery status updated successfully.'
    });

  } catch (error: any) {
    logger.error('Update delivery status error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to update delivery status.' 
    );
  }
}

async function handleGET(request: NextRequest) {
  try {
    // Verify authentication
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);const { searchParams } = new URL(request.url);
    const assignmentId = searchParams.get('assignmentId');
    const orderId = searchParams.get('orderId');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!assignmentId && !orderId) {
      return ResponseFactory.validationError('Missing required parameter: assignmentId or orderId.');
    }

    const convex = getConvexClient();

    let assignment;
    if (assignmentId) {
      assignment = await convex.query(api.queries.delivery.getDeliveryAssignmentById, { assignmentId: assignmentId as any });
    } else if (orderId) {
      assignment = await convex.query(api.queries.delivery.getDeliveryAssignmentByOrder, { orderId });
    }

    if (!assignment) {
      return ResponseFactory.notFound('Delivery assignment not found.');
    }

    // Verify user has permission to view this delivery
    if (user.roles?.[0] === 'driver' && assignment.driver_id !== userId) {
      return ResponseFactory.forbidden('Forbidden: You can only view your own deliveries.');
    }

    // Get delivery tracking history
    const trackingHistory = await convex.query(api.queries.delivery.getDeliveryTrackingHistory, {
      assignmentId: assignment._id,
      limit
    });

    // Get driver details
    const driver = await convex.query(api.queries.delivery.getDriverById, { driverId: assignment.driver_id });

    return ResponseFactory.success({});
  } catch (error: any) {
    logger.error('Error tracking delivery:', error);
    return ResponseFactory.internalError('Failed to track delivery');
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const GET = withAPIMiddleware(withErrorHandling(handleGET)); 