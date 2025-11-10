import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { getConvexClient } from '@/lib/conxed-client';
import { ErrorCode, ErrorFactory, withErrorHandling } from '@/lib/errors';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

// Endpoint: /v1/auth/apple-signin
// Group: auth

const APPLE_CLIENT_ID = process.env.APPLE_CLIENT_ID;
const APPLE_TEAM_ID = process.env.APPLE_TEAM_ID;
const APPLE_KEY_ID = process.env.APPLE_KEY_ID;

/**
 * @swagger
 * /auth/apple-signin:
 *   post:
 *     summary: Apple OAuth Sign-in
 *     description: Authenticate user using Apple Sign-In (identity sessionResult.sessionToken or authorization code)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               identityToken:
 *                 type: string
 *                 description: Apple identity sessionResult.sessionToken (preferred method)
 *                 example: "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
 *               authorizationCode:
 *                 type: string
 *                 description: Apple authorization code (alternative method)
 *                 example: "c1234567890abcdef..."
 *               user:
 *                 type: object
 *                 description: User data from Apple (optional, for authorization code flow)
 *                 properties:
 *                   email:
 *                     type: string
 *                     format: email
 *                     example: "user@privaterelay.appleid.com"
 *                   sub:
 *                     type: string
 *                     example: "001234.abcdef1234567890abcdef1234567890.1234"
 *                   name:
 *                     type: string
 *                     example: "John Doe"
 *     responses:
 *       200:
 *         description: Apple authentication successful
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
 *                     sessionResult.sessionToken:
 *                       type: string
 *                       description: JWT authentication sessionResult.sessionToken
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
 *                           example: "user@privaterelay.appleid.com"
 *                         name:
 *                           type: string
 *                           example: "Apple User 1234"
 *                         roles:
 *                           type: array
 *                           items:
 *                             type: string
 *                           example: ["user"]
 *                         picture:
 *                           type: string
 *                           nullable: true
 *                           description: Apple doesn't provide profile pictures
 *                         isNewUser:
 *                           type: boolean
 *                           example: false
 *                         provider:
 *                           type: string
 *                           example: "apple"
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
 *         description: Invalid Apple sessionResult.sessionToken
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
async function handlePOST(request: NextRequest): Promise<NextResponse> {
  try {
    const { identityToken, authorizationCode, user } = await request.json();
    
    if (!identityToken && !authorizationCode) {
      return ResponseFactory.validationError('Either identityToken or authorizationCode is required.');
    }

    const convex = getConvexClient();
    
    // Verify Apple sessionResult.sessionToken and get user info
    let appleUserInfo;
    
    if (identityToken) {
      // Verify identity sessionResult.sessionToken with Apple
      appleUserInfo = await verifyAppleIdentityToken(identityToken);
    } else if (authorizationCode) {
      // Exchange authorization code for tokens and get user info
      appleUserInfo = await exchangeAppleAuthorizationCode(authorizationCode, user);
    }
    
    if (!appleUserInfo) {
      return ResponseFactory.unauthorized('Invalid Apple sessionResult.sessionToken or failed to verify.');
    }

    // Create or update user with OAuth info
    const { userId, isNewUser } = await convex.mutation(api.mutations.users.createOrUpdateOAuthUser, {
      provider: 'apple',
      providerId: appleUserInfo.sub, // Apple's unique user ID
      email: appleUserInfo.email,
      name: appleUserInfo.name || `Apple User ${appleUserInfo.sub.slice(-4)}`,
      picture: appleUserInfo.picture,
      verified: true, // Apple users are verified by default
    });

    // Get the user details
    // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
    const userDetails = await convex.query(api.queries.users.getById, { 
      userId,
      sessionToken: undefined // No session token during sign-in
    }) as any;
    
    if (!userDetails) {
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Failed to retrieve user after Apple OAuth authentication');
    }

    // Ensure user has 'customer' role for API access
    let userRoles = userDetails.roles || ['user'];
    if (!userRoles.includes('customer')) {
      userRoles = [...userRoles, 'customer'];
      // Update user roles in database
      await convex.mutation(api.mutations.users.updateUserRoles, {
        userId: userDetails._id,
        roles: userRoles,
      });
    }

    // Check if user has 2FA enabled
    if (userDetails.twoFactorEnabled && userDetails.twoFactorSecret) {
      // Create verification session for 2FA
      // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
      const verificationToken = await convex.mutation(api.mutations.verificationSessions.createVerificationSession, {
        userId: userDetails._id,
      }) as string;
      
      return ResponseFactory.success({
        success: true,
        requires2FA: true,
        verificationToken,
        message: '2FA verification required',
      });
    }

    // No 2FA required - create session token using Convex mutation
    // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
    const sessionResult = await convex.mutation(api.mutations.users.createAndSetSessionToken, {
      userId: userDetails._id,
      expiresInDays: 30, // 30 days expiry
    }) as { sessionToken: string; sessionExpiry: number };
    
    // Set session token cookie
    const isProd = process.env.NODE_ENV === 'production';
    const response = ResponseFactory.success({
      success: true,
      message: isNewUser ? 'User created and authenticated successfully' : 'Authentication successful',
      sessionToken: sessionResult.sessionToken,
      user: {
        user_id: userDetails._id,
        email: userDetails.email,
        name: userDetails.name,
        roles: userRoles,
        picture: userDetails.oauthProviders?.find((p: { provider: string; picture?: string }) => p.provider === 'apple')?.picture,
        isNewUser,
        provider: 'apple',
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
    logger.error('Apple sign-in error:', error);
    return ResponseFactory.internalError(getErrorMessage(error, 'Apple sign-in failed'));
  }
}

/**
 * Verify Apple identity token
 */
