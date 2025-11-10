import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import { mutation } from "../_generated/server";
import { requireAuth, requireStaff, requireAdmin, isAdmin, isStaff } from '../utils/auth';

export const createChef = mutation(
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
    
    // Users can only create chef profiles for themselves
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
    const chefDoc = {
      userId: args.userId,
      name: args.name || '',
      bio,
      specialties,
      rating,
      status,
      location: { city, coordinates },
    };
    const id = await ctx.db.insert("chefs", chefDoc);
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

export const updateChef = mutation({
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

export const update = mutation({
  args: {
    chefId: v.id('chefs'),
    updates: v.object({
      name: v.optional(v.string()),
      bio: v.optional(v.string()),
      specialties: v.optional(v.array(v.string())),
      rating: v.optional(v.number()),
      image: v.optional(v.string()),
      status: v.optional(v.union(v.literal('active'), v.literal('inactive'), v.literal('suspended'))),
      location: v.optional(v.object({
        city: v.optional(v.string()),
        coordinates: v.optional(v.array(v.number())),
      })),
    }),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Get the chef to verify ownership or admin access
    const chef = await ctx.db.get(args.chefId);
    if (!chef) {
      throw new Error("Chef not found");
    }

    // Users can update their own chef profile, staff/admin can update any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error("Access denied");
    }
    
    // Only admins can update status
    if (args.updates.status && !isAdmin(user)) {
      throw new Error("Only admins can update chef status");
    }

    // Prepare updates, ensuring required location fields are present if location is being updated
    let updates: any = { ...args.updates };
    
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

export const updateAvailability = mutation({
  args: {
    chefId: v.id('chefs'),
    updates: v.object({
      isAvailable: v.optional(v.boolean()),
      availableDays: v.optional(v.array(v.string())),
      availableHours: v.optional(v.any()),
      maxOrdersPerDay: v.optional(v.number()),
      advanceBookingDays: v.optional(v.number()),
      specialInstructions: v.optional(v.string()),
    }),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Get the chef to verify ownership
    const chef = await ctx.db.get(args.chefId);
    if (!chef) {
      throw new Error("Chef not found");
    }

    // Users can update their own availability, staff/admin can update any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error("Access denied");
    }

    // Apply updates
    await ctx.db.patch(args.chefId, args.updates as any);

    return { success: true };
  },
});
