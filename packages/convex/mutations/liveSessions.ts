// @ts-nocheck
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { isAdmin, isStaff, requireAuth } from '../utils/auth';

export const createLiveSession = mutation({
  args: {
    channelName: v.string(),
    chefId: v.id("chefs"),
    title: v.string(),
    description: v.string(),
    mealId: v.id("meals"),
    thumbnailUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    location: v.optional(v.object({
      city: v.string(),
      coordinates: v.array(v.number()), // [longitude, latitude]
      address: v.optional(v.string()),
      radius: v.optional(v.number()), // Delivery radius in km
    })),
    sessionToken: v.optional(v.string()),
  },
  returns: v.id("liveSessions"),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Get the chef to verify ownership
    const chef = await ctx.db.get(args.chefId);
    if (!chef) {
      throw new Error('Chef not found');
    }

    // Users can only create live sessions for their own chef profile, staff/admin can create for any chef
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied: You can only create live sessions for yourself');
    }
    // Get chef location if session location not provided
    let sessionLocation = args.location;
    if (!sessionLocation) {
      const chef = await ctx.db.get(args.chefId);
      if (chef && chef.location) {
        sessionLocation = {
          city: chef.location.city,
          coordinates: chef.location.coordinates,
          radius: 10 // Default delivery radius
        };
      }
    }

    const sessionId = await ctx.db.insert("liveSessions", {
      session_id: args.channelName,
      chef_id: args.chefId,
      title: args.title,
      description: args.description,
      status: "live",
      scheduled_start_time: Date.now(),
      actual_start_time: Date.now(),
      thumbnailUrl: args.thumbnailUrl,
      tags: args.tags,
      location: sessionLocation,
      viewerCount: 0,
      maxViewers: 1000,
      currentViewers: 0,
      chatEnabled: true,
      totalComments: 0,
      totalReactions: 0,
      mutedUsers: [],
      sessionStats: {
        totalViewers: 0,
        peakViewers: 0,
        averageWatchTime: 0,
        totalTips: 0,
        totalOrders: 0
      },
    });

    return sessionId;
  },
});

export const joinLiveSession = mutation({
  args: {
    sessionId: v.id("liveSessions"),
    userId: v.id("users"),
    userType: v.union(v.literal("viewer"), v.literal("moderator")),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    session: v.union(v.object({
      _id: v.id("liveSessions"),
      channelName: v.string(),
      title: v.string(),
      isActive: v.boolean(),
      viewerCount: v.number(),
      chatEnabled: v.boolean(),
    }), v.null()),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return {
        success: false,
        message: "Live session not found",
        session: null,
      };
    }

    if (session.status !== "live") {
      return {
        success: false,
        message: "Live session has ended",
        session: null,
      };
    }

    if (session.viewerCount >= session.maxViewers) {
      return {
        success: false,
        message: "Session is at maximum capacity",
        session: null,
      };
    }

    // Update viewer count
    await ctx.db.patch(args.sessionId, {
      viewerCount: session.viewerCount + 1,
      currentViewers: session.currentViewers + 1,
      sessionStats: {
        ...session.sessionStats,
        totalViewers: session.sessionStats.totalViewers + 1,
        peakViewers: Math.max(session.sessionStats.peakViewers, session.viewerCount + 1),
      },
    });

    return {
      success: true,
      message: "Successfully joined live session",
      session: {
        _id: session._id,
        channelName: session.session_id,
        title: session.title,
        isActive: session.status === "live",
        viewerCount: session.viewerCount + 1,
        chatEnabled: session.chatEnabled,
      },
    };
  },
});

export const leaveLiveSession = mutation({
  args: {
    sessionId: v.id("liveSessions"),
    userId: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return {
        success: false,
        message: "Live session not found",
      };
    }

    // Update viewer count (currentViewers is a number, not an array)
    await ctx.db.patch(args.sessionId, {
      viewerCount: Math.max(0, session.viewerCount - 1),
      currentViewers: Math.max(0, session.currentViewers - 1),
    });

    return {
      success: true,
      message: "Successfully left live session",
    };
  },
});

