import { v } from "convex/values";
import { mutation } from "../_generated/server";

export const createTemplate = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        subject: v.string(),
        htmlContent: v.string(),
        previewImageStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const templateId = await ctx.db.insert("emailTemplates", {
            ...args,
            createdAt: now,
            updatedAt: now,
        });
        return templateId;
    },
});

export const update = mutation({
    args: {
        id: v.id("emailTemplates"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        subject: v.optional(v.string()),
        htmlContent: v.optional(v.string()),
        previewImageStorageId: v.optional(v.id("_storage")),
    },
    handler: async (ctx, args) => {
        const { id, ...updates } = args;
        await ctx.db.patch(id, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

export const deleteTemplate = mutation({
    args: {
        id: v.id("emailTemplates"),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.id);
    },
});

export const requestUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const saveAsset = mutation({
    args: {
        templateId: v.id("emailTemplates"),
        storageId: v.id("_storage"),
        originalName: v.string(),
        url: v.string(),
    },
    handler: async (ctx, args) => {
        const template = await ctx.db.get(args.templateId);
        if (!template) throw new Error("Template not found");

        const assets = template.assets || [];
        assets.push({
            storageId: args.storageId,
            originalName: args.originalName,
            url: args.url
        });

        await ctx.db.patch(args.templateId, { assets });
    }
});
