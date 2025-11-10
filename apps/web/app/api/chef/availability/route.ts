import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withErrorHandling } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { getAuthenticatedChef } from '@/lib/api/session-auth';
import { AuthenticationError, AuthorizationError } from '@/lib/errors/standard-errors';

/**
 * @swagger
 * /chef/availability:
 *   get:
 *     summary: Get Chef Availability
 *     description: Retrieve the current availability status and schedule for the authenticated chef
 *     tags: [Chef, Availability]
 *     responses:
 *       200:
 *         description: Chef availability retrieved successfully
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
 *                     availability:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Availability record ID
 *                           example: "j1234567890abcdef"
 *                         chefId:
 *                           type: string
 *                           description: Chef ID
 *                           example: "j1234567890abcdef"
 *                         isAvailable:
 *                           type: boolean
 *                           description: Whether the chef is currently available for orders
 *                           example: true
 *                         availableDays:
 *                           type: array
 *                           items:
 *                             type: string
 *                           description: Days of the week when chef is available
 *                           example: ["monday", "tuesday", "wednesday", "thursday", "friday"]
 *                         availableHours:
 *                           type: object
 *                           description: Available hours for each day
 *                           example:
 *                             monday: {start: "09:00", end: "21:00"}
 *                             tuesday: {start: "09:00", end: "21:00"}
 *                             wednesday: {start: "09:00", end: "21:00"}
 *                         maxOrdersPerDay:
 *                           type: number
 *                           description: Maximum number of orders chef can accept per day
 *                           example: 15
 *                         advanceBookingDays:
 *                           type: number
 *                           description: Number of days in advance orders can be booked
 *                           example: 7
 *                         specialInstructions:
 *                           type: string
 *                           nullable: true
 *                           description: Special instructions for availability
 *                           example: "Not available on weekends"
 *                         currentOrdersToday:
 *                           type: number
 *                           description: Number of orders already accepted today
 *                           example: 5
 *                         nextAvailableSlot:
 *                           type: string
 *                           format: date-time
 *                           nullable: true
 *                           description: Next available time slot
 *                           example: "2024-01-15T14:00:00.000Z"
 *                         createdAt:
 *                           type: string
 *                           format: date-time
 *                           description: Availability record creation timestamp
 *                           example: "2024-01-15T10:00:00.000Z"
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           description: Last update timestamp
 *                           example: "2024-01-15T15:30:00.000Z"
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
 *         description: Forbidden - only chefs can access this endpoint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chef profile not found
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
    // Get authenticated chef from session token
    const { userId } = await getAuthenticatedChef(request);
    
    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Get chef profile first
    const chef = await convex.query(api.queries.chefs.getByUserId, {
      userId,
      sessionToken: sessionToken || undefined
    });
    if (!chef) {
      return ResponseFactory.notFound('Chef profile not found.');
    }
    
    // Get chef availability
    const availability = await convex.query(api.queries.chefs.getAvailability, {
      chefId: chef._id,
      sessionToken: sessionToken || undefined
    });
    
    return ResponseFactory.success({ availability });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch availability.'));
  }
}

/**
 * @swagger
 * /chef/availability:
 *   put:
 *     summary: Update Chef Availability
 *     description: Update the availability status and schedule for the authenticated chef
 *     tags: [Chef, Availability]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - isAvailable
 *             properties:
 *               isAvailable:
 *                 type: boolean
 *                 description: Whether the chef is currently available for orders
 *                 example: true
 *               availableDays:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [monday, tuesday, wednesday, thursday, friday, saturday, sunday]
 *                 description: Days of the week when chef is available
 *                 example: ["monday", "tuesday", "wednesday", "thursday", "friday"]
 *               availableHours:
 *                 type: object
 *                 description: Available hours for each day
 *                 example:
 *                   monday: {start: "09:00", end: "21:00"}
 *                   tuesday: {start: "09:00", end: "21:00"}
 *                   wednesday: {start: "09:00", end: "21:00"}
 *               maxOrdersPerDay:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 50
 *                 description: Maximum number of orders chef can accept per day
 *                 example: 15
 *               advanceBookingDays:
 *                 type: number
 *                 minimum: 1
 *                 maximum: 30
 *                 description: Number of days in advance orders can be booked
 *                 example: 7
 *               specialInstructions:
 *                 type: string
 *                 nullable: true
 *                 description: Special instructions for availability
 *                 example: "Not available on weekends"
 *     responses:
 *       200:
 *         description: Chef availability updated successfully
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
 *                     availability:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         chefId:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         isAvailable:
 *                           type: boolean
 *                           example: true
 *                         availableDays:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["monday", "tuesday", "wednesday", "thursday", "friday"]
 *                         availableHours:
 *                           type: object
 *                           example:
 *                             monday: {start: "09:00", end: "21:00"}
 *                             tuesday: {start: "09:00", end: "21:00"}
 *                         maxOrdersPerDay:
 *                           type: number
 *                           example: 15
 *                         advanceBookingDays:
 *                           type: number
 *                           example: 7
 *                         specialInstructions:
 *                           type: string
 *                           nullable: true
 *                           example: "Not available on weekends"
 *                         updatedAt:
 *                           type: string
 *                           format: date-time
 *                           example: "2024-01-15T15:30:00.000Z"
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       400:
 *         description: Validation error - missing required fields or invalid values
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
 *         description: Forbidden - only chefs can access this endpoint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Chef profile not found
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
async function handlePUT(request: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated chef from session token
    const { userId } = await getAuthenticatedChef(request);
    
    const body = await request.json();
    const { 
      isAvailable, 
      availableDays, 
      availableHours, 
      maxOrdersPerDay, 
      advanceBookingDays,
      specialInstructions 
    } = body;
    
    if (isAvailable === undefined) {
      return ResponseFactory.validationError('Missing required field: isAvailable');
    }
    
    const convex = getConvexClient();
    const sessionToken = getSessionTokenFromRequest(request);
    
    // Get chef profile first
    const chef = await convex.query(api.queries.chefs.getByUserId, {
      userId,
      sessionToken: sessionToken || undefined
    });
    if (!chef) {
      return ResponseFactory.notFound('Chef profile not found.');
    }
    
    // Update chef availability
    await convex.mutation(api.mutations.chefs.updateAvailability, {
      chefId: chef._id,
      updates: {
        isAvailable,
        availableDays: availableDays || [],
        availableHours: availableHours || {},
        maxOrdersPerDay: maxOrdersPerDay || 10,
        advanceBookingDays: advanceBookingDays || 7,
        specialInstructions: specialInstructions || ''
      },
      sessionToken: sessionToken || undefined
    });
    
    return ResponseFactory.success({ success: true });
  } catch (error: unknown) {
    if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
      return ResponseFactory.unauthorized(error.message);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to update availability.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));
export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));
