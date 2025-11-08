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

interface WaitlistCompleteResult {
  success: boolean;
  id: Id<"waitlist">;
  userId: Id<"users">;
  isExisting?: boolean;
  sessionToken: string;
  referralLink: string;
  referralAttributed?: boolean;
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

/**
 * Complete waitlist signup flow that handles:
 * - Adding to waitlist
 * - Creating user if needed
 * - Setting session token
 * - Generating referral link
 * - Attributing referral if referrer exists
 */
export const addToWaitlistComplete = action({
  args: {
    email: v.string(),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    location: v.optional(v.string()),
    referralCode: v.optional(v.string()),
    source: v.optional(v.string()),
    referrerId: v.optional(v.id("users")),
    deviceId: v.optional(v.string()),
    ip: v.optional(v.string()),
  },
  handler: async (ctx, args): Promise<WaitlistCompleteResult> => {
    // Step 1: Add to waitlist and create/get user
    const waitlistResult = await ctx.runMutation(api.mutations.waitlist.addToWaitlist, {
      email: args.email,
      name: args.name,
      phone: args.phone,
      location: args.location || undefined,
      referralCode: args.referralCode,
      source: args.source,
    });
    
    const waitlistId: Id<"waitlist"> = waitlistResult.waitlistId;
    
    // Get or create user - use userId from mutation if available (optimization)
    let userId: Id<"users">;
    if (waitlistResult.userId) {
      // User already exists - use the ID from mutation
      userId = waitlistResult.userId;
    } else {
      // User doesn't exist - create one
      userId = await ctx.runMutation(api.mutations.users.createMinimalUser, {
        name: args.email.split("@")[0],
        email: args.email,
      });
    }

    // Step 2: Generate and set session token atomically using Convex mutation
    // This is more performant and uses base64url encoding for better security
    const ONE_WEEK_DAYS = 7;
    const sessionResult = await ctx.runMutation(api.mutations.users.createAndSetSessionToken, {
      userId,
      expiresInDays: ONE_WEEK_DAYS,
    });

    // Step 3: Generate referral link
    const referralLink = await ctx.runMutation(api.mutations.users.generateReferralLink, {
      userId,
    });

    // Step 4: Attribute referral if referrer exists
    let referralAttributed = false;
    if (args.referrerId) {
      try {
        await ctx.runMutation(api.mutations.users.attributeReferral, {
          newUserId: userId,
          referrerId: args.referrerId,
          deviceId: args.deviceId,
          ip: args.ip,
        });
        referralAttributed = true;
      } catch (err) {
        // Ignore if already attributed or error - this is expected behavior
        console.log("Referral attribution skipped:", err);
      }
    }

    return {
      success: true,
      id: waitlistId,
      userId,
      isExisting: waitlistResult.isExisting,
      sessionToken,
      referralLink,
      referralAttributed,
    };
  }
});