import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { getConvexClient } from '@/lib/conxed-client';
import { api } from '@/convex/_generated/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { Id } from '@/convex/_generated/dataModel';
import { getAuthenticatedUser } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';
import { getErrorMessage } from '@/types/errors';
interface UpdateDriverLocationRequest {
  driverId: string;
  location: {
    latitude: number;
    longitude: number;
  };
  availability?: 'available' | 'busy' | 'offline' | 'on_delivery';
  metadata?: Record<string, string>;
}

interface UpdateDriverStatusRequest {
  driverId: string;
  status: 'pending' | 'approved' | 'rejected' | 'on_hold' | 'active' | 'inactive' | 'suspended';
  reason?: string;
  metadata?: Record<string, string>;
}

// Type guard for driver status validation
function isValidDriverStatus(status: string | null): status is 'pending' | 'active' | 'inactive' | 'suspended' | 'approved' | 'rejected' | 'on_hold' {
  return status === 'pending' || status === 'active' || status === 'inactive' || status === 'suspended' || status === 'approved' || status === 'rejected' || status === 'on_hold';
}

// Type guard for driver availability validation
function isValidDriverAvailability(availability: string | null): availability is 'available' | 'busy' | 'offline' | 'on_delivery' {
  return availability === 'available' || availability === 'busy' || availability === 'offline' || availability === 'on_delivery';
}

/**
 * @swagger
 * /delivery/drivers:
 *   get:
 *     summary: Get Delivery Drivers
 *     description: Retrieve delivery drivers with filtering and pagination
 *     tags: [Delivery, Drivers]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, rejected, on_hold, active, inactive, suspended]
 *         description: Filter by driver status
 *         example: "active"
 *       - in: query
 *         name: availability
 *         schema:
 *           type: string
 *           enum: [available, busy, offline, on_delivery]
 *         description: Filter by driver availability
 *         example: "available"
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of drivers to return
 *         example: 50
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of drivers to skip
 *         example: 0
 *     responses:
 *       200:
 *         description: Delivery drivers retrieved successfully
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
 *                     drivers:
 *                       type: array
 *                       description: Array of delivery drivers
 *                       items:
 *                         type: object
 *                         properties:
 *                           _id:
 *                             type: string
 *                             description: Driver ID
 *                             example: "j1234567890abcdef"
 *                           userId:
 *                             type: string
 *                             description: Associated user ID
 *                             example: "j1234567890abcdef"
 *                           name:
 *                             type: string
 *                             description: Driver name
 *                             example: "John Smith"
 *                           email:
 *                             type: string
 *                             description: Driver email
 *                             example: "driver@example.com"
 *                           phone:
 *                             type: string
 *                             description: Driver phone number
 *                             example: "+1234567890"
 *                           status:
 *                             type: string
 *                             enum: [pending, approved, rejected, on_hold, active, inactive, suspended]
 *                             description: Driver status
 *                             example: "active"
 *                           availability:
 *                             type: string
 *                             enum: [available, busy, offline, on_delivery]
 *                             description: Current availability
 *                             example: "available"
 *                           location:
 *                             type: object
 *                             nullable: true
 *                             description: Current location
 *                             properties:
 *                               latitude:
 *                                 type: number
 *                                 example: 51.5074
 *                               longitude:
 *                                 type: number
 *                                 example: -0.1276
 *                               accuracy:
 *                                 type: number
 *                                 example: 10
 *                               lastUpdated:
 *                                 type: string
 *                                 format: date-time
 *                                 example: "2024-01-15T15:30:00.000Z"
 *                           vehicle:
 *                             type: object
 *                             nullable: true
 *                             description: Vehicle information
 *                             properties:
 *                               type:
 *                                 type: string
 *                                 example: "bicycle"
 *                               make:
 *                                 type: string
 *                                 example: "Trek"
 *                               model:
 *                                 type: string
 *                                 example: "FX 3"
 *                               licensePlate:
 *                                 type: string
 *                                 nullable: true
 *                                 example: "ABC123"
 *                           rating:
 *                             type: number
 *                             nullable: true
 *                             description: Average rating
 *                             example: 4.8
 *                           totalDeliveries:
 *                             type: number
 *                             description: Total deliveries completed
 *                             example: 150
 *                           activeDeliveries:
 *                             type: number
 *                             description: Currently active deliveries
 *                             example: 2
 *                           maxCapacity:
 *                             type: number
 *                             description: Maximum delivery capacity
 *                             example: 5
 *                           serviceAreas:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Service area codes
 *                             example: ["SW1", "SW2", "SW3"]
 *                           certifications:
 *                             type: array
 *                             items:
 *                               type: string
 *                             description: Driver certifications
 *                             example: ["food_safety", "first_aid"]
 *                           createdAt:
 *                             type: string
 *                             format: date-time
 *                             description: Driver registration timestamp
 *                             example: "2024-01-15T10:00:00.000Z"
 *                           updatedAt:
 *                             type: string
 *                             format: date-time
 *                             description: Last update timestamp
 *                             example: "2024-01-15T15:30:00.000Z"
 *                     total:
 *                       type: number
 *                       description: Total number of drivers matching filters
 *                       example: 25
 *                     limit:
 *                       type: number
 *                       example: 50
 *                     offset:
 *                       type: number
 *                       example: 0
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - invalid parameters
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
 */
