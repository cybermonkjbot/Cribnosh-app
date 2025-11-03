import { query } from '../_generated/server';
import { v } from 'convex/values';

export const getTimelogs = query({
  args: {
    staffId: v.optional(v.id('users')),
    bucket: v.optional(v.string()),
    start: v.optional(v.number()), // timestamp >=
    end: v.optional(v.number()),   // timestamp <=
    skip: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query('timelogs');
    if (args.staffId) q = q.filter(q => q.eq(q.field('staffId'), args.staffId));
    if (args.bucket) q = q.filter(q => q.eq(q.field('bucket'), args.bucket));
    if (args.start) q = q.filter(q => q.gte(q.field('timestamp'), args.start!));
    if (args.end) q = q.filter(q => q.lte(q.field('timestamp'), args.end!));
    let results = await q.collect();
    results = results.sort((a, b) => b.timestamp - a.timestamp);
    const total = results.length;
    if (args.skip) results = results.slice(args.skip);
    if (args.limit) results = results.slice(0, args.limit);
    return { total, results };
  },
}); 