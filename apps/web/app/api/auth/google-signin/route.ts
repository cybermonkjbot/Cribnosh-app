import { api } from '@/convex/_generated/api';
import { withErrorHandling, ErrorFactory, errorHandler, ErrorCode } from '@/lib/errors';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { ResponseFactory } from '@/lib/api';
import { logger } from '@/lib/utils/logger';

// Endpoint: /v1/auth/google-signin
// Group: auth

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

/**
 * @swagger
 * /auth/google-signin:
 *   post:
 *     summary: Google OAuth Sign-in
 *     description: Authenticate user using Google OAuth (ID token or access token)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Google ID token (preferred method)
 *                 example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               accessToken:
 *                 type: string
 *                 description: Google access token (alternative method)
 *                 example: "ya29.a0AfH6SMC..."
 *     responses:
 *       200:
 *         description: Google authentication successful
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
 *                     message:
 *                       type: string
 *                       example: "Authentication successful"
 *                     token:
 *                       type: string
 *                       description: JWT authentication token
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                     user:
 *                       type: object
 *                       properties:
 *                         user_id:
 *                           type: string
 *                           example: "j1234567890abcdef"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: "user@gmail.com"
 *                         name:
 *                           type: string
 *                           example: "John Doe"
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["user"]
 *                         picture:
 *                           type: string
 *                           description: Google profile picture URL
 *                           example: "https://lh3.googleusercontent.com/..."
 *                         isNewUser:
 *                           type: boolean
 *                           example: false
 *                         provider:
 *                           type: string
 *                           example: "google"
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
 *         description: Invalid Google token
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
 *     security: []
 */
async function handlePOST(request: NextRequest) {
  try {
    const { idToken, accessToken } = await request.json();
    
    if (!idToken && !accessToken) {
      return ResponseFactory.validationError('Either idToken or accessToken is required.');
    }

    const convex = getConvexClient();
    
    // Verify Google token and get user info
    let googleUserInfo;
    
    if (idToken) {
      // Verify ID token with Google
      googleUserInfo = await verifyGoogleIdToken(idToken);
    } else if (accessToken) {
      // Get user info using access token
      googleUserInfo = await getGoogleUserInfo(accessToken);
    }
    
    if (!googleUserInfo) {
      return ResponseFactory.unauthorized('Invalid Google token or failed to verify.');
    }

    // Create or update user with OAuth info
    const { userId, isNewUser } = await convex.mutation(api.mutations.users.createOrUpdateOAuthUser, {
      provider: 'google',
      providerId: googleUserInfo.sub, // Google's unique user ID
      email: googleUserInfo.email,
      name: googleUserInfo.name,
      picture: googleUserInfo.picture,
      verified: googleUserInfo.email_verified,
    });

    // Get the user details
    const user = await convex.query(api.queries.users.getById, { userId });
    
    if (!user) {
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve user after OAuth authentication');
    }

    // Ensure user has 'customer' role for API access
    let userRoles = user.roles || ['user'];
    if (!userRoles.includes('customer')) {
      userRoles = [...userRoles, 'customer'];
      // Update user roles in database
      await convex.mutation(api.mutations.users.updateUserRoles, {
        userId: user._id,
        roles: userRoles,
      });
    }

    // Check if user has 2FA enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      // Create verification session for 2FA
      const verificationToken = await convex.mutation(api.mutations.verificationSessions.createVerificationSession, {
        userId: user._id,
      });
      
      return ResponseFactory.success({
        success: true,
        requires2FA: true,
        verificationToken,
        message: '2FA verification required',
      });
    }

    // No 2FA required - create session token using Convex mutation
    const sessionResult = await convex.mutation(api.mutations.users.createAndSetSessionToken, {
      userId: user._id,
      expiresInDays: 30, // 30 days expiry
    });
    
    // Set session token cookie
    const isProd = process.env.NODE_ENV === 'production';
    const response = ResponseFactory.success({
      success: true,
      message: isNewUser ? 'User created and authenticated successfully' : 'Authentication successful',
      sessionToken: sessionResult.sessionToken,
      user: {
        user_id: user._id,
        email: user.email,
        name: user.name,
        roles: userRoles,
        picture: user.oauthProviders?.find((p: { provider: string; picture?: string }) => p.provider === 'google')?.picture,
        isNewUser,
        provider: 'google',
      },
    });
    
    response.cookies.set('convex-auth-token', sessionResult.sessionToken, {
      httpOnly: true,
      secure: isProd,
      sameSite: 'strict',
      maxAge: 30 * 24 * 60 * 60, // 30 days
      path: '/',
    });
    
    return response;

  } catch (error: unknown) {
    return ResponseFactory.internalError(getErrorMessage(error, 'Google sign-in failed'));
  }
}

/**
 * Verify Google ID token
 */
async function verifyGoogleIdToken(idToken: string) {
  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`
    );
    
    if (!response.ok) {
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Failed to verify Google ID token');
    }
    
    const data = await response.json();
    
    // Validate required fields
    if (!data.sub || !data.email || !data.name) {
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Invalid Google ID token data');
    }
    
    return {
      sub: data.sub,
      email: data.email,
      name: data.name,
      picture: data.picture,
      email_verified: data.email_verified === 'true',
    };
  } catch (error) {
    logger.error('Google ID token verification failed:', error);
    return null;
  }
}

/**
 * Get user info using Google access token
 */
async function getGoogleUserInfo(accessToken: string) {
  try {
    const response = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    
    if (!response.ok) {
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Failed to get Google user info');
    }
    
    const data = await response.json();
    
    // Validate required fields
    if (!data.id || !data.email || !data.name) {
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Invalid Google user info data');
    }
    
    return {
      sub: data.id,
      email: data.email,
      name: data.name,
      picture: data.picture,
      email_verified: data.verified_email || false,
    };
  } catch (error) {
    logger.error('Google user info fetch failed:', error);
    return null;
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
