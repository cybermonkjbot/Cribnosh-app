import { v } from 'convex/values';
import { query } from '../_generated/server';
import { Id } from '../_generated/dataModel';

// Get group order by ID
export const getById = query({
  args: { group_order_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('group_orders')
      .withIndex('by_group_order_id', q => q.eq('group_order_id', args.group_order_id))
      .first();
  },
});

// Get group order by share token
export const getByShareToken = query({
  args: { share_token: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('group_orders')
      .withIndex('by_share_token', q => q.eq('share_token', args.share_token))
      .first();
  },
});

// Get active group orders for a user (as creator or participant)
export const getActiveByUser = query({
  args: { user_id: v.id('users') },
  handler: async (ctx, args) => {
    // Get orders where user is creator
    const asCreator = await ctx.db
      .query('group_orders')
      .withIndex('by_creator', q => q.eq('created_by', args.user_id))
      .filter(q => q.eq(q.field('status'), 'active'))
      .collect();
    
    // Get orders where user is participant
    const allActive = await ctx.db
      .query('group_orders')
      .withIndex('by_status', q => q.eq('status', 'active'))
      .collect();
    
    const asParticipant = allActive.filter(go => 
      go.participants.some(p => p.user_id === args.user_id)
    );
    
    // Deduplicate
    const unique = new Map<string, any>();
    [...asCreator, ...asParticipant].forEach(go => {
      unique.set(go._id, go);
    });
    
    return Array.from(unique.values());
  },
});

// Get group orders by status
export const getByStatus = query({
  args: { 
    status: v.union(
      v.literal("active"),
      v.literal("closed"),
      v.literal("confirmed"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("on_the_way"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    user_id: v.optional(v.id('users')),
  },
  handler: async (ctx, args) => {
    let query = ctx.db
      .query('group_orders')
      .withIndex('by_status', q => q.eq('status', args.status));
    
    const allOrders = await query.collect();
    
    // Filter by user if specified
    if (args.user_id) {
      return allOrders.filter(go => 
        go.created_by === args.user_id || 
        go.participants.some(p => p.user_id === args.user_id)
      );
    }
    
    return allOrders;
  },
});

