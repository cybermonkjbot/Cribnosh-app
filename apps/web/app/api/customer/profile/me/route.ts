import { NextRequest } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { api } from '@/convex/_generated/api';
import { getConvexClientFromRequest } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { NextResponse } from 'next/server';
import { getAuthenticatedCustomer } from '@/lib/api/session-auth';
import { handleConvexError, isAuthenticationError, isAuthorizationError } from '@/lib/api/error-handler';

/**
 * @swagger
 * /customer/profile/me:
 *   get:
 *     summary: Get Customer Profile
 *     description: Get the current customer's profile information
 *     tags: [Customer]
 *     responses:
 *       200:
 *         description: Customer profile retrieved successfully
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
 *                       description: Customer profile (excluding sensitive fields)
 *                       properties:
 *                         _id:
 *                           type: string
 *                           description: Customer ID
 *                           example: "j1234567890abcdef"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: "customer@example.com"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["customer"]
 *                         _creationTime:
 *                           type: number
 *                           description: Account creation timestamp
 *                           example: 1640995200000
 *                         avatar:
 *                           type: string
 *                           nullable: true
 *                           description: Profile picture URL
 *                           example: "https://example.com/avatar.jpg"
 *                         phone:
 *                           type: string
 *                           nullable: true
 *                           description: Phone number
 *                           example: "+1234567890"
 *                         preferences:
 *                           type: object
 *                           nullable: true
 *                           description: Customer preferences
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
 *         description: Forbidden - only customers can access this endpoint
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
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
    const user = await convex.query(api.queries.users.getById, { userId });
    if (!user) {
      return ResponseFactory.notFound('User not found.');
    }
    const { password, sessionToken, sessionExpiry, ...safeUser } = user;
    
    // Transform address from backend format (zipCode) to frontend format (postal_code)
    if (safeUser.address && safeUser.address.zipCode) {
      safeUser.address = {
        ...safeUser.address,
        postal_code: safeUser.address.zipCode,
      };
      delete (safeUser.address as any).zipCode;
    }
    
    return ResponseFactory.success({ user: safeUser });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to fetch user.'));
  }
}

export const GET = withAPIMiddleware(withErrorHandling(handleGET));

/**
 * @swagger
 * /customer/profile/me:
 *   put:
 *     summary: Update Customer Profile
 *     description: Update the current customer's profile information
 *     tags: [Customer]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Customer's display name
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 description: Customer's email address
 *                 example: "customer@example.com"
 *               phone:
 *                 type: string
 *                 description: Customer's phone number
 *                 example: "+1234567890"
 *               picture:
 *                 type: string
 *                 description: Profile picture URL
 *                 example: "https://example.com/avatar.jpg"
 *               preferences:
 *                 type: object
 *                 description: Customer preferences
 *                 properties:
 *                   dietary_restrictions:
 *                     type: array
 *                     items:
 *                       type: string
 *                   favorite_cuisines:
 *                     type: array
 *                     items:
 *                       type: string
 *                   delivery_instructions:
 *                     type: string
 *               address:
 *                 type: object
 *                 description: Customer address
 *                 properties:
 *                   street:
 *                     type: string
 *                   city:
 *                     type: string
 *                   state:
 *                     type: string
 *                   postal_code:
 *                     type: string
 *                   country:
 *                     type: string
 *     responses:
 *       200:
 *         description: Profile updated successfully
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
 *                       description: Updated customer profile
 *                 message:
 *                   type: string
 *                   example: "Profile updated successfully"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - invalid or missing authentication
 *       403:
 *         description: Forbidden - only customers can update their profile
 *       500:
 *         description: Internal server error
 *     security:
 *       - cookieAuth: []
 */
async function handlePUT(request: NextRequest): Promise<NextResponse> {
  try {
    const { userId } = await getAuthenticatedCustomer(request);
    
    const body = await request.json();
    const { name, email, phone, picture, preferences, address } = body;
    
    const convex = getConvexClientFromRequest(request);
    
    // Build update object
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone_number = phone;
    if (picture !== undefined) updates.avatar = picture;
    if (preferences !== undefined) {
      updates.preferences = {
        cuisine: preferences.favorite_cuisines || preferences.cuisine || [],
        dietary: preferences.dietary_restrictions || preferences.dietary || [],
      };
    }
    if (address !== undefined) {
      // Convert address from frontend format (postal_code) to backend format (zipCode)
      updates.address = {
        street: address.street || '',
        city: address.city || '',
        state: address.state || '',
        zipCode: address.postal_code || address.zipCode || '',
        country: address.country || '',
      };
    }
    
    // Update user via Convex mutation
    await convex.mutation(api.mutations.users.updateUser, {
      userId: userId as any,
      ...updates,
    });
    
    // Fetch updated user
    const user = await convex.query(api.queries.users.getById, { userId });
    if (!user) {
      return ResponseFactory.notFound('User not found.');
    }
    
    const { password, sessionToken, sessionExpiry, ...safeUser } = user;
    
    // Transform address from backend format (zipCode) to frontend format (postal_code)
    if (safeUser.address && safeUser.address.zipCode) {
      safeUser.address = {
        ...safeUser.address,
        postal_code: safeUser.address.zipCode,
      };
      delete (safeUser.address as any).zipCode;
    }
    
    return ResponseFactory.success({ 
      user: safeUser,
      message: "Profile updated successfully"
    });
  } catch (error: unknown) {
    if (isAuthenticationError(error) || isAuthorizationError(error)) {
      return handleConvexError(error, request);
    }
    return ResponseFactory.internalError(getErrorMessage(error, 'Failed to update profile.'));
  }
}

export const PUT = withAPIMiddleware(withErrorHandling(handlePUT)); 