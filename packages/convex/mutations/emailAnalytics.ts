// @ts-nocheck
import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Record email event from Resend webhook
export const recordEmailEvent = mutation({
  args: {
    emailId: v.string(),
    templateId: v.string(),
    recipientEmail: v.string(),
    eventType: v.union(
      // Email events
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("complained"),
      v.literal("unsubscribed"),
      // Contact events
      v.literal("contact_created"),
      v.literal("contact_updated"),
      v.literal("contact_deleted"),
      // Domain events
      v.literal("domain_created"),
      v.literal("domain_updated"),
      v.literal("domain_deleted")
    ),
    metadata: v.record(v.string(), v.any()),
    deviceInfo: v.optional(
      v.object({
        type: v.string(),
        os: v.string(),
        browser: v.string(),
        client: v.string(),
      })
    ),
    locationInfo: v.optional(
      v.object({
        country: v.string(),
        region: v.string(),
        city: v.string(),
        ipAddress: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("emailAnalyticsData", {
      emailId: args.emailId,
      templateId: args.templateId,
      recipientEmail: args.recipientEmail,
      eventType: args.eventType,
      timestamp: Date.now(),
      metadata: args.metadata,
      deviceInfo: args.deviceInfo,
      locationInfo: args.locationInfo,
    });
    
    console.log(`Recorded email event: ${args.eventType} for ${args.recipientEmail}`, {
      deviceInfo: args.deviceInfo,
      locationInfo: args.locationInfo,
    });
    return eventId;
  },
});
