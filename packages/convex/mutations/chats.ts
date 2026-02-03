// @ts-nocheck
import { mutation } from '../_generated/server';
import { v } from 'convex/values';

// Create a new conversation
export const createConversation = mutation({
  args: { participants: v.array(v.id('users')), metadata: v.optional(v.any()) },
  handler: async (ctx, args) => {
    const now = Date.now();
    const chatId = await ctx.db.insert('chats', {
      participants: args.participants,
      createdAt: now,
      lastMessageAt: undefined, // Fix: should be undefined, not null
      metadata: args.metadata || {},
    });
    return { chatId };
  }
});

// Send a message (optionally with file info for MinIO)
export const sendMessage = mutation({
  args: {
    chatId: v.id('chats'),
    senderId: v.id('users'),
    content: v.string(),
    fileUrl: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const messageId = await ctx.db.insert('messages', {
      chatId: args.chatId,
      senderId: args.senderId,
      content: args.content,
      createdAt: now,
      isRead: false,
      fileUrl: args.fileUrl,
      fileType: args.fileType,
      fileName: args.fileName,
      fileSize: args.fileSize,
      metadata: args.metadata || {},
    });
    // Update lastMessageAt on chat
    await ctx.db.patch(args.chatId, { lastMessageAt: now });
    return { messageId };
  }
});

// Mark all messages as read for a user in a chat
export const markMessagesRead = mutation({
  args: { chatId: v.id('chats'), userId: v.id('users') },
  handler: async (ctx, args) => {
    // Mark all messages in chat as read (sent to this user)
    const messages = await ctx.db.query('messages').withIndex('by_chat', q => q.eq('chatId', args.chatId)).collect();
    for (const msg of messages) {
      if (msg.senderId !== args.userId && !msg.isRead) {
        await ctx.db.patch(msg._id, { isRead: true });
      }
    }
    return { status: 'ok' };
  }
});

// Delete a message (only sender can delete)
export const deleteMessage = mutation({
  args: { chatId: v.id('chats'), messageId: v.id('messages'), userId: v.id('users') },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      return { status: 'error', error: 'Message not found' };
    }
    if (message.chatId !== args.chatId) {
      return { status: 'error', error: 'Message does not belong to this chat' };
    }
    if (message.senderId !== args.userId) {
      return { status: 'error', error: 'Only the sender can delete this message' };
    }
    await ctx.db.delete(args.messageId);
    return { status: 'ok' };
  }
});

// Edit a message (only sender can edit)
export const editMessage = mutation({
  args: {
    chatId: v.id('chats'),
    messageId: v.id('messages'),
    userId: v.id('users'),
    content: v.optional(v.string()),
    fileUrl: v.optional(v.string()),
    fileType: v.optional(v.string()),
    fileName: v.optional(v.string()),
    fileSize: v.optional(v.number()),
    metadata: v.optional(v.any()),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      return { status: 'error', error: 'Message not found' };
    }
    if (message.chatId !== args.chatId) {
      return { status: 'error', error: 'Message does not belong to this chat' };
    }
    if (message.senderId !== args.userId) {
      return { status: 'error', error: 'Only the sender can edit this message' };
    }
    await ctx.db.patch(args.messageId, {
      ...(args.content !== undefined ? { content: args.content } : {}),
      ...(args.fileUrl !== undefined ? { fileUrl: args.fileUrl } : {}),
      ...(args.fileType !== undefined ? { fileType: args.fileType } : {}),
      ...(args.fileName !== undefined ? { fileName: args.fileName } : {}),
      ...(args.fileSize !== undefined ? { fileSize: args.fileSize } : {}),
      ...(args.metadata !== undefined ? { metadata: args.metadata } : {}),
    });
    return { status: 'ok' };
  }
});

// Delete a conversation (and all its messages). Only a participant can delete.
export const deleteConversation = mutation({
  args: { chatId: v.id('chats'), userId: v.id('users') },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return { status: 'error', error: 'Conversation not found' };
    }
    if (!chat.participants.includes(args.userId)) {
      return { status: 'error', error: 'Only a participant can delete this conversation' };
    }
    // Delete all messages in this chat
    const messages = await ctx.db.query('messages').withIndex('by_chat', q => q.eq('chatId', args.chatId)).collect();
    for (const msg of messages) {
      await ctx.db.delete(msg._id);
    }
    // Delete the chat itself
    await ctx.db.delete(args.chatId);
    return { status: 'ok' };
  }
});

// Edit conversation metadata (only participant can edit)
export const editConversation = mutation({
  args: {
    chatId: v.id('chats'),
    userId: v.id('users'),
    metadata: v.any(),
  },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return { status: 'error', error: 'Conversation not found' };
    }
    if (!chat.participants.includes(args.userId)) {
      return { status: 'error', error: 'Only a participant can edit this conversation' };
    }
    await ctx.db.patch(args.chatId, { metadata: args.metadata });
    return { status: 'ok' };
  }
});

