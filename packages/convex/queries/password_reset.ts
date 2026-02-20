import { v } from "convex/values";
import { query } from "../_generated/server";

export const checkResetToken = query({
    args: { token: v.string() },
    handler: async (ctx, args) => {
        console.log(`[checkResetToken] Checking token prefix: ${args.token?.slice(0, 8)}…`);

        const tokenDoc = await ctx.db
            .query("passwordResetTokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();

        if (!tokenDoc) {
            console.warn(`[checkResetToken] INVALID — token not found in DB`);
            return { valid: false, reason: "Invalid token" };
        }
        if (tokenDoc.used) {
            console.warn(`[checkResetToken] INVALID — token already used (email: ${tokenDoc.email})`);
            return { valid: false, reason: "Token already used" };
        }
        if (Date.now() > tokenDoc.expiresAt) {
            console.warn(`[checkResetToken] INVALID — token expired (email: ${tokenDoc.email}, expiredAt: ${new Date(tokenDoc.expiresAt).toISOString()})`);
            return { valid: false, reason: "Token expired" };
        }

        console.log(`[checkResetToken] VALID — token for email: ${tokenDoc.email}`);
        return { valid: true };
    },
});
