import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getAuthenticatedDriver } from '@/lib/api/session-auth';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

/**
 * @swagger
 * /driver/profile/me:
 *   get:
 *     summary: Get Driver Profile
 *     description: Get the current driver's profile information (user + driver profile combined)
 *     tags: [Driver]
 *     responses:
 *       200:
 *         description: Driver profile retrieved successfully
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
 *                     user:
 *                       type: object
 *                       description: User profile (excluding sensitive fields)
 *                     driver:
 *                       type: object
 *                       description: Driver profile
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Driver ID
 *                         name:
 *                           type: string
 *                         email:
 *                           type: string
 *                         phone:
 *                           type: string
 *                         vehicle:
 *                           type: string
 *                         vehicleType:
 *                           type: string
 *                         status:
 *                           type: string
 *                         availability:
 *                           type: string
 *                         rating:
 *                           type: number
 *                         totalDeliveries:
 *                           type: number
 *                         totalEarnings:
 *                           type: number
 *                 message:
 *                   type: string
 *                   example: "Success"
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *       403:
 *         description: Forbidden - only drivers can access this endpoint
 *       404:
 *         description: Driver profile not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handleGET(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId, user } = await getAuthenticatedDriver(request);
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get driver profile by user email
    const driver = await convex.query(api.queries.drivers.getByUserId, {
      userId,
      sessionToken: sessionToken || undefined,
    });

    if (!driver) {
      return ResponseFactory.notFound('Driver profile not found. Please complete your driver registration.');
    }

    // Remove sensitive fields from user
    const { password, sessionExpiry, ...safeUser } = user;

    return ResponseFactory.success({
      user: safeUser,
      driver,
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch driver profile.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

/**
 * @swagger
 * /driver/profile/me:
 *   put:
 *     summary: Update Driver Profile
 *     description: Update the current driver's profile information
 *     tags: [Driver]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               vehicle:
 *                 type: string
 *               vehicleType:
 *                 type: string
 *                 enum: [car, motorcycle, bicycle, scooter, van]
 *               licenseNumber:
 *                 type: string
 *               experience:
 *                 type: number
 *               availability:
 *                 type: string
 *                 enum: [available, busy, offline, on_delivery]
 *               bankName:
 *                 type: string
 *               accountNumber:
 *                 type: string
 *               accountName:
 *                 type: string
 *               privacySettings:
 *                 type: object
 *                 properties:
 *                   locationSharing:
 *                     type: boolean
 *                   analyticsTracking:
 *                     type: boolean
 *                   marketingEmails:
 *                     type: boolean
 *                   dataSharing:
 *                     type: boolean
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - only drivers can update their profile
 *       404:
 *         description: Driver profile not found
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handlePUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedDriver(request);
    const convex = getConvexClientFromRequest(request);
    const sessionToken = getSessionTokenFromRequest(request);

    // Get driver profile by user email
    const driver = await convex.query(api.queries.drivers.getByUserId, {
      userId,
      sessionToken: sessionToken || undefined,
    });

    if (!driver) {
      return ResponseFactory.notFound('Driver profile not found. Please complete your driver registration.');
    }

    const body = await request.json();
    const {
      name,
      phone,
      vehicle,
      vehicleType,
      licenseNumber,
      experience,
      availability,
      bankName,
      accountNumber,
      accountName,
      privacySettings,
      currentLocation,
    } = body;

    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (vehicle !== undefined) updates.vehicle = vehicle;
    if (vehicleType !== undefined) updates.vehicleType = vehicleType;
    if (licenseNumber !== undefined) updates.licenseNumber = licenseNumber;
    if (experience !== undefined) updates.experience = experience;
    if (availability !== undefined) updates.availability = availability;
    if (bankName !== undefined) updates.bankName = bankName;
    if (accountNumber !== undefined) updates.accountNumber = accountNumber;
    if (accountName !== undefined) updates.accountName = accountName;
    if (privacySettings !== undefined) updates.privacySettings = privacySettings;
    if (currentLocation !== undefined) updates.currentLocation = currentLocation;

    // Update driver profile via Convex mutation
    await convex.mutation(api.mutations.drivers.updateDriverProfile, {
      driverId: driver._id,
      ...updates,
    });

    // Fetch updated driver profile
    const updatedDriver = await convex.query(api.queries.drivers.getByUserId, {
      userId,
      sessionToken: sessionToken || undefined,
    });

    if (!updatedDriver) {
      return ResponseFactory.notFound('Driver profile not found.');
    }

    // Get updated user
    const user = await convex.query(api.queries.users.getById, {
      userId,
      sessionToken: sessionToken || undefined,
    });

    if (!user) {
      return ResponseFactory.notFound('User not found.');
    }

    const { password: _, sessionExpiry: __, ...safeUser } = user;

    return ResponseFactory.success({
      user: safeUser,
      driver: updatedDriver,
      message: 'Profile updated successfully',
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to update driver profile.'));
  }
}

export const PUT = withAPIMiddleware(withErrorHandling(handlePUT));

