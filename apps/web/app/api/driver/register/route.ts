import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClientFromRequest, getSessionTokenFromRequest } from '@/lib/conxed-client';
import { withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

/**
 * @swagger
 * /api/driver/register:
 *   post:
 *     summary: Register Driver
 *     description: Register a new driver with complete profile information
 *     tags: [Driver]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phoneNumber
 *               - vehicleType
 *               - vehicleModel
 *               - vehicleYear
 *               - licensePlate
 *               - driversLicense
 *               - vehicleRegistration
 *               - insurance
 *               - bankName
 *               - bankCode
 *               - accountNumber
 *               - accountName
 *             properties:
 *               sessionToken:
 *                 type: string
 *                 description: Optional session token for authenticated users
 *               firstName:
 *                 type: string
 *                 example: "John"
 *               lastName:
 *                 type: string
 *                 example: "Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *               phoneNumber:
 *                 type: string
 *                 example: "+44 7123 456789"
 *               vehicleType:
 *                 type: string
 *                 example: "Car"
 *               vehicleModel:
 *                 type: string
 *                 example: "Toyota Corolla"
 *               vehicleYear:
 *                 type: string
 *                 example: "2020"
 *               licensePlate:
 *                 type: string
 *                 example: "AB12 CDE"
 *               driversLicense:
 *                 type: string
 *                 description: URL or file ID of driver's license document
 *               driversLicenseFileId:
 *                 type: string
 *                 description: Optional file ID for driver's license
 *               vehicleRegistration:
 *                 type: string
 *                 description: URL or file ID of vehicle registration document
 *               vehicleRegistrationFileId:
 *                 type: string
 *                 description: Optional file ID for vehicle registration
 *               insurance:
 *                 type: string
 *                 description: URL or file ID of insurance document
 *               insuranceFileId:
 *                 type: string
 *                 description: Optional file ID for insurance
 *               bankName:
 *                 type: string
 *                 example: "HSBC"
 *               bankCode:
 *                 type: string
 *                 example: "000004"
 *               accountNumber:
 *                 type: string
 *                 example: "1234567890"
 *               accountName:
 *                 type: string
 *                 example: "John Doe"
 *               workType:
 *                 type: string
 *                 enum: [independent, supplier]
 *                 example: "independent"
 *               supplierId:
 *                 type: string
 *                 description: Required if workType is 'supplier'
 *     responses:
 *       200:
 *         description: Driver registered successfully
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
 *                     driverId:
 *                       type: string
 *                       example: "j1234567890abcdef"
 *                     userId:
 *                       type: string
 *                       nullable: true
 *                       example: "j0987654321fedcba"
 *       400:
 *         description: Validation error
 *       409:
 *         description: Driver with this email already exists
 *       500:
 *         description: Internal server error
 */
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const {
      sessionToken: bodySessionToken,
      firstName,
      lastName,
      email,
      phoneNumber,
      vehicleType,
      vehicleModel,
      vehicleYear,
      licensePlate,
      driversLicense,
      driversLicenseFileId,
      vehicleRegistration,
      vehicleRegistrationFileId,
      insurance,
      insuranceFileId,
      bankName,
      bankCode,
      accountNumber,
      accountName,
      workType,
      supplierId,
    } = body;
    
    // Validate required fields
    if (!firstName || !lastName || !email || !phoneNumber) {
      return ResponseFactory.validationError('firstName, lastName, email, and phoneNumber are required');
    }
    
    if (!vehicleType || !vehicleModel || !vehicleYear || !licensePlate) {
      return ResponseFactory.validationError('vehicleType, vehicleModel, vehicleYear, and licensePlate are required');
    }
    
    if (!driversLicense || !vehicleRegistration || !insurance) {
      return ResponseFactory.validationError('driversLicense, vehicleRegistration, and insurance are required');
    }
    
    if (!bankName || !bankCode || !accountNumber || !accountName) {
      return ResponseFactory.validationError('bankName, bankCode, accountNumber, and accountName are required');
    }
    
    // Validate workType
    if (workType && !['independent', 'supplier'].includes(workType)) {
      return ResponseFactory.validationError('workType must be either "independent" or "supplier"');
    }
    
    if (workType === 'supplier' && !supplierId) {
      return ResponseFactory.validationError('supplierId is required when workType is "supplier"');
    }
    
    // Get session token from request or body
    const sessionToken = getSessionTokenFromRequest(request) || bodySessionToken;
    
    // Get user ID if session token is provided
    let userId: string | undefined;
    if (sessionToken) {
      const convex = getConvexClientFromRequest(request);
      try {
        const user = await convex.query(api.queries.users.getUserBySessionToken, {
          sessionToken,
        });
        if (user) {
          userId = user._id;
        }
      } catch (error) {
        // Session token might be invalid, continue without userId
        console.warn('Failed to get user from session token:', error);
      }
    }
    
    const convex = getConvexClientFromRequest(request);
    
    // Register driver
    const result = await convex.mutation(api.mutations.drivers.registerDriver, {
      userId: userId as any,
      firstName,
      lastName,
      email,
      phoneNumber,
      vehicleType,
      vehicleModel,
      vehicleYear,
      licensePlate,
      driversLicense,
      driversLicenseFileId,
      vehicleRegistration,
      vehicleRegistrationFileId,
      insurance,
      insuranceFileId,
      bankName,
      bankCode,
      accountNumber,
      accountName,
      workType: workType || 'independent',
      supplierId,
    });
    
    return ResponseFactory.success(result);
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    
    // Check if it's a duplicate email error
    const errorMessage = getErrorMessage(error, 'Failed to register driver.');
    if (errorMessage.includes('already exists')) {
      return ResponseFactory.error(errorMessage, 'DUPLICATE_EMAIL', 409);
    }
    
    return ResponseFactory.internalError(errorMessage);
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));

