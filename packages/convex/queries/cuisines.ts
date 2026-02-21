// @ts-nocheck
import { paginationOptsValidator } from "convex/server";
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

export const listPaginated = query({
    args: {
        paginationOpts: paginationOptsValidator,
        search: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { paginationOpts, search } = args;

        if (search) {
            return await ctx.db
                .query("cuisines")
                .withSearchIndex("search_name", (q) => q.search("name", search))
                .filter((q) => q.eq(q.field("status"), "approved"))
                .paginate(paginationOpts);
        }

        return await ctx.db
            .query("cuisines")
            .filter((q) => q.eq(q.field("status"), "approved"))
            .order("desc")
            .paginate(paginationOpts);
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
