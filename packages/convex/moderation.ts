// @ts-nocheck
import { v } from "convex/values";
import { internalQuery, mutation, query } from "./_generated/server";
import { isAdmin, requireStaff } from "./utils/auth";

/**
 * Get moderation settings from systemSettings.
 */
export const getModerationSettings = query({
    args: { sessionToken: v.optional(v.string()) },
    handler: async (ctx, args) => {
        await requireStaff(ctx, args.sessionToken);

        const settings = await ctx.db
            .query("systemSettings")
            .withIndex("by_key", (q) => q.eq("key", "moderation_config"))
            .first();

        return settings?.value || {
            prohibitedKeywords: ["scam", "fraud", "illegal", "violence", "threat", "hate", "harass"],
            violationThreshold: 3,
            autoSuspendEnabled: false,
        };
    },
});

/**
 * Internal query for the job processor to get moderation config.
 */
export const getModerationConfigInternal = internalQuery({
    args: {},
    handler: async (ctx) => {
        const settings = await ctx.db
            .query("systemSettings")
            .withIndex("by_key", (q) => q.eq("key", "moderation_config"))
            .first();

        return settings?.value || {
            prohibitedKeywords: ["scam", "fraud", "illegal", "violence", "threat", "hate", "harass"],
            violationThreshold: 3,
            autoSuspendEnabled: false,
        };
    },
});

/**
 * Update moderation settings.
 */
export const updateModerationSettings = mutation({
    args: {
        sessionToken: v.optional(v.string()),
        config: v.object({
            prohibitedKeywords: v.array(v.string()),
            violationThreshold: v.number(),
            autoSuspendEnabled: v.boolean(),
        }),
    },
    handler: async (ctx, args) => {
        const user = await requireStaff(ctx, args.sessionToken);
        if (!isAdmin(user)) {
            throw new Error("Only admins can update moderation settings");
        }

        const existing = await ctx.db
            .query("systemSettings")
            .withIndex("by_key", (q) => q.eq("key", "moderation_config"))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                value: args.config,
                lastModified: Date.now(),
                modifiedBy: user._id,
            });
        } else {
            await ctx.db.insert("systemSettings", {
                key: "moderation_config",
                value: args.config,
                lastModified: Date.now(),
                modifiedBy: user._id,
            });
        }

        // Log the change
        await ctx.db.insert("adminLogs", {
            action: "UPDATE_MODERATION_SETTINGS",
            details: args.config,
            timestamp: Date.now(),
            userId: user._id,
            adminId: user._id,
        });

        return { success: true };
    },
});

/**
 * Get count of resolved violations for a creator.
 */
export const getCreatorViolationCount = internalQuery({
    args: { chefId: v.id("chefs") },
    handler: async (ctx, args) => {
        // 1. Get all videos by this creator
        const videos = await ctx.db
            .query("videoPosts")
            .withIndex("by_creator", (q) => q.eq("creatorId", args.chefId))
            .collect();

        let totalViolations = 0;

        // 2. Count resolved reports for these videos
        for (const video of videos) {
            const resolvedReports = await ctx.db
                .query("videoReports")
                .withIndex("by_video", (q) => q.eq("videoId", video._id))
                .filter((q) => q.eq(q.field("status"), "resolved"))
                .collect();

            totalViolations += resolvedReports.length;
        }

        return totalViolations;
    },
});
