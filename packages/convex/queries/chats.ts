// @ts-nocheck
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
    // Use index to find chats where user is a participant
    // Note: Convex array indexes allow querying array fields
    const all = await ctx.db
      .query('chats')
      .withIndex('by_participant', q => q.eq('participants', userId))
      .collect();
    
    // Filter to ensure user is actually in participants (index might return some false positives)
    const chats = all.filter(chat => Array.isArray(chat.participants) && chat.participants.includes(userId));
    
    // Sort by lastMessageAt desc
    chats.sort((a, b) => (b.lastMessageAt || 0) - (a.lastMessageAt || 0));
    
    const total_count = chats.length;
    
    return {
      chats: chats.slice(offset, offset + limit),
      total_count,
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
    
    // Use index with order and take for efficient pagination
    // Fetch more than needed to handle offset, then slice
    const fetchLimit = limit + offset;
    const messages = await ctx.db
      .query('messages')
      .withIndex('by_chat', q => q.eq('chatId', chatId))
      .order('desc')
      .take(fetchLimit);
    
    // Get total count (needed for pagination info)
    const allMessages = await ctx.db
      .query('messages')
      .withIndex('by_chat', q => q.eq('chatId', chatId))
      .collect();
    const total_count = allMessages.length;
    
    // Apply offset by slicing
    const paginatedMessages = messages.slice(offset);
    
    return {
      messages: paginatedMessages,
      total_count,
      limit,
      offset
    };
  }
});

// Batch fetch messages for multiple chats (optimized to avoid N+1 queries)
export const listMessagesForChats = query({
  args: { 
    chatIds: v.array(v.id('chats')), 
    limitPerChat: v.optional(v.number()),
    totalLimit: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const { chatIds, limitPerChat = 100, totalLimit } = args;
    
    if (chatIds.length === 0) {
      return [];
    }
    
    // Fetch messages for all chats in parallel
    const messagePromises = chatIds.map(chatId => 
      ctx.db.query('messages')
        .withIndex('by_chat', q => q.eq('chatId', chatId))
        .order('desc')
        .take(limitPerChat)
    );
    
    const messageArrays = await Promise.all(messagePromises);
    
    // Flatten and add chatId to each message, then sort by createdAt desc
    const allMessages = messageArrays.flatMap((messages, index) => 
      messages.map(msg => ({ ...msg, chatId: chatIds[index] }))
    );
    
    // Sort by createdAt desc
    allMessages.sort((a, b) => b.createdAt - a.createdAt);
    
    // Apply total limit if specified
    if (totalLimit !== undefined) {
      return allMessages.slice(0, totalLimit);
    }
    
    return allMessages;
  }
}); 