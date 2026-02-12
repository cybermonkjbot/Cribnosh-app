// @ts-nocheck
import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import { internalMutation, mutation } from "../_generated/server";
import { isAdmin, isStaff, requireAuth, requireStaff } from '../utils/auth';

export const createFoodCreator = mutation(
  async (
    ctx,
    args: {
      userId: Id<'users'>;
      name?: string;
      cuisine?: string[];
      location: { lat: number; lng: number; city?: string };
      rating?: number;
      image?: string;
      bio?: string;
      specialties?: string[];
      status?: 'active' | 'inactive' | 'suspended';
      sessionToken?: string;
    }
  ) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Users can only create foodCreator profiles for themselves
    if (!isAdmin(user) && !isStaff(user) && args.userId !== user._id) {
      throw new Error('Access denied');
    }

    // Map old args to schema
    if (!args.userId) throw new Error('userId is required');
    const bio = args.bio || '';
    const specialties = args.specialties || args.cuisine || [];
    const rating = typeof args.rating === 'number' ? args.rating : 0;
    const status = args.status || 'active';
    const city = args.location.city || '';
    const coordinates = [args.location.lat, args.location.lng];
    const foodCreatorDoc: any = {
      userId: args.userId,
      name: args.name || '',
      bio,
      specialties,
      rating,
      status,
      location: { city, coordinates },
    };

    // Add profile image if provided
    if (args.image) {
      foodCreatorDoc.profileImage = args.image;
    }
    const id = await ctx.db.insert("chefs", foodCreatorDoc);

    // Add 'foodCreator' role to user if they don't have it
    // This allows existing customers to become foodCreators
    const currentUser = await ctx.db.get(args.userId);
    if (currentUser) {
      const userRoles = currentUser.roles || [];
      if (!userRoles.includes('chef')) {
        await ctx.db.patch(args.userId, {
          roles: [...userRoles, 'chef'],
          lastModified: Date.now(),
        });
      }
    }

    // Auto-enroll foodCreator in compliance course
    try {
      const courseId = "compliance-course-v1";
      const courseName = "Home Cooking Compliance Course";

      // Check if already enrolled
      const existingEnrollment = await ctx.db
        .query('chefCourses')
        .withIndex('by_chef_course', q =>
          q.eq('chefId', id).eq('courseId', courseId)
        )
        .first();

      if (!existingEnrollment) {
        // Get all published modules for this course to initialize progress
        const courseModules = await ctx.db
          .query('courseModules')
          .withIndex('by_course', q => q.eq('courseId', courseId))
          .filter(q => q.eq(q.field('status'), 'published'))
          .collect();

        // Sort by module number
        courseModules.sort((a, b) => a.moduleNumber - b.moduleNumber);

        // Initialize progress array with all modules
        const initialProgress = courseModules.map(module => ({
          moduleId: module.moduleId,
          moduleName: module.moduleName,
          moduleNumber: module.moduleNumber,
          completed: false,
          quizAttempts: 0,
          lastAccessed: 0,
          timeSpent: 0,
        }));

        const now = Date.now();
        await ctx.db.insert('chefCourses', {
          chefId: id,
          courseId,
          courseName,
          enrollmentDate: now,
          status: 'enrolled',
          progress: initialProgress,
          totalTimeSpent: 0,
          lastAccessed: now,
          createdAt: now,
          updatedAt: now,
        });
      }
    } catch (error) {
      // Log error but don't fail foodCreator creation if enrollment fails
      console.error('Error auto-enrolling foodCreator in compliance course:', error);
    }

    return id;
  }
);

export const createCuisine = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
    createdBy: v.id('users'),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const cuisineId = await ctx.db.insert('cuisines', {
      name: args.name,
      description: args.description,
      status: args.status,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
      image: args.image,
    });
    return { cuisineId };
  }
});

export const updateCuisine = mutation({
  args: {
    cuisineId: v.id('cuisines'),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    status: v.optional(v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected'))),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const updates: any = { updatedAt: Date.now() };
    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.status !== undefined) updates.status = args.status;
    if (args.image !== undefined) updates.image = args.image;
    await ctx.db.patch(args.cuisineId, updates);
    return { status: 'ok' };
  }
});

export const deleteCuisine = mutation({
  args: { cuisineId: v.id('cuisines') },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.cuisineId);
    return { status: 'ok' };
  }
});

