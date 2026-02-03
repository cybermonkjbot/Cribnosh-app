// @ts-nocheck
// This is necessary due to complex nested validators in Convex actions
"use node";
import { v } from 'convex/values';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { api } from '../_generated/api';
import type { Id } from '../_generated/dataModel';
import { action } from '../_generated/server';
import { formatExpirationBadge } from '../utils/timeCalculations';

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
    deviceId: v.optional(v.string()), // Unique device identifier for tracking specific devices
    deviceName: v.optional(v.string()), // Human-readable device name
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
      deviceId: args.deviceId,
      deviceName: args.deviceName,
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
    deviceId: v.optional(v.string()),
    deviceName: v.optional(v.string()),
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
      deviceId: args.deviceId,
      deviceName: args.deviceName,
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
 * Customer Get Cuisines - for mobile app direct Convex communication
 */
export const customerGetCuisines = action({
  args: {
    sessionToken: v.string(),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      cuisines: v.array(v.any()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Authenticate user
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Get cuisines from meals
      const cuisines = await ctx.runQuery(api.queries.meals.getCuisines);

      // Transform to match API format
      const formattedCuisines = cuisines.map((cuisine: string, index: number) => ({
        id: `cuisine-${index}`,
        _id: `cuisine-${index}`,
        name: cuisine,
        image_url: `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=80&h=80&fit=crop`,
        image: `https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=80&h=80&fit=crop`,
      }));

      return {
        success: true as const,
        cuisines: formattedCuisines,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get cuisines';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Takeaway Items - for mobile app direct Convex communication
 * Returns meals that are available for takeaway
 */
export const customerGetTakeawayItems = action({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    page: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      items: v.array(v.any()),
      total: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Authenticate user
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      const limit = args.limit || 20;
      const page = args.page || 1;
      const offset = (page - 1) * limit;

      // Get random meals (which filters by available status)
      const allMeals = await ctx.runQuery(api.queries.meals.getRandomMeals, {
        limit: limit + offset,
        latitude: args.latitude,
        longitude: args.longitude,
      });
      
      // Apply pagination
      const meals = allMeals.slice(offset, offset + limit);

      // Transform to match API format
      const items = meals.map((meal: any) => ({
        _id: meal._id,
        id: meal._id,
        dish: {
          _id: meal._id,
          id: meal._id,
          name: meal.name,
          description: meal.description || '',
          price: meal.price || 0,
          image_url: meal.images?.[0] || '',
          image: meal.images?.[0] || '',
          cuisine: meal.cuisine || [],
        },
        meal: {
          _id: meal._id,
          id: meal._id,
          name: meal.name,
          description: meal.description || '',
          price: meal.price || 0,
          image_url: meal.images?.[0] || '',
          image: meal.images?.[0] || '',
        },
      }));

      return {
        success: true as const,
        items,
        total: items.length,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get takeaway items';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Top Kebabs - for mobile app direct Convex communication
 * Returns top-rated kebab-related meals or chefs
 */
export const customerGetTopKebabs = action({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    page: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      items: v.array(v.any()),
      total: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Authenticate user
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      const limit = args.limit || 20;
      const page = args.page || 1;
      const offset = (page - 1) * limit;

      // Get meals filtered by kebab-related cuisine or search term
      const meals = await ctx.runQuery(api.queries.meals.search, {
        query: 'kebab',
        limit,
        offset,
      });

      // Transform to match API format (could be chefs/kitchens or meals)
      const items = meals.map((meal: any) => ({
        _id: meal._id,
        id: meal._id,
        chef: {
          _id: meal._id,
          id: meal._id,
          name: meal.name,
          cuisine: meal.cuisine?.[0] || 'Kebab',
          specialties: meal.cuisine || ['Kebab'],
          image_url: meal.images?.[0] || '',
          image: meal.images?.[0] || '',
        },
        kitchen: {
          _id: meal._id,
          id: meal._id,
          name: meal.name,
          cuisine: meal.cuisine?.[0] || 'Kebab',
          image_url: meal.images?.[0] || '',
          image: meal.images?.[0] || '',
        },
        dish: {
          _id: meal._id,
          id: meal._id,
          name: meal.name,
          cuisine: meal.cuisine?.[0] || 'Kebab',
          image_url: meal.images?.[0] || '',
          image: meal.images?.[0] || '',
        },
        meal: {
          _id: meal._id,
          id: meal._id,
          name: meal.name,
          cuisine: meal.cuisine?.[0] || 'Kebab',
          image_url: meal.images?.[0] || '',
          image: meal.images?.[0] || '',
        },
      }));

      return {
        success: true as const,
        items,
        total: items.length,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get top kebabs';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Too Fresh To Waste Items - for mobile app direct Convex communication
 * Returns meals that are fresh/available and might be expiring soon
 */
export const customerGetTooFreshItems = action({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    page: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      items: v.array(v.any()),
      total: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Authenticate user
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      const limit = args.limit || 20;
      const page = args.page || 1;
      const offset = (page - 1) * limit;

      // Get available meals (fresh items are typically available meals)
      const meals = await ctx.runQuery(api.queries.meals.getAvailable, {
        limit,
        offset,
        latitude: args.latitude,
        longitude: args.longitude,
      });

      // Transform to match API format with expiration time calculations
      const items = meals.map((meal: any) => {
        // Calculate expiration time (default: 2 hours from creation, or use meal.expiresAt if available)
        const mealCreatedAt = meal._creationTime || Date.now();
        const defaultExpirationHours = 2; // Meals expire 2 hours after creation by default
        const expiresAt = meal.expiresAt || (mealCreatedAt + (defaultExpirationHours * 60 * 60 * 1000));
        const expirationBadge = formatExpirationBadge(expiresAt);

        return {
          _id: meal._id,
          id: meal._id,
          expiresAt,
          expirationBadge,
          dish: {
            _id: meal._id,
            id: meal._id,
            name: meal.name,
            description: meal.description || '',
            price: meal.price || 0,
            cuisine: meal.cuisine || [],
            image_url: meal.images?.[0] || '',
            image: meal.images?.[0] || '',
            expiresAt,
            expirationBadge,
          },
          meal: {
            _id: meal._id,
            id: meal._id,
            name: meal.name,
            description: meal.description || '',
            price: meal.price || 0,
            cuisine: meal.cuisine || [],
            image_url: meal.images?.[0] || '',
            image: meal.images?.[0] || '',
            expiresAt,
            expirationBadge,
          },
        };
      });

      return {
        success: true as const,
        items,
        total: items.length,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get too fresh items';
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
    deviceId: v.optional(v.string()),
    deviceName: v.optional(v.string()),
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
      deviceId: args.deviceId,
      deviceName: args.deviceName,
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
    deviceId: v.optional(v.string()),
    deviceName: v.optional(v.string()),
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
        deviceId: args.deviceId,
        deviceName: args.deviceName,
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
 * Customer email OTP send - for mobile app direct Convex communication (sign-in)
 */
export const customerEmailSendOTP = action({
  args: {
    email: v.string(),
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
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(args.email)) {
        return { success: false as const, error: 'Invalid email format' };
      }

      // Generate OTP code
      const otpCode = process.env.NODE_ENV === 'development' ? TEST_OTP : Math.floor(100000 + Math.random() * 900000).toString();

      // Send OTP email using Resend
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

      // Use verified from email address
      // emails.cribnosh.com is verified in Resend
      // Format: "Name <email@domain.com>" or just "email@domain.com"
      const fromEmail = process.env.RESEND_FROM_EMAIL || 'CribNosh <onboarding@emails.cribnosh.com>';

      try {
        const emailId = await ctx.runAction(api.actions.resend.sendEmail, {
          from: fromEmail,
          to: args.email,
          subject: `Verify your email - ${otpCode}`,
          html: htmlContent,
          text: `Your CribNosh verification code is: ${otpCode}\n\nThis code will expire in 5 minutes.\n\nIf you didn't request this verification code, please ignore this email.`,
        });

        console.log(`✅ OTP email sent successfully to ${args.email}, email ID: ${emailId}`);
      } catch (emailError: any) {
        // Always log the error for debugging
        console.error('❌ Failed to send OTP email:', {
          email: args.email,
          error: emailError?.message || emailError,
          errorDetails: emailError,
          fromEmail,
        });

        // In development, still create OTP so testing can continue, but log the error
        if (process.env.NODE_ENV === 'development') {
          console.warn('⚠️ Development mode: Email sending failed, but OTP will still be created for testing');
          console.warn('   Test OTP code:', otpCode);
        } else {
          // In production, fail if email can't be sent
          return { 
            success: false as const, 
            error: emailError?.message || 'Failed to send verification email. Please check your email address and try again.' 
          };
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
 * Customer email verify and login - for mobile app direct Convex communication
 */
export const customerEmailVerifyAndLogin = action({
  args: {
    email: v.string(),
    otp: v.string(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    deviceId: v.optional(v.string()),
    deviceName: v.optional(v.string()),
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
    try {
      // Verify OTP
      await ctx.runMutation(api.mutations.otp.verifyEmailOTP, {
        email: args.email,
        code: args.otp,
      });

      // Find user by email
      const user = await ctx.runQuery(api.queries.users.getUserByEmail, { email: args.email });
      
      let finalUser;
      let isNewUser = false;

      if (!user) {
        // If user doesn't exist, create a new one
        isNewUser = true;
        const userId = await ctx.runMutation(api.mutations.users.create, {
          name: args.email.split('@')[0], // Use email prefix as name
          email: args.email,
          password: '', // No password for email OTP auth
          roles: ['customer', 'chef'], // Chef app sign-in - grant both roles
          status: 'active',
        });

        // Get the created user using internal query (no auth required)
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

      // Ensure user has 'customer' and 'chef' roles (chef app sign-in)
      // Use internal mutation to update roles without requiring admin auth
      let userRoles = finalUser.roles || ['user'];
      let rolesUpdated = false;
      if (!userRoles.includes('customer')) {
        userRoles = [...userRoles, 'customer'];
        rolesUpdated = true;
      }
      if (!userRoles.includes('chef')) {
        userRoles = [...userRoles, 'chef'];
        rolesUpdated = true;
      }
      if (rolesUpdated) {
        // Use internal mutation to update roles during sign-in (no auth required)
        await ctx.runMutation(api.mutations.users._updateUserRolesInternal, {
          userId: finalUser._id,
          roles: userRoles,
        });
      }

      // Check if user has 2FA enabled
      if (finalUser.twoFactorEnabled) {
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
        deviceId: args.deviceId,
        deviceName: args.deviceName,
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
          email: finalUser.email,
          name: finalUser.name,
          roles: userRoles,
          picture: finalUser.picture,
          provider: 'email',
          isNewUser,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Email verification failed. Please try again.';
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
    deviceId: v.optional(v.string()),
    deviceName: v.optional(v.string()),
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

      // Ensure user has 'customer' and 'chef' roles (chef app sign-in)
      // Use internal mutation to update roles without requiring admin auth
      let userRoles = userDetails.roles || ['user'];
      let rolesUpdated = false;
      if (!userRoles.includes('customer')) {
        userRoles = [...userRoles, 'customer'];
        rolesUpdated = true;
      }
      if (!userRoles.includes('chef')) {
        userRoles = [...userRoles, 'chef'];
        rolesUpdated = true;
      }
      if (rolesUpdated) {
        // Use internal mutation to update roles during sign-in (no auth required)
        await ctx.runMutation(api.mutations.users._updateUserRolesInternal, {
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
        deviceId: args.deviceId,
        deviceName: args.deviceName,
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
 * Customer Google Sign-In - for mobile app direct Convex communication
 * Note: This accepts an accessToken and fetches user info from Google's API
 */
export const customerGoogleSignIn = action({
  args: {
    accessToken: v.string(),
    userAgent: v.optional(v.string()),
    ipAddress: v.optional(v.string()),
    deviceId: v.optional(v.string()),
    deviceName: v.optional(v.string()),
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
      // Fetch user info from Google using access token
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${args.accessToken}`,
        },
      });

      if (!userInfoResponse.ok) {
        return { success: false as const, error: 'Failed to verify Google token' };
      }

      const googleUserInfo = await userInfoResponse.json();

      if (!googleUserInfo.id || !googleUserInfo.email) {
        return { success: false as const, error: 'Invalid Google user info received' };
      }

      // Create or update user with OAuth info
      const result = await ctx.runMutation(api.mutations.users.createOrUpdateOAuthUser, {
        provider: 'google',
        providerId: googleUserInfo.id,
        email: googleUserInfo.email,
        name: googleUserInfo.name || googleUserInfo.email.split('@')[0],
        picture: googleUserInfo.picture,
        verified: googleUserInfo.verified_email || false,
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

      // Ensure user has 'customer' and 'chef' roles (chef app sign-in)
      // Use internal mutation to update roles without requiring admin auth
      let userRoles = userDetails.roles || ['user'];
      let rolesUpdated = false;
      if (!userRoles.includes('customer')) {
        userRoles = [...userRoles, 'customer'];
        rolesUpdated = true;
      }
      if (!userRoles.includes('chef')) {
        userRoles = [...userRoles, 'chef'];
        rolesUpdated = true;
      }
      if (rolesUpdated) {
        // Use internal mutation to update roles during sign-in (no auth required)
        await ctx.runMutation(api.mutations.users._updateUserRolesInternal, {
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
        deviceId: args.deviceId,
        deviceName: args.deviceName,
      });

      return {
        success: true as const,
        sessionToken: sessionResult.sessionToken,
        user: {
          user_id: userDetails._id,
          email: userDetails.email,
          name: userDetails.name,
          roles: userRoles,
          picture: userDetails.oauthProviders?.find((p: { provider: string; picture?: string }) => p.provider === 'google')?.picture || '',
          isNewUser: result.isNewUser || false,
          provider: 'google',
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Google sign-in failed. Please try again.';
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
    deviceId: v.optional(v.string()),
    deviceName: v.optional(v.string()),
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
        deviceId: args.deviceId,
        deviceName: args.deviceName,
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
      // If session token provided, delete ONLY this device's session
      if (args.sessionToken) {
        // Delete the session from the sessions table (primary storage)
        // This only affects the current device - other devices' sessions remain active
        await ctx.runMutation(api.mutations.sessions.deleteSessionByToken, {
          sessionToken: args.sessionToken,
        });
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

/**
 * Customer Change Password - for mobile app direct Convex communication
 */
export const customerChangePassword = action({
  args: {
    sessionToken: v.string(),
    currentPassword: v.string(),
    newPassword: v.string(),
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

      // Validate new password length
      if (args.newPassword.length < 8) {
        return { success: false as const, error: 'New password must be at least 8 characters long.' };
      }

      // Verify current password
      if (!user.password) {
        return { success: false as const, error: 'No password set for this account. Please use password reset.' };
      }

      try {
        const [salt, storedHash] = user.password.split(':');
        if (!salt || !storedHash) {
          return { success: false as const, error: 'Invalid password format.' };
        }

        const hash = scryptSync(args.currentPassword, salt, 64).toString('hex');
        if (!timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))) {
          return { success: false as const, error: 'Current password is incorrect.' };
        }
      } catch (error) {
        console.error('Error during password verification:', error);
        return { success: false as const, error: 'Failed to verify current password.' };
      }

      // Hash new password
      const newSalt = randomBytes(16).toString('hex');
      const newHash = scryptSync(args.newPassword, newSalt, 64).toString('hex');
      const hashedPassword = `${newSalt}:${newHash}`;

      // Update password
      await ctx.runMutation(api.mutations.users.updateUser, {
        userId: user._id,
        password: hashedPassword,
        sessionToken: args.sessionToken,
      });

      return {
        success: true as const,
        message: 'Password changed successfully',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to change password';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Sessions - for mobile app direct Convex communication
 */
export const customerGetSessions = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      sessions: v.array(v.object({
        session_id: v.string(),
        device: v.string(),
        device_id: v.optional(v.string()),
        location: v.string(),
        created_at: v.string(),
        expires_at: v.string(),
        is_current: v.boolean(),
      })),
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

      // Get sessions from the sessions table
      const sessions = await ctx.runQuery(api.queries.sessions.getSessionsByUserId, {
        userId: user._id,
      });

      // Filter active sessions (expiresAt > now)
      // Also include sessions without expiresAt (legacy sessions) if they're not explicitly expired
      const now = Date.now();
      const activeSessions = (sessions || []).filter((session: any) => {
        // If expiresAt exists, check if it's in the future
        if (session.expiresAt) {
          return session.expiresAt > now;
        }
        // If no expiresAt, include it (legacy session - assume active)
        return true;
      });

      // Format sessions for response
      const formattedSessions = activeSessions.map((session: any) => {
        // Use deviceName if available, otherwise extract device info from userAgent
        let device = session.deviceName || 'Unknown Device';
        if (!session.deviceName && session.userAgent) {
          const ua = session.userAgent.toLowerCase();
          if (ua.includes('iphone') || ua.includes('ipad')) {
            device = 'iOS Device';
          } else if (ua.includes('android')) {
            device = 'Android Device';
          } else if (ua.includes('windows')) {
            device = 'Windows';
          } else if (ua.includes('mac')) {
            device = 'Mac';
          } else if (ua.includes('linux')) {
            device = 'Linux';
          } else {
            device = session.userAgent.substring(0, 50);
          }
        }

        // Check if this is the current session
        const isCurrent = session.sessionToken === args.sessionToken;

        return {
          session_id: session._id,
          device: device,
          device_id: session.deviceId || undefined, // Include deviceId for client-side tracking
          location: session.ipAddress || 'Unknown',
          created_at: new Date(session.createdAt).toISOString(),
          expires_at: new Date(session.expiresAt).toISOString(),
          is_current: isCurrent,
        };
      });

      // Sort by creation time (newest first)
      formattedSessions.sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      return {
        success: true as const,
        sessions: formattedSessions,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get sessions';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Revoke Session - for mobile app direct Convex communication
 */
export const customerRevokeSession = action({
  args: {
    sessionToken: v.string(),
    sessionId: v.string(),
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

      // Get sessions to verify ownership
      const sessions = await ctx.runQuery(api.queries.sessions.getSessionsByUserId, {
        userId: user._id,
      });

      const sessionToRevoke = (sessions || []).find((s: any) => s._id === args.sessionId);

      if (!sessionToRevoke) {
        return { success: false as const, error: 'Session not found.' };
      }

      // Verify session belongs to user
      if (sessionToRevoke.userId !== user._id) {
        return { success: false as const, error: 'Forbidden: You can only revoke your own sessions.' };
      }

      // Delete session via mutation
      const deleted = await ctx.runMutation(api.mutations.sessions.deleteUserSession, {
        sessionId: args.sessionId as any,
      });

      if (!deleted) {
        return { success: false as const, error: 'Session not found or could not be deleted.' };
      }

      return {
        success: true as const,
        message: 'Session revoked successfully',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to revoke session';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Setup 2FA - for mobile app direct Convex communication
 */
export const customerSetup2FA = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      secret: v.string(),
      backupCodes: v.array(v.string()),
      qrCode: v.string(),
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

      // Import otplib and qrcode
      const { authenticator } = await import('otplib');
      const QRCode = await import('qrcode');

      // Generate 2FA secret
      const secret = authenticator.generateSecret();

      // Generate 8 backup codes
      const backupCodes: string[] = [];
      const unhashedBackupCodes: string[] = [];
      for (let i = 0; i < 8; i++) {
        const code = randomBytes(4).toString('hex').toUpperCase();
        unhashedBackupCodes.push(code);
        // Hash backup code using scrypt
        const salt = randomBytes(16).toString('hex');
        const hashedCode = `${salt}:${scryptSync(code, salt, 64).toString('hex')}`;
        backupCodes.push(hashedCode);
      }

      // Store encrypted secret and hashed backup codes
      const encryptedSecret = secret;

      // Store in database
      await ctx.runMutation(api.mutations.users.setupTwoFactor, {
        userId: user._id,
        secret: encryptedSecret,
        backupCodes: backupCodes,
        sessionToken: args.sessionToken,
      });

      // Generate QR code
      const serviceName = 'Cribnosh';
      const accountName = user.email || user.phone_number || user.name || `user_${user._id}`;

      // Generate otpauth URL
      const encodedServiceName = encodeURIComponent(serviceName);
      const encodedAccountName = encodeURIComponent(accountName);
      const otpauthUrl = `otpauth://totp/${encodedServiceName}:${encodedAccountName}?secret=${secret}&issuer=${encodedServiceName}`;
      const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

      return {
        success: true as const,
        secret: secret,
        backupCodes: unhashedBackupCodes,
        qrCode: qrCodeDataUrl,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to setup 2FA';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Disable 2FA - for mobile app direct Convex communication
 */
export const customerDisable2FA = action({
  args: {
    sessionToken: v.string(),
    password: v.optional(v.string()),
    code: v.optional(v.string()),
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

      // Verify password if provided
      if (args.password) {
        if (!user.password) {
          return { success: false as const, error: 'No password set for this account.' };
        }

        try {
          const [salt, storedHash] = user.password.split(':');
          if (!salt || !storedHash) {
            return { success: false as const, error: 'Invalid password format.' };
          }

          const hash = scryptSync(args.password, salt, 64).toString('hex');
          if (!timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(storedHash, 'hex'))) {
            return { success: false as const, error: 'Invalid password.' };
          }
        } catch (error) {
          console.error('Error during password verification:', error);
          return { success: false as const, error: 'Failed to verify password.' };
        }
      }

      // Verify 2FA code if provided (and password not provided)
      if (args.code && !args.password) {
        if (!user.twoFactorEnabled || !user.twoFactorSecret) {
          return { success: false as const, error: '2FA not enabled for this user.' };
        }

        const { authenticator } = await import('otplib');
        const isValid = authenticator.verify({
          token: args.code,
          secret: user.twoFactorSecret,
        });

        if (!isValid) {
          return { success: false as const, error: 'Invalid 2FA code.' };
        }
      }

      // Disable 2FA
      await ctx.runMutation(api.mutations.users.disableTwoFactor, {
        userId: user._id,
        sessionToken: args.sessionToken,
      });

      return {
        success: true as const,
        message: '2FA disabled successfully',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to disable 2FA';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Cart - for mobile app direct Convex communication
 */
export const customerGetCart = action({
  args: {
    sessionToken: v.string(),
  },
      returns: v.union(
    v.object({
      success: v.literal(true),
      cart: v.array(v.object({
        _id: v.string(),
        dish_id: v.string(),
        quantity: v.number(),
        price: v.number(),
        total_price: v.number(),
        name: v.string(),
        image_url: v.optional(v.string()),
        chef_id: v.optional(v.string()),
        chef_name: v.optional(v.string()),
        added_at: v.optional(v.number()),
      })),
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

      // Get cart from Convex
      const cart = await ctx.runQuery(api.queries.orders.getUserCart, {
        userId: user._id,
        sessionToken: args.sessionToken,
      });

      if (!cart || !cart.items || cart.items.length === 0) {
        return {
          success: true as const,
          cart: [],
        };
      }

      // Enrich cart items with meal and chef details
      const enrichedItems = await Promise.all(
        cart.items.map(async (item: any) => {
          try {
            // Get meal details
            const meal = await ctx.runQuery(api.queries.meals.getById, {
              mealId: item.id as any,
            });

            // Get chef details if available
            let chefName: string | undefined;
            if (meal?.chefId) {
              try {
                const chef = await ctx.runQuery(api.queries.chefs.getById, {
                  chefId: meal.chefId as any,
                });
                chefName = chef?.name;
              } catch (error) {
                // Chef not found, continue without chef name
              }
            }

            // Get first image URL if available
            let imageUrl: string | undefined = undefined;
            if (meal?.images && Array.isArray(meal.images) && meal.images.length > 0) {
              const firstImage = meal.images[0];
              // Check if it's a Convex storage ID (starts with 'k' and is a valid ID format)
              // or if it's already a URL
              if (firstImage.startsWith('http://') || firstImage.startsWith('https://')) {
                imageUrl = firstImage;
              } else if (firstImage.startsWith('k')) {
                // It's likely a Convex storage ID, get the URL
                try {
                  imageUrl = await ctx.storage.getUrl(firstImage as any);
                } catch (error) {
                  console.error('Failed to get storage URL for image:', firstImage, error);
                  // Fallback to relative path
                  imageUrl = `/api/files/${firstImage}`;
                }
              } else {
                // Fallback to relative path
                imageUrl = `/api/files/${firstImage}`;
              }
            }

            // Include sides if they exist
            const sides = item.sides || [];

            return {
              _id: item.id,
              dish_id: item.id,
              quantity: item.quantity,
              price: item.price || meal?.price || 0,
              total_price: (item.price || meal?.price || 0) * item.quantity,
              name: item.name || meal?.name || 'Unknown Dish',
              image_url: imageUrl,
              chef_id: meal?.chefId || undefined,
              chef_name: chefName,
              added_at: item.updatedAt || Date.now(),
              sides: sides.length > 0 ? sides : undefined,
            };
          } catch (error) {
            // If meal not found, return item with available data
            return {
              _id: item.id,
              dish_id: item.id,
              quantity: item.quantity,
              price: item.price || 0,
              total_price: (item.price || 0) * item.quantity,
              name: item.name || 'Unknown Dish',
              image_url: undefined,
              chef_id: undefined,
              chef_name: undefined,
              added_at: item.updatedAt || Date.now(),
              sides: item.sides || undefined,
            };
          }
        })
      );

      return {
        success: true as const,
        cart: enrichedItems,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get cart';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Add To Cart - for mobile app direct Convex communication
 */
export const customerAddToCart = action({
  args: {
    sessionToken: v.string(),
    dish_id: v.string(),
    quantity: v.number(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      item: v.object({
        _id: v.string(),
        dish_id: v.string(),
        quantity: v.number(),
        price: v.number(),
        name: v.string(),
        chef_id: v.optional(v.string()),
        added_at: v.number(),
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

      // Validate quantity
      if (!args.quantity || args.quantity <= 0) {
        return { success: false as const, error: 'Quantity must be greater than 0' };
      }

      // Add item to cart using mutation
      const updatedCart = await ctx.runMutation(api.mutations.orders.addToCart, {
        userId: user._id,
        dishId: args.dish_id as any,
        quantity: args.quantity,
      });

      // Find the added item in the cart
      const addedItem = updatedCart.items.find((item: any) => item.id === args.dish_id);

      if (!addedItem) {
        return { success: false as const, error: 'Failed to add item to cart' };
      }

      // Get meal details for enrichment
      let meal: any = null;
      try {
        meal = await ctx.runQuery(api.queries.meals.getById, {
          mealId: args.dish_id as any,
        });
      } catch (error) {
        // Meal not found, use item data
      }

      return {
        success: true as const,
        item: {
          _id: addedItem.id,
          dish_id: addedItem.id,
          quantity: addedItem.quantity,
          price: addedItem.price || meal?.price || 0,
          name: addedItem.name || meal?.name || 'Unknown Dish',
          chef_id: meal?.chefId || undefined,
          added_at: addedItem.updatedAt || Date.now(),
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to add item to cart';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Add Order to Cart - adds all items from a previous order to cart
 */
export const customerAddOrderToCart = action({
  args: {
    sessionToken: v.string(),
    order_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      items: v.array(v.object({
        _id: v.string(),
        dish_id: v.string(),
        quantity: v.number(),
        price: v.number(),
        name: v.string(),
        chef_id: v.optional(v.string()),
        added_at: v.number(),
      })),
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

      // Get order by ID
      const order = await ctx.runQuery(api.queries.orders.getById, {
        order_id: args.order_id,
        sessionToken: args.sessionToken,
      });

      if (!order) {
        return { success: false as const, error: 'Order not found' };
      }

      // Verify ownership
      if (order.customer_id !== user._id && order.customer_id.toString() !== user._id.toString()) {
        return { success: false as const, error: 'Order not found or not owned by customer' };
      }

      // Check if order has items
      if (!order.order_items || !Array.isArray(order.order_items) || order.order_items.length === 0) {
        return { success: false as const, error: 'Order has no items to add' };
      }

      // Add each item from the order to cart
      const addedItems: any[] = [];
      const errors: string[] = [];

      for (const orderItem of order.order_items) {
        const dishId = orderItem.dish_id || orderItem.dishId;
        if (!dishId) {
          errors.push(`Item "${orderItem.name || 'Unknown'}" has no dish ID`);
          continue;
        }

        try {
          // Add item to cart using mutation
          const updatedCart = await ctx.runMutation(api.mutations.orders.addToCart, {
            userId: user._id,
            dishId: dishId as any,
            quantity: orderItem.quantity || 1,
          });

          // Find the added item in the cart
          const addedItem = updatedCart.items.find((item: any) => item.id === dishId);

          if (addedItem) {
            // Get meal details for enrichment
            let meal: any = null;
            try {
              meal = await ctx.runQuery(api.queries.meals.getById, {
                mealId: dishId as any,
              });
            } catch (error) {
              // Meal not found, use item data
            }

            addedItems.push({
              _id: addedItem.id,
              dish_id: addedItem.id,
              quantity: addedItem.quantity,
              price: addedItem.price || meal?.price || orderItem.price || 0,
              name: addedItem.name || meal?.name || orderItem.name || 'Unknown Dish',
              chef_id: meal?.chefId || undefined,
              added_at: addedItem.updatedAt || Date.now(),
            });
          } else {
            errors.push(`Failed to add "${orderItem.name || 'Unknown'}" to cart`);
          }
        } catch (error: any) {
          errors.push(`Failed to add "${orderItem.name || 'Unknown'}": ${error?.message || 'Unknown error'}`);
        }
      }

      // If no items were added, return error
      if (addedItems.length === 0) {
        return { 
          success: false as const, 
          error: errors.length > 0 
            ? errors.join('; ') 
            : 'Failed to add any items from order to cart' 
        };
      }

      // Return success with added items
      const message = addedItems.length === order.order_items.length
        ? `Added ${addedItems.length} item${addedItems.length > 1 ? 's' : ''} to cart`
        : `Added ${addedItems.length} of ${order.order_items.length} items to cart${errors.length > 0 ? '. Some items could not be added.' : ''}`;

      return {
        success: true as const,
        items: addedItems,
        message,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to add order to cart';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Update Cart Item - for mobile app direct Convex communication
 */
export const customerUpdateCartItem = action({
  args: {
    sessionToken: v.string(),
    cart_item_id: v.string(),
    quantity: v.number(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      item: v.object({
        _id: v.string(),
        dish_id: v.string(),
        quantity: v.float64(),
        price: v.float64(),
        name: v.string(),
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

      // Update cart item quantity
      const updatedItem = await ctx.runMutation(api.mutations.orders.updateCartItem, {
        userId: user._id,
        itemId: args.cart_item_id,
        quantity: args.quantity,
      });

      if (!updatedItem) {
        return { success: false as const, error: 'Cart item not found' };
      }

      // Format the response to match the expected return type
      return {
        success: true as const,
        item: {
          _id: updatedItem.id,
          dish_id: updatedItem.id,
          quantity: updatedItem.quantity,
          price: updatedItem.price,
          name: updatedItem.name,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update cart item';
      return { success: false as const, error: errorMessage };
    }
  },
});

// ============================================================================
// NOTIFICATIONS ACTIONS
// ============================================================================

/**
 * Customer Get Notifications - for mobile app direct Convex communication
 */
export const customerGetNotifications = action({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    unreadOnly: v.optional(v.boolean()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      notifications: v.array(v.any()),
      total: v.number(),
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

      // Get notifications
      const notifications = await ctx.runQuery(api.queries.notifications.getUserNotifications, {
        userId: user._id,
        roles: user.roles || [],
        limit: args.limit || 50,
        unreadOnly: args.unreadOnly,
      });

      return {
        success: true as const,
        notifications: notifications || [],
        total: notifications?.length || 0,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get notifications';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Notification Stats - for mobile app direct Convex communication
 */
export const customerGetNotificationStats = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      total: v.number(),
      unread: v.number(),
      byType: v.any(),
      byPriority: v.any(),
      byCategory: v.any(),
      recentCount: v.number(),
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

      // Get notification stats
      const stats = await ctx.runQuery(api.queries.notifications.getNotificationStats, {
        userId: user._id,
        roles: user.roles || [],
      });

      return {
        success: true as const,
        total: stats.total || 0,
        unread: stats.unread || 0,
        byType: stats.byType || {},
        byPriority: stats.byPriority || {},
        byCategory: stats.byCategory || {},
        recentCount: stats.recentCount || 0,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get notification stats';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Mark Notification Read - for mobile app direct Convex communication
 */
export const customerMarkNotificationRead = action({
  args: {
    sessionToken: v.string(),
    notification_id: v.string(),
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

      // Mark notification as read
      // Handle both regular IDs and prefixed IDs (system_, admin_)
      let notificationId = args.notification_id;
      if (notificationId.startsWith('system_') || notificationId.startsWith('admin_')) {
        // System/admin notifications can't be marked as read via this endpoint
        // They're always considered "read" in the UI context
        return {
          success: true as const,
          message: 'Notification marked as read',
        };
      }

      await ctx.runMutation(api.mutations.notifications.markAsRead, {
        notificationId: notificationId as Id<'notifications'>,
      });

      return {
        success: true as const,
        message: 'Notification marked as read',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to mark notification as read';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Mark All Notifications Read - for mobile app direct Convex communication
 */
export const customerMarkAllNotificationsRead = action({
  args: {
    sessionToken: v.string(),
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

      // Mark all notifications as read
      await ctx.runMutation(api.mutations.notifications.markAllAsRead, {
        userId: user._id,
      });

      return {
        success: true as const,
        message: 'All notifications marked as read',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to mark all notifications as read';
      return { success: false as const, error: errorMessage };
    }
  },
});

// Helper to authenticate user and verify customer role
async function authenticateUser(ctx: any, sessionToken: string): Promise<Id<'users'> | null> {
  const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
    sessionToken,
  });
  if (!user || !user.roles?.includes('customer')) {
    return null;
  }
  return user._id;
}

/**
 * Customer Get Active Offers
 */
export const customerGetActiveOffers = action({
  args: {
    sessionToken: v.string(),
    target: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      offers: v.array(v.any()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      const offers = await ctx.runQuery(api.queries.specialOffers.getActiveOffers, {
        user_id: userId,
        target_audience: args.target as any || 'all',
      });

      // Transform to match API format
      const formattedOffers = offers.map((offer: any) => ({
        id: offer.offer_id,
        offer_id: offer.offer_id,
        title: offer.title,
        description: offer.description,
        call_to_action_text: offer.call_to_action_text,
        offer_type: offer.offer_type,
        badge_text: offer.badge_text,
        discount_type: offer.discount_type,
        discount_value: offer.discount_value,
        max_discount: offer.max_discount,
        target_audience: offer.target_audience,
        min_order_amount: offer.min_order_amount,
        min_participants: offer.min_participants,
        status: offer.status,
        is_active: offer.is_active,
        background_image_url: offer.background_image_url,
        background_color: offer.background_color,
        text_color: offer.text_color,
        starts_at: offer.starts_at,
        ends_at: offer.ends_at,
        click_count: offer.click_count || 0,
        conversion_count: offer.conversion_count || 0,
        action_type: offer.action_type,
        action_target: offer.action_target,
        created_at: offer.created_at,
        updated_at: offer.updated_at,
      }));

      return { success: true as const, offers: formattedOffers };
    } catch (error: any) {
      return { success: false as const, error: error?.message || 'Failed to get active offers' };
    }
  },
});

/**
 * Customer Get Recommended Meals
 */
export const customerGetRecommendedMeals = action({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      meals: v.array(v.any()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      const limit = args.limit || 10;
      const meals = await ctx.runQuery(api.queries.mealRecommendations.getRecommended, {
        userId,
        limit,
      });

      return { success: true as const, meals };
    } catch (error: any) {
      return { success: false as const, error: error?.message || 'Failed to get recommended meals' };
    }
  },
});

/**
 * Customer Get Random Meals
 */
export const customerGetRandomMeals = action({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      meals: v.array(v.any()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      const limit = args.limit || 20;
      const meals = await ctx.runQuery(api.queries.meals.getRandomMeals, {
        userId,
        limit,
        latitude: args.latitude,
        longitude: args.longitude,
      });

      return { success: true as const, meals };
    } catch (error: any) {
      return { success: false as const, error: error?.message || 'Failed to get random meals' };
    }
  },
});

/**
 * Customer Get Trending Searches
 */
export const customerGetTrendingSearches = action({
  args: {
    sessionToken: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      searches: v.array(v.any()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // If sessionToken is provided, authenticate user; otherwise proceed without authentication
      let userId: Id<'users'> | undefined;
      if (args.sessionToken) {
        userId = await authenticateUser(ctx, args.sessionToken);
        if (!userId) {
          return { success: false as const, error: 'Authentication required' };
        }
      }

      const limit = args.limit || 10;
      const now = Date.now();
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

      // Get recent search queries from orders (meal names, chef names, etc.)
      // This is a simplified implementation - in production you'd have a dedicated search history table
      let recentOrders: any[] = [];
      if (userId) {
        recentOrders = await ctx.runQuery(api.queries.orders.listByCustomer, {
          customer_id: userId.toString(),
          status: 'all',
          order_type: 'all',
        });
      }

      // Extract search terms from order items
      const searchTerms = new Map<string, number>();
      recentOrders.forEach((order: any) => {
        if (order.items) {
          order.items.forEach((item: any) => {
            if (item.meal_name) {
              const term = item.meal_name.toLowerCase();
              searchTerms.set(term, (searchTerms.get(term) || 0) + 1);
            }
            if (item.chef_name) {
              const term = item.chef_name.toLowerCase();
              searchTerms.set(term, (searchTerms.get(term) || 0) + 1);
            }
          });
        }
      });

      // Convert to array and sort by frequency
      const trending = Array.from(searchTerms.entries())
        .map(([term, count]) => ({ term, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit)
        .map((item, index) => ({
          id: `trending-${index}`,
          query: item.term,
          count: item.count,
          rank: index + 1,
        }));

      return { success: true as const, searches: trending };
    } catch (error: any) {
      return { success: false as const, error: error?.message || 'Failed to get trending searches' };
    }
  },
});

/**
 * Customer Get Nutrition Progress
 */
export const customerGetNutritionProgress = action({
  args: {
    sessionToken: v.string(),
    period: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      progress: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      const today = new Date().toISOString().split('T')[0];
      const progress = await ctx.runQuery(api.queries.nutrition.getCaloriesProgress, {
        userId,
        date: today,
      });

      return { success: true as const, progress };
    } catch (error: any) {
      return { success: false as const, error: error?.message || 'Failed to get nutrition progress' };
    }
  },
});

/**
 * Customer Get Rewards Points
 */
export const customerGetRewardsPoints = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      points: v.number(),
      total_earned: v.optional(v.number()),
      total_spent: v.optional(v.number()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      const pointsData = await ctx.runQuery(api.queries.noshPoints.getPointsByUserId, {
        userId,
      });

      return { 
        success: true as const, 
        points: pointsData.available_points || 0,
        total_earned: pointsData.total_points_earned || 0,
        total_spent: pointsData.total_points_spent || 0,
      };
    } catch (error: any) {
      return { success: false as const, error: error?.message || 'Failed to get rewards points' };
    }
  },
});

/**
 * Customer Get Monthly Overview
 */
export const customerGetMonthlyOverview = action({
  args: {
    sessionToken: v.string(),
    month: v.optional(v.number()),
    year: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      overview: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      const now = new Date();
      const targetMonth = args.month !== undefined ? args.month : now.getMonth() + 1;
      const targetYear = args.year !== undefined ? args.year : now.getFullYear();
      
      // Format month as YYYY-MM for the query
      const monthString = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

      // Use the existing query that returns the correct structure
      const overview = await ctx.runQuery(api.queries.stats.getMonthlyOverview, {
        userId,
        month: monthString,
      });

      return {
        success: true as const,
        overview,
      };
    } catch (error: any) {
      return { success: false as const, error: error?.message || 'Failed to get monthly overview' };
    }
  },
      });

/**
 * Customer Get ForkPrint Score - for mobile app direct Convex communication
 */
export const customerGetForkPrintScore = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      data: v.object({
        score: v.number(),
        status: v.string(),
        points_to_next: v.number(),
        next_level: v.string(),
        current_level_icon: v.optional(v.string()),
        level_history: v.optional(v.array(v.object({
          level: v.string(),
          unlocked_at: v.string(),
        }))),
        updated_at: v.string(),
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

      // Get ForkPrint score
      const scoreData = await ctx.runQuery(api.queries.forkPrint.getScoreByUserId, {
        userId: user._id,
      });

      if (!scoreData) {
        // Return default values if no score exists yet
      return {
        success: true as const,
          data: {
            score: 0,
            status: 'Starter',
            points_to_next: 100,
            next_level: 'Tastemaker',
            current_level_icon: undefined,
            level_history: [],
            updated_at: new Date().toISOString(),
          },
        };
      }

      return {
        success: true as const,
        data: {
          score: scoreData.score,
          status: scoreData.status,
          points_to_next: scoreData.points_to_next,
          next_level: scoreData.next_level,
          current_level_icon: (scoreData.current_level_icon != null) ? scoreData.current_level_icon : undefined,
          level_history: scoreData.level_history || [],
          updated_at: scoreData.updated_at,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get ForkPrint score';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get User Behavior
 */
export const customerGetUserBehavior = action({
  args: {
    sessionToken: v.string(),
    period: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      behavior: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Get all orders
      const allOrders = await ctx.runQuery(api.queries.orders.listByCustomer, {
        customer_id: userId.toString(),
        status: 'all',
        order_type: 'all',
      });

      // Calculate total orders
      const totalOrders = allOrders.length;

      // Calculate days active
      let daysActive = 0;
      if (allOrders.length > 0) {
        const firstOrderDate = Math.min(...allOrders.map((o: any) => o.order_date || o.createdAt || o._creationTime));
        const now = Date.now();
        daysActive = Math.floor((now - firstOrderDate) / (1000 * 60 * 60 * 24));
      } else {
        const user = await ctx.runQuery(api.queries.users.getById, { userId });
        if (user) {
          const accountCreationDate = user._creationTime;
          const now = Date.now();
          daysActive = Math.floor((now - accountCreationDate) / (1000 * 60 * 60 * 24));
        }
      }

      // Get usual dinner items (orders between 5 PM - 10 PM)
      const dinnerItemsMap = new Map<string, {
        dish_id: string;
        dish_name: string;
        order_count: number;
        last_ordered_at: number;
        kitchen_name: string;
        image_url?: string;
      }>();

      for (const order of allOrders) {
        const orderDate = new Date(order.order_date || order.createdAt || order._creationTime);
        const hour = orderDate.getHours();
        
        if (hour >= 17 && hour < 22 && order.items) {
          order.items.forEach((item: any) => {
            const dishId = item.meal_id || item.dish_id || 'unknown';
            const existing = dinnerItemsMap.get(dishId);
            
            if (existing) {
              existing.order_count += 1;
              existing.last_ordered_at = Math.max(existing.last_ordered_at, orderDate.getTime());
            } else {
              dinnerItemsMap.set(dishId, {
                dish_id: dishId,
                dish_name: item.meal_name || item.dish_name || 'Unknown',
                order_count: 1,
                last_ordered_at: orderDate.getTime(),
                kitchen_name: item.chef_name || order.chef_name || 'Unknown',
                image_url: item.image_url || item.meal_image,
              });
            }
          });
        }
      }

      const usualDinnerItems = Array.from(dinnerItemsMap.values())
        .sort((a, b) => b.order_count - a.order_count)
        .slice(0, 10);

      // Get colleague connections (mutual follows)
      const userConnections = await ctx.runQuery(api.queries.userConnections.getAllUserConnections, {
        user_id: userId,
      });
      // Count colleagues (both manual and inferred)
      const colleagueConnections = userConnections.filter((conn: any) => 
        conn.connection_type === 'colleague_manual' || conn.connection_type === 'colleague_inferred'
      ).length;

      // Play to win history (simplified - would need actual game data)
      const playToWinHistory = {
        gamesPlayed: 0,
        gamesWon: 0,
        lastPlayed: null as number | null,
      };

      return {
        success: true as const,
        behavior: {
          totalOrders,
          daysActive,
          usualDinnerItems,
          colleagueConnections,
          playToWinHistory,
        },
      };
    } catch (error: any) {
      return { success: false as const, error: error?.message || 'Failed to get user behavior' };
    }
  },
});

/**
 * Customer Get Weekly Summary
 */
export const customerGetWeeklySummary = action({
  args: {
    sessionToken: v.string(),
    start_date: v.optional(v.string()),
    end_date: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      week_start: v.string(),
      week_end: v.string(),
      week_meals: v.array(v.number()),
      avg_meals: v.number(),
      kcal_today: v.number(),
      kcal_yesterday: v.number(),
      cuisines: v.array(v.string()),
      daily_calories: v.array(v.any()),
      updated_at: v.string(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Calculate week start and end dates if not provided
      let startDate: string;
      let endDate: string;

      if (args.start_date && args.end_date) {
        startDate = args.start_date;
        endDate = args.end_date;
      } else {
        // Default to current week (Monday to Sunday)
      const now = new Date();
        const dayOfWeek = now.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        const monday = new Date(now);
        monday.setDate(now.getDate() + mondayOffset);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        startDate = monday.toISOString().split('T')[0];
        endDate = sunday.toISOString().split('T')[0];
      }

      // Use the existing query that returns the correct structure
      const summary = await ctx.runQuery(api.queries.stats.getWeeklySummary, {
            userId,
        startDate,
        endDate,
          });

      return {
        success: true as const,
        week_start: summary.week_start,
        week_end: summary.week_end,
        week_meals: summary.week_meals,
        avg_meals: summary.avg_meals,
        kcal_today: summary.kcal_today,
        kcal_yesterday: summary.kcal_yesterday,
        cuisines: summary.cuisines,
        daily_calories: summary.daily_calories,
        updated_at: summary.updated_at,
      };
    } catch (error: any) {
      return { success: false as const, error: error?.message || 'Failed to get weekly summary' };
    }
  },
});

// Helper functions for week calculations
function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekStartDate(year: number, week: number): Date {
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const ISOweekStart = simple;
  if (dow <= 4) {
    ISOweekStart.setDate(simple.getDate() - simple.getDay() + 1);
  } else {
    ISOweekStart.setDate(simple.getDate() + 8 - simple.getDay());
  }
  return ISOweekStart;
}

// Helper to normalize kitchen ID - validates and converts string to Convex ID
// Handles both kitchen IDs and chef IDs (converts chef IDs to kitchen IDs)
async function normalizeKitchenId(ctx: any, id: string): Promise<Id<'kitchens'> | null> {
  try {
    // First, try as a kitchen ID
    try {
      const kitchenId = id as Id<'kitchens'>;
      const kitchenDetails = await ctx.runQuery(api.queries.kitchens.getKitchenDetails, {
        kitchenId,
      });
      if (kitchenDetails) {
        return kitchenId;
      }
    } catch (kitchenError) {
      // If it's not a valid kitchen ID, try as a chef ID
      try {
        const chefId = id as Id<'chefs'>;
        const kitchenId = await ctx.runQuery(api.queries.kitchens.getKitchenByChefId, {
          chefId,
        });
        if (kitchenId) {
          return kitchenId;
        }
      } catch (chefError) {
        // Not a valid chef ID either
        return null;
      }
    }
    return null;
  } catch (error) {
    // If all attempts fail, return null
    return null;
  }
}

/**
 * Customer Get Kitchen Meals - for mobile app direct Convex communication
 */
export const customerGetKitchenMeals = action({
  args: {
    sessionToken: v.string(),
    kitchen_id: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    category: v.optional(v.string()),
    dietary: v.optional(v.array(v.string())),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      meals: v.array(v.any()),
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

      // Normalize kitchen ID (validate and convert to Convex ID)
      const kitchenId = await normalizeKitchenId(ctx, args.kitchen_id);
      if (!kitchenId) {
        return { success: false as const, error: 'Kitchen not found' };
      }

      // Get chefId from kitchenId
      const chefId = await ctx.runQuery(api.queries.kitchens.getChefByKitchenId, {
        kitchenId,
      });

      if (!chefId) {
        return { success: false as const, error: 'Kitchen not found' };
      }

      // Get meals by chefId
      const meals = await ctx.runQuery(api.queries.meals.getByChefId, {
        chefId,
        userId: user._id,
        limit: args.limit,
        offset: args.offset,
        category: args.category,
        dietary: args.dietary,
      });

      return {
        success: true as const,
        meals: meals || [],
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get kitchen meals';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Popular Kitchen Meals - for mobile app direct Convex communication
 */
export const customerGetPopularKitchenMeals = action({
  args: {
    sessionToken: v.string(),
    kitchen_id: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      meals: v.array(v.any()),
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

      // Normalize kitchen ID (validate and convert to Convex ID)
      const kitchenId = await normalizeKitchenId(ctx, args.kitchen_id);
      if (!kitchenId) {
        return { success: false as const, error: 'Kitchen not found' };
      }

      // Get chefId from kitchenId
      const chefId = await ctx.runQuery(api.queries.kitchens.getChefByKitchenId, {
        kitchenId,
      });

      if (!chefId) {
        return { success: false as const, error: 'Kitchen not found' };
      }

      // Get popular meals by chefId
      const meals = await ctx.runQuery(api.queries.meals.getPopularByChefId, {
        chefId,
        userId: user._id,
        limit: args.limit || 10,
      });

      return {
        success: true as const,
        meals: meals || [],
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get popular kitchen meals';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Search Kitchen Meals - for mobile app direct Convex communication
 */
export const customerSearchKitchenMeals = action({
  args: {
    sessionToken: v.string(),
    kitchen_id: v.string(),
    query: v.string(),
    category: v.optional(v.string()),
    dietary: v.optional(v.array(v.string())),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      meals: v.array(v.any()),
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

      // Normalize kitchen ID (validate and convert to Convex ID)
      const kitchenId = await normalizeKitchenId(ctx, args.kitchen_id);
      if (!kitchenId) {
        return { success: false as const, error: 'Kitchen not found' };
      }

      // Get chefId from kitchenId
      const chefId = await ctx.runQuery(api.queries.kitchens.getChefByKitchenId, {
        kitchenId,
      });

      if (!chefId) {
        return { success: false as const, error: 'Kitchen not found' };
      }

      // Search meals by chefId
      const meals = await ctx.runQuery(api.queries.meals.searchMealsByChefId, {
        chefId,
        query: args.query,
        userId: user._id,
        category: args.category,
        dietary: args.dietary,
        limit: args.limit || 20,
      });

      return {
        success: true as const,
        meals: meals || [],
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to search kitchen meals';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Support Cases - for mobile app direct Convex communication
 */
export const customerGetSupportCases = action({
  args: {
    sessionToken: v.string(),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    status: v.optional(v.union(v.literal('open'), v.literal('closed'), v.literal('resolved'))),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      cases: v.array(v.any()),
      pagination: v.object({
        page: v.number(),
        limit: v.number(),
        total: v.number(),
        total_pages: v.number(),
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

      // Get support cases
      const allCases = await ctx.runQuery(api.queries.supportCases.getByUserId, {
        userId: user._id,
        status: args.status,
      });

      // Pagination
      const page = args.page || 1;
      const limit = args.limit || 10;
      const total = allCases.length;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;
      const paginatedCases = allCases.slice(offset, offset + limit);

      // Format cases for response
      const formattedCases = paginatedCases.map((c: any) => ({
        id: c._id,
        subject: c.subject,
        status: c.status,
        priority: c.priority,
        category: c.category,
        created_at: new Date(c.created_at).toISOString(),
        updated_at: new Date(c.updated_at).toISOString(),
        last_message: c.last_message || c.message,
        support_reference: c.support_reference,
      }));

      return {
        success: true as const,
        cases: formattedCases,
        pagination: {
          page,
          limit,
          total,
          total_pages: totalPages,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get support cases';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Create Support Case - for mobile app direct Convex communication
 */
export const customerCreateSupportCase = action({
  args: {
    sessionToken: v.string(),
    subject: v.string(),
    message: v.string(),
    category: v.union(
      v.literal('order'),
      v.literal('payment'),
      v.literal('account'),
      v.literal('technical'),
      v.literal('other')
    ),
    priority: v.optional(v.union(v.literal('low'), v.literal('medium'), v.literal('high'))),
    order_id: v.optional(v.string()),
    attachments: v.optional(v.array(v.string())),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      id: v.string(),
      subject: v.string(),
      status: v.string(),
      priority: v.string(),
      category: v.string(),
      created_at: v.string(),
      support_reference: v.string(),
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

      // Create support case
      const caseId = await ctx.runMutation(api.mutations.supportCases.create, {
        userId: user._id,
        subject: args.subject,
        message: args.message,
        category: args.category,
        priority: args.priority || 'medium',
        order_id: args.order_id,
        attachments: args.attachments || [],
      });

      // Get the created case to return details
      const supportCase = await ctx.db.get(caseId);
      if (!supportCase) {
        return { success: false as const, error: 'Failed to create support case' };
      }

      return {
        success: true as const,
        id: caseId,
        subject: supportCase.subject,
        status: supportCase.status,
        priority: supportCase.priority,
        category: supportCase.category,
        created_at: new Date(supportCase.created_at).toISOString(),
        support_reference: supportCase.support_reference,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create support case';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Support Chat - for mobile app direct Convex communication
 */
export const customerGetSupportChat = action({
  args: {
    sessionToken: v.string(),
    caseId: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      chatId: v.string(),
      supportCaseId: v.string(),
      agent: v.any(),
      messages: v.array(v.any()),
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

      let activeChat: any = null;

      if (args.caseId) {
        // Get chat for specific case
        const supportCase = await ctx.db.get(args.caseId as Id<'supportCases'>);
        if (!supportCase || supportCase.userId !== user._id) {
          return { success: false as const, error: 'Support case not found' };
        }
        if (supportCase.chat_id) {
          const chat = await ctx.db.get(supportCase.chat_id);
          if (chat) {
            activeChat = { chat, supportCase };
          }
        }
      } else {
        // Get active support chat
        activeChat = await ctx.runQuery(api.queries.supportCases.getActiveSupportChat, {
          userId: user._id,
        });
      }

      if (!activeChat || !activeChat.chat || !activeChat.supportCase) {
        return { success: false as const, error: 'No active support chat found' };
      }

      // Get messages for the chat
      const messagesResult = await ctx.runQuery(api.queries.chats.listMessagesForChat, {
        chatId: activeChat.chat._id,
        limit: 50,
        offset: 0,
      });

      // Get agent info
      let agent = null;
      if (activeChat.supportCase.assigned_agent_id) {
        const agentData = await ctx.runQuery(api.queries.supportAgents.getAgentInfo, {
          agentId: activeChat.supportCase.assigned_agent_id,
        });
        if (agentData) {
          agent = {
            id: agentData._id,
            name: agentData.name,
            avatar: agentData.avatar,
            isOnline: agentData.isOnline,
          };
        }
      }

      return {
        success: true as const,
        chatId: activeChat.chat._id,
        supportCaseId: activeChat.supportCase._id,
        agent,
        messages: messagesResult.messages.reverse(), // Reverse to show oldest first
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get support chat';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Send Support Message - for mobile app direct Convex communication
 */
export const customerSendSupportMessage = action({
  args: {
    sessionToken: v.string(),
    content: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      messageId: v.string(),
      chatId: v.string(),
      content: v.string(),
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

      // Get active support chat
      const activeChat = await ctx.runQuery(api.queries.supportCases.getActiveSupportChat, {
        userId: user._id,
      });

      if (!activeChat || !activeChat.chat || !activeChat.supportCase) {
        return { success: false as const, error: 'No active support chat found. Please create a support case first.' };
      }

      // Send message
      const messageResult = await ctx.runMutation(api.mutations.chats.sendMessage, {
        chatId: activeChat.chat._id,
        senderId: user._id,
        content: args.content.trim(),
      });

      // Update support case last message
      await ctx.runMutation(api.mutations.supportCases.addMessageToCase, {
        caseId: activeChat.supportCase._id,
        message: args.content.trim(),
      });

      return {
        success: true as const,
        messageId: messageResult.messageId,
        chatId: activeChat.chat._id,
        content: args.content.trim(),
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to send message';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Quick Replies - for mobile app direct Convex communication
 */
export const customerGetQuickReplies = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      replies: v.array(v.object({
        id: v.string(),
        text: v.string(),
        category: v.string(),
      })),
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

      // Return predefined quick replies
      const replies = [
        { id: '1', text: 'I need help with my order', category: 'order' },
        { id: '2', text: 'I have a payment issue', category: 'payment' },
        { id: '3', text: 'I want to update my account', category: 'account' },
        { id: '4', text: 'I\'m experiencing a technical problem', category: 'technical' },
        { id: '5', text: 'I have a general question', category: 'other' },
        { id: '6', text: 'Where is my order?', category: 'order' },
        { id: '7', text: 'I want to cancel my order', category: 'order' },
        { id: '8', text: 'I need a refund', category: 'payment' },
      ];

      return {
        success: true as const,
        replies,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get quick replies';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Support Messages - for mobile app direct Convex communication
 */
export const customerGetSupportMessages = action({
  args: {
    sessionToken: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      messages: v.array(v.any()),
      total: v.number(),
      limit: v.number(),
      offset: v.number(),
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

      // Get active support chat
      const activeChat = await ctx.runQuery(api.queries.supportCases.getActiveSupportChat, {
        userId: user._id,
      });

      if (!activeChat || !activeChat.chat) {
        return {
          success: true as const,
          messages: [],
          total: 0,
          limit: args.limit || 50,
          offset: args.offset || 0,
        };
      }

      // Get messages for the chat
      const limit = args.limit || 50;
      const offset = args.offset || 0;
      const messagesResult = await ctx.runQuery(api.queries.chats.listMessagesForChat, {
        chatId: activeChat.chat._id,
        limit,
        offset,
      });

      return {
        success: true as const,
        messages: messagesResult.messages.reverse(), // Reverse to show oldest first
        total: messagesResult.total_count,
        limit: messagesResult.limit,
        offset: messagesResult.offset,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get messages';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Support Agent - for mobile app direct Convex communication
 */
export const customerGetSupportAgent = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      agent: v.union(
        v.object({
          id: v.string(),
          name: v.string(),
          avatar: v.optional(v.string()),
          isOnline: v.boolean(),
          activeCases: v.number(),
        }),
        v.null()
      ),
      message: v.optional(v.string()),
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

      // Get active support chat
      const activeChat = await ctx.runQuery(api.queries.supportCases.getActiveSupportChat, {
        userId: user._id,
      });

      if (!activeChat || !activeChat.supportCase || !activeChat.supportCase.assigned_agent_id) {
        return {
          success: true as const,
          agent: null,
          message: 'No agent assigned yet. We will assign an agent shortly.',
        };
      }

      // Get agent info
      const agentInfo = await ctx.runQuery(api.queries.supportAgents.getAgentInfo, {
        agentId: activeChat.supportCase.assigned_agent_id,
      });

      if (!agentInfo) {
        return {
          success: true as const,
          agent: null,
          message: 'Agent information not available.',
        };
      }

      return {
        success: true as const,
        agent: {
          id: agentInfo._id,
          name: agentInfo.name,
          avatar: agentInfo.avatar,
          isOnline: agentInfo.isOnline,
          activeCases: agentInfo.activeCases,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get agent info';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Dish Details - for mobile app direct Convex communication
 */
export const customerGetDishDetails = action({
  args: {
    sessionToken: v.optional(v.string()),
    dish_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      dish: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Validate that dish_id is a valid Convex ID format
      // Convex IDs are typically 32 character alphanumeric strings
      if (!/^[a-z0-9]{32}$/.test(args.dish_id)) {
        return { 
          success: false as const, 
          error: 'Invalid dish ID format. Expected a valid Convex ID.' 
        };
      }

      // Get meal details
      const meal = await ctx.runQuery(api.queries.meals.getById, {
        mealId: args.dish_id as Id<'meals'>,
      });

      if (!meal) {
        return { success: false as const, error: 'Dish not found' };
      }

      // Get chef details
      const chef = await ctx.runQuery(api.queries.chefs.getById, {
        chefId: meal.chefId,
      });

      // Get reviews for this meal
      const allReviews = await ctx.runQuery(api.queries.reviews.getAll, {});
      const mealReviews = allReviews.filter((r: any) => 
        (r.mealId || r.meal_id) === args.dish_id
      );

      // Get favorite status if user is authenticated
      let isFavorited = false;
      if (args.sessionToken) {
        const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
          sessionToken: args.sessionToken,
        });
        if (user) {
          const favoriteStatus = await ctx.runQuery(api.queries.userFavorites.isMealFavorited, {
            userId: user._id,
            mealId: args.dish_id as Id<'meals'>,
          });
          isFavorited = favoriteStatus.isFavorited;
        }
      }

      // Build dish details with all expected fields for frontend
      const mealAny = meal as any;
      const chefAny = chef as any;
      
      const dishDetails = {
        ...meal,
        // Image URL mapping
        image_url: mealAny.images?.[0] || mealAny.image_url || null,
        // Kitchen/Chef information mapping
        kitchen_name: chefAny?.name || mealAny.kitchen_name || null,
        kitchen_image: chefAny?.profileImage || mealAny.kitchen_image || null,
        kitchen_id: chefAny?._id || mealAny.kitchen_id || null,
        // Chef object with all expected fields
        chef: chef ? {
          _id: chef._id,
          id: chef._id, // Also include as 'id' for consistency
          name: chef.name,
          bio: chef.bio,
          story: chef.bio, // Map bio to story for consistency
          specialties: chef.specialties || [],
          rating: chef.rating || 0,
          profileImage: chef.profileImage,
          profile_image: chef.profileImage, // Also include as snake_case
        } : null,
        // Reviews
        reviews: mealReviews,
        reviewCount: mealReviews.length,
        averageRating: mealReviews.length > 0
          ? mealReviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / mealReviews.length
          : meal.rating || 0,
        // Favorite status
        isFavorited,
        // Dietary information
        is_vegetarian: mealAny.dietary?.includes('vegetarian') || mealAny.is_vegetarian || false,
        // Nutritional information (if present in meal)
        fat: mealAny.fat || null,
        protein: mealAny.protein || null,
        carbs: mealAny.carbs || null,
        // Ingredients (if present in meal)
        ingredients: mealAny.ingredients || null,
        // Timing information
        prep_time: mealAny.prepTime || mealAny.prep_time || null,
        preparation_time: mealAny.prepTime || mealAny.prep_time || null, // Both formats
        delivery_time: mealAny.deliveryTime || mealAny.delivery_time || null,
        // Diet compatibility
        diet_compatibility: mealAny.dietCompatibility || mealAny.diet_compatibility || null,
        diet_message: mealAny.dietMessage || mealAny.diet_message || null,
        // Chef tips
        chef_tips: mealAny.chefTips || mealAny.chef_tips || mealAny.tips || null,
        tips: mealAny.chefTips || mealAny.chef_tips || mealAny.tips || null, // Both formats
      };

      return {
        success: true as const,
        dish: dishDetails,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get dish details';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Dish Favorite Status - for mobile app direct Convex communication
 */
export const customerGetDishFavoriteStatus = action({
  args: {
    sessionToken: v.string(),
    dish_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      isFavorited: v.boolean(),
      favoriteId: v.optional(v.string()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Validate that dish_id is a valid Convex ID format
      // Convex IDs are typically 32 character alphanumeric strings
      if (!/^[a-z0-9]{32}$/.test(args.dish_id)) {
        return { 
          success: false as const, 
          error: 'Invalid dish ID format. Expected a valid Convex ID.' 
        };
      }

      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Get favorite status
      const favoriteStatus = await ctx.runQuery(api.queries.userFavorites.isMealFavorited, {
        userId: user._id,
        mealId: args.dish_id as Id<'meals'>,
      });

      return {
        success: true as const,
        isFavorited: favoriteStatus.isFavorited,
        favoriteId: favoriteStatus.favoriteId,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get favorite status';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Add Dish Favorite - for mobile app direct Convex communication
 */
export const customerAddDishFavorite = action({
  args: {
    sessionToken: v.string(),
    dish_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      isFavorited: v.boolean(),
      favoriteId: v.string(),
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

      // Add to favorites
      const favoriteId = await ctx.runMutation(api.mutations.userFavorites.addMealFavorite, {
        userId: user._id,
        mealId: args.dish_id as Id<'meals'>,
      });

      return {
        success: true as const,
        isFavorited: true,
        favoriteId,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to add favorite';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Remove Dish Favorite - for mobile app direct Convex communication
 */
export const customerRemoveDishFavorite = action({
  args: {
    sessionToken: v.string(),
    dish_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      isFavorited: v.boolean(),
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

      // Remove from favorites
      await ctx.runMutation(api.mutations.userFavorites.removeMealFavorite, {
        userId: user._id,
        mealId: args.dish_id as Id<'meals'>,
      });

      return {
        success: true as const,
        isFavorited: false,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to remove favorite';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Toggle Dish Favorite - for mobile app direct Convex communication
 */
export const customerToggleDishFavorite = action({
  args: {
    sessionToken: v.string(),
    dish_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      isFavorited: v.boolean(),
      favoriteId: v.optional(v.string()),
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

      // Toggle favorite
      const result = await ctx.runMutation(api.mutations.userFavorites.toggleMealFavorite, {
        userId: user._id,
        mealId: args.dish_id as Id<'meals'>,
      });

      return {
        success: true as const,
        isFavorited: result.isFavorited,
        favoriteId: result.favoriteId,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to toggle favorite';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Similar Meals - for mobile app direct Convex communication
 */
export const customerGetSimilarMeals = action({
  args: {
    sessionToken: v.optional(v.string()),
    meal_id: v.string(),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      dishes: v.array(v.any()),
      total: v.optional(v.number()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Validate that meal_id is a valid Convex ID format
      // Convex IDs are typically 32 character alphanumeric strings
      if (!/^[a-z0-9]{32}$/.test(args.meal_id)) {
        return { 
          success: false as const, 
          error: 'Invalid meal ID format. Expected a valid Convex ID.' 
        };
      }

      // Get user ID if authenticated
      let userId: Id<'users'> | undefined;
      if (args.sessionToken) {
        const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
          sessionToken: args.sessionToken,
        });
        userId = user?._id;
      }

      // Get similar meals
      const similarMeals = await ctx.runQuery(api.queries.mealRecommendations.getSimilar, {
        mealId: args.meal_id as Id<'meals'>,
        userId,
        limit: args.limit || 5,
      });

      // Transform meals to dishes format expected by frontend
      const dishes = await Promise.all(
        (similarMeals || []).map(async (meal: any) => {
          // Get chef data for each meal
          const chef = await ctx.runQuery(api.queries.chefs.getById, {
            chefId: meal.chefId,
          });

          const mealAny = meal as any;
          const chefAny = chef as any;

          // Transform to expected format
          return {
            id: meal._id || meal.id,
            _id: meal._id,
            name: meal.name,
            price: typeof meal.price === 'number' ? meal.price.toString() : meal.price || '0',
            imageUrl: mealAny.images?.[0] || mealAny.image_url || mealAny.imageUrl || null,
            image_url: mealAny.images?.[0] || mealAny.image_url || null,
            sentiment: mealAny.sentiment || null,
            isVegetarian: mealAny.dietary?.includes('vegetarian') || mealAny.is_vegetarian || false,
            is_vegetarian: mealAny.dietary?.includes('vegetarian') || mealAny.is_vegetarian || false,
            // Include additional fields for compatibility
            description: meal.description || null,
            cuisine: meal.cuisine || [],
            dietary: meal.dietary || [],
            rating: meal.rating || null,
            calories: meal.calories || null,
            chefId: meal.chefId,
            chef: chef ? {
              _id: chef._id,
              id: chef._id,
              name: chef.name,
            } : null,
          };
        })
      );

      return {
        success: true as const,
        dishes: dishes,
        total: dishes.length,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get similar meals';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Remove From Cart - for mobile app direct Convex communication
 */
export const customerRemoveFromCart = action({
  args: {
    sessionToken: v.string(),
    cart_item_id: v.string(),
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

      // Remove item from cart
      await ctx.runMutation(api.mutations.orders.removeFromCart, {
        userId: user._id,
        itemId: args.cart_item_id,
      });

      return {
        success: true as const,
        message: 'Item removed from cart',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to remove item from cart';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Sides For Cart - for mobile app direct Convex communication
 * Returns available sides for all meals in the cart
 */
export const customerGetSidesForCart = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      sides: v.any(), // Using v.any() for dynamic object with string keys mapping to arrays
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

      // Get cart from Convex
      const cart = await ctx.runQuery(api.queries.orders.getUserCart, {
        userId: user._id,
        sessionToken: args.sessionToken,
      });

      if (!cart || !cart.items || cart.items.length === 0) {
        return {
          success: true as const,
          sides: {},
        };
      }

      // Get meal IDs from cart
      const mealIds = cart.items.map((item: any) => item.id as any);

      // Get sides for cart items
      const sidesByMeal = await ctx.runQuery(api.queries.sides.getSidesForCartItems, {
        mealIds,
        sessionToken: args.sessionToken,
      });

      // Transform sides to match expected format
      const transformedSides: Record<string, any[]> = {};
      for (const [mealId, sides] of Object.entries(sidesByMeal)) {
        transformedSides[mealId] = sides.map((side: any) => ({
          _id: side._id,
          name: side.name,
          description: side.description,
          price: side.price,
          category: side.category,
          image: side.image,
        }));
      }

      return {
        success: true as const,
        sides: transformedSides,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get sides for cart';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Add Side To Cart Item - for mobile app direct Convex communication
 */
export const customerAddSideToCartItem = action({
  args: {
    sessionToken: v.string(),
    cart_item_id: v.string(),
    side_id: v.string(),
    quantity: v.number(),
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

      // Add side to cart item
      await ctx.runMutation(api.mutations.sides.addSideToCartItem, {
        userId: user._id,
        cartItemId: args.cart_item_id,
        sideId: args.side_id as any,
        quantity: args.quantity,
        sessionToken: args.sessionToken,
      });

      return {
        success: true as const,
        message: 'Side added to cart item',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to add side to cart item';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Update Side Quantity - for mobile app direct Convex communication
 */
export const customerUpdateSideQuantity = action({
  args: {
    sessionToken: v.string(),
    cart_item_id: v.string(),
    side_id: v.string(),
    quantity: v.number(),
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

      // Update side quantity
      await ctx.runMutation(api.mutations.sides.updateSideQuantity, {
        userId: user._id,
        cartItemId: args.cart_item_id,
        sideId: args.side_id,
        quantity: args.quantity,
        sessionToken: args.sessionToken,
      });

      return {
        success: true as const,
        message: 'Side quantity updated',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update side quantity';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Remove Side From Cart Item - for mobile app direct Convex communication
 */
export const customerRemoveSideFromCartItem = action({
  args: {
    sessionToken: v.string(),
    cart_item_id: v.string(),
    side_id: v.string(),
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

      // Remove side from cart item
      await ctx.runMutation(api.mutations.sides.removeSideFromCartItem, {
        userId: user._id,
        cartItemId: args.cart_item_id,
        sideId: args.side_id,
        sessionToken: args.sessionToken,
      });

      return {
        success: true as const,
        message: 'Side removed from cart item',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to remove side from cart item';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Dietary Preferences - for mobile app direct Convex communication
 */
export const customerGetDietaryPreferences = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      preferences: v.array(v.string()),
      religious_requirements: v.array(v.string()),
      health_driven: v.array(v.string()),
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

      // Get dietary preferences
      const preferences = await ctx.runQuery(api.queries.dietaryPreferences.getByUserId, {
        userId: user._id,
      });

      return {
        success: true as const,
        preferences: preferences.preferences || [],
        religious_requirements: preferences.religious_requirements || [],
        health_driven: preferences.health_driven || [],
        updated_at: preferences.updated_at,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get dietary preferences';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Update Dietary Preferences - for mobile app direct Convex communication
 */
export const customerUpdateDietaryPreferences = action({
  args: {
    sessionToken: v.string(),
    preferences: v.array(v.string()),
    religious_requirements: v.array(v.string()),
    health_driven: v.array(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      preferences: v.array(v.string()),
      religious_requirements: v.array(v.string()),
      health_driven: v.array(v.string()),
      updated_at: v.string(),
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

      // Update dietary preferences
      await ctx.runMutation(api.mutations.dietaryPreferences.updateByUserId, {
        userId: user._id,
        preferences: args.preferences,
        religious_requirements: args.religious_requirements,
        health_driven: args.health_driven,
      });

      // Get updated preferences
      const updated = await ctx.runQuery(api.queries.dietaryPreferences.getByUserId, {
        userId: user._id,
      });

      return {
        success: true as const,
        preferences: updated.preferences || [],
        religious_requirements: updated.religious_requirements || [],
        health_driven: updated.health_driven || [],
        updated_at: updated.updated_at,
        message: 'Dietary preferences updated successfully',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update dietary preferences';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Allergies - for mobile app direct Convex communication
 */
export const customerGetAllergies = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      allergies: v.array(v.any()),
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

      // Get allergies
      const allergies = await ctx.runQuery(api.queries.allergies.getByUserId, {
        userId: user._id,
      });

      return {
        success: true as const,
        allergies: allergies || [],
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get allergies';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Update Allergies - for mobile app direct Convex communication
 */
export const customerUpdateAllergies = action({
  args: {
    sessionToken: v.string(),
    allergies: v.array(
      v.object({
        name: v.string(),
        type: v.union(v.literal('allergy'), v.literal('intolerance')),
        severity: v.union(v.literal('mild'), v.literal('moderate'), v.literal('severe')),
      })
    ),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      allergies: v.array(v.any()),
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

      // Update allergies
      await ctx.runMutation(api.mutations.allergies.updateByUserId, {
        userId: user._id,
        allergies: args.allergies,
      });

      // Get updated allergies
      const updated = await ctx.runQuery(api.queries.allergies.getByUserId, {
        userId: user._id,
      });

      return {
        success: true as const,
        allergies: updated || [],
        message: 'Allergies updated successfully',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update allergies';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Update Cross-Contamination Setting - for mobile app direct Convex communication
 */
export const customerUpdateCrossContaminationSetting = action({
  args: {
    sessionToken: v.string(),
    avoid_cross_contamination: v.boolean(),
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

      // Update cross-contamination setting
      await ctx.runMutation(api.mutations.foodSafetySettings.updateCrossContamination, {
        userId: user._id,
        avoid_cross_contamination: args.avoid_cross_contamination,
      });

      return {
        success: true as const,
        message: 'Cross-contamination setting updated successfully',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update cross-contamination setting';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Data Sharing Preferences - for mobile app direct Convex communication
 */
export const customerGetDataSharingPreferences = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      analytics_enabled: v.boolean(),
      personalization_enabled: v.boolean(),
      marketing_enabled: v.boolean(),
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

      // Get data sharing preferences
      const preferences = await ctx.runQuery(api.queries.dataSharingPreferences.getByUserId, {
        userId: user._id,
      });

      return {
        success: true as const,
        analytics_enabled: preferences.analytics_enabled,
        personalization_enabled: preferences.personalization_enabled,
        marketing_enabled: preferences.marketing_enabled,
        updated_at: preferences.updated_at,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get data sharing preferences';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Update Data Sharing Preferences - for mobile app direct Convex communication
 */
export const customerUpdateDataSharingPreferences = action({
  args: {
    sessionToken: v.string(),
    analytics_enabled: v.optional(v.boolean()),
    personalization_enabled: v.optional(v.boolean()),
    marketing_enabled: v.optional(v.boolean()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      analytics_enabled: v.boolean(),
      personalization_enabled: v.boolean(),
      marketing_enabled: v.boolean(),
      updated_at: v.string(),
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

      // Update data sharing preferences
      await ctx.runMutation(api.mutations.dataSharingPreferences.updateByUserId, {
        userId: user._id,
        analytics_enabled: args.analytics_enabled,
        personalization_enabled: args.personalization_enabled,
        marketing_enabled: args.marketing_enabled,
      });

      // Get updated preferences
      const updated = await ctx.runQuery(api.queries.dataSharingPreferences.getByUserId, {
        userId: user._id,
      });

      return {
        success: true as const,
        analytics_enabled: updated.analytics_enabled,
        personalization_enabled: updated.personalization_enabled,
        marketing_enabled: updated.marketing_enabled,
        updated_at: updated.updated_at,
        message: 'Data sharing preferences updated successfully',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update data sharing preferences';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Treats - for mobile app direct Convex communication
 */
export const customerGetTreats = action({
  args: {
    sessionToken: v.string(),
    type: v.optional(v.union(v.literal('given'), v.literal('received'), v.literal('all'))),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      treats: v.array(v.any()),
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

      const type = args.type || 'all';
      let treats: any[] = [];

      if (type === 'given' || type === 'all') {
        const givenTreats = await ctx.runQuery(api.queries.treats.getTreatsByTreater, {
          treater_id: user._id,
        });
        treats = [...treats, ...givenTreats.map((t: any) => ({ ...t, treat_type: 'given' }))];
      }

      if (type === 'received' || type === 'all') {
        const receivedTreats = await ctx.runQuery(api.queries.treats.getTreatsByRecipient, {
          treated_user_id: user._id,
        });
        treats = [...treats, ...receivedTreats.map((t: any) => ({ ...t, treat_type: 'received' }))];
      }

      // Sort by created_at descending
      treats.sort((a, b) => (b.created_at || 0) - (a.created_at || 0));

      return {
        success: true as const,
        treats,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get treats';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Treat Details - for mobile app direct Convex communication
 */
export const customerGetTreatDetails = action({
  args: {
    sessionToken: v.string(),
    treat_token: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      treat: v.any(),
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

      // Get treat by token (using mutation as it's defined that way)
      const treat = await ctx.runMutation(api.mutations.treats.getTreatByToken, {
        treat_token: args.treat_token,
      });

      if (!treat) {
        return { success: false as const, error: 'Treat not found' };
      }

      return {
        success: true as const,
        treat,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get treat details';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Treat By Token - for mobile app direct Convex communication
 */
export const customerGetTreatByToken = action({
  args: {
    sessionToken: v.string(),
    treat_token: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      treat: v.any(),
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

      // Get treat by token
      const treat = await ctx.runMutation(api.mutations.treats.getTreatByToken, {
        treat_token: args.treat_token,
      });

      if (!treat) {
        return { success: false as const, error: 'Treat not found' };
      }

      return {
        success: true as const,
        treat,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get treat by token';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Create Treat - for mobile app direct Convex communication
 */
export const customerCreateTreat = action({
  args: {
    sessionToken: v.string(),
    treated_user_id: v.optional(v.string()),
    order_id: v.optional(v.string()),
    expires_in_hours: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      treat_id: v.string(),
      treat_token: v.string(),
      expires_at: v.number(),
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

      // Create treat
      const result = await ctx.runMutation(api.mutations.treats.createTreat, {
        treater_id: user._id,
        treated_user_id: args.treated_user_id as Id<'users'> | undefined,
        order_id: args.order_id as Id<'orders'> | undefined,
        expires_in_hours: args.expires_in_hours,
        metadata: args.metadata,
      });

      return {
        success: true as const,
        treat_id: result.treat_id,
        treat_token: result.treat_token,
        expires_at: result.expires_at,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create treat';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Popular Chef Details - for mobile app direct Convex communication
 */
export const customerGetPopularChefDetails = action({
  args: {
    sessionToken: v.optional(v.string()),
    chef_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      chef: v.any(),
      reviews: v.array(v.any()),
      averageRating: v.number(),
      reviewCount: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get chef details
      const chef = await ctx.runQuery(api.queries.chefs.getById, {
        chefId: args.chef_id as Id<'chefs'>,
      });

      if (!chef) {
        return { success: false as const, error: 'Chef not found' };
      }

      // Get reviews for this chef
      const reviews = await ctx.runQuery(api.queries.reviews.getByChef, {
        chef_id: args.chef_id,
      });

      // Calculate average rating
      const reviewCount = reviews.length;
      const averageRating = reviewCount > 0
        ? reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / reviewCount
        : chef.rating || 0;

      // Get favorite status if user is authenticated
      let isFavorited = false;
      if (args.sessionToken) {
        const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
          sessionToken: args.sessionToken,
        });
        if (user) {
          const favoriteStatus = await ctx.runQuery(api.queries.userFavorites.isChefFavorited, {
            userId: user._id,
            chefId: args.chef_id as Id<'chefs'>,
          });
          isFavorited = favoriteStatus.isFavorited;
        }
      }

      return {
        success: true as const,
        chef: {
          ...chef,
          isFavorited,
        },
        reviews,
        averageRating,
        reviewCount,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get popular chef details';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Kitchen Favorite Status - for mobile app direct Convex communication
 */
export const customerGetKitchenFavoriteStatus = action({
  args: {
    sessionToken: v.string(),
    kitchenId: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      isFavorited: v.boolean(),
      favoriteId: v.optional(v.string()),
      chefId: v.optional(v.string()),
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

      // Normalize kitchen ID (validate and convert to Convex ID)
      const kitchenId = await normalizeKitchenId(ctx, args.kitchenId);
      if (!kitchenId) {
        return { success: false as const, error: 'Kitchen not found' };
      }

      // Get kitchen favorite status
      const favoriteStatus = await ctx.runQuery(api.queries.userFavorites.isKitchenFavorited, {
        userId: user._id,
        kitchenId,
      });

      return {
        success: true as const,
        isFavorited: favoriteStatus.isFavorited,
        favoriteId: favoriteStatus.favoriteId,
        chefId: favoriteStatus.chefId,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get kitchen favorite status';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Add Kitchen Favorite - for mobile app direct Convex communication
 */
export const customerAddKitchenFavorite = action({
  args: {
    sessionToken: v.string(),
    kitchenId: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      isFavorited: v.boolean(),
      favoriteId: v.string(),
      chefId: v.string(),
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

      // Normalize kitchen ID (validate and convert to Convex ID)
      const kitchenId = await normalizeKitchenId(ctx, args.kitchenId);
      if (!kitchenId) {
        return { success: false as const, error: 'Kitchen not found' };
      }

      // Get chefId from kitchenId
      const favoriteStatus = await ctx.runQuery(api.queries.userFavorites.isKitchenFavorited, {
        userId: user._id,
        kitchenId,
      });

      if (!favoriteStatus.chefId) {
        return { success: false as const, error: 'Kitchen or chef not found' };
      }

      // Add to favorites
      const favoriteId = await ctx.runMutation(api.mutations.userFavorites.addFavorite, {
        userId: user._id,
        chefId: favoriteStatus.chefId,
      });

      return {
        success: true as const,
        isFavorited: true,
        favoriteId,
        chefId: favoriteStatus.chefId,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to add kitchen favorite';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Remove Kitchen Favorite - for mobile app direct Convex communication
 */
export const customerRemoveKitchenFavorite = action({
  args: {
    sessionToken: v.string(),
    kitchenId: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      isFavorited: v.boolean(),
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

      // Normalize kitchen ID (validate and convert to Convex ID)
      const kitchenId = await normalizeKitchenId(ctx, args.kitchenId);
      if (!kitchenId) {
        return { success: false as const, error: 'Kitchen not found' };
      }

      // Get chefId from kitchenId
      const favoriteStatus = await ctx.runQuery(api.queries.userFavorites.isKitchenFavorited, {
        userId: user._id,
        kitchenId,
      });

      if (!favoriteStatus.chefId) {
        return { success: false as const, error: 'Kitchen or chef not found' };
      }

      // Remove from favorites
      await ctx.runMutation(api.mutations.userFavorites.removeFavorite, {
        userId: user._id,
        chefId: favoriteStatus.chefId,
      });

      return {
        success: true as const,
        isFavorited: false,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to remove kitchen favorite';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Search Chefs By Location - for mobile app direct Convex communication
 */
export const customerSearchChefsByLocation = action({
  args: {
    sessionToken: v.optional(v.string()),
    query: v.optional(v.string()),
    latitude: v.number(),
    longitude: v.number(),
    radius: v.optional(v.number()),
    cuisine: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      chefs: v.array(v.any()),
      total: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // If query is provided, use searchChefsByQuery
      if (args.query) {
        const result = await ctx.runQuery(api.queries.chefs.searchChefsByQuery, {
          query: args.query,
          latitude: args.latitude,
          longitude: args.longitude,
          radiusKm: args.radius || 10,
          cuisine: args.cuisine,
          limit: args.limit || 20,
        });

        return {
          success: true as const,
          chefs: result.chefs || [],
          total: result.total || 0,
        };
      } else {
        // Just get chefs by location
        const result = await ctx.runQuery(api.queries.chefs.getChefsByLocation, {
          latitude: args.latitude,
          longitude: args.longitude,
          radiusKm: args.radius || 10,
          limit: args.limit || 20,
          page: 1,
        });

        return {
          success: true as const,
          chefs: result.chefs || [],
          total: result.total || 0,
        };
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to search chefs by location';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Search - General search across dishes, chefs, kitchens, videos, recipes, stories, and livestreams
 * for mobile app direct Convex communication
 */
export const customerSearch = action({
  args: {
    sessionToken: v.optional(v.string()),
    query: v.string(),
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
    filters: v.optional(v.object({
      cuisine: v.optional(v.string()),
      priceRange: v.optional(v.object({
        min: v.optional(v.number()),
        max: v.optional(v.number()),
      })),
      dietary: v.optional(v.array(v.string())),
    })),
    contentTypes: v.optional(v.array(v.union(
      v.literal("dishes"),
      v.literal("chefs"),
      v.literal("videos"),
      v.literal("recipes"),
      v.literal("stories"),
      v.literal("livestreams")
    ))),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      results: v.object({
        dishes: v.array(v.any()),
        chefs: v.array(v.any()),
        kitchens: v.array(v.any()),
        videos: v.array(v.any()),
        recipes: v.array(v.any()),
        stories: v.array(v.any()),
        livestreams: v.array(v.any()),
        total: v.number(),
      }),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user ID if authenticated
      let userId: Id<'users'> | undefined;
      if (args.sessionToken) {
        const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
          sessionToken: args.sessionToken,
        });
        userId = user?._id;
      }

      // Determine which content types to search (default: all)
      const searchAll = !args.contentTypes || args.contentTypes.length === 0;
      const shouldSearchDishes = searchAll || args.contentTypes.includes("dishes");
      const shouldSearchChefs = searchAll || args.contentTypes.includes("chefs");
      const shouldSearchVideos = searchAll || args.contentTypes.includes("videos");
      const shouldSearchRecipes = searchAll || args.contentTypes.includes("recipes");
      const shouldSearchStories = searchAll || args.contentTypes.includes("stories");
      const shouldSearchLivestreams = searchAll || args.contentTypes.includes("livestreams");

      // Per-type limit to prevent overwhelming response
      const perTypeLimit = Math.floor((args.limit || 20) / 6) || 5; // Distribute limit across types

      // Run searches in parallel for better performance
      const searchPromises: Promise<any>[] = [];

      // Search meals/dishes
      if (shouldSearchDishes) {
        searchPromises.push(
          ctx.runQuery(api.queries.meals.searchMeals, {
            query: args.query,
            userId,
            filters: args.filters,
          }).then(meals => ({ type: 'dishes', data: Array.isArray(meals) ? meals : [] }))
            .catch(() => ({ type: 'dishes', data: [] }))
        );
      } else {
        searchPromises.push(Promise.resolve({ type: 'dishes', data: [] }));
      }

      // Search chefs
      if (shouldSearchChefs) {
        if (args.location) {
          searchPromises.push(
            ctx.runQuery(api.queries.chefs.searchChefsByQuery, {
              query: args.query,
              latitude: args.location.latitude,
              longitude: args.location.longitude,
              radiusKm: 10,
              limit: perTypeLimit,
            }).then(chefResult => ({ type: 'chefs', data: chefResult.chefs || [] }))
              .catch(() => ({ type: 'chefs', data: [] }))
          );
        } else {
          searchPromises.push(
            ctx.runQuery(api.queries.chefs.getAll, {})
              .then((allChefs: any[]) => {
                const queryLower = args.query.toLowerCase();
                const chefs = allChefs
                  .filter((chef: any) =>
                    chef.name?.toLowerCase().includes(queryLower) ||
                    chef.specialties?.some((s: string) => s.toLowerCase().includes(queryLower)) ||
                    chef.bio?.toLowerCase().includes(queryLower)
                  )
                  .slice(0, perTypeLimit);
                return { type: 'chefs', data: chefs };
              })
              .catch(() => ({ type: 'chefs', data: [] }))
          );
        }
      } else {
        searchPromises.push(Promise.resolve({ type: 'chefs', data: [] }));
      }

      // Search videos
      if (shouldSearchVideos) {
        searchPromises.push(
          ctx.runQuery(api.queries.videoPosts.searchVideos, {
            query: args.query,
            limit: perTypeLimit,
          }).then(result => ({ type: 'videos', data: result.videos || [] }))
            .catch(() => ({ type: 'videos', data: [] }))
        );
      } else {
        searchPromises.push(Promise.resolve({ type: 'videos', data: [] }));
      }

      // Search recipes
      if (shouldSearchRecipes) {
        searchPromises.push(
          ctx.runQuery(api.queries.recipes.getRecipes, {
            search: args.query,
            limit: perTypeLimit,
          }).then(result => ({ type: 'recipes', data: result.recipes || [] }))
            .catch(() => ({ type: 'recipes', data: [] }))
        );
      } else {
        searchPromises.push(Promise.resolve({ type: 'recipes', data: [] }));
      }

      // Search stories
      if (shouldSearchStories) {
        searchPromises.push(
          ctx.runQuery(api.queries.blog.getBlogPosts, {
            search: args.query,
            status: "published",
            limit: perTypeLimit,
          }).then(result => ({ type: 'stories', data: Array.isArray(result) ? result : [] }))
            .catch(() => ({ type: 'stories', data: [] }))
        );
      } else {
        searchPromises.push(Promise.resolve({ type: 'stories', data: [] }));
      }

      // Search livestreams (requires authentication)
      if (shouldSearchLivestreams && args.sessionToken) {
        searchPromises.push(
          ctx.runAction(api.actions.noshHeaven.getNoshHeavenFeed, {
            sessionToken: args.sessionToken,
            category: "live",
            limit: perTypeLimit,
            search: args.query,
          }).then(result => {
            if (result.success) {
              return { type: 'livestreams', data: result.items || [] };
            }
            return { type: 'livestreams', data: [] };
          })
            .catch(() => ({ type: 'livestreams', data: [] }))
        );
      } else {
        searchPromises.push(Promise.resolve({ type: 'livestreams', data: [] }));
      }

      // Wait for all searches to complete
      const results = await Promise.all(searchPromises);

      // Extract results by type
      const dishes = results.find(r => r.type === 'dishes')?.data || [];
      const chefs = results.find(r => r.type === 'chefs')?.data || [];
      const videos = results.find(r => r.type === 'videos')?.data || [];
      const recipes = results.find(r => r.type === 'recipes')?.data || [];
      const stories = results.find(r => r.type === 'stories')?.data || [];
      const livestreams = results.find(r => r.type === 'livestreams')?.data || [];

      // For now, kitchens are represented by chefs, so we can return empty or derive from chefs
      const kitchens: any[] = [];

      const total = dishes.length + chefs.length + kitchens.length + videos.length + recipes.length + stories.length + livestreams.length;

      return {
        success: true as const,
        results: {
          dishes: dishes.slice(0, perTypeLimit),
          chefs: chefs.slice(0, perTypeLimit),
          kitchens,
          videos: videos.slice(0, perTypeLimit),
          recipes: recipes.slice(0, perTypeLimit),
          stories: stories.slice(0, perTypeLimit),
          livestreams: livestreams.slice(0, perTypeLimit),
          total,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to search';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Search Chefs - for mobile app direct Convex communication
 * Delegates to chefs.ts action
 */
export const customerSearchChefs = action({
  args: {
    sessionToken: v.string(),
    query: v.string(),
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      chefs: v.array(v.any()),
      total: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Delegate to chefs action
      const result = await ctx.runAction(api.actions.chefs.customerSearchChefs, {
        sessionToken: args.sessionToken,
        q: args.query,
        latitude: args.location?.latitude,
        longitude: args.location?.longitude,
        limit: args.limit,
      });

      return result;
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to search chefs';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Search Suggestions - for mobile app direct Convex communication
 */
export const customerGetSearchSuggestions = action({
  args: {
    sessionToken: v.optional(v.string()),
    query: v.string(),
    location: v.optional(v.string()),
    limit: v.optional(v.number()),
    category: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      suggestions: v.array(v.object({
        text: v.string(),
        type: v.string(),
        id: v.optional(v.string()),
      })),
      metadata: v.optional(v.any()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user ID if authenticated
      let userId: Id<'users'> | undefined;
      if (args.sessionToken) {
        const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
          sessionToken: args.sessionToken,
        });
        userId = user?._id;
      }

      // Get search suggestions from meals
      const mealSuggestions = await ctx.runQuery(api.queries.meals.getSearchSuggestions, {
        query: args.query,
        userId,
      });

      // Transform to suggestion format
      const suggestions = mealSuggestions.map((text: string) => ({
        text,
        type: 'meal',
      }));

      // Limit results
      const limited = suggestions.slice(0, args.limit || 10);

      return {
        success: true as const,
        suggestions: limited,
        metadata: {
          total: suggestions.length,
          category: args.category,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get search suggestions';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Connections - for mobile app direct Convex communication
 */
export const customerGetConnections = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      connections: v.array(v.any()),
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

      // Get all user connections (aggregated from all sources)
      const connections = await ctx.runQuery(api.queries.userConnections.getAllUserConnections, {
        user_id: user._id,
      });

      return {
        success: true as const,
        connections: connections || [],
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get connections';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Create Connection - for mobile app direct Convex communication
 */
export const customerCreateConnection = action({
  args: {
    sessionToken: v.string(),
    connected_user_id: v.string(),
    connection_type: v.union(v.literal('colleague'), v.literal('friend')),
    company: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      connection: v.any(),
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

      // Create connection
      await ctx.runMutation(api.mutations.userConnections.createConnection, {
        user_id: user._id,
        connected_user_id: args.connected_user_id as Id<'users'>,
        connection_type: args.connection_type,
        company: args.company,
      });

      // Get the created connection to return
      const connections = await ctx.runQuery(api.queries.userConnections.getConnectionsByUser, {
        user_id: user._id,
      });

      const connection = connections.find((c: any) => 
        c.connected_user_id === args.connected_user_id
      );

      return {
        success: true as const,
        connection: connection || { success: true },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create connection';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Create Group Order - for mobile app direct Convex communication
 */
export const customerCreateGroupOrder = action({
  args: {
    sessionToken: v.string(),
    chef_id: v.string(),
    restaurant_name: v.string(),
    initial_budget: v.number(),
    title: v.optional(v.string()),
    delivery_address: v.optional(v.object({
      street: v.string(),
      city: v.string(),
      postcode: v.string(),
      country: v.string(),
    })),
    delivery_time: v.optional(v.string()),
    expires_in_hours: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      group_order_id: v.string(),
      share_token: v.string(),
      share_link: v.string(),
      expires_at: v.number(),
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

      // Create group order
      const result = await ctx.runMutation(api.mutations.groupOrders.create, {
        created_by: user._id,
        chef_id: args.chef_id as Id<'chefs'>,
        restaurant_name: args.restaurant_name,
        initial_budget: args.initial_budget,
        title: args.title,
        delivery_address: args.delivery_address,
        delivery_time: args.delivery_time,
        expires_in_hours: args.expires_in_hours,
      });

      return {
        success: true as const,
        group_order_id: result.group_order_id,
        share_token: result.share_token,
        share_link: result.share_link,
        expires_at: result.expires_at,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create group order';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Group Order - for mobile app direct Convex communication
 */
export const customerGetGroupOrder = action({
  args: {
    sessionToken: v.string(),
    group_order_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      group_order: v.any(),
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

      // Get group order
      const groupOrder = await ctx.runQuery(api.queries.groupOrders.getById, {
        group_order_id: args.group_order_id,
      });

      if (!groupOrder) {
        return { success: false as const, error: 'Group order not found' };
      }

      // Check if user is creator or participant
      const isCreator = groupOrder.created_by === user._id;
      const isParticipant = groupOrder.participants.some((p: any) => p.user_id === user._id);

      if (!isCreator && !isParticipant) {
        return { success: false as const, error: 'Access denied. You are not part of this group order.' };
      }

      return {
        success: true as const,
        group_order: groupOrder,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get group order';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Join Group Order - for mobile app direct Convex communication
 */
export const customerJoinGroupOrder = action({
  args: {
    sessionToken: v.string(),
    group_order_id: v.optional(v.string()),
    share_token: v.optional(v.string()),
    order_items: v.optional(v.array(v.object({
      dish_id: v.string(),
      name: v.string(),
      quantity: v.number(),
      price: v.number(),
      special_instructions: v.optional(v.string()),
    }))),
    initial_budget_contribution: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      participant: v.any(),
      group_order: v.any(),
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

      // Get group order by ID or share token
      let groupOrder: any = null;
      let groupOrderId: Id<'group_orders'> | null = null;

      if (args.group_order_id) {
        groupOrder = await ctx.runQuery(api.queries.groupOrders.getById, {
          group_order_id: args.group_order_id,
        });
        if (groupOrder) {
          groupOrderId = groupOrder._id;
        }
      } else if (args.share_token) {
        groupOrder = await ctx.runQuery(api.queries.groupOrders.getByShareToken, {
          share_token: args.share_token,
        });
        if (groupOrder) {
          groupOrderId = groupOrder._id;
        }
      }

      if (!groupOrder || !groupOrderId) {
        return { success: false as const, error: 'Group order not found' };
      }

      // Transform order items to use Id types
      const orderItems = (args.order_items || []).map((item: any) => ({
        dish_id: item.dish_id as Id<'meals'>,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        special_instructions: item.special_instructions,
      }));

      // Join group order
      const result = await ctx.runMutation(api.mutations.groupOrders.join, {
        group_order_id: groupOrderId,
        user_id: user._id,
        order_items: orderItems,
        initial_budget_contribution: args.initial_budget_contribution,
      });

      return {
        success: true as const,
        participant: result.participant,
        group_order: result.group_order,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to join group order';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Close Group Order - for mobile app direct Convex communication
 */
export const customerCloseGroupOrder = action({
  args: {
    sessionToken: v.string(),
    group_order_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      main_order_id: v.string(),
      order_id: v.string(),
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

      // Get group order to get the document ID
      const groupOrder = await ctx.runQuery(api.queries.groupOrders.getById, {
        group_order_id: args.group_order_id,
      });

      if (!groupOrder) {
        return { success: false as const, error: 'Group order not found' };
      }

      // Close group order
      const result = await ctx.runMutation(api.mutations.groupOrders.close, {
        group_order_id: groupOrder._id,
        closed_by: user._id,
      });

      return {
        success: true as const,
        main_order_id: result.main_order_id,
        order_id: result.order_id,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to close group order';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Start Selection Phase - for mobile app direct Convex communication
 */
export const customerStartSelectionPhase = action({
  args: {
    sessionToken: v.string(),
    group_order_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      selection_phase: v.string(),
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

      // Get group order to get the document ID
      const groupOrder = await ctx.runQuery(api.queries.groupOrders.getById, {
        group_order_id: args.group_order_id,
      });

      if (!groupOrder) {
        return { success: false as const, error: 'Group order not found' };
      }

      // Start selection phase
      const result = await ctx.runMutation(api.mutations.groupOrders.startSelectionPhase, {
        group_order_id: groupOrder._id,
        user_id: user._id,
      });

      return {
        success: true as const,
        selection_phase: result.selection_phase,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to start selection phase';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Participant Selections - for mobile app direct Convex communication
 */
export const customerGetParticipantSelections = action({
  args: {
    sessionToken: v.string(),
    group_order_id: v.string(),
    participant_user_id: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      selections: v.array(v.any()),
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

      // Get participant selections
      const selections = await ctx.runQuery(api.queries.groupOrders.getParticipantSelections, {
        group_order_id: args.group_order_id,
        participant_user_id: args.participant_user_id as Id<'users'> | undefined,
      });

      if (!selections) {
        return { success: false as const, error: 'Group order or participant not found' };
      }

      // Return as array if single selection, or array if multiple
      const selectionsArray = Array.isArray(selections) ? selections : [selections];

      return {
        success: true as const,
        selections: selectionsArray,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get participant selections';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Update Participant Selections - for mobile app direct Convex communication
 */
export const customerUpdateParticipantSelections = action({
  args: {
    sessionToken: v.string(),
    group_order_id: v.string(),
    order_items: v.array(v.object({
      dish_id: v.string(),
      name: v.string(),
      quantity: v.number(),
      price: v.number(),
      special_instructions: v.optional(v.string()),
    })),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      total_contribution: v.number(),
      total_amount: v.number(),
      final_amount: v.number(),
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

      // Get group order to get the document ID
      const groupOrder = await ctx.runQuery(api.queries.groupOrders.getById, {
        group_order_id: args.group_order_id,
      });

      if (!groupOrder) {
        return { success: false as const, error: 'Group order not found' };
      }

      // Transform order items to use Id types
      const orderItems = args.order_items.map((item: any) => ({
        dish_id: item.dish_id as Id<'meals'>,
        name: item.name,
        quantity: item.quantity,
        price: item.price,
        special_instructions: item.special_instructions,
      }));

      // Update participant selections
      const result = await ctx.runMutation(api.mutations.groupOrders.updateParticipantSelections, {
        group_order_id: groupOrder._id,
        user_id: user._id,
        order_items: orderItems,
      });

      return {
        success: true as const,
        total_contribution: result.total_contribution,
        total_amount: result.total_amount,
        final_amount: result.final_amount,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update participant selections';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Mark Selections Ready - for mobile app direct Convex communication
 */
export const customerMarkSelectionsReady = action({
  args: {
    sessionToken: v.string(),
    group_order_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      all_ready: v.boolean(),
      selection_phase: v.string(),
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

      // Get group order to get the document ID
      const groupOrder = await ctx.runQuery(api.queries.groupOrders.getById, {
        group_order_id: args.group_order_id,
      });

      if (!groupOrder) {
        return { success: false as const, error: 'Group order not found' };
      }

      // Mark selections ready
      const result = await ctx.runMutation(api.mutations.groupOrders.markSelectionsReady, {
        group_order_id: groupOrder._id,
        user_id: user._id,
      });

      return {
        success: true as const,
        all_ready: result.all_ready,
        selection_phase: result.selection_phase,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to mark selections as ready';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Group Order Status - for mobile app direct Convex communication
 */
export const customerGetGroupOrderStatus = action({
  args: {
    sessionToken: v.string(),
    group_order_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      status: v.any(),
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

      // Get group order status
      const status = await ctx.runQuery(api.queries.groupOrders.getGroupOrderStatus, {
        group_order_id: args.group_order_id,
      });

      if (!status) {
        return { success: false as const, error: 'Group order not found' };
      }

      return {
        success: true as const,
        status,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get group order status';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Budget Details - for mobile app direct Convex communication
 */
export const customerGetBudgetDetails = action({
  args: {
    sessionToken: v.string(),
    group_order_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      budget: v.any(),
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

      // Get budget details
      const budget = await ctx.runQuery(api.queries.groupOrders.getBudgetContributions, {
        group_order_id: args.group_order_id,
      });

      if (!budget) {
        return { success: false as const, error: 'Group order not found' };
      }

      return {
        success: true as const,
        budget,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get budget details';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Chip In To Budget - for mobile app direct Convex communication
 */
export const customerChipInToBudget = action({
  args: {
    sessionToken: v.string(),
    group_order_id: v.string(),
    amount: v.number(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      budget_contribution: v.number(),
      total_budget: v.number(),
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

      // Get group order to get the document ID
      const groupOrder = await ctx.runQuery(api.queries.groupOrders.getById, {
        group_order_id: args.group_order_id,
      });

      if (!groupOrder) {
        return { success: false as const, error: 'Group order not found' };
      }

      // Chip in to budget
      const result = await ctx.runMutation(api.mutations.groupOrders.chipInToBudget, {
        group_order_id: groupOrder._id,
        user_id: user._id,
        amount: args.amount,
      });

      return {
        success: true as const,
        budget_contribution: result.budget_contribution,
        total_budget: result.total_budget,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to chip in to budget';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Family Profile - for mobile app direct Convex communication
 */
export const customerGetFamilyProfile = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      family_profile_id: v.string(),
      parent_user_id: v.string(),
      member_user_ids: v.array(v.string()),
      family_members: v.array(v.any()),
      settings: v.any(),
      created_at: v.number(),
      updated_at: v.number(),
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

      // Get family profile
      const profile = await ctx.runQuery(api.queries.familyProfiles.getByUserId, {
        userId: user._id,
      });

      if (!profile) {
        return { success: false as const, error: 'Family profile not found' };
      }

      return {
        success: true as const,
        family_profile_id: profile._id,
        parent_user_id: profile.parent_user_id,
        member_user_ids: profile.member_user_ids.map((id: Id<'users'>) => id),
        family_members: profile.family_members,
        settings: profile.settings,
        created_at: profile.created_at,
        updated_at: profile.updated_at || profile.created_at,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get family profile';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Setup Family Profile - for mobile app direct Convex communication
 */
export const customerSetupFamilyProfile = action({
  args: {
    sessionToken: v.string(),
    family_members: v.optional(v.array(v.object({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      relationship: v.string(),
      budget_settings: v.optional(v.object({
        daily_limit: v.optional(v.number()),
        weekly_limit: v.optional(v.number()),
        monthly_limit: v.optional(v.number()),
        currency: v.optional(v.string()),
      })),
    }))),
    settings: v.optional(v.object({
      shared_payment_methods: v.boolean(),
      shared_orders: v.boolean(),
      allow_child_ordering: v.boolean(),
      require_approval_for_orders: v.boolean(),
      spending_notifications: v.boolean(),
    })),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      family_profile_id: v.string(),
      parent_user_id: v.string(),
      member_user_ids: v.array(v.string()),
      family_members: v.array(v.any()),
      settings: v.any(),
      created_at: v.number(),
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

      // Create family profile
      const profileId = await ctx.runMutation(api.mutations.familyProfiles.create, {
        userId: user._id,
        family_members: args.family_members,
        settings: args.settings,
      });

      // Get the created profile
      const profile = await ctx.db.get(profileId);

      if (!profile) {
        return { success: false as const, error: 'Failed to create family profile' };
      }

      return {
        success: true as const,
        family_profile_id: profile._id,
        parent_user_id: profile.parent_user_id,
        member_user_ids: profile.member_user_ids.map((id: Id<'users'>) => id),
        family_members: profile.family_members,
        settings: profile.settings,
        created_at: profile.created_at,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to setup family profile';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Validate Family Member Email - for mobile app direct Convex communication
 */
export const customerValidateFamilyMemberEmail = action({
  args: {
    sessionToken: v.string(),
    email: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      exists: v.boolean(),
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

      // Check if email belongs to an existing user
      const existingUser = await ctx.runQuery(api.queries.users.getByEmail, {
        email: args.email.toLowerCase().trim(),
      });

      return {
        success: true as const,
        exists: !!existingUser,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to validate email';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Family Members - for mobile app direct Convex communication
 */
export const customerGetFamilyMembers = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      members: v.array(v.any()),
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

      // Get family profile
      const profile = await ctx.runQuery(api.queries.familyProfiles.getByUserId, {
        userId: user._id,
      });

      if (!profile) {
        return { success: false as const, error: 'Family profile not found' };
      }

      return {
        success: true as const,
        members: profile.family_members || [],
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get family members';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Invite Family Member - for mobile app direct Convex communication
 */
export const customerInviteFamilyMember = action({
  args: {
    sessionToken: v.string(),
    member: v.object({
      name: v.string(),
      email: v.string(),
      phone: v.optional(v.string()),
      relationship: v.string(),
      budget_settings: v.optional(v.object({
        daily_limit: v.optional(v.number()),
        weekly_limit: v.optional(v.number()),
        monthly_limit: v.optional(v.number()),
        currency: v.optional(v.string()),
      })),
    }),
    family_profile_id: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      member_id: v.string(),
      invitation_token: v.string(),
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

      // Get family profile
      let profile = await ctx.runQuery(api.queries.familyProfiles.getByUserId, {
        userId: user._id,
      });

      if (args.family_profile_id && profile?._id !== args.family_profile_id) {
        profile = await ctx.db.get(args.family_profile_id as Id<'familyProfiles'>);
      }

      if (!profile) {
        return { success: false as const, error: 'Family profile not found' };
      }

      // Invite member
      const result = await ctx.runMutation(api.mutations.familyProfiles.inviteMember, {
        family_profile_id: profile._id,
        userId: user._id,
        member: args.member,
      });

      return {
        success: true as const,
        member_id: result.member_id,
        invitation_token: result.invitation_token,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to invite family member';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Update Member Budget - for mobile app direct Convex communication
 */
export const customerUpdateMemberBudget = action({
  args: {
    sessionToken: v.string(),
    member_id: v.string(),
    budget_settings: v.object({
      daily_limit: v.optional(v.number()),
      weekly_limit: v.optional(v.number()),
      monthly_limit: v.optional(v.number()),
      currency: v.optional(v.string()),
    }),
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

      // Get family profile for user
      const familyProfile = await ctx.runQuery(api.queries.familyProfiles.getByUserId, {
        userId: user._id,
        sessionToken: args.sessionToken,
      });

      if (!familyProfile) {
        return { success: false as const, error: 'Family profile not found' };
      }

      // Update member budget via mutation
      await ctx.runMutation(api.mutations.familyProfiles.updateMemberBudget, {
        family_profile_id: familyProfile._id,
        member_id: args.member_id,
        userId: user._id,
        budget_settings: args.budget_settings,
      });

      return {
        success: true as const,
        message: 'Member budget updated successfully',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update member budget';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Update Member Preferences - for mobile app direct Convex communication
 */
export const customerUpdateMemberPreferences = action({
  args: {
    sessionToken: v.string(),
    member_id: v.string(),
    allergy_ids: v.optional(v.array(v.id('allergies'))),
    dietary_preference_id: v.optional(v.id('dietaryPreferences')),
    parent_controlled: v.optional(v.boolean()),
    allergies: v.optional(v.array(v.object({
      name: v.string(),
      type: v.union(v.literal('allergy'), v.literal('intolerance')),
      severity: v.union(v.literal('mild'), v.literal('moderate'), v.literal('severe')),
    }))),
    dietary_preferences: v.optional(v.object({
      preferences: v.array(v.string()),
      religious_requirements: v.array(v.string()),
      health_driven: v.array(v.string()),
    })),
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

      // Get family profile for user
      const familyProfile = await ctx.runQuery(api.queries.familyProfiles.getByUserId, {
        userId: user._id,
        sessionToken: args.sessionToken,
      });

      if (!familyProfile) {
        return { success: false as const, error: 'Family profile not found' };
      }

      // Update member preferences via mutation
      await ctx.runMutation(api.mutations.familyProfiles.updateMemberPreferences, {
        family_profile_id: familyProfile._id,
        member_id: args.member_id,
        userId: user._id,
        allergy_ids: args.allergy_ids,
        dietary_preference_id: args.dietary_preference_id,
        parent_controlled: args.parent_controlled,
        allergies: args.allergies,
        dietary_preferences: args.dietary_preferences,
      });

      return {
        success: true as const,
        message: 'Member preferences updated successfully',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to update member preferences';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Accept Family Invite - for mobile app direct Convex communication
 */
export const customerAcceptFamilyInvite = action({
  args: {
    sessionToken: v.string(),
    invitation_token: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      family_profile_id: v.string(),
      member_id: v.string(),
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

      // Accept invitation
      const result = await ctx.runMutation(api.mutations.familyProfiles.acceptInvitation, {
        invitation_token: args.invitation_token,
        user_id: user._id,
      });

      return {
        success: true as const,
        family_profile_id: result.family_profile_id,
        member_id: result.member_id,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to accept invitation';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Remove Family Member - for mobile app direct Convex communication
 */
export const customerRemoveFamilyMember = action({
  args: {
    sessionToken: v.string(),
    member_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
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

      // Get family profile
      const profile = await ctx.runQuery(api.queries.familyProfiles.getByUserId, {
        userId: user._id,
      });

      if (!profile) {
        return { success: false as const, error: 'Family profile not found' };
      }

      // Remove member
      await ctx.runMutation(api.mutations.familyProfiles.removeMember, {
        family_profile_id: profile._id,
        userId: user._id,
        member_id: args.member_id,
      });

      return {
        success: true as const,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to remove family member';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Family Orders - for mobile app direct Convex communication
 */
export const customerGetFamilyOrders = action({
  args: {
    sessionToken: v.string(),
    member_user_id: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      orders: v.array(v.any()),
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

      // Get family profile
      const profile = await ctx.runQuery(api.queries.familyProfiles.getByUserId, {
        userId: user._id,
      });

      if (!profile) {
        return { success: false as const, error: 'Family profile not found' };
      }

      // Get family orders
      const orders = await ctx.runQuery(api.queries.familyProfiles.getFamilyOrders, {
        family_profile_id: profile._id,
        member_user_id: args.member_user_id as Id<'users'> | undefined,
        limit: args.limit,
      });

      return {
        success: true as const,
        orders: orders || [],
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get family orders';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Create Event Chef Request - for mobile app direct Convex communication
 */
export const customerCreateEventChefRequest = action({
  args: {
    sessionToken: v.string(),
    event_date: v.string(),
    number_of_guests: v.number(),
    event_type: v.string(),
    event_location: v.string(),
    phone_number: v.string(),
    email: v.string(),
    dietary_requirements: v.optional(v.string()),
    additional_notes: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      request_id: v.string(),
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

      // Create event chef request
      const requestId = await ctx.runMutation(api.mutations.eventChefRequests.create, {
        customer_id: user._id,
        event_date: args.event_date,
        number_of_guests: args.number_of_guests,
        event_type: args.event_type,
        event_location: args.event_location,
        phone_number: args.phone_number,
        email: args.email,
        dietary_requirements: args.dietary_requirements,
        additional_notes: args.additional_notes,
        status: 'pending' as const,
      });

      return {
        success: true as const,
        request_id: requestId,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create event chef request';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Family Spending - for mobile app direct Convex communication
 */
export const customerGetFamilySpending = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      members: v.array(v.any()),
      total_spending: v.number(),
      currency: v.string(),
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

      // Get family profile
      const profile = await ctx.runQuery(api.queries.familyProfiles.getByUserId, {
        userId: user._id,
      });

      if (!profile) {
        return { success: false as const, error: 'Family profile not found' };
      }

      // Get all family orders
      const orders = await ctx.runQuery(api.queries.familyProfiles.getFamilyOrders, {
        family_profile_id: profile._id,
      });

      // Calculate spending per member
      const memberSpending: Record<string, { user_id: string; name: string; spending: number }> = {};
      let totalSpending = 0;
      const currency = 'gbp'; // Default currency

      // Initialize member spending
      for (const member of profile.family_members) {
        if (member.user_id) {
          memberSpending[member.user_id] = {
            user_id: member.user_id,
            name: member.name,
            spending: 0,
          };
        }
      }

      // Calculate spending from orders
      for (const order of orders) {
        const orderAny = order as any;
        const userId = orderAny.userId || orderAny.user_id || orderAny.customer_id;
        const amount = orderAny.total_amount || orderAny.totalAmount || 0;

        if (userId && memberSpending[userId]) {
          memberSpending[userId].spending += amount;
          totalSpending += amount;
        }
      }

      const members = Object.values(memberSpending);

      return {
        success: true as const,
        members,
        total_spending: totalSpending,
        currency,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get family spending';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Request Account Data Download - for mobile app direct Convex communication
 */
export const customerRequestAccountDataDownload = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      download_token: v.string(),
      download_url: v.optional(v.string()),
      status: v.string(),
      estimated_completion_time: v.optional(v.number()),
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

      // Generate download token
      const downloadToken = `dd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const expiresAt = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days

      // Create download request
      const downloadId = await ctx.runMutation(api.mutations.dataDownloads.create, {
        userId: user._id,
        download_token: downloadToken,
        expires_at: expiresAt,
      });

      // Get the created download record
      const downloadRecord = await ctx.db.get(downloadId);

      if (!downloadRecord) {
        return { success: false as const, error: 'Failed to create download request' };
      }

      // Trigger data compilation in background (async)
      // Note: In production, this would be handled by a scheduled function or webhook
      // For now, we'll return the token and let the backend process it
      ctx.scheduler.runAfter(0, api.actions.data_compilation.compileUserDataAction, {
        userId: user._id,
        downloadToken,
      });

      return {
        success: true as const,
        download_token: downloadRecord.download_token,
        download_url: downloadRecord.download_url,
        status: downloadRecord.status,
        estimated_completion_time: downloadRecord.estimated_completion_time,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to request account data download';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Submit Delete Account Feedback - for mobile app direct Convex communication
 */
export const customerSubmitDeleteAccountFeedback = action({
  args: {
    sessionToken: v.string(),
    feedback_options: v.array(v.number()),
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

      // Update feedback
      await ctx.runMutation(api.mutations.accountDeletions.updateFeedback, {
        userId: user._id,
        feedback_options: args.feedback_options,
      });

      return {
        success: true as const,
        message: 'Feedback submitted successfully',
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to submit feedback';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Request Account Deletion - for mobile app direct Convex communication
 */
export const customerRequestAccountDeletion = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      deletion_id: v.string(),
      deletion_will_complete_at: v.number(),
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

      // Set deletion to complete in 30 days (GDPR requirement)
      const deletionWillCompleteAt = Date.now() + (30 * 24 * 60 * 60 * 1000);

      // Create account deletion request
      const deletionId = await ctx.runMutation(api.mutations.accountDeletions.create, {
        userId: user._id,
        deletion_will_complete_at: deletionWillCompleteAt,
      });

      return {
        success: true as const,
        deletion_id: deletionId,
        deletion_will_complete_at: deletionWillCompleteAt,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to request account deletion';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Convex Video Upload URL - for mobile app direct Convex communication
 */
export const customerGetConvexVideoUploadUrl = action({
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

      // Check if user is a chef or food creator
      const isChef = user.roles?.includes('chef') || user.roles?.includes('staff') || user.roles?.includes('admin');
      if (!isChef) {
        return { success: false as const, error: 'Only chefs and food creators can upload videos' };
      }

      // Generate upload URL directly (actions have access to storage)
      const uploadUrl = await ctx.storage.generateUploadUrl();

      return {
        success: true as const,
        uploadUrl,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get upload URL';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Create Video Post - for mobile app direct Convex communication
 */
export const customerCreateVideoPost = action({
  args: {
    sessionToken: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    videoStorageId: v.string(),
    thumbnailStorageId: v.optional(v.string()),
    kitchenId: v.optional(v.string()),
    duration: v.number(),
    fileSize: v.number(),
    resolution: v.object({
      width: v.number(),
      height: v.number(),
    }),
    tags: v.array(v.string()),
    cuisine: v.optional(v.string()),
    difficulty: v.optional(v.union(
      v.literal("beginner"),
      v.literal("intermediate"),
      v.literal("advanced")
    )),
    visibility: v.optional(v.union(
      v.literal("public"),
      v.literal("followers"),
      v.literal("private")
    )),
    isLive: v.optional(v.boolean()),
    liveSessionId: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      videoId: v.string(),
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

      // Check if user is a chef or food creator
      const isChef = user.roles?.includes('chef') || user.roles?.includes('staff') || user.roles?.includes('admin');
      if (!isChef) {
        return { success: false as const, error: 'Only chefs and food creators can create video posts' };
      }

      // Create video post using userId-based mutation
      const videoId = await ctx.runMutation(api.mutations.videoPosts.createVideoPostByUserId, {
        userId: user._id,
        title: args.title,
        description: args.description,
        videoStorageId: args.videoStorageId as Id<"_storage">,
        thumbnailStorageId: args.thumbnailStorageId ? (args.thumbnailStorageId as Id<"_storage">) : undefined,
        kitchenId: args.kitchenId ? (args.kitchenId as Id<"kitchens">) : undefined,
        duration: args.duration,
        fileSize: args.fileSize,
        resolution: args.resolution,
        tags: args.tags,
        cuisine: args.cuisine,
        difficulty: args.difficulty,
        visibility: args.visibility,
        isLive: args.isLive,
        liveSessionId: args.liveSessionId ? (args.liveSessionId as Id<"liveSessions">) : undefined,
      });

      return {
        success: true as const,
        videoId: videoId,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to create video post';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Send AI Chat Message - for mobile app direct Convex communication
 */
export const customerSendAIChatMessage = action({
  args: {
    sessionToken: v.string(),
    message: v.string(),
    conversation_id: v.optional(v.string()),
    location: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
    preferences: v.optional(v.object({
      dietaryRestrictions: v.optional(v.array(v.string())),
      cuisinePreferences: v.optional(v.array(v.string())),
      spiceLevel: v.optional(v.string()),
    })),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      data: v.object({
        message: v.string(),
        recommendations: v.optional(v.array(v.any())),
        conversation_id: v.string(),
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

      // Get or create channel
      let channelId: any;
      if (args.conversation_id) {
        // Try to get existing channel
        const channel = await ctx.runQuery(api.queries.aiChat.getChannelById, {
          channelId: args.conversation_id as any,
        });
        if (channel) {
          channelId = channel._id;
        } else {
          // Create new channel if not found
          const newChannel = await ctx.runMutation(api.mutations.aiChat.createChannel, {
            name: `Chat with ${user.name || 'User'}`,
            createdBy: user._id,
          });
          channelId = newChannel.channelId;
        }
      } else {
        // Create new channel
        const newChannel = await ctx.runMutation(api.mutations.aiChat.createChannel, {
          name: `Chat with ${user.name || 'User'}`,
          createdBy: user._id,
        });
        channelId = newChannel.channelId;
      }

      // Generate embedding for the user message to enable vector search
      let queryEmbedding: number[] | undefined;
      let mealRecommendations: any[] = [];
      
      try {
        // Generate embedding for semantic meal search
        const embeddingResult = await ctx.runAction(api.actions.generateEmbeddings.generateQueryEmbedding, {
          query: args.message.trim(),
        });
        queryEmbedding = embeddingResult.embedding;

        // Perform vector search for meal recommendations
        if (queryEmbedding && queryEmbedding.length > 0) {
          const vectorSearchResults = await ctx.runQuery(api.queries.mealRecommendations.searchMealsByVector, {
            queryEmbedding,
            limit: 5,
            userId: user._id,
          });
          mealRecommendations = vectorSearchResults || [];
        }
      } catch (error: any) {
        // Check if it's a quota/rate limit error
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          // Return user-friendly message for quota errors
          return {
            success: false as const,
            error: 'CribNosh AI is temporarily unavailable. Please try again later.',
          };
        }
        // If vector search fails for other reasons, continue without it
        console.error('Vector search error:', error);
      }

      // Send message
      let messageResult: any;
      try {
        messageResult = await ctx.runMutation(api.mutations.aiChat.sendMessage, {
          channelId,
          authorId: user._id,
          content: args.message.trim(),
        });
      } catch (error: any) {
        // Check if it's a quota/rate limit error
        const errorMessage = error?.message || String(error);
        if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
          return {
            success: false as const,
            error: 'CribNosh AI is temporarily unavailable. Please try again later.',
          };
        }
        // Re-throw other errors to be caught by outer catch
        throw error;
      }

      // Wait a bit for AI response to be generated (it's scheduled)
      // Poll for the AI response with timeout
      let aiMessage: any = null;
      const maxWaitTime = 10000; // 10 seconds
      const pollInterval = 500; // 500ms
      const startTime = Date.now();

      while (!aiMessage && (Date.now() - startTime) < maxWaitTime) {
        await new Promise(resolve => setTimeout(resolve, pollInterval));
        
        const messages = await ctx.runQuery(api.queries.aiChat.getMessagesByChannel, {
          channelId,
          limit: 10,
        });

        // Find the latest AI message
        const latestAiMessage = messages
          .filter((m: any) => m.messageType === 'ai' || m.messageType === 'assistant')
          .sort((a: any, b: any) => b.createdAt - a.createdAt)[0];

        if (latestAiMessage && latestAiMessage.createdAt > messageResult.messageId) {
          aiMessage = latestAiMessage;
          break;
        }
      }

      // If no AI message found, use meal recommendations as fallback
      if (!aiMessage && mealRecommendations.length > 0) {
        aiMessage = {
          content: `I found ${mealRecommendations.length} meal(s) that might interest you based on your message.`,
        };
      }

      return {
        success: true as const,
        data: {
          message: aiMessage?.content || 'I received your message. Let me help you find the perfect meal!',
          recommendations: mealRecommendations.length > 0 ? mealRecommendations : [],
          conversation_id: channelId,
        },
      };
    } catch (error: any) {
      // Check if it's a quota/rate limit error
      const errorMessage = error?.message || String(error);
      if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('rate limit')) {
        return {
          success: false as const,
          error: 'CribNosh AI is temporarily unavailable. Please try again later.',
        };
      }
      
      // For other errors, return generic message
      console.error('AI chat error:', error);
      return {
        success: false as const,
        error: 'Failed to send chat message. Please try again.',
      };
    }
  },
});

// Add any other business logic actions here as needed 
