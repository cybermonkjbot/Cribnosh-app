import { query } from "../_generated/server";
import { v } from "convex/values";

// Admin: Get all comments (video, live, content) with enriched data
export const getAllCommentsForAdmin = query({
  args: {
    limit: v.optional(v.number()),
    commentType: v.optional(v.union(
      v.literal("video"),
      v.literal("live"),
      v.literal("content")
    )),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.email) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!user || !Array.isArray(user.roles) || !user.roles.includes("admin")) {
      throw new Error("Not authorized");
    }

    const limit = args.limit || 1000;
    const results: any[] = [];

    // Get video comments
    if (!args.commentType || args.commentType === "video") {
      const videoComments = await ctx.db
        .query("videoComments")
        .order("desc")
        .take(limit);

      for (const comment of videoComments) {
        const commentUser = await ctx.db.get(comment.userId);
        const video = await ctx.db.get(comment.videoId);
        
        results.push({
          _id: comment._id,
          _creationTime: comment._creationTime,
          type: "video" as const,
          content: comment.content,
          userId: comment.userId,
          user: commentUser ? {
            _id: commentUser._id,
            name: commentUser.name || "Unknown",
            avatar: commentUser.avatar,
          } : null,
          parentCommentId: comment.parentCommentId,
          likesCount: comment.likesCount,
          status: comment.status,
          createdAt: comment.createdAt,
          updatedAt: comment.updatedAt,
          video: video ? {
            _id: video._id,
            title: video.title,
            thumbnailUrl: video.thumbnailStorageId 
              ? await ctx.storage.getUrl(video.thumbnailStorageId) || undefined
              : undefined,
          } : null,
          entityId: comment.videoId,
        });
      }
    }

    // Get live comments
    if (!args.commentType || args.commentType === "live") {
      const liveComments = await ctx.db
        .query("liveComments")
        .order("desc")
        .take(limit);

      for (const comment of liveComments) {
        const commentUser = await ctx.db.get(comment.sent_by);
        const session = await ctx.db.get(comment.session_id);
        
        results.push({
          _id: comment._id,
          _creationTime: comment._creationTime,
          type: "live" as const,
          content: comment.content,
          userId: comment.sent_by,
          user: commentUser ? {
            _id: commentUser._id,
            name: commentUser.name || comment.user_display_name || "Unknown",
            avatar: commentUser.avatar,
          } : {
            _id: comment.sent_by,
            name: comment.user_display_name || "Unknown",
            avatar: undefined,
          },
          commentType: comment.commentType,
          status: comment.status,
          createdAt: comment.sent_at,
          updatedAt: comment.moderated_at || comment.sent_at,
          session: session ? {
            _id: session._id,
            title: session.title,
            thumbnailUrl: session.thumbnailUrl,
          } : null,
          entityId: comment.session_id,
        });
      }
    }

    // Get content comments
    if (!args.commentType || args.commentType === "content") {
      const contentComments = await ctx.db
        .query("contentComments")
        .order("desc")
        .take(limit);

      for (const comment of contentComments) {
        const commentUser = await ctx.db.get(comment.userId);
        const content = await ctx.db.get(comment.contentId);
        
        results.push({
          _id: comment._id,
          _creationTime: comment._creationTime,
          type: "content" as const,
          content: comment.comment,
          userId: comment.userId,
          user: commentUser ? {
            _id: commentUser._id,
            name: commentUser.name || "Unknown",
            avatar: commentUser.avatar,
          } : null,
          parentCommentId: comment.parentCommentId,
          status: comment.status,
          createdAt: comment.commentedAt,
          updatedAt: comment.commentedAt,
          contentItem: content ? {
            _id: content._id,
            title: content.title,
            type: content.type,
          } : null,
          entityId: comment.contentId,
        });
      }
    }

    // Sort all by creation time (newest first)
    results.sort((a, b) => b._creationTime - a._creationTime);

    return results.slice(0, limit);
  },
});