async function handleGET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const availability = searchParams.get('availability');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const convex = getConvexClient();

    // Get drivers based on filters with proper type validation
    const drivers = await convex.query(api.queries.delivery.getDrivers, {
      status: isValidDriverStatus(status) ? status : undefined,
      availability: isValidDriverAvailability(availability) ? availability : undefined,
      limit,
      offset
    });

    return ResponseFactory.success({});
  } catch (error: any) {
    console.error('Error getting drivers:', error);
    return ResponseFactory.internalError('Failed to get drivers');
  }
}

/**
 * @swagger
 * /delivery/drivers:
 *   post:
 *     summary: Update Driver Location/Status
 *     description: Update driver location, availability, or status (admin/staff/driver only)
 *     tags: [Delivery, Drivers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - driverId
 *               - location
 *             properties:
 *               driverId:
 *                 type: string
 *                 description: Driver ID to update
 *                 example: "j1234567890abcdef"
 *               location:
 *                 type: object
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
 *               availability:
 *                 type: string
 *                 enum: [available, busy, offline, on_delivery]
 *                 description: Driver availability status
 *                 example: "available"
 *               metadata:
 *                 type: object
 *                 nullable: true
 *                 description: Additional update metadata
 *                 example: {"batteryLevel": 85, "signalStrength": "strong"}
 *     responses:
 *       200:
 *         description: Driver location/status updated successfully
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
 *                     driverId:
 *                       type: string
 *                       example: "j1234567890abcdef"
 *                     location:
 *                       type: object
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
 *                     availability:
 *                       type: string
 *                       example: "available"
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 *                       description: Update timestamp
 *                       example: "2024-01-15T15:30:00.000Z"
 *                     updatedBy:
 *                       type: string
 *                       description: User who made the update
 *                       example: "j1234567890abcdef"
 *                     updatedByRole:
 *                       type: string
 *                       example: "driver"
 *                 message:
 *                   type: string
 *                   example: "Driver location updated successfully"
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
 *         description: Forbidden - insufficient permissions or trying to update another driver's location
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Driver not found
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
    const { userId, user } = await getAuthenticatedUser(request);// Check if user has permission to update driver location
    if (!['admin', 'staff', 'driver'].includes(user.roles?.[0])) {
      return ResponseFactory.forbidden('Forbidden: Insufficient permissions.');
    }

    const body: UpdateDriverLocationRequest = await request.json();
    const { driverId, location, availability, metadata } = body;

    if (!driverId || !location) {
      return ResponseFactory.validationError('Missing required fields: driverId and location.');
    }

    // Verify driver can only update their own location
    if (user.roles?.[0] === 'driver' && driverId !== userId) {
      return ResponseFactory.forbidden('Forbidden: You can only update your own location.');
    }

    const convex = getConvexClient();

    // Update driver location and availability
    const updateResult = await convex.mutation(api.mutations.delivery.updateDriverLocation, {
      driverId: driverId as Id<'drivers'>,
      location,
      availability,
      metadata: {
        updatedByRole: user.roles?.[0],
        updatedBy: userId,
        ...metadata
      }
    });

    console.log(`Driver location updated for ${driverId} by ${userId}`);

    return ResponseFactory.success({
      success: true,
      driverId,
      location,
      availability,
      updatedAt: new Date().toISOString(),
      message: 'Driver location updated successfully.'
    });

  } catch (error: any) {
    console.error('Update driver location error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to update driver location.' 
    );
  }
}

async function handlePATCH(request: NextRequest) {
  try {
    // Verify authentication
    // Get authenticated user from session token
    const { userId, user } = await getAuthenticatedUser(request);// Check if user has permission to update driver status
    if (!['admin', 'staff'].includes(user.roles?.[0])) {
      return ResponseFactory.forbidden('Forbidden: Only admins and staff can update driver status.');
    }

    const body: UpdateDriverStatusRequest = await request.json();
    const { driverId, status, reason, metadata } = body;

    if (!driverId || !status) {
      return ResponseFactory.validationError('Missing required fields: driverId and status.');
    }

    const convex = getConvexClient();

    // Update driver status
    const updateResult = await convex.mutation(api.mutations.delivery.updateDriverStatus, {
      driverId: driverId as Id<'drivers'>,
      status,
      reason,
      updatedBy: userId as Id<'users'>,
      metadata: {
        updatedByRole: user.roles?.[0],
        ...metadata
      }
    });

    console.log(`Driver status updated for ${driverId} to ${status} by ${userId}`);

    return ResponseFactory.success({
      success: true,
      driverId,
      status,
      reason,
      updatedAt: new Date().toISOString(),
      message: 'Driver status updated successfully.'
    });

  } catch (error: any) {
    console.error('Update driver status error:', error);
    return ResponseFactory.internalError(error.message || 'Failed to update driver status.' 
    );
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
export const PATCH = withAPIMiddleware(withErrorHandling(handlePATCH)); 