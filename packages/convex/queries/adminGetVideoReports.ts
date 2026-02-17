// @ts-nocheck
import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { isAdmin, isStaff, requireAuth } from "../utils/auth";

interface EnrichedVideoReport {
    _id: Id<"videoReports">;
    _creationTime: number;
    videoId: Id<"videoPosts">;
    reporterId: Id<"users">;
    reason: string;
    description?: string;
    status: "pending" | "reviewing" | "resolved" | "dismissed";
    createdAt: number;
    videoTitle?: string;
    creatorName?: string;
    reporterName?: string;
}

export const adminGetVideoReports = query({
    args: {
        status: v.optional(v.string()),
        limit: v.optional(v.number()),
        sessionToken: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<EnrichedVideoReport[]> => {
        const user = await requireAuth(ctx, args.sessionToken);

        if (!isAdmin(user) && !isStaff(user)) {
            throw new Error("Unauthorized: Admin or staff access required");
        }

        let reportsQuery = ctx.db.query("videoReports");

        if (args.status && args.status !== "all") {
            reportsQuery = reportsQuery.withIndex("by_status", (q) => q.eq("status", args.status as any));
        }

        const reports = await reportsQuery.order("desc").take(args.limit || 100);

        const enrichedReports = await Promise.all(
            reports.map(async (report) => {
                try {
                    const [video, reporter] = await Promise.all([
                        ctx.db.get(report.videoId),
                        ctx.db.get(report.reporterId),
                    ]);

                    let creatorName = "Unknown Creator";
                    if (video?.creatorId) {
                        const creator = await ctx.db.get(video.creatorId);
                        creatorName = creator?.name || "Unknown Creator";
                    }

                    return {
                        ...report,
                        videoTitle: video?.title || "Unknown Video",
                        creatorName,
                        reporterName: reporter?.name || "Unknown Reporter",
                    } as EnrichedVideoReport;
                } catch (error) {
                    console.error("Error enriching video report:", error);
                    return {
                        ...report,
                        videoTitle: "Error Loading Video",
                        creatorName: "Error Loading Creator",
                        reporterName: "Error Loading Reporter",
                    } as EnrichedVideoReport;
                }
            })
        );

        return enrichedReports;
    },
});
