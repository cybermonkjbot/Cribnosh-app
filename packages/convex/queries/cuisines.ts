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

        let baseQuery = ctx.db
            .query("cuisines")
            .filter((q) => q.eq(q.field("status"), "approved"));

        if (search) {
            const searchLower = search.toLowerCase();
            baseQuery = baseQuery.filter((q) =>
                q.or(
                    q.contains(q.field("name"), searchLower),
                    q.contains(q.field("description"), searchLower)
                )
            );
        }

        return await baseQuery.order("desc").paginate(paginationOpts);
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
