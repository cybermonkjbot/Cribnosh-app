"use node";

import { v } from "convex/values";
import { api } from "../_generated/api";
import { Id } from "../_generated/dataModel";
import { action } from "../_generated/server";

/**
 * Helper to authenticate user from session token
 */
async function authenticateUser(ctx: any, sessionToken: string): Promise<Id<"users"> | null> {
  const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
    sessionToken,
  });
  return user?._id || null;
}

/**
 * Customer Get Live Streams - for mobile app direct Convex communication
 */
export const customerGetLiveStreams = action({
  args: {
    sessionToken: v.string(),
    page: v.optional(v.number()),
    limit: v.optional(v.number()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      streams: v.array(v.any()),
      total: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      const limit = args.limit || 20;
      const page = args.page || 1;
      const offset = (page - 1) * limit;

      let streams: any[] = [];

      // If location is provided, use nearby sessions
      if (args.latitude !== undefined && args.longitude !== undefined) {
        const nearbySessions = await ctx.runQuery(api.queries.liveSessions.getNearbyLiveSessions, {
          latitude: args.latitude,
          longitude: args.longitude,
          maxDistanceKm: 50,
        });

        streams = nearbySessions.map((session) => ({
          id: session._id,
          kitchen_name: session.title || 'Live Kitchen',
          chef_name: 'Chef', // Will need to fetch chef name
          viewer_count: session.viewerCount || 0,
          is_live: session.isActive,
          thumbnail_url: session.thumbnailUrl,
          description: session.description || '',
          started_at: session.startedAt,
        }));
      } else {
        // Get all active live sessions
        const activeSessions = await ctx.runQuery(api.queries.presence.getActiveSessions, {});

        streams = activeSessions.slice(offset, offset + limit).map((session: any) => ({
          id: session._id,
          kitchen_name: session.title || 'Live Kitchen',
          chef_name: 'Chef', // Will need to fetch chef name
          viewer_count: session.viewerCount || 0,
          is_live: session.status === 'live',
          thumbnail_url: session.thumbnailUrl,
          description: session.description || '',
          started_at: session.actual_start_time || session.scheduled_start_time,
        }));
      }

      return {
        success: true as const,
        streams,
        total: streams.length,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get live streams';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Live Session - for mobile app direct Convex communication
 */
export const customerGetLiveSession = action({
  args: {
    sessionToken: v.string(),
    sessionId: v.string(),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      session: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      const session = await ctx.runQuery(api.queries.liveSessions.getLiveSessionWithMeal, {
        sessionId: args.sessionId,
      });

      if (!session) {
        return { success: false as const, error: 'Live session not found' };
      }

      return {
        success: true as const,
        session: {
          id: session._id,
          channel_name: session.channelName || session.session_id,
          title: session.title,
          description: session.description,
          chef_id: session.chefId,
          meal_id: session.mealId,
          is_live: session.isActive,
          viewer_count: session.viewerCount || 0,
          thumbnail_url: session.thumbnailUrl,
          started_at: session.startedAt,
          ended_at: session.endedAt,
          meal: session.meal,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get live session';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Live Comments - for mobile app direct Convex communication
 */
export const customerGetLiveComments = action({
  args: {
    sessionToken: v.string(),
    sessionId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    commentType: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      comments: v.array(v.any()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      const comments = await ctx.runQuery(api.queries.liveSessions.getLiveComments, {
        sessionId: args.sessionId as Id<"liveSessions">,
        limit: args.limit || 50,
        offset: args.offset || 0,
        commentType: args.commentType as any,
      });

      return {
        success: true as const,
        comments: comments.map((comment: any) => ({
          id: comment._id,
          content: comment.content,
          comment_type: comment.commentType,
          sent_by: comment.sent_by,
          user_display_name: comment.user_display_name,
          sent_at: comment.sent_at,
        })),
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get live comments';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Send Live Comment - for mobile app direct Convex communication
 */
export const customerSendLiveComment = action({
  args: {
    sessionToken: v.string(),
    sessionId: v.string(),
    content: v.string(),
    commentType: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      comment: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Get user details for display name
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      const comment = await ctx.runMutation(api.mutations.liveSessions.sendLiveComment, {
        sessionId: args.sessionId as Id<"liveSessions">,
        sentBy: userId,
        content: args.content,
        commentType: (args.commentType || 'general') as any,
        metadata: {
          userDisplayName: user?.name || user?.email || 'Anonymous',
          sentByRole: 'viewer',
        },
      });

      return {
        success: true as const,
        comment: {
          id: comment._id,
          content: comment.content,
          comment_type: comment.commentType,
          sent_by: comment.sent_by,
          user_display_name: comment.user_display_name,
          sent_at: comment.sent_at,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to send live comment';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Live Reactions - for mobile app direct Convex communication
 */
export const customerGetLiveReactions = action({
  args: {
    sessionToken: v.string(),
    sessionId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    reactionType: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      reactions: v.array(v.any()),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      const reactions = await ctx.runQuery(api.queries.liveSessions.getLiveReactions, {
        sessionId: args.sessionId as Id<"liveSessions">,
        limit: args.limit || 100,
        offset: args.offset || 0,
        reactionType: args.reactionType as any,
      });

      return {
        success: true as const,
        reactions: reactions.map((reaction: any) => ({
          id: reaction._id,
          reaction_type: reaction.reactionType,
          intensity: reaction.intensity,
          sent_by: reaction.sent_by,
          user_display_name: reaction.user_display_name,
          sent_at: reaction.sent_at,
        })),
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get live reactions';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Send Live Reaction - for mobile app direct Convex communication
 */
export const customerSendLiveReaction = action({
  args: {
    sessionToken: v.string(),
    sessionId: v.string(),
    reactionType: v.string(),
    intensity: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      reaction: v.any(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Get user details for display name
      const user = await ctx.runQuery(api.queries.users.getUserBySessionToken, {
        sessionToken: args.sessionToken,
      });

      const reaction = await ctx.runMutation(api.mutations.liveSessions.sendLiveReaction, {
        sessionId: args.sessionId as Id<"liveSessions">,
        sentBy: userId,
        reactionType: args.reactionType as any,
        intensity: (args.intensity || 'medium') as any,
        metadata: {
          userDisplayName: user?.name || user?.email || 'Anonymous',
          sentByRole: 'viewer',
        },
      });

      return {
        success: true as const,
        reaction: {
          id: reaction._id,
          reaction_type: reaction.reactionType,
          intensity: reaction.intensity,
          sent_by: reaction.sent_by,
          user_display_name: reaction.user_display_name,
          sent_at: reaction.sent_at,
        },
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to send live reaction';
      return { success: false as const, error: errorMessage };
    }
  },
});

/**
 * Customer Get Live Viewers - for mobile app direct Convex communication
 */
export const customerGetLiveViewers = action({
  args: {
    sessionToken: v.string(),
    sessionId: v.string(),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  returns: v.union(
    v.object({
      success: v.literal(true),
      viewers: v.array(v.any()),
      total: v.number(),
    }),
    v.object({
      success: v.literal(false),
      error: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    try {
      const userId = await authenticateUser(ctx, args.sessionToken);
      if (!userId) {
        return { success: false as const, error: 'Authentication required' };
      }

      // Get viewers from presence system
      const presenceData = await ctx.runQuery(api.queries.presence.getSessionPresence, {
        sessionId: args.sessionId as Id<"liveSessions">,
      });

      const viewers = presenceData?.viewers || [];
      const limit = args.limit || 50;
      const offset = args.offset || 0;
      const paginatedViewers = viewers.slice(offset, offset + limit);

      return {
        success: true as const,
        viewers: paginatedViewers.map((viewer: any) => ({
          user_id: viewer.userId,
          display_name: viewer.displayName || 'Anonymous',
          joined_at: viewer.joinedAt,
        })),
        total: viewers.length,
      };
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to get live viewers';
      return { success: false as const, error: errorMessage };
    }
  },
});

