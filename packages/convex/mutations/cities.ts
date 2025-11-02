import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const addCity = mutation({
  args: {
    name: v.string(),
    state: v.optional(v.string()),
    country: v.string(),
    status: v.union(v.literal("active"), v.literal("inactive"), v.literal("coming_soon")),
    deliveryFee: v.optional(v.number()),
    minOrderAmount: v.optional(v.number()),
    estimatedDeliveryTime: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    // Check if city already exists
    const existing = await ctx.db
      .query("cities")
      .filter((q: any) => 
        q.and(
          q.eq(q.field("name"), args.name),
          q.eq(q.field("country"), args.country),
          args.state ? q.eq(q.field("state"), args.state) : q.eq(q.field("state"), undefined)
        )
      )
      .first();
    
    if (existing) {
      throw new Error("City already exists");
    }
    
    const cityId = await ctx.db.insert("cities", {
      name: args.name,
      state: args.state,
      country: args.country,
      status: args.status,
      deliveryFee: args.deliveryFee || 0,
      minOrderAmount: args.minOrderAmount || 0,
      estimatedDeliveryTime: args.estimatedDeliveryTime || "30-45 min",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    
    // Log the city addition
    await ctx.db.insert("adminActivity", {
      type: "city_added",
      description: `City ${args.name}, ${args.country} was added`,
      timestamp: Date.now(),
      metadata: {
        cityId,
        name: args.name,
        state: args.state,
        country: args.country,
        status: args.status,
      },
    });
    
    return { success: true, cityId };
  },
});

export const updateCity = mutation({
  args: {
    cityId: v.id("cities"),
    name: v.optional(v.string()),
    state: v.optional(v.string()),
    country: v.optional(v.string()),
    status: v.optional(v.union(v.literal("active"), v.literal("inactive"), v.literal("coming_soon"))),
    deliveryFee: v.optional(v.number()),
    minOrderAmount: v.optional(v.number()),
    estimatedDeliveryTime: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    const city = await ctx.db.get(args.cityId);
    if (!city) {
      throw new Error("City not found");
    }
    
    const updateData: any = {
      updatedAt: Date.now(),
    };
    
    if (args.name !== undefined) updateData.name = args.name;
    if (args.state !== undefined) updateData.state = args.state;
    if (args.country !== undefined) updateData.country = args.country;
    if (args.status !== undefined) updateData.status = args.status;
    if (args.deliveryFee !== undefined) updateData.deliveryFee = args.deliveryFee;
    if (args.minOrderAmount !== undefined) updateData.minOrderAmount = args.minOrderAmount;
    if (args.estimatedDeliveryTime !== undefined) updateData.estimatedDeliveryTime = args.estimatedDeliveryTime;
    
    await ctx.db.patch(args.cityId, updateData);
    
    // Log the city update
    await ctx.db.insert("adminActivity", {
      type: "city_updated",
      description: `City ${city.name} was updated`,
      timestamp: Date.now(),
      metadata: {
        cityId: args.cityId,
        changes: updateData,
      },
    });
    
    return { success: true };
  },
});

export const deleteCity = mutation({
  args: {
    cityId: v.id("cities"),
  },
  handler: async (ctx: any, args: any) => {
    const city = await ctx.db.get(args.cityId);
    if (!city) {
      throw new Error("City not found");
    }
    
    await ctx.db.delete(args.cityId);
    
    // Log the city deletion
    await ctx.db.insert("adminActivity", {
      type: "city_deleted",
      description: `City ${city.name} was deleted`,
      timestamp: Date.now(),
      metadata: {
        cityId: args.cityId,
        name: city.name,
        state: city.state,
        country: city.country,
      },
    });
    
    return { success: true };
  },
});

export const createCity = mutation({
  args: {
    name: v.string(),
    state: v.optional(v.string()),
    country: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("inactive"),
      v.literal("coming_soon")
    ),
    serviceArea: v.optional(v.array(v.string())),
    deliveryFee: v.optional(v.number()),
    minOrderAmount: v.optional(v.number()),
    estimatedDeliveryTime: v.optional(v.string()),
    coordinates: v.optional(v.object({
      latitude: v.number(),
      longitude: v.number(),
    })),
    timezone: v.optional(v.string()),
    currency: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    // Check if city already exists
    const existing = await ctx.db
      .query("cities")
      .filter((q: any) => 
        q.and(
          q.eq(q.field("name"), args.name),
          q.eq(q.field("country"), args.country),
          args.state ? q.eq(q.field("state"), args.state) : q.eq(q.field("state"), undefined)
        )
      )
      .first();
    
    if (existing) {
      throw new Error("City already exists");
    }
    
    const cityId = await ctx.db.insert("cities", {
      name: args.name,
      state: args.state,
      country: args.country,
      status: args.status,
      serviceArea: args.serviceArea || [],
      deliveryFee: args.deliveryFee || 0,
      minOrderAmount: args.minOrderAmount || 0,
      estimatedDeliveryTime: args.estimatedDeliveryTime || "30-45 minutes",
      coordinates: args.coordinates,
      timezone: args.timezone || "UTC",
      currency: args.currency || "USD",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, cityId };
  },
});

export const toggleCityStatus = mutation({
  args: {
    cityId: v.id("cities"),
    isActive: v.boolean(),
  },
  handler: async (ctx: any, args: any) => {
    await ctx.db.patch(args.cityId, {
      status: args.isActive ? "active" : "inactive",
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});
