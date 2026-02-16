"use node";
// @ts-nocheck
import { v } from "convex/values";

import { randomBytes } from "crypto";
import { api, internal } from "../_generated/api";
import { action } from "../_generated/server";
import { isAdmin, isStaff } from "../utils/auth";

export const sendPasswordResetEmail = (action as any)({
    args: {
        email: v.string(),
        role: v.string(),
    },
    handler: async (ctx: any, args: any) => {
        // 1. Verify user exists
        const user = await ctx.runQuery(api.queries.users.getUserByEmail, {
            email: args.email,
        });

        if (!user) {
            // Return success even if user not found for security (prevent email enumeration)
            return { success: true };
        }

        // 2. Verify user has the required role
        // For admin portal, we require admin privileges
        // For staff portal, we require staff privileges
        const authenticatedUser = {
            _id: user._id,
            email: user.email,
            roles: user.roles || [],
            status: user.status
        };

        let hasAccess = false;
        if (args.role === "admin") {
            hasAccess = isAdmin(authenticatedUser);
        } else if (args.role === "staff") {
            hasAccess = isStaff(authenticatedUser);
        } else {
            // Default check for other roles if ever added
            hasAccess = user.roles && user.roles.includes(args.role);
        }

        if (!hasAccess) {
            console.warn(`User ${args.email} attempted password reset for role ${args.role} but lacks permissions`);
            return { success: true };
        }

        // 3. Generate token
        const token = randomBytes(32).toString("hex");
        const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour

        // 4. Store token (unhashed for simplicity in this implementation, 
        // but usually should be hashed if stored in a persistent DB)
        await ctx.runMutation(api.mutations.password_reset.createResetToken, {
            email: args.email,
            token: token,
            expiresAt: expiresAt,
        });

        // 5. Send Email
        const defaultBaseUrl = "https://app.cribnosh.co.uk";
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || defaultBaseUrl;
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