export const sendChatMessage = mutation({
  args: {
    sessionId: v.id("liveSessions"),
    userId: v.id("users"),
    message: v.string(),
    messageType: v.union(v.literal("text"), v.literal("reaction"), v.literal("system")),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    messageId: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return {
        success: false,
        message: "Live session not found",
        messageId: null,
      };
    }

    if (session.status !== "live") {
      return {
        success: false,
        message: "Live session has ended",
        messageId: null,
      };
    }

    if (!session.chatEnabled) {
      return {
        success: false,
        message: "Chat is disabled for this session",
        messageId: null,
      };
    }

    // Create chat message in the format expected by the schema
    const chatMessage = {
      userId: args.userId,
      message: args.message,
      timestamp: Date.now(),
      type: args.messageType === "reaction" ? "reaction" :
        args.messageType === "system" ? "text" : "text" as "text" | "reaction" | "tip",
    };

    const chatMessages = session.chatMessages || [];
    const updatedMessages = [...chatMessages, chatMessage].slice(-100); // Keep last 100 messages

    await ctx.db.patch(args.sessionId, {
      chatMessages: updatedMessages,
      totalComments: (session.totalComments || 0) + 1,
      totalReactions: args.messageType === "reaction"
        ? (session.totalReactions || 0) + 1
        : (session.totalReactions || 0),
    });

    return {
      success: true,
      message: "Message sent successfully",
      messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  },
});

export const endLiveSession = mutation({
  args: {
    sessionId: v.id("liveSessions"),
    reason: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
    saveAsVideo: v.optional(v.boolean()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
    videoId: v.optional(v.id("videoPosts")),
  }),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return {
        success: false,
        message: "Live session not found",
      };
    }

    // Get the chef to verify ownership
    const chef = await ctx.db.get(session.chef_id);
    if (!chef) {
      return {
        success: false,
        message: "Chef not found",
      };
    }

    // Users can only end their own live sessions, staff/admin can end any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      return {
        success: false,
        message: "Access denied: You can only end your own live sessions",
      };
    }

    const now = Date.now();
    const startTime = session.actual_start_time || session.scheduled_start_time || now;
    const duration = Math.floor((now - startTime) / 1000); // Duration in seconds

    // Update session status
    await ctx.db.patch(args.sessionId, {
      status: "ended",
      endedAt: now,
      endReason: args.reason || "manual_end",
      viewerCount: 0,
      currentViewers: 0,
      savedAsVideo: args.saveAsVideo || false,
    });

    let videoId: Id<"videoPosts"> | undefined;

    // If saveAsVideo is requested, create a video post
    // Note: Actual video recording would need to be handled by Agora recording service
    // This creates a placeholder video post that can be updated when the recording is available
    if (args.saveAsVideo) {
      try {
        videoId = await ctx.db.insert("videoPosts", {
          creatorId: user._id,
          kitchenId: session.kitchen_id,
          mealId: session.mealId,
          title: session.title || "Live Cooking Session",
          description: session.description || `Live stream from ${new Date(startTime).toLocaleDateString()}`,
          videoStorageId: "" as any, // Placeholder - will be updated when recording is available
          duration: duration,
          fileSize: 0, // Will be updated when recording is available
          resolution: { width: 1920, height: 1080 }, // Default resolution
          tags: session.tags || [],
          cuisine: undefined,
          difficulty: undefined,
          status: "draft", // Start as draft until video is processed
          visibility: "public",
          isLive: false,
          liveSessionId: args.sessionId,
          likesCount: 0,
          commentsCount: session.totalComments || 0,
          sharesCount: 0,
          viewsCount: session.sessionStats?.totalViewers || 0,
          publishedAt: undefined,
          createdAt: now,
          updatedAt: now,
        });

        // Update session with video post ID
        await ctx.db.patch(args.sessionId, {
          savedVideoPostId: videoId,
        });
      } catch (error) {
        console.error("Error creating video post:", error);
        // Continue with ending the stream even if video post creation fails
      }
    }

    return {
      success: true,
      message: args.saveAsVideo
        ? "Live session ended and saved as video post"
        : "Live session ended successfully",
      videoId,
    };
  },
});

