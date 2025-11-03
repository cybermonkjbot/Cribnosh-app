import { mutation } from '../_generated/server';
import { v } from 'convex/values';

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

