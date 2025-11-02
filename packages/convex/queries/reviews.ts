import { v } from 'convex/values';
import { query } from '../_generated/server';
import { Id } from '../_generated/dataModel';

export const getAll = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query('reviews').collect();
  }
});

export const getByChef = query({
  args: { chef_id: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db.query('reviews').filter(q => q.eq(q.field('chef_id'), args.chef_id)).collect();
  },
});

// Get a single review by ID
export const get = query({
  args: { id: v.id("reviews") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
}); 