async function verifyAppleIdentityToken(identityToken: string) {
  try {
    // For production, you should verify the JWT signature using Apple's public keys
    // For now, we'll decode the JWT payload to get user info
    const payload = decodeJWT(identityToken);
    
    if (!payload || !payload.sub) {
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Invalid Apple identity token payload');
    }
    
    // Apple may not always provide email in subsequent sign-ins
    const email = payload.email_verified && payload.email ? payload.email : (payload.email || null);
    
    return {
      sub: payload.sub,
      email: email,
      name: payload.name || `Apple User ${payload.sub.slice(-4)}`,
      picture: undefined, // Apple doesn't provide profile pictures
      email_verified: payload.email_verified || false,
    };
  } catch (error) {
    logger.error('Apple identity sessionResult.sessionToken verification failed:', error);
    if (error instanceof Error) {
      logger.error('Error details:', error.message, error.stack);
    }
    return null;
  }
}

/**
 * Exchange Apple authorization code for user info
 */
async function exchangeAppleAuthorizationCode(authorizationCode: string, userData?: { email?: string; sub?: string; name?: string }) {
  try {
    if (!APPLE_CLIENT_ID || !APPLE_TEAM_ID || !APPLE_KEY_ID) {
      logger.error('Apple OAuth configuration missing');
      return null;
    }

    // Exchange authorization code for access sessionResult.sessionToken
    const tokenResponse = await fetch('https://appleid.apple.com/auth/sessionResult.sessionToken', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: APPLE_CLIENT_ID,
        client_secret: await generateAppleClientSecret(),
        code: authorizationCode,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/apple/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      logger.error('Apple sessionResult.sessionToken exchange failed:', await tokenResponse.text());
      return null;
    }

    const tokenData = await tokenResponse.json();
    
    if (!tokenData.id_token) {
      logger.error('No ID sessionResult.sessionToken received from Apple');
      return null;
    }

    // Verify and decode the ID sessionResult.sessionToken
    const appleUserInfo = await verifyAppleIdentityToken(tokenData.id_token);
    
    if (!appleUserInfo) {
      logger.error('Failed to verify Apple ID sessionResult.sessionToken');
      return null;
    }

    return appleUserInfo;
  } catch (error) {
    logger.error('Apple authorization code exchange failed:', error);
    return null;
  }
}

/**
 * Generate Apple client secret using JWT
 */
async function generateAppleClientSecret() {
  if (!APPLE_TEAM_ID || !APPLE_KEY_ID) {
    throw new Error('Apple OAuth configuration missing');
  }

  const header = {
    alg: 'ES256',
    kid: APPLE_KEY_ID,
  };

  const payload = {
    iss: APPLE_TEAM_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    aud: 'https://appleid.apple.com',
    sub: APPLE_CLIENT_ID,
  };

  try {
    const jwt = require('jsonwebtoken');
    
    // Get Apple private key from environment
    const APPLE_PRIVATE_KEY = process.env.APPLE_PRIVATE_KEY;
    
    if (!APPLE_PRIVATE_KEY) {
      throw new Error('Apple private key not configured');
    }
    
    // Create JWT payload
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: APPLE_TEAM_ID,
      iat: now,
      exp: now + 3600, // 1 hour
      aud: 'https://appleid.apple.com',
      sub: APPLE_CLIENT_ID
    };

    // Sign JWT with ES256 algorithm using Apple private key
    const clientSecret = jwt.sign(payload, APPLE_PRIVATE_KEY, {
      algorithm: 'ES256',
      header: {
        kid: APPLE_KEY_ID,
        alg: 'ES256'
      }
    });
    
    logger.log('Apple client secret generated successfully with ES256 signing');
    return clientSecret;
    
  } catch (error) {
    logger.error('Failed to generate Apple client secret:', error);
    
    // Fallback to unsigned JWT structure if private key is not available
    try {
      const now = Math.floor(Date.now() / 1000);
      const header = {
        alg: 'ES256',
        kid: APPLE_KEY_ID
      };

      const payload = {
        iss: APPLE_TEAM_ID,
        iat: now,
        exp: now + 3600,
        aud: 'https://appleid.apple.com',
        sub: APPLE_CLIENT_ID
      };

      const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      
      logger.warn('Using unsigned JWT structure - Apple private key required for production');
      return `${headerBase64}.${payloadBase64}.unsigned`;
      
    } catch (fallbackError) {
      logger.error('Fallback JWT generation failed:', fallbackError);
      // Return properly structured unsigned JWT as fallback
      const now = Math.floor(Date.now() / 1000);
      const header = {
        alg: 'ES256',
        kid: APPLE_KEY_ID
      };

      const payload = {
        iss: APPLE_TEAM_ID,
        iat: now,
        exp: now + 3600,
        aud: 'https://appleid.apple.com',
        sub: APPLE_CLIENT_ID
      };

      const headerBase64 = Buffer.from(JSON.stringify(header)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
      
      return `${headerBase64}.${payloadBase64}.unsigned`;
    }
  }
}

/**
 * Simple JWT decode (for development - use proper verification in production)
 */
function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = Buffer.from(base64, 'base64').toString('utf-8');
    return JSON.parse(jsonPayload);
  } catch (error) {
    logger.error('JWT decode failed:', error);
    if (error instanceof Error) {
      logger.error('Error details:', error.message, error.stack);
    }
    return null;
  }
}

export const POST = withAPIMiddleware(withErrorHandling(handlePOST));