// Leave a conversation (remove user from participants, delete chat if last)
export const leaveConversation = mutation({
  args: { chatId: v.id('chats'), userId: v.id('users') },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return { status: 'error', error: 'Conversation not found' };
    }
    if (!chat.participants.includes(args.userId)) {
      return { status: 'error', error: 'User is not a participant' };
    }
    const newParticipants = chat.participants.filter((id: string) => id !== args.userId);
    if (newParticipants.length === 0) {
      // Delete all messages in this chat
      const messages = await ctx.db.query('messages').withIndex('by_chat', q => q.eq('chatId', args.chatId)).collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }
      // Delete the chat itself
      await ctx.db.delete(args.chatId);
      return { status: 'ok', deleted: true };
    } else {
      await ctx.db.patch(args.chatId, { participants: newParticipants });
      return { status: 'ok', deleted: false };
    }
  }
});

// Transfer group chat admin rights (only current admin can transfer)
export const transferAdmin = mutation({
  args: { chatId: v.id('chats'), userId: v.id('users'), newAdminId: v.id('users') },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return { status: 'error', error: 'Conversation not found' };
    }
    if (!chat.participants.includes(args.userId) || !chat.participants.includes(args.newAdminId)) {
      return { status: 'error', error: 'Both users must be participants' };
    }
    if (!chat.metadata || chat.metadata.adminId !== args.userId) {
      return { status: 'error', error: 'Only the current admin can transfer admin rights' };
    }
    await ctx.db.patch(args.chatId, { metadata: { ...chat.metadata, adminId: args.newAdminId } });
    return { status: 'ok' };
  }
});

// Remove (kick) a participant from a group chat (only admin can remove others, cannot remove self)
export const removeParticipant = mutation({
  args: { chatId: v.id('chats'), userId: v.id('users'), removeUserId: v.id('users') },
  handler: async (ctx, args) => {
    const chat = await ctx.db.get(args.chatId);
    if (!chat) {
      return { status: 'error', error: 'Conversation not found' };
    }
    if (!chat.participants.includes(args.userId) || !chat.participants.includes(args.removeUserId)) {
      return { status: 'error', error: 'Both users must be participants' };
    }
    if (args.userId === args.removeUserId) {
      return { status: 'error', error: 'Admin cannot remove themselves (use leave instead)' };
    }
    if (!chat.metadata || chat.metadata.adminId !== args.userId) {
      return { status: 'error', error: 'Only the admin can remove participants' };
    }
    const newParticipants = chat.participants.filter((id: string) => id !== args.removeUserId);
    if (newParticipants.length === 0) {
      // Delete all messages in this chat
      const messages = await ctx.db.query('messages').withIndex('by_chat', q => q.eq('chatId', args.chatId)).collect();
      for (const msg of messages) {
        await ctx.db.delete(msg._id);
      }
      // Delete the chat itself
      await ctx.db.delete(args.chatId);
      return { status: 'ok', deleted: true };
    } else {
      await ctx.db.patch(args.chatId, { participants: newParticipants });
      return { status: 'ok', deleted: false };
    }
  }
});

// Add or remove a reaction to a message
export const reactToMessage = mutation({
  args: {
    chatId: v.id('chats'),
    messageId: v.id('messages'),
    userId: v.id('users'),
    emoji: v.string(),
    action: v.union(v.literal('add'), v.literal('remove')),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      return { status: 'error', error: 'Message not found' };
    }
    if (message.chatId !== args.chatId) {
      return { status: 'error', error: 'Message does not belong to this chat' };
    }
    // Get or initialize reactions array in metadata
    const metadata = message.metadata || {};
    let reactions = Array.isArray(metadata.reactions) ? metadata.reactions : [];
    if (args.action === 'add') {
      // Prevent duplicate reactions by the same user/emoji
      if (!reactions.some((r: any) => r.userId === args.userId && r.emoji === args.emoji)) {
        reactions.push({ userId: args.userId, emoji: args.emoji });
      }
    } else if (args.action === 'remove') {
      reactions = reactions.filter((r: any) => !(r.userId === args.userId && r.emoji === args.emoji));
    }
    await ctx.db.patch(args.messageId, { metadata: { ...metadata, reactions } });
    return { status: 'ok', reactions };
  }
});

// Pin or unpin a message in a conversation
export const pinMessage = mutation({
  args: {
    chatId: v.id('chats'),
    messageId: v.id('messages'),
    userId: v.id('users'),
    pin: v.boolean(),
  },
  handler: async (ctx, args) => {
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      return { status: 'error', error: 'Message not found' };
    }
    if (message.chatId !== args.chatId) {
      return { status: 'error', error: 'Message does not belong to this chat' };
    }
    // Only participants can pin/unpin
    const chat = await ctx.db.get(args.chatId);
    if (!chat || !chat.participants.includes(args.userId)) {
      return { status: 'error', error: 'Only a participant can pin/unpin messages' };
    }
    const metadata = message.metadata || {};
    await ctx.db.patch(args.messageId, { metadata: { ...metadata, pinned: args.pin } });
    return { status: 'ok', pinned: args.pin };
  }
}); 