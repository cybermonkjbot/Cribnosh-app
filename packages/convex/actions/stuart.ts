"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action } from "../_generated/server";

/**
 * Public action to validate a delivery address with Stuart.
 * This can be called from the frontend during checkout or address entry.
 */
export const validateDeliveryAddress = action({
    args: {
        address: v.string(),
    },
    handler: async (ctx, args) => {
        try {
            // 1. Check if Stuart is enabled
            const settings = await ctx.runQuery(internal.queries.admin.getDeliverySettings);
            if (!settings || !settings.fallback_enabled || !settings.stuart_api_key) {
                // If Stuart fallback is not enabled, we don't need to validate with Stuart.
                return { valid: true, skipped: true };
            }

            // 2. Use the internal action to perform the actual Stuart API call
            const result = await ctx.runAction(internal.stuart_integration.validateAddress, {
                address: args.address,
                type: "delivering",
            });

            return result;
        } catch (error) {
            console.error("Public address validation failed:", error);
            return { valid: false, error: "Validation service temporarily unavailable" };
        }
    },
});
