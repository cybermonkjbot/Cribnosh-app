import { query } from "../_generated/server";
import { v } from "convex/values";

// Get comments for a video
export const getVideoComments = query({
  args: {
    videoId: v.id("videoPosts"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    comments: v.array(v.object({
      _id: v.id("videoComments"),
      _creationTime: v.number(),
      videoId: v.id("videoPosts"),
      userId: v.id("users"),
      content: v.string(),
      parentCommentId: v.optional(v.id("videoComments")),
      likesCount: v.number(),
      status: v.union(
        v.literal("active"),
        v.literal("deleted"),
        v.literal("flagged"),
        v.literal("hidden")
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
      user: v.object({
        _id: v.id("users"),
        name: v.string(),
        avatar: v.optional(v.string()),
      }),
      replies: v.array(v.object({
        _id: v.id("videoComments"),
        _creationTime: v.number(),
        videoId: v.id("videoPosts"),
        userId: v.id("users"),
        content: v.string(),
        parentCommentId: v.optional(v.id("videoComments")),
        likesCount: v.number(),
        status: v.union(
          v.literal("active"),
          v.literal("deleted"),
          v.literal("flagged"),
          v.literal("hidden")
        ),
        createdAt: v.number(),
        updatedAt: v.number(),
        user: v.object({
          _id: v.id("users"),
          name: v.string(),
          avatar: v.optional(v.string()),
        }),
      })),
    })),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cursor = args.cursor ? parseInt(args.cursor) : undefined;

    // Get top-level comments (no parent)
    let commentsQuery = ctx.db
      .query('videoComments')
      .withIndex('by_video', q => q.eq('videoId', args.videoId))
      .filter(q => q.eq(q.field('parentCommentId'), undefined))
      .filter(q => q.eq(q.field('status'), 'active'))
      .order('desc');

    if (cursor) {
      commentsQuery = commentsQuery.filter(q => q.lt(q.field('_creationTime'), cursor));
    }

    const comments = await commentsQuery.take(limit + 1);
    const hasMore = comments.length > limit;
    const commentsToReturn = hasMore ? comments.slice(0, limit) : comments;

    // Get user info and replies for each comment
    const commentsWithDetails = await Promise.all(
      commentsToReturn.map(async (comment) => {
        const user = await ctx.db.get(comment.userId);
        if (!user) {
          throw new Error("User not found");
        }

        // Get replies for this comment
        const replies = await ctx.db
          .query('videoComments')
          .withIndex('by_parent', q => q.eq('parentCommentId', comment._id))
          .filter(q => q.eq(q.field('status'), 'active'))
          .order('asc')
          .take(10); // Limit replies to 10 per comment

        // Get user info for replies
        const repliesWithUsers = await Promise.all(
          replies.map(async (reply) => {
            const replyUser = await ctx.db.get(reply.userId);
            if (!replyUser) {
              throw new Error("Reply user not found");
            }

            return {
              ...reply,
              user: {
                _id: replyUser._id,
                name: replyUser.name,
                avatar: replyUser.avatar,
              },
            };
          })
        );

        return {
          ...comment,
          user: {
            _id: user._id,
            name: user.name,
            avatar: user.avatar,
          },
          replies: repliesWithUsers,
        };
      })
    );

    const nextCursor = hasMore ? commentsToReturn[commentsToReturn.length - 1]._creationTime.toString() : undefined;

    return {
      comments: commentsWithDetails,
      nextCursor,
    };
  },
});

// Get comment by ID
export const getCommentById = query({
  args: {
    commentId: v.id("videoComments"),
  },
  returns: v.union(v.object({
    _id: v.id("videoComments"),
    _creationTime: v.number(),
    videoId: v.id("videoPosts"),
    userId: v.id("users"),
    content: v.string(),
    parentCommentId: v.optional(v.id("videoComments")),
    likesCount: v.number(),
    status: v.union(
      v.literal("active"),
      v.literal("deleted"),
      v.literal("flagged"),
      v.literal("hidden")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
    user: v.object({
      _id: v.id("users"),
      name: v.string(),
      avatar: v.optional(v.string()),
    }),
  }), v.null()),
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      return null;
    }

    const user = await ctx.db.get(comment.userId);
    if (!user) {
      throw new Error("User not found");
    }

    return {
      ...comment,
      user: {
        _id: user._id,
        name: user.name,
        avatar: user.avatar,
      },
    };
  },
});

// Get user's comments
export const getUserComments = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    comments: v.array(v.object({
      _id: v.id("videoComments"),
      _creationTime: v.number(),
      videoId: v.id("videoPosts"),
      userId: v.id("users"),
      content: v.string(),
      parentCommentId: v.optional(v.id("videoComments")),
      likesCount: v.number(),
      status: v.union(
        v.literal("active"),
        v.literal("deleted"),
        v.literal("flagged"),
        v.literal("hidden")
      ),
      createdAt: v.number(),
      updatedAt: v.number(),
      video: v.object({
        _id: v.id("videoPosts"),
        title: v.string(),
        thumbnailUrl: v.optional(v.string()),
        creatorId: v.id("users"),
      }),
    })),
    nextCursor: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit || 20;
    const cursor = args.cursor ? parseInt(args.cursor) : undefined;

    // Get user's comments
    let commentsQuery = ctx.db
      .query('videoComments')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .filter(q => q.eq(q.field('status'), 'active'))
      .order('desc');

    if (cursor) {
      commentsQuery = commentsQuery.filter(q => q.lt(q.field('_creationTime'), cursor));
    }

    const comments = await commentsQuery.take(limit + 1);
    const hasMore = comments.length > limit;
    const commentsToReturn = hasMore ? comments.slice(0, limit) : comments;

    // Get video info for each comment
    const commentsWithVideos = await Promise.all(
      commentsToReturn.map(async (comment) => {
        const video = await ctx.db.get(comment.videoId);
        if (!video) {
          throw new Error("Video not found");
        }

        return {
          ...comment,
          video: {
            _id: video._id,
            title: video.title,
            thumbnailUrl: video.thumbnailUrl,
            creatorId: video.creatorId,
          },
        };
      })
    );

    const nextCursor = hasMore ? commentsToReturn[commentsToReturn.length - 1]._creationTime.toString() : undefined;

    return {
      comments: commentsWithVideos,
      nextCursor,
    };
  },
});
