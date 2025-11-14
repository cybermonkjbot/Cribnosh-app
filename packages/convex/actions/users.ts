"use node";
import { v } from 'convex/values';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { api } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { action } from '../_generated/server';

export const applyReferralRewardToNewUser = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    // Fetch user via query
    const user = await ctx.runQuery(api.queries.users.getById, { userId: args.userId });
    if (!user) throw new Error("User not found");
    if (!user.referrerId) throw new Error("No referrer found for this user");
    // Update rewards via mutation
    await ctx.runMutation(api.mutations.users.applyReferralReward, { userId: args.userId });
    return { success: true };
  },
});

export const activateReferralProgram = action({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.runMutation(api.mutations.users.setReferralProgramActive, { userId: args.userId });
    return { success: true };
  },
});

export const loginAndCreateSession = action({
  args: { 
    email: v.string(), 
    password: v.string(),
    userAgent: v.optional(v.string()), // User agent for session tracking
    ipAddress: v.optional(v.string()), // IP address for session tracking
  },
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.runQuery(api.queries.users.getUserByEmail, { email: args.email });
    if (!user) return { error: 'Invalid credentials' };
    
    // Only allow staff or admin
    if (!user.roles?.includes('staff') && !user.roles?.includes('admin')) {
      return { error: 'Not a staff user' };
    }
    
    // Check if user has a password set
    if (!user.password) {
      return { error: 'No password set for this account. Please use password reset.' };
    }
    
    try {
      // Check password (assume user.password is a scrypt hash: salt:hash)
      const [salt, storedHash] = user.password.split(':');
      if (!salt || !storedHash) {
        console.error('Invalid password format for user:', args.email);
        return { error: 'Invalid credentials' };
      }
      
      const hash = scryptSync(args.password, salt, 64).toString('hex');
      if (!timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))) {
        return { error: 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Error during password verification for user:', args.email, error);
      return { error: 'Invalid credentials' };
    }
    // Generate and set session token atomically using Convex mutation
    // This is more performant and uses base64url encoding for better security
    const ONE_YEAR_DAYS = 365;
    const sessionResult = await ctx.runMutation(api.mutations.users.createAndSetSessionToken, {
      userId: user._id,
      expiresInDays: ONE_YEAR_DAYS,
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
    });
    return { sessionToken: sessionResult.sessionToken };
  }
});

export const createUserWithHashedPassword = action({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
    roles: v.optional(v.array(v.union(v.literal('user'), v.literal('admin'), v.literal('moderator'), v.literal('chef'), v.literal('staff')))),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'), v.literal('suspended'))),
  },
  handler: async (ctx, args): Promise<Id<'users'>> => {
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(args.password, salt, 64).toString('hex');
    const hashedPassword = `${salt}:${hash}`;
    // Call the mutation to create the user
    const userId: Id<'users'> = await ctx.runMutation(api.mutations.users.create, {
      name: args.name,
      email: args.email,
      password: hashedPassword,
      roles: args.roles,
      status: args.status,
    });
    return userId;
  },
});

/**
 * Customer email login - for mobile app direct Convex communication
 * This allows customers (non-staff) to login via email/password
 */
