// @ts-nocheck
import { query } from '../_generated/server';
import { v } from 'convex/values';

// List all channels
export const listChannels = query({
  args: {},
  handler: async (ctx) => {
    const channels = await ctx.db
      .query('channels')
      .filter((q) => q.eq(q.field('isActive'), true))
      .order('desc')
      .collect();

    return channels;
  },
});

// Get messages for a channel (limited to 10 most recent)
export const listMessages = query({
  args: {
    channelId: v.id('channels'),
  },
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query('aiMessages')
      .withIndex('by_channel', (q) => q.eq('channelId', args.channelId))
      .order('desc')
      .take(10);

    // Reverse to get chronological order (oldest first)
    return messages.reverse();
  },
});

// Get messages by channel (alias for listMessages, for backward compatibility)
export const getMessagesByChannel = query({
  args: {
    channelId: v.id('channels'),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 10;
    const messages = await ctx.db
      .query('aiMessages')
      .withIndex('by_channel', (q) => q.eq('channelId', args.channelId))
      .order('desc')
      .take(limit);

    // Reverse to get chronological order (oldest first)
    return messages.reverse();
  },
});

// Get a specific channel
export const getChannel = query({
  args: {
    channelId: v.id('channels'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.channelId);
  },
});

// Get channel by ID (alias for getChannel, for backward compatibility)
export const getChannelById = query({
  args: {
    channelId: v.id('channels'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.channelId);
  },
});

// Get user by email
export const getUserByEmail = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first();
  },
});

// Get user by ID
export const getUser = query({
  args: {
    userId: v.id('users'),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.userId);
  },
});

// Get all users
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('users').collect();
  },
});
