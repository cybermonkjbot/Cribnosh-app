// @ts-nocheck
import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const createResetToken = mutation({
    args: {
        email: v.string(),
        token: v.string(),
        expiresAt: v.number(),
    },
    handler: async (ctx, args) => {
        console.log(`[createResetToken] START — email: ${args.email}, expiresAt: ${new Date(args.expiresAt).toISOString()}`);

        // Invalidate any existing tokens for this email
        const existingTokens = await ctx.db
            .query("passwordResetTokens")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .filter((q) => q.eq(q.field("used"), false))
            .collect();

        if (existingTokens.length > 0) {
            console.log(`[createResetToken] Invalidating ${existingTokens.length} existing token(s) for ${args.email}`);
        }
        for (const token of existingTokens) {
            await ctx.db.patch(token._id, { used: true });
        }

        // Insert new token
        const newId = await ctx.db.insert("passwordResetTokens", {
            email: args.email,
            token: args.token,
            expiresAt: args.expiresAt,
            used: false,
        });
        console.log(`[createResetToken] SUCCESS — token inserted with id: ${newId} for ${args.email}`);
        return newId;
    },
});

export const verifyAndUseToken = mutation({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        console.log("verifyAndUseToken CALLED with token:", args.token);
        const tokenDoc = await ctx.db
            .query("passwordResetTokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .first();

        if (!tokenDoc) {
            console.error("verifyAndUseToken FAILED: Invalid token - not found in DB");
            return { success: false, error: "Invalid token" };
        }

        if (tokenDoc.used) {
            console.error("verifyAndUseToken FAILED: Token already used");
            return { success: false, error: "Token already used" };
        }

        if (Date.now() > tokenDoc.expiresAt) {
            console.error("verifyAndUseToken FAILED: Token expired");
            return { success: false, error: "Token expired" };
        }

        // Mark as used
        await ctx.db.patch(tokenDoc._id, { used: true });
        console.log("verifyAndUseToken SUCCESS: Token marked as used for email", tokenDoc.email);

        return { success: true, email: tokenDoc.email };
    },
});
