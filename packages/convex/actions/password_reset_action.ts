"use node";
// @ts-nocheck
import { v } from "convex/values";

import { randomBytes } from "crypto";
import { api, internal } from "../_generated/api";
import { action } from "../_generated/server";

export const sendPasswordResetEmail = (action as any)({
    args: {
        email: v.string(),
        role: v.string(),
    },
    handler: async (ctx: any, args: any) => {
        // 1. Verify user exists and has the required role
        const user = await ctx.runQuery(api.queries.users.getUserByEmail, {
            email: args.email,
        });

        if (!user) {
            // Return success even if user not found for security (prevent email enumeration)
            return { success: true };
        }

        if (!user.roles || !user.roles.includes(args.role)) {
            return { success: true };
        }

        // 2. Generate token
        const token = randomBytes(32).toString("hex");
        const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

        // 3. Store token (unhashed for simplicity in this implementation, 
        // but usually should be hashed if stored in a persistent DB)
        await ctx.runMutation(api.mutations.password_reset.createResetToken, {
            email: args.email,
            token: token,
            expiresAt: expiresAt,
        });

        // 4. Send Email
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://app.cribnosh.com";
        const resetUrl = `${baseUrl}/${args.role}/reset-password?token=${token}`;

        await ctx.runAction(internal.actions.resend.sendTemplateEmail, {
            emailType: "password_reset",
            to: args.email,
            variables: {
                userName: user.name,
                resetUrl: resetUrl,
                expiryHours: "1",
            },
        });

        return { success: true };
    },
} as any);
