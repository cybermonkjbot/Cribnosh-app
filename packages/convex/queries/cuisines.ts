import { v } from "convex/values";
import { query } from "../_generated/server";

export const listApproved = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db
            .query("cuisines")
            .filter((q) => q.eq(q.field("status"), "approved"))
            .collect();
    },
});

export const getByName = query({
    args: { name: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("cuisines")
            .filter((q) => q.eq(q.field("name"), args.name))
            .first();
    },
});
