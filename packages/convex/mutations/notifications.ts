// @ts-nocheck
import { v } from 'convex/values';
import { mutation } from '../_generated/server';

// Type for notification creation
const createArgs = {
  userId: v.optional(v.id('users')),
  type: v.string(),
  message: v.string(),
  global: v.optional(v.boolean()),
  roles: v.optional(v.array(v.string())),
  createdAt: v.number(),
};

export const create = mutation({
  args: createArgs,
  handler: async (ctx, args) => {
    const notification = {
      ...args,
      read: false, // Default to unread
    };
    await ctx.db.insert('notifications', notification);
  },
});

// Type for marking all as read
const markAllAsReadArgs = { 
  userId: v.id('users') 
};

export const markAllAsRead = mutation({
  args: markAllAsReadArgs,
  handler: async (ctx, args) => {
    const notifs = await ctx.db.query('notifications')
      .withIndex('by_user', q => q.eq('userId', args.userId))
      .collect();
    
    for (const notif of notifs) {
      if (notif._id) {
        await ctx.db.patch(notif._id, { read: true });
      }
    }
    return true;
  },
});

// Type for marking single notification as read
const markAsReadArgs = { 
  notificationId: v.id('notifications') 
};

export const markAsRead = mutation({
  args: markAsReadArgs,
  handler: async (ctx, args) => {
    const notification = await ctx.db.get(args.notificationId);
    if (notification) {
      await ctx.db.patch(args.notificationId, { read: true });
    }
    return true;
  },
});