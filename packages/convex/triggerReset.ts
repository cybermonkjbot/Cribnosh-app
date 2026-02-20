"use node";
// @ts-nocheck
import { api } from "./_generated/api";
import { action } from "./_generated/server";

export default action({
    args: {},
    handler: async (ctx) => {
        try {
            console.log("Triggering reset email for joshua@marvengrey.africa");
            await ctx.runAction(api.actions.password_reset_action.sendPasswordResetEmail, {
                email: "joshua@marvengrey.africa",
                role: "admin",
            });
            return { success: true };
        } catch (e) {
            console.error(e);
            return "Error: " + e.toString();
        }
    }
});
