import { v } from 'convex/values';
import type { Id } from '../_generated/dataModel';
import { mutation } from "../_generated/server";

export const createChef = mutation(
  async (
    { db },
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
    }
  ) => {
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
    const id = await db.insert("chefs", chefDoc);
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
    )
  },
  handler: async (ctx, args) => {
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the chef to verify ownership or admin access
    const chef = await ctx.db.get(args.chefId);
    if (!chef) {
      throw new Error("Chef not found");
    }

    // Check if user is admin or the chef themselves
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Allow if admin or if updating own chef profile
    if (chef.userId !== user._id && !user.roles?.includes('admin')) {
      throw new Error("Not authorized");
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
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get the chef to verify ownership
    const chef = await ctx.db.get(args.chefId);
    if (!chef) {
      throw new Error("Chef not found");
    }

    // Check if user is the chef themselves
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Only allow chefs to update their own availability
    if (chef.userId !== user._id) {
      throw new Error("Not authorized");
    }

    // Apply updates
    await ctx.db.patch(args.chefId, args.updates as any);

    return { success: true };
  },
});
