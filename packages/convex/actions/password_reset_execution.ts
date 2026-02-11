"use node";
// @ts-nocheck

import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { action } from "../_generated/server";

export const resetPasswordWithToken = action({
    args: {
        token: v.string(),
        newPassword: v.string(),
    },
    handler: async (ctx, args) => {
        // 1. Verify and use token
        const verification = await ctx.runMutation(api.mutations.password_reset.verifyAndUseToken, {
            token: args.token,
        });

        if (!verification.success) {
            return { success: false, error: verification.error };
        }

        // 2. Hash new password
        const hashedPassword = await ctx.runAction(api.actions.password.hashPasswordAction, {
            password: args.newPassword,
        });

        // 3. Update user password
        await ctx.runMutation(internal.mutations.users._updateUserPasswordByEmailInternal, {
            email: verification.email,
            password: hashedPassword,
        });

        return { success: true };
    },
});
