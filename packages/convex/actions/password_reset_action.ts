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
        console.log(`[sendPasswordResetEmail] START — email: ${args.email}, role: ${args.role}`);

        // 1. Verify user exists
        const user = await ctx.runQuery(api.queries.users.getUserByEmail, {
            email: args.email,
        });

        if (!user) {
            // Return success even if user not found for security (prevent email enumeration)
            console.warn(`[sendPasswordResetEmail] User not found for email: ${args.email} — returning success (anti-enumeration)`);
            return { success: true };
        }

        console.log(`[sendPasswordResetEmail] User found — id: ${user._id}, roles: ${JSON.stringify(user.roles)}, status: ${user.status}`);

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

        console.log(`[sendPasswordResetEmail] Role check — role: ${args.role}, hasAccess: ${hasAccess}`);

        if (!hasAccess) {
            console.warn(`[sendPasswordResetEmail] DENIED — ${args.email} lacks role '${args.role}'. Actual roles: ${JSON.stringify(user.roles)}`);
            return { success: true };
        }

        // 3. Generate token
        const token = randomBytes(32).toString("hex");
        const expiresAt = Date.now() + 60 * 60 * 1000; // 1 hour
        console.log(`[sendPasswordResetEmail] Token generated — expiresAt: ${new Date(expiresAt).toISOString()} (token prefix: ${token.slice(0, 8)}…)`);

        // 4. Store token (unhashed for simplicity in this implementation, 
        // but usually should be hashed if stored in a persistent DB)
        await ctx.runMutation(api.mutations.password_reset.createResetToken, {
            email: args.email,
            token: token,
            expiresAt: expiresAt,
        });
        console.log(`[sendPasswordResetEmail] Reset token stored in DB`);

        // 5. Send Email
        const defaultBaseUrl = "https://cribnosh.co.uk";
        // SITE_URL must be set as a Convex environment variable (dashboard > Settings > Environment Variables).
        // NEXT_PUBLIC_APP_URL from the web app's .env.local is NOT accessible to Convex cloud actions.
        const baseUrl = process.env.SITE_URL || process.env.NEXT_PUBLIC_APP_URL || defaultBaseUrl;
        const resetUrl = `${baseUrl}/${args.role}/reset-password?token=${token}`;
        console.log(`[sendPasswordResetEmail] Sending reset email — to: ${args.email}, baseUrl: ${baseUrl}, role: ${args.role}`);

        await ctx.runAction(internal.actions.resend.sendTemplateEmail, {
            emailType: "password_reset",
            to: args.email,
            variables: {
                userName: user.name,
                resetUrl: resetUrl,
                expiryHours: "1",
            },
        });

        console.log(`[sendPasswordResetEmail] SUCCESS — email dispatched to ${args.email}`);
        return { success: true };
    },
} as any);
