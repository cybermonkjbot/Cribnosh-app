import { v } from 'convex/values';
import { mutation } from '../_generated/server';

export const create = mutation({
  args: {
    userId: v.id('users'),
    subject: v.string(),
    message: v.string(),
    category: v.union(
      v.literal('order'),
      v.literal('payment'),
      v.literal('account'),
      v.literal('technical'),
      v.literal('other')
    ),
    priority: v.union(v.literal('low'), v.literal('medium'), v.literal('high')),
    order_id: v.optional(v.string()),
    attachments: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const supportReference = `SUP-${new Date().getFullYear()}-${String(
      Date.now()
    ).slice(-6)}`;

    const caseId = await ctx.db.insert('supportCases', {
      userId: args.userId,
      subject: args.subject,
      message: args.message,
      category: args.category,
      priority: args.priority,
      status: 'open',
      order_id: args.order_id,
      attachments: args.attachments,
      support_reference: supportReference,
      last_message: args.message,
      created_at: now,
      updated_at: now,
    });

    return caseId;
  },
});

export const assignAgent = mutation({
  args: {
    caseId: v.id('supportCases'),
    agentId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.caseId, {
      assigned_agent_id: args.agentId,
      updated_at: now,
    });
    return { success: true };
  },
});

export const createSupportChat = mutation({
  args: {
    caseId: v.id('supportCases'),
    agentId: v.id('users'),
  },
  handler: async (ctx, args) => {
    const supportCase = await ctx.db.get(args.caseId);
    if (!supportCase) {
      throw new Error('Support case not found');
    }

    // Check if chat already exists
    if (supportCase.chat_id) {
      const existingChat = await ctx.db.get(supportCase.chat_id);
      if (existingChat) {
        return { chatId: supportCase.chat_id };
      }
    }

    // Create new chat with customer and agent
    const now = Date.now();
    const chatId = await ctx.db.insert('chats', {
      participants: [supportCase.userId, args.agentId],
      createdAt: now,
      lastMessageAt: undefined,
      metadata: {
        support_case_id: args.caseId,
        is_support_chat: true,
        agent_id: args.agentId,
      },
    });

    // Link chat to support case and assign agent
    await ctx.db.patch(args.caseId, {
      chat_id: chatId,
      assigned_agent_id: args.agentId,
      updated_at: now,
    });

    return { chatId };
  },
});

export const addMessageToCase = mutation({
  args: {
    caseId: v.id('supportCases'),
    message: v.string(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    await ctx.db.patch(args.caseId, {
      last_message: args.message,
      updated_at: now,
    });
    return { success: true };
  },
});