export const updateFoodCreator = mutation({
  args: {
    chefId: v.id('chefs'),
    status: v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('suspended')
    ),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require staff/admin authentication for status updates
    await requireStaff(ctx, args.sessionToken);

    await ctx.db.patch(args.chefId, {
      status: args.status
    });
    return { status: 'ok' };
  }
});

export const toggleAvailability = mutation({
  args: {
    chefId: v.id('chefs'),
    isAvailable: v.boolean(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Get the foodCreator to verify ownership
    const foodCreator = await ctx.db.get(args.chefId);
    if (!foodCreator) {
      throw new Error('FoodCreator not found');
    }

    // Users can only update their own foodCreator profile, staff/admin can update any
    if (!isAdmin(user) && !isStaff(user) && foodCreator.userId !== user._id) {
      throw new Error('Access denied: You can only update your own availability');
    }

    // If trying to go online, check if requirements are met (staff/admin can bypass)
    if (args.isAvailable && !isAdmin(user) && !isStaff(user)) {
      // Check compliance training
      const complianceCourse = await ctx.db
        .query('chefCourses')
        .withIndex('by_chef_course', q =>
          q.eq('chefId', args.chefId).eq('courseId', 'compliance-course-v1')
        )
        .first();

      const complianceTrainingComplete = complianceCourse?.status === 'completed';

      if (!complianceTrainingComplete) {
        throw new Error('Please complete compliance training before going online. You can access it from your profile.');
      }

      // Check required documents
      const documents = await ctx.db
        .query('chefDocuments')
        .withIndex('by_chef', q => q.eq('chefId', args.chefId as any))
        .collect();

      const requiredDocuments = documents.filter(d => d.isRequired);
      const verifiedRequiredDocuments = requiredDocuments.filter(d => d.status === 'verified');

      if (requiredDocuments.length > 0 && verifiedRequiredDocuments.length !== requiredDocuments.length) {
        const missingCount = requiredDocuments.length - verifiedRequiredDocuments.length;
        throw new Error(`Please verify ${missingCount} required document${missingCount !== 1 ? 's' : ''} before going online. You can upload them from your profile.`);
      }
    }

    await ctx.db.patch(args.chefId, {
      isAvailable: args.isAvailable,
      updatedAt: Date.now(),
    });

    return { success: true, isAvailable: args.isAvailable };
  },
});

export const update = mutation({
  args: {
    chefId: v.id('chefs'),
    updates: v.object({
      name: v.optional(v.string()),
      bio: v.optional(v.string()),
      specialties: v.optional(v.array(v.string())),
      rating: v.optional(v.number()),
      image: v.optional(v.string()),
      profileImage: v.optional(v.string()),
      status: v.optional(v.union(v.literal('active'), v.literal('inactive'), v.literal('suspended'))),
      location: v.optional(v.object({
        city: v.optional(v.string()),
        coordinates: v.optional(v.array(v.number())),
      })),
      isAvailable: v.optional(v.boolean()),
    }),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Get the foodCreator to verify ownership or admin access
    const foodCreator = await ctx.db.get(args.chefId);
    if (!foodCreator) {
      throw new Error("FoodCreator not found");
    }

    // Users can update their own foodCreator profile, staff/admin can update any
    if (!isAdmin(user) && !isStaff(user) && foodCreator.userId !== user._id) {
      throw new Error("Access denied");
    }

    // Only admins can update status
    if (args.updates.status && !isAdmin(user)) {
      throw new Error("Only admins can update foodCreator status");
    }

    // Prepare updates, ensuring required location fields are present if location is being updated
    let updates: any = { ...args.updates };

    // Map 'image' to 'profileImage' if provided (for backward compatibility)
    if (updates.image && !updates.profileImage) {
      updates.profileImage = updates.image;
      delete updates.image;
    }

    // If location is being updated, ensure it has all required fields
    if (updates.location) {
      const coordinates = Array.isArray(updates.location.coordinates) ? updates.location.coordinates : [];
      const city = updates.location.city || '';

      // Only update location if both fields are provided and valid
      if (city && coordinates.length >= 2) {
        updates = {
          ...updates,
          location: {
            city,
            coordinates: coordinates.slice(0, 2), // Ensure exactly 2 coordinates
          },
        };
      } else {
        // Remove location from updates if fields are missing or invalid
        const { location, ...rest } = updates;
        updates = rest;
      }
    }

    // Apply updates
    await ctx.db.patch(args.chefId, updates as any);

    return { success: true };
  },
});

export const saveOnboardingDraft = mutation({
  args: {
    chefId: v.id('chefs'),
    draft: v.object({
      name: v.optional(v.string()),
      bio: v.optional(v.string()),
      specialties: v.optional(v.array(v.string())),
      city: v.optional(v.string()),
      coordinates: v.optional(v.array(v.number())),
      profileImage: v.optional(v.string()),
      kitchenName: v.optional(v.string()),
      kitchenAddress: v.optional(v.string()),
      kitchenType: v.optional(v.string()),
      kitchenImages: v.optional(v.array(v.string())),
      currentStep: v.optional(v.string()),
    }),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Get the foodCreator to verify ownership
    const foodCreator = await ctx.db.get(args.chefId);
    if (!foodCreator) {
      throw new Error("FoodCreator not found");
    }

    // Users can update their own draft, staff/admin can update any
    if (!isAdmin(user) && !isStaff(user) && foodCreator.userId !== user._id) {
      throw new Error("Access denied");
    }

    // Save draft data
    await ctx.db.patch(args.chefId, {
      onboardingDraft: args.draft,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const clearOnboardingDraft = mutation({
  args: {
    chefId: v.id('chefs'),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Get the foodCreator to verify ownership
    const foodCreator = await ctx.db.get(args.chefId);
    if (!foodCreator) {
      throw new Error("FoodCreator not found");
    }

    // Users can clear their own draft, staff/admin can clear any
    if (!isAdmin(user) && !isStaff(user) && foodCreator.userId !== user._id) {
      throw new Error("Access denied");
    }

    // Clear draft data
    await ctx.db.patch(args.chefId, {
      onboardingDraft: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

export const updateAvailability = mutation({
  args: {
    chefId: v.id('chefs'),
    updates: v.object({
      isAvailable: v.optional(v.boolean()),
      availableDays: v.optional(v.array(v.string())),
      availableHours: v.optional(v.any()), // Object mapping day -> array of { start: string, end: string }
      unavailableDates: v.optional(v.array(v.number())), // Array of timestamps
      maxOrdersPerDay: v.optional(v.number()),
      advanceBookingDays: v.optional(v.number()),
      specialInstructions: v.optional(v.string()),
    }),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Get the foodCreator to verify ownership
    const foodCreator = await ctx.db.get(args.chefId);
    if (!foodCreator) {
      throw new Error("FoodCreator not found");
    }

    // Users can update their own availability, staff/admin can update any
    if (!isAdmin(user) && !isStaff(user) && foodCreator.userId !== user._id) {
      throw new Error("Access denied");
    }

    // Apply updates
    await ctx.db.patch(args.chefId, args.updates as any);

    return { success: true };
  },
});

// Internal mutation for seeding - bypasses auth
export const createFoodCreatorForSeed = internalMutation({
  args: {
    userId: v.id('users'),
    name: v.string(),
    bio: v.optional(v.string()),
    specialties: v.optional(v.array(v.string())),
    location: v.object({
      lat: v.number(),
      lng: v.number(),
      city: v.optional(v.string()),
    }),
    rating: v.optional(v.number()),
    status: v.optional(v.union(v.literal('active'), v.literal('inactive'), v.literal('suspended'))),
  },
  handler: async (ctx, args) => {
    // Check if foodCreator already exists
    const existing = await ctx.db
      .query('chefs')
      .filter(q => q.eq(q.field('userId'), args.userId))
      .first();

    if (existing) {
      return existing._id;
    }

    const bio = args.bio || '';
    const specialties = args.specialties || [];
    const rating = typeof args.rating === 'number' ? args.rating : 0;
    const status = args.status || 'active';
    const city = args.location.city || '';
    const coordinates = [args.location.lat, args.location.lng];

    const foodCreatorDoc = {
      userId: args.userId,
      name: args.name,
      bio,
      specialties,
      rating,
      status,
      location: { city, coordinates },
    };

    const id = await ctx.db.insert("chefs", foodCreatorDoc);

    // Add foodCreator role to user
    const user = await ctx.db.get(args.userId);
    if (user) {
      const userRoles = user.roles || [];
      if (!userRoles.includes('chef')) {
        await ctx.db.patch(args.userId, {
          roles: [...userRoles, 'chef'],
          lastModified: Date.now(),
        });
      }
    }

    // Auto-enroll foodCreator in compliance course
    try {
      const courseId = "compliance-course-v1";
      const courseName = "Home Cooking Compliance Course";

      // Check if already enrolled
      const existingEnrollment = await ctx.db
        .query('chefCourses')
        .withIndex('by_chef_course', q =>
          q.eq('chefId', id).eq('courseId', courseId)
        )
        .first();

      if (!existingEnrollment) {
        // Get all published modules for this course to initialize progress
        const courseModules = await ctx.db
          .query('courseModules')
          .withIndex('by_course', q => q.eq('courseId', courseId))
          .filter(q => q.eq(q.field('status'), 'published'))
          .collect();

        // Sort by module number
        courseModules.sort((a, b) => a.moduleNumber - b.moduleNumber);

        // Initialize progress array with all modules
        const initialProgress = courseModules.map(module => ({
          moduleId: module.moduleId,
          moduleName: module.moduleName,
          moduleNumber: module.moduleNumber,
          completed: false,
          quizAttempts: 0,
          lastAccessed: 0,
          timeSpent: 0,
        }));

        const now = Date.now();
        await ctx.db.insert('chefCourses', {
          chefId: id,
          courseId,
          courseName,
          enrollmentDate: now,
          status: 'enrolled',
          progress: initialProgress,
          totalTimeSpent: 0,
          lastAccessed: now,
          createdAt: now,
          updatedAt: now,
        });
      }
    } catch (error) {
      // Log error but don't fail foodCreator creation if enrollment fails
      console.error('Error auto-enrolling foodCreator in compliance course:', error);
    }

    return id;
  },
});

// Internal mutation for seeding cuisines - bypasses auth
export const createCuisineForSeed = internalMutation({
  args: {
    name: v.string(),
    description: v.string(),
    status: v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
    createdBy: v.id('users'),
    image: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const cuisineId = await ctx.db.insert('cuisines', {
      name: args.name,
      description: args.description,
      status: args.status,
      createdBy: args.createdBy,
      createdAt: now,
      updatedAt: now,
      image: args.image,
    });
    return { cuisineId };
  },
});

/**
 * Mark compliance training as skipped
 */
export const skipComplianceTraining = mutation({
  args: {
    chefId: v.id("chefs"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Get foodCreator to verify ownership
    const foodCreator = await ctx.db.get(args.chefId);

    if (!foodCreator) {
      throw new Error('FoodCreator not found');
    }

    // Users can only skip their own training, staff/admin can skip any
    if (!isAdmin(user) && !isStaff(user) && foodCreator.userId !== user._id) {
      throw new Error('Access denied');
    }

    // Mark compliance training as skipped
    await ctx.db.patch(args.chefId, {
      complianceTrainingSkipped: true,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Update foodCreator's real-time location.
 * Used by FoodCreator App for background location tracking.
 */
export const updateFoodCreatorLocation = mutation({
  args: {
    chefId: v.id('chefs'),
    lat: v.number(),
    lng: v.number(),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Get foodCreator to verify ownership
    const foodCreator = await ctx.db.get(args.chefId);
    if (!foodCreator) {
      throw new Error("FoodCreator not found");
    }

    // Only allow the foodCreator themselves to update their location
    if (foodCreator.userId !== user._id) {
      throw new Error("Access denied");
    }

    // Update location coordinates while preserving the city
    await ctx.db.patch(args.chefId, {
      location: {
        city: foodCreator.location.city,
        coordinates: [args.lng, args.lat] // GeoJSON format: [lng, lat]
      }
    });

    return { success: true };
  }
});

export const updateFsaRating = mutation({
  args: {
    chefId: v.id('chefs'),
    rating: v.number(), // 0-5
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.sessionToken);

    if (!isAdmin(user) && !isStaff(user)) {
      throw new Error("Only admins and staff can update FSA ratings");
    }

    if (args.rating < 0 || args.rating > 5) {
      throw new Error("FSA Rating must be between 0 and 5");
    }

    await ctx.db.patch(args.chefId, {
      fsaRating: args.rating,
      updatedAt: Date.now(),
    });
  }
});
