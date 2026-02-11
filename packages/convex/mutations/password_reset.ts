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
        // Invalidate any existing tokens for this email
        const existingTokens = await ctx.db
            .query("passwordResetTokens")
            .withIndex("by_email", (q) => q.eq("email", args.email))
            .filter((q) => q.eq(q.field("used"), false))
            .collect();

        for (const token of existingTokens) {
            await ctx.db.patch(token._id, { used: true });
        }

        // Insert new token
        return await ctx.db.insert("passwordResetTokens", {
            email: args.email,
            token: args.token,
            expiresAt: args.expiresAt,
            used: false,
        });
    },
});

export const verifyAndUseToken = mutation({
    args: {
        token: v.string(),
    },
    handler: async (ctx, args) => {
        const tokenDoc = await ctx.db
            .query("passwordResetTokens")
            .withIndex("by_token", (q) => q.eq("token", args.token))
            .unique();

        if (!tokenDoc) {
            return { success: false, error: "Invalid token" };
        }

        if (tokenDoc.used) {
            return { success: false, error: "Token already used" };
        }

        if (Date.now() > tokenDoc.expiresAt) {
            return { success: false, error: "Token expired" };
        }

        // Mark as used
        await ctx.db.patch(tokenDoc._id, { used: true });

        return { success: true, email: tokenDoc.email };
    },
});