export const updateViewerCount = mutation({
  args: {
    sessionId: v.id("liveSessions"),
    viewerCount: v.number(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return {
        success: false,
        message: "Live session not found",
      };
    }

    const peakViewers = Math.max(session.sessionStats.peakViewers || 0, args.viewerCount);

    await ctx.db.patch(args.sessionId, {
      viewerCount: args.viewerCount,
      sessionStats: {
        ...session.sessionStats,
        peakViewers,
      },
    });

    return {
      success: true,
      message: "Viewer count updated successfully",
    };
  },
});

export const toggleChat = mutation({
  args: {
    sessionId: v.id("liveSessions"),
    enabled: v.boolean(),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return {
        success: false,
        message: "Live session not found",
      };
    }

    await ctx.db.patch(args.sessionId, {
      chatEnabled: args.enabled,
    });

    return {
      success: true,
      message: `Chat ${args.enabled ? 'enabled' : 'disabled'} successfully`,
    };
  },
});

export const moderateChatMessage = mutation({
  args: {
    sessionId: v.id("liveSessions"),
    messageIndex: v.number(), // Use index instead of messageId since messages don't have IDs
    action: v.union(v.literal("delete"), v.literal("warn"), v.literal("ban")),
    reason: v.optional(v.string()),
    moderatedBy: v.id("users"),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return {
        success: false,
        message: "Live session not found",
      };
    }

    const chatMessages = session.chatMessages || [];

    if (args.messageIndex < 0 || args.messageIndex >= chatMessages.length) {
      return {
        success: false,
        message: "Message index out of bounds",
      };
    }

    let updatedMessages = [...chatMessages];
    const message = updatedMessages[args.messageIndex];

    if (args.action === "delete") {
      // Mark message as deleted with moderation info
      updatedMessages[args.messageIndex] = {
        ...message,
        moderation: {
          status: 'deleted',
          moderatedBy: args.moderatedBy,
          moderatedAt: Date.now(),
          reason: args.reason || 'Moderated',
          action: 'delete'
        }
      };
    } else if (args.action === "warn") {
      // Mark message as warned
      updatedMessages[args.messageIndex] = {
        ...message,
        moderation: {
          status: 'active',
          moderatedBy: args.moderatedBy,
          moderatedAt: Date.now(),
          reason: args.reason || 'Warning issued',
          action: 'warn'
        }
      };
    } else if (args.action === "ban") {
      // Mark message as banned and add user to muted list
      updatedMessages[args.messageIndex] = {
        ...message,
        moderation: {
          status: 'muted',
          moderatedBy: args.moderatedBy,
          moderatedAt: Date.now(),
          reason: args.reason || 'User banned',
          action: 'ban'
        }
      };

      // Add user to muted users list
      const mutedUsers = session.mutedUsers || [];
      if (!mutedUsers.includes(message.userId)) {
        await ctx.db.patch(args.sessionId, {
          mutedUsers: [...mutedUsers, message.userId],
        });
      }
    }

    await ctx.db.patch(args.sessionId, {
      chatMessages: updatedMessages,
    });

    return {
      success: true,
      message: `Message ${args.action}ed successfully`,
    };
  },
});

export const updateSessionSettings = mutation({
  args: {
    sessionId: v.id("liveSessions"),
    settings: v.object({
      title: v.optional(v.string()),
      description: v.optional(v.string()),
      tags: v.optional(v.array(v.string())),
      maxViewers: v.optional(v.number()),
      isPrivate: v.optional(v.boolean()),
      recordingEnabled: v.optional(v.boolean()),
    }),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return {
        success: false,
        message: "Live session not found",
      };
    }

    const updateData: any = {};

    if (args.settings.title !== undefined) updateData.title = args.settings.title;
    if (args.settings.description !== undefined) updateData.description = args.settings.description;
    if (args.settings.tags !== undefined) updateData.tags = args.settings.tags;
    if (args.settings.maxViewers !== undefined) updateData.maxViewers = args.settings.maxViewers;
    if (args.settings.isPrivate !== undefined) updateData.isPrivate = args.settings.isPrivate;
    if (args.settings.recordingEnabled !== undefined) updateData.recordingEnabled = args.settings.recordingEnabled;

    await ctx.db.patch(args.sessionId, updateData);

    return {
      success: true,
      message: "Session settings updated successfully",
    };
  },
});

