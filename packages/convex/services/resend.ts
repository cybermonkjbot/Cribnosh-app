import { internalMutation } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

// Handle email events from Resend webhooks
export const handleEmailEvent = internalMutation({
  args: {
    emailId: v.string(),
    templateId: v.string(),
    recipientEmail: v.string(),
    eventType: v.union(
      v.literal("sent"),
      v.literal("delivered"),
      v.literal("opened"),
      v.literal("clicked"),
      v.literal("bounced"),
      v.literal("complained"),
      v.literal("unsubscribed")
    ),
    metadata: v.record(v.string(), v.any()),
  },
  handler: async (ctx, args) => {
    console.log("Received email event:", args.emailId, args.eventType);
    
    // Record the event in analytics
    await ctx.runMutation(api.mutations.emailAnalytics.recordEmailEvent, {
      emailId: args.emailId,
      templateId: args.templateId,
      recipientEmail: args.recipientEmail,
      eventType: args.eventType,
      metadata: args.metadata,
    });
  },
});
