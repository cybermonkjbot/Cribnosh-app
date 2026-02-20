// @ts-nocheck
"use node";
import { api } from "./_generated/api";
import { action } from "./_generated/server";

export default action({
    args: {},
    handler: async (ctx) => {
        try {
            const email = "joshua@marvengrey.africa";

            console.log("1. Generating token through normal flow");
            await ctx.runAction(api.actions.password_reset_action.sendPasswordResetEmail, {
                email,
                role: "admin",
            });

            console.log("2. Fetching the created token");
            const tokens = await ctx.runQuery(api.viewActiveTokens.default as any);
            if (!tokens || tokens.length === 0) {
                return { success: false, error: "Token was not created" };
            }
            const tokenObj = tokens[0];
            const token = tokenObj.token;

            console.log("3. Extracted Token:", token, "| Is Used?", tokenObj.used);

            console.log("4. Calling resetPasswordWithToken (Simulating UI Submit)");
            const result = await ctx.runAction(api.actions.password_reset_execution.resetPasswordWithToken, {
                token,
                newPassword: "TestPassword123!",
            });

            console.log("5. Final Result:", result);
            return result;
        } catch (e) {
            console.error(e);
            return "Error: " + e.toString();
        }
    }
});
