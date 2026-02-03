// @ts-nocheck
import { query } from "../_generated/server";
import { v } from "convex/values";

export const getForUser = query({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    // No custom index, so filter in-memory
    const all = await ctx.db.query("dripEmails").collect();
    return all.filter((e) => e.userId === args.userId);
  },
});
