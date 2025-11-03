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
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("emailAnalyticsData", {
      emailId: args.emailId,
      templateId: args.templateId,
      recipientEmail: args.recipientEmail,
      eventType: args.eventType,
      timestamp: Date.now(),
      metadata: args.metadata,
    });
    
    console.log(`Recorded email event: ${args.eventType} for ${args.recipientEmail}`);
    return eventId;
  },
});
