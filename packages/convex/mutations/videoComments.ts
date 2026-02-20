// @ts-nocheck
import { v } from "convex/values";
import { mutation } from "../_generated/server";

// Add comment to video
export const addComment = mutation({
  args: {
    videoId: v.id("videoPosts"),
    content: v.string(),
    parentCommentId: v.optional(v.id("videoComments")),
  },
  returns: v.id("videoComments"),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from token
    const email = identity.tokenIdentifier.split(':')[1];
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', email))
      .first();
    if (!user) {
      throw new Error("User not found");
    }

    // Check if video exists
    const video = await ctx.db.get(args.videoId);
    if (!video) {
      throw new Error("Video not found");
    }

    // If replying to a comment, check if parent comment exists
    if (args.parentCommentId) {
      const parentComment = await ctx.db.get(args.parentCommentId);
      if (!parentComment || parentComment.videoId !== args.videoId) {
        throw new Error("Parent comment not found");
      }
    }

    // Create comment
    const commentId = await ctx.db.insert('videoComments', {
      videoId: args.videoId,
      userId: user._id,
      content: args.content,
      parentCommentId: args.parentCommentId,
      likesCount: 0,
      status: "active",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update video comments count
    await ctx.db.patch(args.videoId, {
      commentsCount: video.commentsCount + 1,
      updatedAt: Date.now(),
    });

    // Notify video creator (skip if commenter is the creator)
    if (video.userId && video.userId !== user._id) {
      await ctx.db.insert('notifications', {
        userId: video.userId,
        type: 'social_comment',
        title: 'New comment',
        message: `${user.name} commented on your video "${video.title}"`,
        data: { videoId: args.videoId, videoTitle: video.title, commentId, commenterName: user.name, commentPreview: args.content.slice(0, 80) },
        createdAt: Date.now(),
        read: false,
      });
    }

    return commentId;
  },
});

// Update comment
export const updateComment = mutation({
  args: {
    commentId: v.id("videoComments"),
    content: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from token
    const email = identity.tokenIdentifier.split(':')[1];
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check if user is the author or admin
    const isAuthor = comment.userId === user._id;
    const isAdmin = user.roles?.includes('admin');

    if (!isAuthor && !isAdmin) {
      throw new Error("Not authorized to update this comment");
    }

    // Update comment
    await ctx.db.patch(args.commentId, {
      content: args.content,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Delete comment
export const deleteComment = mutation({
  args: {
    commentId: v.id("videoComments"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from token
    const email = identity.tokenIdentifier.split(':')[1];
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check if user is the author or admin
    const isAuthor = comment.userId === user._id;
    const isAdmin = user.roles?.includes('admin');

    if (!isAuthor && !isAdmin) {
      throw new Error("Not authorized to delete this comment");
    }

    // Soft delete comment
    await ctx.db.patch(args.commentId, {
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

    return null;
  },
});

// Like comment
export const likeComment = mutation({
  args: {
    commentId: v.id("videoComments"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from token
    const email = identity.tokenIdentifier.split(':')[1];
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Check if already liked and handle like/unlike
    const existingLike = await ctx.db
      .query('commentLikes')
      .withIndex('by_comment_user', q => q.eq('commentId', args.commentId).eq('userId', user._id))
      .first();

    let newLikesCount = comment.likesCount;

    if (existingLike) {
      // User already liked, so unlike (remove the like)
      await ctx.db.delete(existingLike._id);
      newLikesCount = Math.max(0, newLikesCount - 1);
    } else {
      // User hasn't liked yet, so add the like
      await ctx.db.insert('commentLikes', {
        commentId: args.commentId,
        userId: user._id,
        likedAt: Date.now()
      });
      newLikesCount = newLikesCount + 1;
    }

    await ctx.db.patch(args.commentId, {
      likesCount: newLikesCount,
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Flag comment for moderation
export const flagComment = mutation({
  args: {
    commentId: v.id("videoComments"),
    reason: v.union(
      v.literal("inappropriate_content"),
      v.literal("spam"),
      v.literal("harassment"),
      v.literal("violence"),
      v.literal("other")
    ),
    description: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Get user from token
    const email = identity.tokenIdentifier.split(':')[1];
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', q => q.eq('email', email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // Get comment
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    // Update comment status to flagged
    await ctx.db.patch(args.commentId, {
      status: "flagged",
      updatedAt: Date.now(),
    });

    return null;
  },
});