export const getSessionStats = mutation({
  args: {
    sessionId: v.id("liveSessions"),
  },
  returns: v.object({
    success: v.boolean(),
    stats: v.union(v.object({
      totalViewers: v.number(),
      peakViewers: v.number(),
      averageWatchTime: v.number(),
      totalComments: v.number(),
      totalReactions: v.number(),
      sessionDuration: v.number(),
    }), v.null()),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return {
        success: false,
        stats: null,
      };
    }

    const sessionDuration = session.endedAt
      ? session.endedAt - (session.actual_start_time || session.scheduled_start_time)
      : Date.now() - (session.actual_start_time || session.scheduled_start_time);

    return {
      success: true,
      stats: {
        totalViewers: session.sessionStats.totalViewers || 0,
        peakViewers: session.sessionStats.peakViewers || 0,
        averageWatchTime: session.sessionStats.averageWatchTime || 0,
        totalComments: session.totalComments || 0,
        totalReactions: session.totalReactions || 0,
        sessionDuration,
      },
    };
  },
});

// Send live comment
export const sendLiveComment = mutation({
  args: {
    sessionId: v.id('liveSessions'),
    sentBy: v.id('users'),
    content: v.string(),
    commentType: v.union(
      v.literal('general'),
      v.literal('question'),
      v.literal('reaction'),
      v.literal('tip'),
      v.literal('moderation')
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error('Live session not found');
    }

    const now = Date.now();

    // Add comment to liveComments table
    const commentId = await ctx.db.insert('liveComments', {
      session_id: args.sessionId,
      content: args.content,
      commentType: args.commentType,
      sent_by: args.sentBy,
      sent_by_role: args.metadata?.sentByRole || 'viewer',
      user_display_name: args.metadata?.userDisplayName || 'Anonymous',
      metadata: args.metadata,
      sent_at: now,
      status: 'active',
    });

    // Update session comment count
    await ctx.db.patch(args.sessionId, {
      totalComments: (session.totalComments || 0) + 1,
    });

    console.log(`Live comment sent for session ${args.sessionId} by ${args.sentBy}`);
    return await ctx.db.get(commentId);
  },
});

// Send live reaction
export const sendLiveReaction = mutation({
  args: {
    sessionId: v.id('liveSessions'),
    sentBy: v.id('users'),
    reactionType: v.union(
      v.literal('like'),
      v.literal('love'),
      v.literal('laugh'),
      v.literal('wow'),
      v.literal('sad'),
      v.literal('angry'),
      v.literal('fire'),
      v.literal('clap'),
      v.literal('heart'),
      v.literal('star')
    ),
    intensity: v.union(
      v.literal('light'),
      v.literal('medium'),
      v.literal('strong')
    ),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      throw new Error('Live session not found');
    }

    const now = Date.now();

    // Add reaction to liveReactions table
    const reactionId = await ctx.db.insert('liveReactions', {
      session_id: args.sessionId,
      reactionType: args.reactionType,
      intensity: args.intensity,
      sent_by: args.sentBy,
      sent_by_role: args.metadata?.sentByRole || 'viewer',
      user_display_name: args.metadata?.userDisplayName || 'Anonymous',
      metadata: args.metadata,
      sent_at: now,
      status: 'active',
    });

    // Update session reaction count
    await ctx.db.patch(args.sessionId, {
      totalReactions: (session.totalReactions || 0) + 1,
    });

    console.log(`Live reaction sent for session ${args.sessionId} by ${args.sentBy}`);
    return await ctx.db.get(reactionId);
  },
});

