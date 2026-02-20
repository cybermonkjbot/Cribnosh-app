import { query } from "./_generated/server";

export default query({
    args: {},
    handler: async (ctx) => {
        // Return all tokens created in the last 15 minutes
        const tokens = await ctx.db
            .query("passwordResetTokens")
            .order("desc")
            .take(10);

        return tokens.map(t => ({
            ...t,
            expiresAtNice: new Date(t.expiresAt).toISOString(),
            isExpired: Date.now() > t.expiresAt
        }));
    }
});