export const customerEmailLogin = action({
  args: { 
    email: v.string(), 
    password: v.string(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      sessionToken: v.string(),
      user: v.object({
        user_id: v.string(),
        email: v.string(),
        name: v.string(),
        roles: v.array(v.string()),
        picture: v.optional(v.string()),
        provider: v.optional(v.string()),
      }),
    }),
    v.object({
      success: v.literal(false),
      requires2FA: v.literal(true),
      verificationToken: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    // Find user by email
    const user = await ctx.runQuery(api.queries.users.getUserByEmail, { email: args.email });
    if (!user) {
      return { success: false as const, error: 'Invalid credentials' };
    }
    
    // Check if user has a password set
    if (!user.password) {
      return { success: false as const, error: 'No password set for this account. Please use password reset.' };
    }
    
    try {
      // Check password (assume user.password is a scrypt hash: salt:hash)
      const [salt, storedHash] = user.password.split(':');
      if (!salt || !storedHash) {
        console.error('Invalid password format for user:', args.email);
        return { success: false as const, error: 'Invalid credentials' };
      }
      
      const hash = scryptSync(args.password, salt, 64).toString('hex');
      if (!timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))) {
        return { success: false as const, error: 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Error during password verification for user:', args.email, error);
      return { success: false as const, error: 'Invalid credentials' };
    }
    
    // Check if user has 2FA enabled
    if (user.twoFactorEnabled && user.twoFactorSecret) {
      // Create verification session for 2FA
      try {
        const verificationToken = await ctx.runMutation(api.mutations.verificationSessions.createVerificationSession, {
          userId: user._id,
        });
        
        if (!verificationToken) {
          console.error('Failed to create 2FA verification session for user:', args.email);
          return { success: false as const, error: 'Failed to create 2FA verification session. Please try again.' };
        }
        
        return {
          success: false as const,
          requires2FA: true as const,
          verificationToken,
        };
      } catch (error) {
        console.error('Error creating 2FA verification session for user:', args.email, error);
        return { success: false as const, error: 'Failed to create 2FA verification session. Please try again.' };
      }
    }
    
    // Ensure user has 'customer' role
    let userRoles = user.roles || ['user'];
    if (!userRoles.includes('customer')) {
      userRoles = [...userRoles, 'customer'];
      // Update user roles in database
      try {
        await ctx.runMutation(api.mutations.users.updateUserRoles, {
          userId: user._id,
          roles: userRoles,
        });
      } catch (error) {
        // Log but don't fail login if role update fails
        console.warn('Failed to update user roles for user:', args.email, error);
      }
    }
    
    // Generate and set session token
    const sessionResult = await ctx.runMutation(api.mutations.users.createAndSetSessionToken, {
      userId: user._id,
      expiresInDays: 30, // 30 days expiry
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
    });
    
    return {
      success: true,
      sessionToken: sessionResult.sessionToken,
      user: {
        user_id: user._id,
        email: user.email,
        name: user.name,
        roles: userRoles,
        picture: user.picture || '',
        provider: 'email',
      },
    };
  },
});

/**
 * Customer email registration - for mobile app direct Convex communication
 */
export const customerEmailRegister = action({
  args: {
    name: v.string(),
    email: v.string(),
    password: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      userId: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.runQuery(api.queries.users.getUserByEmail, { email: args.email });
    if (existing) {
      return { success: false as const, error: 'A user with this email already exists.' };
    }
    
    // Hash password and create user
    const salt = randomBytes(16).toString('hex');
    const hash = scryptSync(args.password, salt, 64).toString('hex');
    const hashedPassword = `${salt}:${hash}`;
    
    try {
      const userId = await ctx.runMutation(api.mutations.users.create, {
        name: args.name,
        email: args.email,
        password: hashedPassword,
        roles: ['customer', 'user'],
        status: 'active',
      });
      
      return { success: true as const, userId };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create account. Please try again.';
      if (errorMessage.includes('already exists')) {
        return { success: false as const, error: 'A user with this email already exists.' };
      }
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Unified customer email sign-in or sign-up - for mobile app direct Convex communication
 * This action handles both sign-in (if user exists) and sign-up (if user doesn't exist)
 * If user exists, validates password and signs them in
 * If user doesn't exist, creates account and signs them in
 */
export const customerEmailSignInOrSignUp = action({
  args: { 
    email: v.string(), 
    password: v.string(),
    name: v.optional(v.string()), // Optional name - if not provided, will be generated from email
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      sessionToken: v.string(),
      user: v.object({
        user_id: v.string(),
        email: v.string(),
        name: v.string(),
        roles: v.array(v.string()),
        picture: v.optional(v.string()),
        provider: v.optional(v.string()),
        isNewUser: v.boolean(),
      }),
    }),
    v.object({
      success: v.literal(false),
      requires2FA: v.literal(true),
      verificationToken: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    // Find user by email
    const existingUser = await ctx.runQuery(api.queries.users.getUserByEmail, { email: args.email });
    
    let user;
    let isNewUser = false;
    
    if (existingUser) {
      // User exists - attempt sign-in
      user = existingUser;
      
      // Check if user has a password set
      if (!user.password) {
        return { success: false as const, error: 'No password set for this account. Please use password reset.' };
      }
      
      // Validate password
      try {
        const [salt, storedHash] = user.password.split(':');
        if (!salt || !storedHash) {
          console.error('Invalid password format for user:', args.email);
          return { success: false as const, error: 'Invalid credentials' };
        }
        
        const hash = scryptSync(args.password, salt, 64).toString('hex');
        if (!timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))) {
          return { success: false as const, error: 'Invalid credentials' };
        }
      } catch (error) {
        console.error('Error during password verification for user:', args.email, error);
        return { success: false as const, error: 'Invalid credentials' };
      }
      
      // Check if user has 2FA enabled
      if (user.twoFactorEnabled && user.twoFactorSecret) {
        // Create verification session for 2FA
        try {
          const verificationToken = await ctx.runMutation(api.mutations.verificationSessions.createVerificationSession, {
            userId: user._id,
          });
          
          if (!verificationToken) {
            console.error('Failed to create 2FA verification session for user:', args.email);
            return { success: false as const, error: 'Failed to create 2FA verification session. Please try again.' };
          }
          
          return {
            success: false as const,
            requires2FA: true as const,
            verificationToken,
          };
        } catch (error) {
          console.error('Error creating 2FA verification session for user:', args.email, error);
          return { success: false as const, error: 'Failed to create 2FA verification session. Please try again.' };
        }
      }
    } else {
      // User doesn't exist - create account and sign them in
      isNewUser = true;
      
      // Generate name from email if not provided
      let userName = args.name;
      if (!userName) {
        const emailParts = args.email.split("@")[0];
        const nameParts = emailParts.split(/[._-]/);
        userName = nameParts
          .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
          .join(" ") || "User";
      }
      
      // Hash password and create user
      const salt = randomBytes(16).toString('hex');
      const hash = scryptSync(args.password, salt, 64).toString('hex');
      const hashedPassword = `${salt}:${hash}`;
      
      try {
        const userId = await ctx.runMutation(api.mutations.users.create, {
          name: userName,
          email: args.email,
          password: hashedPassword,
          roles: ['customer', 'user'],
          status: 'active',
        });
        
        // Fetch the newly created user by email (getUserByEmail doesn't require auth)
        user = await ctx.runQuery(api.queries.users.getUserByEmail, { email: args.email });
        if (!user) {
          return { success: false as const, error: 'Failed to retrieve user after creation. Please try again.' };
        }
      } catch (error: any) {
        const errorMessage = error?.message || 'Failed to create account. Please try again.';
        if (errorMessage.includes('already exists')) {
          // Race condition - user was created between check and creation
          // Try to sign in instead
          const retryUser = await ctx.runQuery(api.queries.users.getUserByEmail, { email: args.email });
          if (retryUser) {
            user = retryUser;
            isNewUser = false;
            
            // Validate password for the existing user
            try {
              const [salt, storedHash] = user.password!.split(':');
              if (!salt || !storedHash) {
                return { success: false as const, error: 'Invalid credentials' };
              }
              
              const hash = scryptSync(args.password, salt, 64).toString('hex');
              if (!timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))) {
                return { success: false as const, error: 'Invalid credentials' };
              }
            } catch (error) {
              return { success: false as const, error: 'Invalid credentials' };
            }
          } else {
            return { success: false as const, error: 'A user with this email already exists.' };
          }
        } else {
          return { success: false as const, error: errorMessage };
        }
      }
    }
    
    // Ensure user has 'customer' role
    let userRoles = user.roles || ['user'];
    if (!userRoles.includes('customer')) {
      userRoles = [...userRoles, 'customer'];
      // Update user roles in database
      try {
        await ctx.runMutation(api.mutations.users.updateUserRoles, {
          userId: user._id,
          roles: userRoles,
        });
      } catch (error) {
        // Log but don't fail login if role update fails
        console.warn('Failed to update user roles for user:', args.email, error);
      }
    }
    
    // Generate and set session token
    const sessionResult = await ctx.runMutation(api.mutations.users.createAndSetSessionToken, {
      userId: user._id,
      expiresInDays: 30, // 30 days expiry
      userAgent: args.userAgent,
      ipAddress: args.ipAddress,
    });
    
    return {
      success: true,
      sessionToken: sessionResult.sessionToken,
      user: {
        user_id: user._id,
        email: user.email,
        name: user.name,
        roles: userRoles,
        picture: user.picture || '',
        provider: 'email',
        isNewUser,
      },
    };
  },
});
/**
 * Customer phone OTP send - for mobile app direct Convex communication
 */
export const customerPhoneSendOTP = action({
  args: {
    phone: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      message: v.string(),
      testOtp: v.optional(v.string()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const TEST_OTP = '123456'; // Test OTP for development
    
    try {
      // Create OTP with test code (in production, this would send SMS)
      await ctx.runMutation(api.mutations.otp.createOTP, {
        phone: args.phone,
        code: TEST_OTP,
        maxAttempts: 3,
      });

      return {
        success: true as const,
        message: 'OTP sent successfully',
        // In development, return the test OTP for testing purposes
        ...(process.env.NODE_ENV === 'development' && { testOtp: TEST_OTP }),
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to send OTP. Please try again.';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer phone verify and login - for mobile app direct Convex communication
 */
export const customerPhoneVerifyAndLogin = action({
  args: {
    phone: v.string(),
    otp: v.string(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      sessionToken: v.string(),
      user: v.object({
        user_id: v.string(),
        phone: v.optional(v.string()),
        email: v.string(),
        name: v.string(),
        roles: v.array(v.string()),
        isNewUser: v.boolean(),
      }),
    }),
    v.object({
      success: v.literal(false),
      requires2FA: v.literal(true),
      verificationToken: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Verify OTP
      await ctx.runMutation(api.mutations.otp.verifyOTP, {
        phone: args.phone,
        code: args.otp,
      });

      // Find user by phone number
      const user = await ctx.runQuery(api.queries.users.getUserByPhone, { phone: args.phone });
      
      let finalUser;
      let isNewUser = false;

      if (!user) {
        // If user doesn't exist, create a new one
        isNewUser = true;
        const userId = await ctx.runMutation(api.mutations.users.create, {
          name: `User_${args.phone.slice(-4)}`, // Generate a temporary name
          email: `${args.phone}@phone.user`, // Generate a temporary email
          password: '', // No password for phone auth
          roles: ['customer'],
          status: 'active',
        });

        // Update the user with phone number
        await ctx.runMutation(api.mutations.users.updateUser, {
          userId,
          phone_number: args.phone,
        });

        // Get the updated user using internal query (no auth required)
        const newUser = await ctx.runQuery(api.queries.users._getUserByIdInternal, {
          userId,
        });
        
        if (!newUser) {
          return { success: false as const, error: 'Failed to create user' };
        }

        finalUser = newUser;
      } else {
        finalUser = user;
      }

      // Ensure user has 'customer' role
      let userRoles = finalUser.roles || ['user'];
      if (!userRoles.includes('customer')) {
        userRoles = [...userRoles, 'customer'];
        await ctx.runMutation(api.mutations.users.updateUserRoles, {
          userId: finalUser._id,
          roles: userRoles,
        });
      }

      // Check if user has 2FA enabled
      if (finalUser.twoFactorEnabled && finalUser.twoFactorSecret) {
        // Create verification session for 2FA
        try {
          const verificationToken = await ctx.runMutation(api.mutations.verificationSessions.createVerificationSession, {
            userId: finalUser._id,
          });
          
          if (!verificationToken) {
            return { success: false as const, error: 'Failed to create 2FA verification session. Please try again.' };
          }
          
          return {
            success: false as const,
            requires2FA: true as const,
            verificationToken,
          };
        } catch (error) {
          console.error('Error creating 2FA verification session:', error);
          return { success: false as const, error: 'Failed to create 2FA verification session. Please try again.' };
        }
      }

      // No 2FA required - create session token
      const sessionResult = await ctx.runMutation(api.mutations.users.createAndSetSessionToken, {
        userId: finalUser._id,
        expiresInDays: 30, // 30 days expiry
        userAgent: args.userAgent,
        ipAddress: args.ipAddress,
      });

      // Update last login
      await ctx.runMutation(api.mutations.users.updateLastLogin, {
        userId: finalUser._id,
      });

      return {
        success: true as const,
        sessionToken: sessionResult.sessionToken,
        user: {
          user_id: finalUser._id,
          phone: finalUser.phone_number,
          email: finalUser.email,
          name: finalUser.name,
          roles: userRoles,
          isNewUser,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Phone verification failed. Please try again.';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Apple Sign-In - for mobile app direct Convex communication
 * Note: This uses a simplified token verification (decoding JWT without signature verification)
 * For production, you should verify the JWT signature using Apple's public keys
 */
export const customerAppleSignIn = action({
  args: {
    identityToken: v.string(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      sessionToken: v.string(),
      user: v.object({
        user_id: v.string(),
        email: v.string(),
        name: v.string(),
        roles: v.array(v.string()),
        picture: v.optional(v.string()),
        isNewUser: v.boolean(),
        provider: v.string(),
      }),
    }),
    v.object({
      success: v.literal(false),
      requires2FA: v.literal(true),
      verificationToken: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Decode JWT token (simplified - for production, verify signature)
      // JWT format: header.payload.signature
      const parts = args.identityToken.split('.');
      if (parts.length !== 3) {
        return { success: false as const, error: 'Invalid Apple identity token format' };
      }

      // Decode payload (base64url)
      const payload = JSON.parse(
        Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString()
      );

      if (!payload.sub) {
        return { success: false as const, error: 'Invalid Apple identity token: missing sub field' };
      }

      // Extract user info from token
      const appleUserInfo = {
        sub: payload.sub,
        email: payload.email_verified && payload.email ? payload.email : (payload.email || `apple-${payload.sub}@privaterelay.appleid.com`),
        name: payload.name || `Apple User ${payload.sub.slice(-4)}`,
        picture: undefined, // Apple doesn't provide profile pictures
        email_verified: payload.email_verified || false,
      };

      // Create or update user with OAuth info
      const result = await ctx.runMutation(api.mutations.users.createOrUpdateOAuthUser, {
        provider: 'apple',
        providerId: appleUserInfo.sub,
        email: appleUserInfo.email,
        name: appleUserInfo.name,
        picture: appleUserInfo.picture,
        verified: true,
      });

      if (!result || !result.userId) {
        return { success: false as const, error: 'Failed to create or update user account' };
      }

      // Get user details using internal query (no auth required)
      const userDetails = await ctx.runQuery(api.queries.users._getUserByIdInternal, {
        userId: result.userId,
      });
      
      if (!userDetails) {
        return { success: false as const, error: 'Failed to retrieve user information' };
      }

      // Ensure user has 'customer' role
      let userRoles = userDetails.roles || ['user'];
      if (!userRoles.includes('customer')) {
        userRoles = [...userRoles, 'customer'];
        await ctx.runMutation(api.mutations.users.updateUserRoles, {
          userId: userDetails._id,
          roles: userRoles,
        });
      }

      // Check if user has 2FA enabled
      if (userDetails.twoFactorEnabled && userDetails.twoFactorSecret) {
        try {
          const verificationToken = await ctx.runMutation(api.mutations.verificationSessions.createVerificationSession, {
            userId: userDetails._id,
          });
          
          if (!verificationToken) {
            return { success: false as const, error: 'Failed to create 2FA verification session. Please try again.' };
          }
          
          return {
            success: false as const,
            requires2FA: true as const,
            verificationToken,
          };
        } catch (error) {
          console.error('Error creating 2FA verification session:', error);
          return { success: false as const, error: 'Failed to create 2FA verification session. Please try again.' };
        }
      }

      // No 2FA required - create session token
      const sessionResult = await ctx.runMutation(api.mutations.users.createAndSetSessionToken, {
        userId: userDetails._id,
        expiresInDays: 30, // 30 days expiry
        userAgent: args.userAgent,
        ipAddress: args.ipAddress,
      });

      return {
        success: true as const,
        sessionToken: sessionResult.sessionToken,
        user: {
          user_id: userDetails._id,
          email: userDetails.email,
          name: userDetails.name,
          roles: userRoles,
          picture: userDetails.picture || '',
          isNewUser: result.isNewUser || false,
          provider: 'apple',
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Apple sign-in failed. Please try again.';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer 2FA verification - for mobile app direct Convex communication
 */
export const customerVerify2FA = action({
  args: {
    verificationToken: v.string(),
    code: v.string(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      sessionToken: v.string(),
      user: v.object({
        user_id: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        name: v.string(),
        roles: v.array(v.string()),
      }),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const MAX_FAILED_ATTEMPTS = 5;
    
    try {
      // Get verification session
      const session = await ctx.runMutation(api.mutations.verificationSessions.getVerificationSession, {
        sessionToken: args.verificationToken,
      });
      
      if (!session) {
        return { success: false as const, error: 'Invalid or expired verification session' };
      }
      
      if (session.used) {
        return { success: false as const, error: 'Verification session already used' };
      }
      
      // Check if session is locked due to too many failed attempts
      if (session.failedAttempts && session.failedAttempts >= MAX_FAILED_ATTEMPTS) {
        return { success: false as const, error: 'Too many failed attempts. Please try again later.' };
      }
      
      // Get user using internal query (no auth required)
      const user = await ctx.runQuery(api.queries.users._getUserByIdInternal, {
        userId: session.userId,
      });
      
      if (!user || !user.twoFactorEnabled || !user.twoFactorSecret) {
        return { success: false as const, error: '2FA not enabled for this user' };
      }
      
      // Verify TOTP code using authenticator library
      // Note: We need to import authenticator in the action
      const { authenticator } = await import('otplib');
      let isValid = false;
      let usedBackupCode: string | null = null;
      
      // Try TOTP verification first
      try {
        isValid = authenticator.check(args.code, user.twoFactorSecret);
      } catch (error) {
        console.error('[2FA] TOTP verification error:', error);
      }
      
      // If TOTP verification failed, try backup codes
      if (!isValid && user.twoFactorBackupCodes && user.twoFactorBackupCodes.length > 0) {
        for (const hashedCode of user.twoFactorBackupCodes) {
          try {
            const [salt, storedHash] = hashedCode.split(':');
            if (!salt || !storedHash) continue;
            
            const hashToVerify = scryptSync(args.code, salt, 64);
            const storedHashBuffer = Buffer.from(storedHash, 'hex');
            
            if (timingSafeEqual(hashToVerify, storedHashBuffer)) {
              isValid = true;
              usedBackupCode = hashedCode;
              break;
            }
          } catch (error) {
            console.error('[2FA] Backup code verification error:', error);
            continue;
          }
        }
      }
      
      if (!isValid) {
        // Increment failed attempts
        const newFailedAttempts = await ctx.runMutation(api.mutations.verificationSessions.incrementFailedAttempts, {
          sessionToken: args.verificationToken,
        });
        
        // Check if we've exceeded max attempts
        if (newFailedAttempts >= MAX_FAILED_ATTEMPTS) {
          return { success: false as const, error: 'Too many failed attempts. Please try again later.' };
        }
        
        const remainingAttempts = MAX_FAILED_ATTEMPTS - newFailedAttempts;
        return { success: false as const, error: `Invalid code. ${remainingAttempts} attempt${remainingAttempts !== 1 ? 's' : ''} remaining.` };
      }
      
      // Code is valid - mark session as used
      await ctx.runMutation(api.mutations.verificationSessions.markSessionAsUsed, {
        sessionToken: args.verificationToken,
      });
      
      // If backup code was used, remove it
      if (usedBackupCode) {
        await ctx.runMutation(api.mutations.users.removeBackupCode, {
          userId: user._id,
          hashedCode: usedBackupCode,
        });
      }
      
      // Ensure user has 'customer' role
      let userRoles = user.roles || ['user'];
      if (!userRoles.includes('customer')) {
        userRoles = [...userRoles, 'customer'];
        await ctx.runMutation(api.mutations.users.updateUserRoles, {
          userId: user._id,
          roles: userRoles,
        });
      }
      
      // Update last login
      await ctx.runMutation(api.mutations.users.updateLastLogin, {
        userId: user._id,
      });
      
      // Create session token
      const sessionResult = await ctx.runMutation(api.mutations.users.createAndSetSessionToken, {
        userId: user._id,
        expiresInDays: 30, // 30 days expiry
        userAgent: args.userAgent,
        ipAddress: args.ipAddress,
      });
      
      return {
        success: true as const,
        sessionToken: sessionResult.sessionToken,
        user: {
          user_id: user._id,
          email: user.email,
          phone: user.phone_number,
          name: user.name,
          roles: userRoles,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || '2FA verification failed. Please try again.';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer logout - for mobile app direct Convex communication
 */
export const customerLogout = action({
  args: {
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      // If session token provided, invalidate it
      if (args.sessionToken) {
        const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
          sessionToken: args.sessionToken,
        });
        
        if (user) {
          // Clear session token
          await ctx.runMutation(api.mutations.users.setSessionToken, {
            userId: user._id,
            sessionToken: '',
            sessionExpiry: 0,
          });
        }
      }
      
      // Always return success - mobile app handles SecureStore cleanup locally
      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error: any) {
      // Even if there's an error, return success to allow client-side cleanup
      return {
        success: true,
        message: 'Logged out successfully',
      };
    }
  },
});

/**
 * Customer Get Profile - for mobile app direct Convex communication
 */
export const customerGetProfile = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      user: v.object({
        _id: v.string(),
        email: v.string(),
        name: v.string(),
        phone: v.optional(v.string()),
        phone_number: v.optional(v.string()),
        roles: v.array(v.string()),
        picture: v.optional(v.string()),
        avatar: v.optional(v.string()),
        preferences: v.optional(v.object({
          cuisine: v.optional(v.array(v.string())),
          dietary: v.optional(v.array(v.string())),
        })),
        address: v.optional(v.object({
          street: v.string(),
          city: v.string(),
          state: v.string(),
          postal_code: v.string(),
          country: v.string(),
        })),
        _creationTime: v.number(),
        lastModified: v.optional(v.number()),
      }),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Transform user data for frontend
      const { password, sessionExpiry, ...safeUser } = user;

      // Transform address from backend format (zipCode) to frontend format (postal_code)
      let transformedAddress = safeUser.address;
      if (transformedAddress && (transformedAddress as any).zipCode) {
        transformedAddress = {
          ...transformedAddress,
          postal_code: (transformedAddress as any).zipCode,
        };
        delete (transformedAddress as any).zipCode;
      }

      // Transform preferences from backend format to frontend format
      let transformedPreferences = safeUser.preferences;
      if (transformedPreferences) {
        transformedPreferences = {
          favorite_cuisines: transformedPreferences.cuisine || [],
          dietary_restrictions: transformedPreferences.dietary || [],
        } as any;
      }

      return {
        success: true as const,
        user: {
          _id: safeUser._id,
          email: safeUser.email,
          name: safeUser.name,
          phone: safeUser.phone_number,
          phone_number: safeUser.phone_number,
          roles: safeUser.roles || [],
          picture: safeUser.avatar || safeUser.picture,
          avatar: safeUser.avatar || safeUser.picture,
          preferences: transformedPreferences as any,
          address: transformedAddress as any,
          _creationTime: safeUser._creationTime,
          lastModified: safeUser.lastModified,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get profile';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Update Profile - for mobile app direct Convex communication
 */
export const customerUpdateProfile = action({
  args: {
    sessionToken: v.string(),
    name: v.optional(v.string()),
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    picture: v.optional(v.string()),
    preferences: v.optional(v.object({
      favorite_cuisines: v.optional(v.array(v.string())),
      dietary_restrictions: v.optional(v.array(v.string())),
    })),
    address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      state: v.string(),
      postal_code: v.string(),
      country: v.string(),
    })),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      user: v.object({
        _id: v.string(),
        email: v.string(),
        name: v.string(),
        phone: v.optional(v.string()),
        phone_number: v.optional(v.string()),
        roles: v.array(v.string()),
        picture: v.optional(v.string()),
        avatar: v.optional(v.string()),
        preferences: v.optional(v.object({
          cuisine: v.optional(v.array(v.string())),
          dietary: v.optional(v.array(v.string())),
        })),
        address: v.optional(v.object({
          street: v.string(),
          city: v.string(),
          state: v.string(),
          postal_code: v.string(),
          country: v.string(),
        })),
        _creationTime: v.number(),
        lastModified: v.optional(v.number()),
      }),
      message: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Build update object with transformations
      const updates: any = {};
      if (args.name !== undefined) updates.name = args.name;
      if (args.email !== undefined) updates.email = args.email;
      if (args.phone !== undefined) updates.phone_number = args.phone;
      if (args.picture !== undefined) updates.avatar = args.picture;
      
      // Transform preferences from frontend format to backend format
      if (args.preferences !== undefined) {
        updates.preferences = {
          cuisine: args.preferences.favorite_cuisines || args.preferences.cuisine || [],
          dietary: args.preferences.dietary_restrictions || args.preferences.dietary || [],
        };
      }
      
      // Transform address from frontend format (postal_code) to backend format (zipCode)
      if (args.address !== undefined) {
        updates.address = {
          street: args.address.street || '',
          city: args.address.city || '',
          state: args.address.state || '',
          zipCode: args.address.postal_code || args.address.zipCode || '',
          country: args.address.country || '',
        };
      }

      // Update user via Convex mutation
      await ctx.runMutation(api.mutations.users.updateUser, {
        userId: user._id,
        ...updates,
        sessionToken: args.sessionToken,
      });

      // Fetch updated user
      const updatedUser = await ctx.runQuery(api.queries.users.getById, {
        userId: user._id,
        sessionToken: args.sessionToken,
      });

      if (!updatedUser) {
        return { success: false as const, error: 'User not found after update' };
      }

      // Transform user data for frontend
      const { password, sessionExpiry, ...safeUser } = updatedUser;

      // Transform address from backend format (zipCode) to frontend format (postal_code)
      let transformedAddress = safeUser.address;
      if (transformedAddress && (transformedAddress as any).zipCode) {
        transformedAddress = {
          ...transformedAddress,
          postal_code: (transformedAddress as any).zipCode,
        };
        delete (transformedAddress as any).zipCode;
      }

      // Transform preferences from backend format to frontend format
      let transformedPreferences = safeUser.preferences;
      if (transformedPreferences) {
        transformedPreferences = {
          favorite_cuisines: transformedPreferences.cuisine || [],
          dietary_restrictions: transformedPreferences.dietary || [],
        } as any;
      }

      return {
        success: true as const,
        user: {
          _id: safeUser._id,
          email: safeUser.email,
          name: safeUser.name,
          phone: safeUser.phone_number,
          phone_number: safeUser.phone_number,
          roles: safeUser.roles || [],
          picture: safeUser.avatar || safeUser.picture,
          avatar: safeUser.avatar || safeUser.picture,
          preferences: transformedPreferences as any,
          address: transformedAddress as any,
          _creationTime: safeUser._creationTime,
          lastModified: safeUser.lastModified,
        },
        message: 'Profile updated successfully',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update profile';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Profile Image Upload URL - for mobile app direct Convex communication
 */
export const customerGetProfileImageUploadUrl = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      uploadUrl: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Generate upload URL
      const uploadUrl = await ctx.runMutation(api.mutations.documents.generateUploadUrl);

      return {
        success: true as const,
        uploadUrl,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to generate upload URL';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Complete Profile Image Upload - for mobile app direct Convex communication
 */
export const customerCompleteProfileImageUpload = action({
  args: {
    sessionToken: v.string(),
    storageId: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      profile_image: v.string(),
      profile_image_url: v.string(),
      first_name: v.string(),
      last_name: v.string(),
      bio: v.null(),
      location_coordinates: v.null(),
      address: v.union(v.string(), v.null()),
      profile_id: v.string(),
      user_id: v.string(),
      created_at: v.string(),
      updated_at: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      // Create file URL
      const fileUrl = `/api/files/${args.storageId}`;

      // Update user avatar
      await ctx.runMutation(api.mutations.users.updateUser, {
        userId: user._id,
        avatar: fileUrl,
        sessionToken: args.sessionToken,
      });

      // Fetch updated user
      const updatedUser = await ctx.runQuery(api.queries.users.getById, {
        userId: user._id,
        sessionToken: args.sessionToken,
      });

      if (!updatedUser) {
        return { success: false as const, error: 'User not found after update' };
      }

      // Format response to match current API format
      const [first_name, ...rest] = (updatedUser.name || '').split(' ');
      const last_name = rest.join(' ');

      return {
        success: true as const,
        profile_image: fileUrl,
        profile_image_url: fileUrl,
        first_name: first_name || '',
        last_name: last_name || '',
        bio: null,
        location_coordinates: null,
        address: updatedUser.address?.street || null,
        profile_id: updatedUser._id,
        user_id: updatedUser._id,
        created_at: new Date(updatedUser._creationTime || Date.now()).toISOString(),
        updated_at: new Date(updatedUser.lastModified || Date.now()).toISOString(),
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to complete image upload';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Send Phone/Email OTP - for mobile app direct Convex communication
 */
export const customerSendPhoneEmailOTP = action({
  args: {
    sessionToken: v.string(),
    type: v.union(v.literal('phone'), v.literal('email')),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      message: v.string(),
      testOtp: v.optional(v.string()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      const TEST_OTP = '123456'; // Test OTP for development

      if (args.type === 'phone') {
        if (!args.phone) {
          return { success: false as const, error: 'Phone number is required' };
        }

        // Create OTP for phone
        await ctx.runMutation(api.mutations.otp.createOTP, {
          phone: args.phone,
          code: TEST_OTP,
          maxAttempts: 3,
        });

        return {
          success: true as const,
          message: 'OTP sent successfully to your phone',
          ...(process.env.NODE_ENV === 'development' && { testOtp: TEST_OTP }),
        };
      } else {
        // type === 'email'
        if (!args.email) {
          return { success: false as const, error: 'Email address is required' };
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(args.email)) {
          return { success: false as const, error: 'Invalid email format' };
        }

        // Generate OTP code
        const otpCode = process.env.NODE_ENV === 'development' ? TEST_OTP : Math.floor(100000 + Math.random() * 900000).toString();

        // Send OTP email using Resend
        try {
          const recipientName = args.email.split('@')[0];
          const htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #333;">Verify your email</h2>
              <p>Hello ${recipientName},</p>
              <p>Your CribNosh verification code is:</p>
              <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; margin: 20px 0;">
                ${otpCode}
              </div>
              <p>This code will expire in 5 minutes.</p>
              <p>If you didn't request this verification code, please ignore this email.</p>
              <p>Best regards,<br>CribNosh Team</p>
            </div>
          `;

          await ctx.runAction(api.actions.resend.sendEmail, {
            from: 'verify@emails.cribnosh.com',
            to: args.email,
            subject: `Verify your email - ${otpCode}`,
            html: htmlContent,
            text: `Your CribNosh verification code is: ${otpCode}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this verification code, please ignore this email.`,
          });
        } catch (emailError: any) {
          // In development, continue even if email fails
          if (process.env.NODE_ENV !== 'development') {
            console.error('Failed to send OTP email:', emailError);
            return { success: false as const, error: 'Failed to send verification email. Please check your email address and try again.' };
          }
        }

        // Create OTP in database
        await ctx.runMutation(api.mutations.otp.createEmailOTP, {
          email: args.email,
          code: otpCode,
          maxAttempts: 3,
        });

        return {
          success: true as const,
          message: 'OTP sent successfully to your email',
          ...(process.env.NODE_ENV === 'development' && { testOtp: TEST_OTP }),
        };
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to send OTP';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Verify Phone/Email OTP - for mobile app direct Convex communication
 */
export const customerVerifyPhoneEmailOTP = action({
  args: {
    sessionToken: v.string(),
    type: v.union(v.literal('phone'), v.literal('email')),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    otp: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      message: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Ensure user has 'customer' role
      if (!user.roles?.includes('customer')) {
        return { success: false as const, error: 'Access denied. Customer role required.' };
      }

      if (!args.otp) {
        return { success: false as const, error: 'OTP code is required for verification' };
      }

      if (args.type === 'phone') {
        if (!args.phone) {
          return { success: false as const, error: 'Phone number is required' };
        }

        // Verify OTP
        await ctx.runMutation(api.mutations.otp.verifyOTP, {
          phone: args.phone,
          code: args.otp,
        });

        // Update user's phone number
        await ctx.runMutation(api.mutations.users.updateUser, {
          userId: user._id,
          phone_number: args.phone,
          sessionToken: args.sessionToken,
        });

        return {
          success: true as const,
          message: 'Phone number updated successfully',
        };
      } else {
        // type === 'email'
        if (!args.email) {
          return { success: false as const, error: 'Email address is required' };
        }

        // Verify OTP
        await ctx.runMutation(api.mutations.otp.verifyEmailOTP, {
          email: args.email,
          code: args.otp,
        });

        // Update user's email
        await ctx.runMutation(api.mutations.users.updateUser, {
          userId: user._id,
          email: args.email,
          sessionToken: args.sessionToken,
        });

        return {
          success: true as const,
          message: 'Email address updated successfully',
        };
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to verify OTP';
      return { success: false as const, error: errorMessage };
    }
  },
});

// Add any other business logic actions here as needed 