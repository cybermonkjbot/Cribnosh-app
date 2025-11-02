import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const add = mutation({
  args: {
    userId: v.id("users"),
    templateId: v.string(),
    sentAt: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("dripEmails", {
      userId: args.userId,
      templateId: args.templateId,
      sentAt: args.sentAt,
    });
  },
});
