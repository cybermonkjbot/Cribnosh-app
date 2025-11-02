import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const logEvent = mutation({
  args: {
    type: v.string(),
    status: v.string(),
    details: v.string(),
  },
  handler: async (ctx, args) => {
    const { type, status, details } = args;
    
    // Store the event in the database
    await ctx.db.insert("monitoring_events", {
      type,
      status,
      details,
      timestamp: new Date().toISOString(),
    });
  },
});

export const logSystemEvent = mutation({
  args: {
    service: v.string(),
    status: v.string(),
    details: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("systemHealth", {
      service: args.service,
      status: args.status,
      responseTime: 0,
      lastChecked: Date.now(),
      details: args.details,
    });
  },
}); 