"use node";

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

interface WaitlistResult {
  success: boolean;
  id: Id<"waitlist">;
  userId: Id<"users">;
  isExisting?: boolean;
}

export const addToWaitlistWithSync = action({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    source: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<WaitlistResult> => {
    // First add to waitlist table using the mutation
    const result = await ctx.runMutation(api.mutations.waitlist.addToWaitlist, {
      email: args.email,
      name: args.name,
      phone: args.phone,
      location: args.location || undefined,
      referralCode: args.referralCode,
      source: args.source,
    });
    
    const id: Id<"waitlist"> = result.waitlistId;
    
    // If this is an existing user, we don't need to create a new user
    if (result.isExisting) {
      // Find existing user by email
      const user = await ctx.runQuery(api.queries.users.getUserByEmail, { email: args.email });
      if (user) {
        return { success: true, id, userId: user._id, isExisting: true };
      }
    }

    // Create minimal user if not exists
    let user = await ctx.runQuery(api.queries.users.getUserByEmail, { email: args.email });
    let userId: Id<"users">;
    if (!user) {
      userId = await ctx.runMutation(api.mutations.users.createMinimalUser, {
        name: args.email.split("@")[0],
        email: args.email,
      });
    } else {
      userId = user._id;
    }

    // Return success
    return { success: true, id, userId, isExisting: false };
  }
});