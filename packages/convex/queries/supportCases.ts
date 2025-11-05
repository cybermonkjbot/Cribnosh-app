import { v } from 'convex/values';
import { query } from '../_generated/server';

export const getByUserId = query({
  args: {
    userId: v.id('users'),
    status: v.optional(
      v.union(v.literal('open'), v.literal('closed'), v.literal('resolved'))
    ),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('supportCases')
      .withIndex('by_user', (q) => q.eq('userId', args.userId));

    const cases = await query.collect();

    // Filter by status if provided
    const filtered = args.status
      ? cases.filter((c) => c.status === args.status)
      : cases;

    // Sort by created_at descending
    return filtered.sort((a, b) => b.created_at - a.created_at);
  },
});

export const getByOrderId = query({
  args: { orderId: v.string() },
  handler: async (ctx, args) => {
    const cases = await ctx.db.query('supportCases').collect();
    return cases.filter((c) => c.order_id === args.orderId);
  },
});

export const getChatByCaseId = query({
  args: { caseId: v.id('supportCases') },
  handler: async (ctx, args) => {
    const supportCase = await ctx.db.get(args.caseId);
    if (!supportCase || !supportCase.chat_id) {
      return null;
    }
    const chat = await ctx.db.get(supportCase.chat_id);
    return chat;
  },
});

export const getActiveSupportChat = query({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    // Find the most recent open support case for the user
    const openCases = await ctx.db
      .query('supportCases')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .collect();
    
    const activeCase = openCases
      .filter((c) => c.status === 'open' && c.chat_id)
      .sort((a, b) => b.created_at - a.created_at)[0];
    
    if (!activeCase || !activeCase.chat_id) {
      return null;
    }
    
    const chat = await ctx.db.get(activeCase.chat_id);
    return {
      chat,
      supportCase: activeCase,
    };
  },
});

export const getAssignedAgent = query({
  args: { caseId: v.id('supportCases') },
  handler: async (ctx, args) => {
    const supportCase = await ctx.db.get(args.caseId);
    if (!supportCase || !supportCase.assigned_agent_id) {
      return null;
    }
    const agent = await ctx.db.get(supportCase.assigned_agent_id);
    return agent;
  },
});

