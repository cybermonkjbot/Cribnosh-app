"use node";
// @ts-nocheck
import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalAction } from "../_generated/server";

/**
 * Main job processor that runs on a schedule to handle background tasks.
 * It fetches the next available job from the queue and executes the appropriate handler.
 */
export const processQueue: any = internalAction({
    args: {
        processorId: v.string(), // Unique ID for this processor instance (e.g., node-1)
    },
    handler: async (ctx: any, args: any) => {
        // 0. Pre-check: see if anything is available to do before trying to do it
        const pendingCount = await ctx.runQuery(internal.queries.jobQueue.getPendingCount);
        if (pendingCount === 0) {
            return;
        }

        // 1. Get next job
        const job = await ctx.runMutation(internal.mutations.jobQueue.getNextJob, {
            processorId: args.processorId,
        });

        if (!job) {
            return;
        }

        console.log(`[Processor:${args.processorId}] Processing job: ${job.jobId} (${job.jobType})`);

        try {
            // 2. Dispatch to handler
            switch (job.jobType) {
                case "moderation_check":
                    await handleModerationCheck(ctx, job.payload);
                    break;
                case "content_publish":
                    await handleContentPublish(ctx, job.payload);
                    break;
                case "report_alert":
                    await handleReportAlert(ctx, job.payload);
                    break;
                case "evaluate_creator":
                    await handleEvaluateCreator(ctx, job.payload);
                    break;
                default:
                    throw new Error(`Unknown job type: ${job.jobType}`);
            }

            // 3. Mark as completed
            await ctx.runMutation(internal.mutations.jobQueue.completeJob, {
                jobId: job.jobId,
                lockId: job.lockId,
            });

            console.log(`[Processor:${args.processorId}] Job ${job.jobId} completed successfully.`);
        } catch (error: any) {
            console.error(`[Processor:${args.processorId}] Job ${job.jobId} failed:`, error.message);

            // 4. Mark as failed
            await ctx.runMutation(internal.mutations.jobQueue.failJob, {
                jobId: job.jobId,
                lockId: job.lockId,
                error: error.message,
            });
        }
    },
} as any);

/**
 * Handle automated moderation checks for content.
 * Performs keyword filtering and flags content if violations are found.
 */
async function handleModerationCheck(ctx: any, payload: any) {
    const { contentId, type, text } = payload;

    // Fetch dynamic moderation config
    const config = await ctx.runQuery((internal as any).moderation.getModerationConfigInternal);
    const prohibitedKeywords = config.prohibitedKeywords || [];

    const foundKeywords = prohibitedKeywords.filter((kw: string) =>
        text?.toLowerCase().includes(kw.toLowerCase())
    );

    if (foundKeywords.length > 0) {
        console.log(`[Moderation] Content ${contentId} flagged for: ${foundKeywords.join(", ")}`);

        // Update content status to flagged
        if (type === 'video') {
            await ctx.runMutation(internal.mutations.videoPosts.updateVideoPostInternal, {
                videoId: contentId,
                status: "flagged",
                moderationNote: `System flagged: Found prohibited keywords (${foundKeywords.join(", ")})`,
            });
        } else {
            await ctx.runMutation(internal.mutations.admin.updateContent, {
                contentId: contentId,
                status: "archived",
                metadata: {
                    moderationNote: `System flagged: Found prohibited keywords (${foundKeywords.join(", ")})`
                }
            });
        }

        // Alert admins and log activity
        await ctx.runMutation(internal.mutations.admin.createAdminNotification, {
            type: "system_alert",
            title: "Automated Content Flag",
            message: `System flagged ${type} content (${contentId}) due to prohibited keywords: ${foundKeywords.join(", ")}`,
            priority: "high",
            category: "moderation",
            metadata: { contentId, type }
        });
    }
}

/**
 * Handle scheduled content publishing.
 */
async function handleContentPublish(ctx: any, payload: any) {
    const { contentId, type } = payload;

    if (type === 'video') {
        await ctx.runMutation(internal.mutations.videoPosts.publishVideoPostForSeed, { videoId: contentId });
    } else {
        await ctx.runMutation(internal.mutations.admin.publishContent, { contentId });
    }

    console.log(`[Content] Successfully published ${type}: ${contentId}`);
}

/**
 * Handle alerts for high-priority reports.
 */
async function handleReportAlert(ctx: any, payload: any) {
    const { reportId, severity } = payload;

    // Create an admin notification for high severity reports
    if (severity === 'high' || severity === 'urgent') {
        await ctx.runMutation(internal.mutations.admin.insertAdminLog, {
            action: "URGENT_REPORT_ALERT",
            details: { reportId, payload },
            adminId: "system" as any, // System user
        });
    }
}

/**
 * Evaluate creator violation thresholds.
 */
async function handleEvaluateCreator(ctx: any, payload: any) {
    const { chefId } = payload;

    // Fetch dynamic moderation config
    const config = await ctx.runQuery((internal as any).moderation.getModerationConfigInternal);
    const threshold = config.violationThreshold || 3;

    // Get actual violation count
    const violationCount = await ctx.runQuery((internal as any).moderation.getCreatorViolationCount, { chefId });

    if (violationCount >= threshold) {
        console.log(`[Moderation] Creator ${chefId} exceeded violation threshold (${violationCount}/${threshold})`);

        const action = config.autoSuspendEnabled ? "suspended" : "flagged";

        await ctx.runMutation(internal.mutations.foodCreators.adminModerateFoodCreator, {
            chefId,
            status: action,
            moderationNote: `System evaluated: ${violationCount} resolved violations detected (Threshold: ${threshold}).`,
        });

        // Notify admins
        await ctx.runMutation(internal.mutations.admin.createAdminNotification, {
            type: "system_alert",
            title: `Creator Auto-${action === 'suspended' ? 'Suspended' : 'Flagged'}`,
            message: `Creator ${chefId} has been ${action} after reaching ${violationCount} violations.`,
            priority: "urgent",
            category: "moderation",
            metadata: { chefId, violationCount }
        });
    }
}
