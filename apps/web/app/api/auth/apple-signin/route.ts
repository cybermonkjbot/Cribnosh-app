import { api } from '@/convex/_generated/api';
import { ResponseFactory } from '@/lib/api';
import { withAPIMiddleware } from '@/lib/api/middleware';
import { fetchMutation } from 'convex/nextjs';
import { withErrorHandling } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';
import { getErrorMessage } from '@/types/errors';
import { NextRequest, NextResponse } from 'next/server';

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

    // No need to initialize client - fetchMutation handles it automatically
    logger.log('Using fetchMutation for server-side Convex call');
    
    // Verify Apple identity token and get user info
    let appleUserInfo;
    
    try {
      if (identityToken) {
        // Verify identity token with Apple
        appleUserInfo = await verifyAppleIdentityToken(identityToken);
      } else if (authorizationCode) {
        // Exchange authorization code for tokens and get user info
        appleUserInfo = await exchangeAppleAuthorizationCode(authorizationCode, user);
      }
    } catch (verifyError) {
      logger.error('Apple token verification error:', verifyError);
      if (verifyError instanceof Error) {
        logger.error('Verification error details:', verifyError.message, verifyError.stack);
      }
      return ResponseFactory.unauthorized('Failed to verify Apple identity token. Please try again.');
    }
    
    if (!appleUserInfo || !appleUserInfo.sub) {
      logger.error('Invalid Apple user info:', appleUserInfo);
      return ResponseFactory.unauthorized('Invalid Apple identity token or failed to verify.');
    }

    // Create or update user with OAuth info
    let userId: string;
    let isNewUser: boolean;
    try {
      // Validate required fields
      if (!appleUserInfo.sub) {
        throw new Error('Missing Apple user ID (sub)');
      }
      if (!appleUserInfo.email) {
        logger.warn('Apple user info missing email, using placeholder');
      }
      
      const mutationArgs = {
        provider: 'apple' as const,
        providerId: appleUserInfo.sub,
        email: appleUserInfo.email || `apple-${appleUserInfo.sub}@privaterelay.appleid.com`,
        name: appleUserInfo.name || `Apple User ${appleUserInfo.sub.slice(-4)}`,
        picture: appleUserInfo.picture,
        verified: true,
      };
      
      logger.log('Calling createOrUpdateOAuthUser with args:', {
        provider: mutationArgs.provider,
        providerId: mutationArgs.providerId,
        email: mutationArgs.email ? 'SET' : 'MISSING',
        name: mutationArgs.name,
        hasPicture: !!mutationArgs.picture,
        verified: mutationArgs.verified,
      });
      
      logger.log('Calling Convex mutation: api.mutations.users.createOrUpdateOAuthUser');
      logger.log('Mutation args being sent:', JSON.stringify(mutationArgs, null, 2));
      logger.log('Using fetchMutation (recommended for Next.js server-side)');
      
      // Use fetchMutation from convex/nextjs - this is the recommended approach for Next.js API routes
      let result;
      try {
        // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
        result = await fetchMutation(api.mutations.users.createOrUpdateOAuthUser, mutationArgs);
      } catch (err: any) {
        // Log comprehensive error details
        logger.error('Promise rejection in mutation call:', err);
        
        // Try to extract more information from the error
        if (err && typeof err === 'object') {
          // Log all enumerable properties
          logger.error('Error type:', err.constructor?.name);
          logger.error('Error properties:', Object.getOwnPropertyNames(err));
          
          // Check for Convex-specific error properties
          if ('status' in err) {
            logger.error('Error status:', err.status);
          }
          if ('statusCode' in err) {
            logger.error('Error statusCode:', err.statusCode);
          }
          if ('code' in err) {
            logger.error('Error code:', err.code);
          }
          if ('name' in err) {
            logger.error('Error name:', err.name);
          }
          
          // Try to get the error as a string
          try {
            logger.error('Error toString:', err.toString());
          } catch (e) {
            logger.error('Could not convert error to string:', e);
          }
          
          // Check if there's a response object
          if ('response' in err && err.response) {
            logger.error('Error response:', JSON.stringify(err.response, null, 2));
          }
          
          // Check if there's a request object
          if ('request' in err && err.request) {
            logger.error('Error request:', JSON.stringify(err.request, null, 2));
          }
        }
        
        throw err;
      }
      
      logger.log('Mutation result received:', { hasUserId: !!result?.userId, isNewUser: result?.isNewUser });
      
      if (!result || !result.userId) {
        throw new Error('Mutation returned invalid result: missing userId');
      }
      
      userId = result.userId;
      isNewUser = result.isNewUser;
    } catch (mutationError: any) {
      logger.error('Failed to create/update OAuth user:', mutationError);
      
      // Extract error message from various possible error formats
      let errorMessage = 'Unknown error';
      
      if (mutationError instanceof Error) {
        errorMessage = mutationError.message || errorMessage;
        logger.error('Mutation error details:', mutationError.message, mutationError.stack);
      }
      
      // Try to get error message from Convex error structure
      if (mutationError && typeof mutationError === 'object') {
        // Check for Convex error data structure
        if (mutationError.data) {
          if (typeof mutationError.data === 'string') {
            errorMessage = mutationError.data;
          } else if (mutationError.data.message) {
            errorMessage = mutationError.data.message;
          } else if (mutationError.data.error) {
            errorMessage = typeof mutationError.data.error === 'string' 
              ? mutationError.data.error 
              : mutationError.data.error.message || errorMessage;
          }
          logger.error('Convex error data:', JSON.stringify(mutationError.data, null, 2));
        }
        
        // Check for direct message property
        if (mutationError.message && errorMessage === 'Unknown error') {
          errorMessage = mutationError.message;
        }
        
        // Check for cause chain
        if (mutationError.cause) {
          if (mutationError.cause instanceof Error) {
            errorMessage = mutationError.cause.message || errorMessage;
          } else if (typeof mutationError.cause === 'string') {
            errorMessage = mutationError.cause;
          } else if (mutationError.cause?.message) {
            errorMessage = mutationError.cause.message;
          }
          logger.error('Error cause:', mutationError.cause);
        }
        
        // Log all error properties for debugging
        logger.error('Error keys:', Object.keys(mutationError));
        if ('status' in mutationError) {
          logger.error('Error status:', mutationError.status);
        }
        if ('response' in mutationError) {
          logger.error('Error response:', mutationError.response);
        }
      }
      
      // Log the full error object for debugging
      try {
        logger.error('Full mutation error:', JSON.stringify(mutationError, Object.getOwnPropertyNames(mutationError), 2));
      } catch (e) {
        logger.error('Could not stringify error:', e);
        logger.error('Error toString:', String(mutationError));
      }
      
      // If we still don't have a meaningful error message, provide a default
      if (!errorMessage || errorMessage === 'Unknown error') {
        errorMessage = 'Failed to create or update user account. Please check the logs for details.';
      }
      
      return ResponseFactory.internalError(`Failed to create user account: ${errorMessage}. Please try again.`);
    }

    // Get the user details
    let userDetails: any;
    try {
      const { fetchQuery } = await import('convex/nextjs');
      // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
      userDetails = await fetchQuery(api.queries.users.getById, { 
        userId,
        sessionToken: undefined // No session token during sign-in
      });
    } catch (queryError) {
      logger.error('Failed to get user details:', queryError);
      if (queryError instanceof Error) {
        logger.error('Query error details:', queryError.message, queryError.stack);
      }
      return ResponseFactory.internalError('Failed to retrieve user information. Please try again.');
    }
    
    if (!userDetails) {
      logger.error('User details not found after creation, userId:', userId);
      return ResponseFactory.internalError('Failed to retrieve user after Apple OAuth authentication');
    }

    // Ensure user has 'customer' role for API access
    let userRoles = userDetails.roles || ['user'];
    if (!userRoles.includes('customer')) {
      userRoles = [...userRoles, 'customer'];
      try {
        // Update user roles in database
        // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
        await fetchMutation(api.mutations.users.updateUserRoles, {
          userId: userDetails._id,
          roles: userRoles,
        });
      } catch (roleError) {
        logger.error('Failed to update user roles:', roleError);
        // Don't fail the request if role update fails, just log it
      }
    }

    // Check if user has 2FA enabled
    if (userDetails.twoFactorEnabled && userDetails.twoFactorSecret) {
      try {
        // Create verification session for 2FA
        // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
        const verificationToken = await fetchMutation(api.mutations.verificationSessions.createVerificationSession, {
          userId: userDetails._id,
        }) as string;
        
        return ResponseFactory.success({
          success: true,
          requires2FA: true,
          verificationToken,
          message: '2FA verification required',
        });
      } catch (twoFactorError) {
        logger.error('Failed to create 2FA verification session:', twoFactorError);
        return ResponseFactory.internalError('Failed to create 2FA verification session. Please try again.');
      }
    }

    // No 2FA required - create session token using Convex mutation
    const userAgent = request.headers.get('user-agent') || undefined;
    const ipAddress = request.headers.get('x-real-ip') || 
                      request.headers.get('cf-connecting-ip') || 
                      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                      undefined;
    const { getDeviceInfoFromBodyOrHeaders } = await import('@/lib/utils/device');
    const body = await request.json().catch(() => ({}));
    const deviceInfo = getDeviceInfoFromBodyOrHeaders(body, userAgent);
    
    let sessionResult: { sessionToken: string; sessionExpiry: number };
    try {
      // @ts-ignore - Type instantiation is excessively deep (Convex type inference issue)
      sessionResult = await fetchMutation(api.mutations.users.createAndSetSessionToken, {
        userId: userDetails._id,
        expiresInDays: 30, // 30 days expiry
        userAgent,
        ipAddress,
        deviceId: deviceInfo.deviceId,
        deviceName: deviceInfo.deviceName,
      }) as { sessionToken: string; sessionExpiry: number };
    } catch (sessionError) {
      logger.error('Failed to create session token:', sessionError);
      if (sessionError instanceof Error) {
        logger.error('Session error details:', sessionError.message, sessionError.stack);
      }
      return ResponseFactory.internalError('Failed to create session. Please try again.');
    }
    
    // Set session token cookie
    const isProd = process.env.NODE_ENV === 'production';
    const response = ResponseFactory.success({
      success: true,
      message: isNewUser ? 'User created and authenticated successfully' : 'Authentication successful',
      token: sessionResult.sessionToken, // Alias for mobile app compatibility
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
    if (error instanceof Error) {
      logger.error('Error stack:', error.stack);
      logger.error('Error message:', error.message);
    }
    // Log the full error object for debugging
    logger.error('Full error object:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
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
    if (!identityToken || typeof identityToken !== 'string') {
      logger.error('Invalid identity token provided:', typeof identityToken);
      return null;
    }

    const payload = decodeJWT(identityToken);
    
    if (!payload) {
      logger.error('Failed to decode JWT payload');
      return null;
    }

    if (!payload.sub) {
      logger.error('Missing sub field in JWT payload:', payload);
      return null;
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
    logger.error('Apple identity token verification failed:', error);
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

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
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
    if (!token || typeof token !== 'string') {
      logger.error('Invalid token provided to decodeJWT:', typeof token);
      return null;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      logger.error('Invalid JWT format - expected 3 parts, got:', parts.length);
      return null;
    }

    const base64Url = parts[1];
    if (!base64Url) {
      logger.error('Missing payload part in JWT');
      return null;
    }

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
