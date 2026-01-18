"use node";

import { v } from "convex/values";
import { internal } from "../_generated/api";
import { action } from "../_generated/server";
import { CACHE_TTL } from "../cacheConfig";

/**
 * Public action to validate a delivery address with Stuart.
 * This can be called from the frontend during checkout or address entry.
 */
export const validateDeliveryAddress = action({
    args: {
        address: v.string(),
    },
    handler: async (ctx, args): Promise<any> => {
        try {
            // 1. Check if Stuart is enabled
            const settings = await ctx.runQuery(internal.queries.admin.getDeliverySettings);
            if (!settings || !settings.fallback_enabled || !settings.stuart_api_key) {
                // If Stuart fallback is not enabled, we don't need to validate with Stuart.
                return { valid: true, skipped: true };
            }

            // 2. Check cache
            const cacheKey = args.address.trim().toLowerCase();
            const cached = await ctx.runQuery(internal.queries.cache.get, {
                action: 'stuart_validation',
                key: cacheKey,
                ttlMs: CACHE_TTL.STUART_VALIDATION
            });

            if (cached) {
                return cached;
            }

            // 3. Use the internal action to perform the actual Stuart API call
            const result = await ctx.runAction(internal.stuart_integration.validateAddress, {
                address: args.address,
                type: "delivering",
            });

            // 4. Cache the result
            await ctx.runMutation(internal.mutations.cache.set, {
                action: 'stuart_validation',
                key: cacheKey,
                data: result,
                ttlMs: CACHE_TTL.STUART_VALIDATION,
            });

            return result;
        } catch (error) {
            console.error("Public address validation failed:", error);
            return { valid: false, error: "Validation service temporarily unavailable" };
        }
    },
});
