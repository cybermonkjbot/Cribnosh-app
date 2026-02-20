import { v } from "convex/values";
import { query } from "../_generated/server";

export const checkResetToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        const tokenDoc = await ctx.db
            .query("passwordResetTokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();

        if (!tokenDoc) {
            return { valid: false, reason: "Invalid token" };
        }
        if (tokenDoc.used) {
            return { valid: false, reason: "Token already used" };
        }
        if (Date.now() > tokenDoc.expiresAt) {
            return { valid: false, reason: "Token expired" };
        }

        return { valid: true };
    },
});
