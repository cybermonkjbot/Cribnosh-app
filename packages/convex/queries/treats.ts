// @ts-nocheck
import { v } from 'convex/values';
import { query } from '../_generated/server';
import { Id } from '../_generated/dataModel';

// Get all treats given by a user
export const getTreatsByTreater = query({
  args: { treater_id: v.id('users') },
  handler: async (ctx, args) => {
    const treats = await ctx.db
      .query('treats')
      .withIndex('by_treater', q => q.eq('treater_id', args.treater_id))
      .collect();
    
    return treats;
  },
});

// Get all treats received by a user
export const getTreatsByRecipient = query({
  args: { treated_user_id: v.id('users') },
  handler: async (ctx, args) => {
    const treats = await ctx.db
      .query('treats')
      .withIndex('by_treated_user', q => q.eq('treated_user_id', args.treated_user_id))
      .collect();
    
    return treats;
  },
});

// Get bidirectional treat relationships between two users
export const getTreatsBetweenUsers = query({
  args: {
    user_id_1: v.id('users'),
    user_id_2: v.id('users'),
  },
  handler: async (ctx, args) => {
    // Get treats where user1 treated user2
    const treats1to2 = await ctx.db
      .query('treats')
      .withIndex('by_treater', q => q.eq('treater_id', args.user_id_1))
      .filter(q => q.eq(q.field('treated_user_id'), args.user_id_2))
      .collect();
    
    // Get treats where user2 treated user1
    const treats2to1 = await ctx.db
      .query('treats')
      .withIndex('by_treater', q => q.eq('treater_id', args.user_id_2))
      .filter(q => q.eq(q.field('treated_user_id'), args.user_id_1))
      .collect();
    
    return {
      treats_given: treats1to2,
      treats_received: treats2to1,
    };
  },
});

