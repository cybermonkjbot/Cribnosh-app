import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const createDriver = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    vehicle: v.string(),
    vehicleType: v.union(
      v.literal('car'),
      v.literal('motorcycle'),
      v.literal('bicycle'),
      v.literal('scooter'),
      v.literal('van')
    ),
    experience: v.optional(v.number()),
    createdAt: v.number(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("drivers", {
      ...args,
      status: 'pending', // Default status for new applications
      availability: 'offline', // Default availability
      updatedAt: args.createdAt, // Set updatedAt to createdAt initially
    });
    return id;
  },
});

export const updateDriver = mutation({
  args: {
    id: v.id("drivers"),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected'),
      v.literal('on_hold')
    ),
    updatedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
    return { success: true };
  },
});

export const deleteDriver = mutation({
  args: {
    id: v.id("drivers"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});
