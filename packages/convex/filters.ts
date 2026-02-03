// @ts-nocheck
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const generateUploadUrl = mutation(async (ctx) => {
    return await ctx.storage.generateUploadUrl();
});

export const create = mutation({
    args: {
        name: v.string(),
        code: v.string(),
        iconStorageId: v.id("_storage"),
        isActive: v.boolean(),
        order: v.optional(v.number()),
        saturation: v.optional(v.number()),
        temperature: v.optional(v.number()),
        vignette: v.optional(v.number()),
        contrast: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const id = await ctx.db.insert("filters", {
            ...args,
            order: args.order ?? 0,
            saturation: args.saturation ?? 0,
            temperature: args.temperature ?? 0,
            vignette: args.vignette ?? 0,
            contrast: args.contrast ?? 0,
        });
        return id;
    },
});

export const update = mutation({
    args: {
        id: v.id("filters"),
        name: v.optional(v.string()),
        code: v.optional(v.string()),
        iconStorageId: v.optional(v.id("_storage")),
        isActive: v.optional(v.boolean()),
        order: v.optional(v.number()),
        saturation: v.optional(v.number()),
        temperature: v.optional(v.number()),
        vignette: v.optional(v.number()),
        contrast: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, updates);
    },
});

export const remove = mutation({
    args: {
        id: v.id("filters"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const list = query({
    args: {},
    handler: async (ctx) => {
        // Return all filters, we can sort them in memory/client for now or add index later
        const filters = await ctx.db.query("filters").collect();

        // Enrich with URL for display in admin
        return await Promise.all(
            filters.map(async (filter) => ({
                ...filter,
                iconUrl: await ctx.storage.getUrl(filter.iconStorageId),
            }))
        );
    },
});

export const listActive = query({
    args: {},
    handler: async (ctx) => {
        const filters = await ctx.db
            .query("filters")
            .withIndex("by_active", (q) => q.eq("isActive", true))
            .collect();

        // Client side sort by order if needed, or index
        filters.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        // Enrich with URL
        return await Promise.all(
            filters.map(async (filter) => ({
                ...filter,
                iconUrl: await ctx.storage.getUrl(filter.iconStorageId),
            }))
        );
    },
});
