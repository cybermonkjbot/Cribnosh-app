"use node";
import { api } from "./_generated/api";
import { action } from "./_generated/server";

export default action({
    args: {},
    handler: async (ctx) => {
        try {
            const email = "joshua@marvengrey.africa";
            const token = Math.random().toString(36).substring(2);

            console.log("Creating token:", token);
            await ctx.runMutation(api.mutations.password_reset.createResetToken, {
                email,
                token,
                expiresAt: Date.now() + 60 * 60 * 1000,
            });

            console.log("Verifying token:", token);
            const verification = await ctx.runMutation(api.mutations.password_reset.verifyAndUseToken, {
                token
            });

            console.log("Verification result:", verification);
            return verification;
        } catch (e) {
            console.error(e);
            return "Error: " + e.toString();
        }
    }
});
