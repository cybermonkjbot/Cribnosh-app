// @ts-nocheck
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const getConfigs = query({
    args: {
        category: v.optional(v.string()),
        configId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.configId && args.category) {
            // Get specific config
            const config = await ctx.db
                .query("emailConfigs")
                .withIndex("by_category_id", (q) =>
                    q.eq("category", args.category!).eq("configId", args.configId!)
                )
                .first();
            return config ? { config: config.config } : null;
        } else if (args.category) {
            // Get all configs for category
            const configs = await ctx.db
                .query("emailConfigs")
                .withIndex("by_category", (q) => q.eq("category", args.category!))
                .collect();
            // Unwrap the config object to match expected API shape
            return { configs: configs.map(c => c.config) };
        } else {
            // Get all configs grouped
            const allConfigs = await ctx.db.query("emailConfigs").collect();
            // This might be heavy, but strictly following legacy API shape
            // The legacy API returned: { configs: { templates: [], ... } }
            // but `emailAdminConfigManager.getAllConfigs()` returns object with keys per category.
            // We will return a similar structure.
            const result: Record<string, any[]> = {};
            for (const doc of allConfigs) {
                if (!result[doc.category]) result[doc.category] = [];
                result[doc.category].push(doc.config);
            }
            return { configs: result };
        }
    },
});

export const saveConfig = mutation({
    args: {
        category: v.string(),
        configId: v.string(),
        config: v.any(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("emailConfigs")
            .withIndex("by_category_id", (q) =>
                q.eq("category", args.category).eq("configId", args.configId)
            )
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                config: args.config,
                lastModified: Date.now(),
                isActive: args.config.isActive,
            });
        } else {
            await ctx.db.insert("emailConfigs", {
                category: args.category,
                configId: args.configId,
                config: args.config,
                lastModified: Date.now(),
                isActive: args.config.isActive,
            });
        }
        return { success: true };
    },
});

export const importConfigs = mutation({
    args: {
        category: v.string(),
        configs: v.any(), // Array of configs
    },
    handler: async (ctx, args) => {
        const configs = args.configs;
        if (!Array.isArray(configs)) {
            throw new Error("Configs must be an array");
        }

        let count = 0;
        for (const config of configs) {
            // Determine configId based on category and config shape
            let configId = "";
            if (args.category === "templates") configId = config.templateId;
            else if (args.category === "automations") configId = config.automationId;
            else if (args.category === "branding") configId = config.brandId;
            else if (args.category === "delivery") configId = config.provider;
            else if (args.category === "analytics") configId = config.configId;
            else if (args.category === "compliance") configId = config.configId;

            if (!configId) continue;

            const existing = await ctx.db
                .query("emailConfigs")
                .withIndex("by_category_id", (q) =>
                    q.eq("category", args.category).eq("configId", configId)
                )
                .first();

            if (existing) {
                await ctx.db.patch(existing._id, {
                    config,
                    lastModified: Date.now(),
                    isActive: config.isActive,
                });
            } else {
                await ctx.db.insert("emailConfigs", {
                    category: args.category,
                    configId,
                    config,
                    lastModified: Date.now(),
                    isActive: config.isActive,
                });
            }
            count++;
        }
        return { success: true, count };
    },
});

export const deleteConfig = mutation({
    args: {
        category: v.string(),
        configId: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query("emailConfigs")
            .withIndex("by_category_id", (q) =>
                q.eq("category", args.category).eq("configId", args.configId)
            )
            .first();

        if (existing) {
            await ctx.db.delete(existing._id);
            return { success: true };
        }
        return { success: false, message: "Not found" };
    },
});
