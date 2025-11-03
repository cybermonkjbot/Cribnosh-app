import { v } from 'convex/values';
import { query } from '../_generated/server';
import { Id } from '../_generated/dataModel';

// Get active offers for user
export const getActiveOffers = query({
  args: {
    user_id: v.optional(v.id('users')),
    target_audience: v.optional(v.union(
      v.literal('all'),
      v.literal('new_users'),
      v.literal('existing_users'),
      v.literal('group_orders')
    )),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    
    // Query active offers
    let offers = await ctx.db
      .query('special_offers')
      .withIndex('by_status', q => 
        q.eq('status', 'active').eq('is_active', true)
      )
      .filter(q => 
        q.and(
          q.lte(q.field('starts_at'), now),
          q.gte(q.field('ends_at'), now)
        )
      )
      .collect();
    
    // Filter by target audience if specified
    if (args.target_audience && args.target_audience !== 'all') {
      offers = offers.filter(o => 
        o.target_audience === args.target_audience || 
        o.target_audience === 'all'
      );
    }
    
    // Sort by creation date (newest first)
    offers.sort((a, b) => b.created_at - a.created_at);
    
    return offers;
  },
});

// Get offer by ID
export const getById = query({
  args: { offer_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('special_offers')
      .withIndex('by_offer_id', q => q.eq('offer_id', args.offer_id))
      .first();
  },
});

// Get all offers (for admin)
export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('special_offers').collect();
  },
});

