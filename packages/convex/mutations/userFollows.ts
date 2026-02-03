// @ts-nocheck
import { mutation } from "../_generated/server";
import { v } from "convex/values";

// Follow a user
export const followUser = mutation({
  args: {
    followingId: v.id("users"),
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

    // Check if trying to follow self
    if (user._id === args.followingId) {
      throw new Error("Cannot follow yourself");
    }

    // Check if user to follow exists
    const userToFollow = await ctx.db.get(args.followingId);
    if (!userToFollow) {
      throw new Error("User to follow not found");
    }

    // Check if already following
    const existingFollow = await ctx.db
      .query('userFollows')
      .withIndex('by_follower_following', q => q.eq('followerId', user._id).eq('followingId', args.followingId))
      .first();

    if (existingFollow) {
      throw new Error("Already following this user");
    }

    // Create follow relationship
    await ctx.db.insert('userFollows', {
      followerId: user._id,
      followingId: args.followingId,
      createdAt: Date.now(),
    });

    return null;
  },
});

// Unfollow a user
export const unfollowUser = mutation({
  args: {
    followingId: v.id("users"),
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

    // Find follow relationship
    const follow = await ctx.db
      .query('userFollows')
      .withIndex('by_follower_following', q => q.eq('followerId', user._id).eq('followingId', args.followingId))
      .first();

    if (!follow) {
      throw new Error("Not following this user");
    }

    // Remove follow relationship
    await ctx.db.delete(follow._id);

    return null;
  },
});

// Block a user
export const blockUser = mutation({
  args: {
    blockedUserId: v.id("users"),
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

    // Check if trying to block self
    if (user._id === args.blockedUserId) {
      throw new Error("Cannot block yourself");
    }

    // Check if user to block exists
    const userToBlock = await ctx.db.get(args.blockedUserId);
    if (!userToBlock) {
      throw new Error("User to block not found");
    }

    // Unfollow if currently following
    const follow = await ctx.db
      .query('userFollows')
      .withIndex('by_follower_following', q => q.eq('followerId', user._id).eq('followingId', args.blockedUserId))
      .first();

    if (follow) {
      await ctx.db.delete(follow._id);
    }

    // Remove any follow from blocked user to current user
    const reverseFollow = await ctx.db
      .query('userFollows')
      .withIndex('by_follower_following', q => q.eq('followerId', args.blockedUserId).eq('followingId', user._id))
      .first();

    if (reverseFollow) {
      await ctx.db.delete(reverseFollow._id);
    }

    // Use user preferences to store blocked users
    const currentPreferences = user.preferences || {};
    const blockedUsers = currentPreferences.blockedUsers || [];

    if (blockedUsers.includes(args.blockedUserId)) {
      // Already blocked, so unblock (remove from list)
      const updatedBlockedUsers = blockedUsers.filter(id => id !== args.blockedUserId);
      await ctx.db.patch(user._id, {
        preferences: {
          ...currentPreferences,
          blockedUsers: updatedBlockedUsers,
        },
      });
    } else {
      // Not blocked yet, so add to blocked list
      await ctx.db.patch(user._id, {
        preferences: {
          ...currentPreferences,
          blockedUsers: [...blockedUsers, args.blockedUserId],
        },
      });
    }

    return null;
  },
});

// Unblock a user
export const unblockUser = mutation({
  args: {
    blockedUserId: v.id("users"),
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

    // Remove from blocked users
    const currentPreferences = user.preferences || {};
    const blockedUsers = currentPreferences.blockedUsers || [];
    
    if (blockedUsers.includes(args.blockedUserId)) {
      await ctx.db.patch(user._id, {
        preferences: {
          ...currentPreferences,
          blockedUsers: blockedUsers.filter(id => id !== args.blockedUserId),
        },
        lastModified: Date.now(),
      });
    }

    return null;
  },
});
