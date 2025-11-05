import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import type { Id } from '../_generated/dataModel';

export const create = mutation({
  args: {
    customer_id: v.id('users'),
    event_date: v.string(),
    number_of_guests: v.number(),
    event_type: v.string(),
    event_location: v.string(),
    phone_number: v.string(),
    email: v.string(),
    dietary_requirements: v.optional(v.string()),
    additional_notes: v.optional(v.string()),
    status: v.union(
      v.literal('pending'),
      v.literal('contacted'),
      v.literal('confirmed'),
      v.literal('cancelled')
    ),
  },
  returns: v.id('eventChefRequests'),
  handler: async (ctx, args) => {
    const requestId = await ctx.db.insert('eventChefRequests', {
      ...args,
      created_at: Date.now(),
    });

    return requestId;
  },
});

export const updateStatus = mutation({
  args: {
    request_id: v.id('eventChefRequests'),
    status: v.union(
      v.literal('pending'),
      v.literal('contacted'),
      v.literal('confirmed'),
      v.literal('cancelled')
    ),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.request_id, {
      status: args.status,
      updated_at: Date.now(),
    });

    return { success: true };
  },
});

