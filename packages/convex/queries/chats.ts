import { query } from '../_generated/server';
import { v } from 'convex/values';

// Get all chats
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('chats').collect();
  }
});

// List all conversations for a user (by participant)
export const listConversationsForUser = query({
  args: { userId: v.id('users'), limit: v.optional(v.number()), offset: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { userId, limit = 20, offset = 0 } = args;
    // Find all chats where user is a participant
    const all = await ctx.db.query('chats').collect();
    const chats = all.filter(chat => chat.participants.includes(userId));
    // Sort by lastMessageAt desc
    chats.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    return {
      chats: chats.slice(offset, offset + limit),
      total_count: chats.length,
      limit,
      offset
    };
  }
});

// Get a single conversation by ID
export const getConversationById = query({
  args: { chatId: v.id('chats') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.chatId);
  }
});

// List messages for a conversation (paginated, newest first)
export const listMessagesForChat = query({
  args: { chatId: v.id('chats'), limit: v.optional(v.number()), offset: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const { chatId, limit = 20, offset = 0 } = args;
    const all = await ctx.db.query('messages').withIndex('by_chat', q => q.eq('chatId', chatId)).collect();
    // Sort by createdAt desc
    all.sort((a, b) => b.createdAt - a.createdAt);
    return {
      messages: all.slice(offset, offset + limit),
      total_count: all.length,
      limit,
      offset
    };
  }
}); 