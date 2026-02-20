"use node";
// @ts-nocheck

import { v } from "convex/values";
import { api, internal } from "../_generated/api";
import { action } from "../_generated/server";

export const resetPasswordWithToken = (action as any)({
    args: {
        token: v.string(),
        newPassword: v.string(),
    },
    handler: async (ctx: any, args: any) => {
        console.log(`[resetPasswordWithToken] START — token prefix: ${args.token?.slice(0, 8)}…`);

        // 1. Verify and use token
        const verification = await ctx.runMutation(api.mutations.password_reset.verifyAndUseToken, {
            token: args.token,
        });

        if (!verification.success) {
            console.error(`[resetPasswordWithToken] Token verification FAILED — reason: ${verification.error}`);
            return { success: false, error: verification.error };
        }

        console.log(`[resetPasswordWithToken] Token verified — email: ${verification.email}`);

        // 2. Hash new password
        console.log(`[resetPasswordWithToken] Hashing new password…`);
        const hashedPassword = await ctx.runAction(api.actions.password.hashPasswordAction, {
            password: args.newPassword,
        });
        console.log(`[resetPasswordWithToken] Password hashed successfully`);

        // 3. Update user password
        console.log(`[resetPasswordWithToken] Updating password in DB for email: ${verification.email}`);
        await ctx.runMutation(internal.mutations.users._updateUserPasswordByEmailInternal, {
            email: verification.email,
            password: hashedPassword,
        });

        console.log(`[resetPasswordWithToken] SUCCESS — password updated for ${verification.email}`);
        return { success: true };
    },
});
