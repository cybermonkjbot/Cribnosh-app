// @ts-nocheck
import { v } from 'convex/values';
import { query } from '../_generated/server';
import { isAdmin, isStaff, requireAuth } from '../utils/auth';

export const getTimelogs = query({
  args: {
    staffId: v.optional(v.id('users')),
    bucket: v.optional(v.string()),
    start: v.optional(v.number()), // timestamp >=
    end: v.optional(v.number()),   // timestamp <=
    skip: v.optional(v.number()),
    limit: v.optional(v.number()),
    sessionToken: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // If staffId is provided, check ownership
    if (args.staffId) {
      // Users can only access their own timelogs unless they're staff/admin
      if (!isAdmin(user) && !isStaff(user) && args.staffId !== user._id) {
        throw new Error('Access denied');
      }
    } else {
      // If no staffId provided, default to current user unless they're staff/admin
      if (!isAdmin(user) && !isStaff(user)) {
        args.staffId = user._id;
      }
    }
    
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