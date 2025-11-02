import { mutation } from '../_generated/server';
import { v } from 'convex/values';

export const create = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    subject: v.optional(v.string()),
    message: v.string(),
    createdAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const contactId = await ctx.db.insert('contacts', {
      name: args.name,
      email: args.email,
      subject: args.subject || '',
      message: args.message,
      createdAt: args.createdAt || Date.now(),
    });
    return contactId;
  },
});

export const deleteContact = mutation({
  args: {
    contactId: v.id('contacts'),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.contactId);
  },
}); 