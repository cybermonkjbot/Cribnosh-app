"use node";

import { v } from "convex/values";
import { action } from "../_generated/server";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";

/**
 * Claim a special offer - tracks that user clicked "Claim Now"
 * This increments click_count and creates a claimed_offers record
 */
export const claimOffer = action({
  args: {
    sessionToken: v.string(),
    offer_id: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      claimed_offer_id: v.id("claimed_offers"),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      // Get user from session token
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: "Authentication required" };
      }

      // Get the offer
      const offer = await ctx.runQuery(api.queries.specialOffers.getById, {
        offer_id: args.offer_id,
      });

      if (!offer) {
        return { success: false as const, error: "Offer not found" };
      }

      // Check if offer is active
      const now = Date.now();
      if (
        offer.status !== "active" ||
        !offer.is_active ||
        offer.starts_at > now ||
        offer.ends_at < now
      ) {
        return { success: false as const, error: "Offer is not active" };
      }

      // Check if user has already claimed this offer
      const existingClaim = await ctx.runQuery(
        api.queries.claimedOffers.getByUserAndOffer,
        {
          user_id: user._id,
          offer_id: args.offer_id,
        }
      );

      // If already claimed and not used, return existing claim
      if (existingClaim && !existingClaim.is_used) {
        // Increment click count anyway (user clicked again)
        await ctx.runMutation(api.mutations.specialOffers.incrementClickCount, {
          offer_id: args.offer_id,
        });
        return {
          success: true as const,
          claimed_offer_id: existingClaim._id,
        };
      }

      // Increment click count on offer
      await ctx.runMutation(api.mutations.specialOffers.incrementClickCount, {
        offer_id: args.offer_id,
      });

      // Create claimed offer record
      const claimedOfferId = await ctx.runMutation(
        api.mutations.claimedOffers.create,
        {
          user_id: user._id,
          offer_id: args.offer_id,
          expires_at: offer.ends_at,
        }
      );

      return {
        success: true as const,
        claimed_offer_id: claimedOfferId,
      };
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to claim offer";
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Get user's claimed offers
 */
export const getUserClaimedOffers = action({
  args: {
    sessionToken: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      claimed_offers: v.array(v.any()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      if (!user) {
        return { success: false as const, error: "Authentication required" };
      }

      const claimedOffers = await ctx.runQuery(
        api.queries.claimedOffers.getByUser,
        {
          user_id: user._id,
        }
      );

      return {
        success: true as const,
        claimed_offers: claimedOffers,
      };
    } catch (error: any) {
      const errorMessage = error?.message || "Failed to get claimed offers";
      return { success: false as const, error: errorMessage };
    }
  },
});