// Moderate live comment (mute/delete)
export const moderateLiveComment = mutation({
  args: {
    commentId: v.id('liveComments'),
    action: v.union(
      v.literal('delete'),
      v.literal('mute_user'),
      v.literal('warn_user')
    ),
    reason: v.optional(v.string()),
    moderatedBy: v.id('users'),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error('Comment not found');
    }

    const now = Date.now();

    if (args.action === 'delete') {
      // Mark comment as deleted
      await ctx.db.patch(args.commentId, {
        status: 'deleted',
        moderated_at: now,
        moderated_by: args.moderatedBy,
        moderation_reason: args.reason,
        metadata: { ...comment.metadata, moderation: args.metadata }
      });
    } else if (args.action === 'mute_user') {
      // Mute user in the session
      const session = await ctx.db.get(comment.session_id);
      if (session) {
        const mutedUsers = session.mutedUsers || [];
        if (!mutedUsers.includes(comment.sent_by)) {
          await ctx.db.patch(comment.session_id, {
            mutedUsers: [...mutedUsers, comment.sent_by],
          });
        }
      }
    }

    console.log(`Comment ${args.commentId} moderated by ${args.moderatedBy}`);
    return await ctx.db.get(args.commentId);
  },
});

// Update live session location
export const adminMuteLiveChatUser = mutation({
  args: {
    sessionId: v.id("liveSessions"),
    userId: v.id("users"),
    adminId: v.id("users"),
    reason: v.optional(v.string()),
    duration: v.optional(v.number()), // Duration in minutes, 0 for permanent
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return {
        success: false,
        message: "Live session not found",
      };
    }

    // Check if user is admin
    const admin = await ctx.db.get(args.adminId);
    if (!admin || !admin.roles?.includes('admin')) {
      return {
        success: false,
        message: "Unauthorized: Admin access required",
      };
    }

    // Update session to add muted user
    const mutedUsers = session.mutedUsers || [];
    const muteExpiry = args.duration ? Date.now() + (args.duration * 60 * 1000) : null;

    const muteEntry = {
      userId: args.userId,
      mutedBy: args.adminId,
      mutedAt: Date.now(),
      reason: args.reason || "Admin moderation",
      expiresAt: muteExpiry,
    };

    // Check if user is already muted
    const existingMute = mutedUsers.find(mute => {
      if (typeof mute === 'string') {
        return mute === args.userId;
      } else {
        return mute.userId === args.userId;
      }
    });
    if (existingMute) {
      return {
        success: false,
        message: "User is already muted",
      };
    }

    await ctx.db.patch(args.sessionId, {
      mutedUsers: [...mutedUsers, muteEntry],
    });

    return {
      success: true,
      message: `User muted successfully${args.duration ? ` for ${args.duration} minutes` : ' permanently'}`,
    };
  },
});

export const updateSessionLocation = mutation({
  args: {
    sessionId: v.id("liveSessions"),
    location: v.object({
      city: v.string(),
      coordinates: v.array(v.number()), // [longitude, latitude]
      address: v.optional(v.string()),
      radius: v.optional(v.number()), // Delivery radius in km
    }),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) {
      return {
        success: false,
        message: "Live session not found",
      };
    }

    // Validate coordinates array
    if (args.location.coordinates.length !== 2) {
      return {
        success: false,
        message: "Invalid coordinates. Must be [longitude, latitude]",
      };
    }

    const [longitude, latitude] = args.location.coordinates;

    // Validate coordinate ranges
    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      return {
        success: false,
        message: "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180",
      };
    }

    // Update the session with new location
    await ctx.db.patch(args.sessionId, {
      location: args.location,
    });

    return {
      success: true,
      message: "Session location updated successfully",
    };
  },
});

// Admin: Resolve live session report
export const resolveLiveReport = mutation({
  args: {
    reportId: v.id("liveSessionReports"),
    status: v.union(
      v.literal("resolved"),
      v.literal("dismissed")
    ),
    resolutionNotes: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);

    // Check if user is admin or staff
    if (!isAdmin(user) && !isStaff(user)) {
      throw new Error("Unauthorized: Admin or staff access required");
    }

    const report = await ctx.db.get(args.reportId);
    if (!report) {
      return {
        success: false,
        message: "Report not found",
      };
    }

    await ctx.db.patch(args.reportId, {
      status: args.status,
      resolutionNotes: args.resolutionNotes,
      resolvedBy: user._id,
      resolvedAt: Date.now(),
    });

    return {
      success: true,
      message: `Report ${args.status} successfully`,
    };
  },
});
