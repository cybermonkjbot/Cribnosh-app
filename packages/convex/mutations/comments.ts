// @ts-nocheck
import { mutation } from "../_generated/server";
import { v } from "convex/values";
import { requireAdmin } from "../utils/auth";

// Admin: Delete any comment type
export const adminDeleteComment = mutation({
  args: {
    commentId: v.string(), // Can be videoComments, liveComments, or contentComments ID
    commentType: v.union(
      v.literal("video"),
      v.literal("live"),
      v.literal("content")
    ),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);

    if (args.commentType === "video") {
      const comment = await ctx.db.get(args.commentId as any);
      if (!comment) {
        throw new Error("Comment not found");
      }
      
      await ctx.db.patch(args.commentId as any, {
        status: "deleted",
        updatedAt: Date.now(),
      });

      // Update video comments count
      const video = await ctx.db.get(comment.videoId);
      if (video) {
        await ctx.db.patch(comment.videoId, {
          commentsCount: Math.max(0, video.commentsCount - 1),
          updatedAt: Date.now(),
        });
      }
    } else if (args.commentType === "live") {
      const comment = await ctx.db.get(args.commentId as any);
      if (!comment) {
        throw new Error("Comment not found");
      }
      
      await ctx.db.patch(args.commentId as any, {
        status: "deleted",
        moderated_at: Date.now(),
      });

      // Update session comments count
      const session = await ctx.db.get(comment.session_id);
      if (session) {
        await ctx.db.patch(comment.session_id, {
          totalComments: Math.max(0, (session.totalComments || 0) - 1),
        });
      }
    } else if (args.commentType === "content") {
      const comment = await ctx.db.get(args.commentId as any);
      if (!comment) {
        throw new Error("Comment not found");
      }
      
      await ctx.db.patch(args.commentId as any, {
        status: "deleted",
      });
    }

    return { success: true };
  },
});

// Admin: Update comment status
export const adminUpdateCommentStatus = mutation({
  args: {
    commentId: v.string(),
    commentType: v.union(
      v.literal("video"),
      v.literal("live"),
      v.literal("content")
    ),
    status: v.union(
      v.literal("active"),
      v.literal("deleted"),
      v.literal("flagged"),
      v.literal("hidden"),
      v.literal("moderated"),
      v.literal("muted")
    ),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx, args.sessionToken);

    if (args.commentType === "video") {
      await ctx.db.patch(args.commentId as any, {
        status: args.status as any,
        updatedAt: Date.now(),
      });
    } else if (args.commentType === "live") {
      await ctx.db.patch(args.commentId as any, {
        status: args.status as any,
        moderated_at: Date.now(),
      });
    } else if (args.commentType === "content") {
      await ctx.db.patch(args.commentId as any, {
        status: args.status as any,
      });
    }

    return { success: true };
  },
});

