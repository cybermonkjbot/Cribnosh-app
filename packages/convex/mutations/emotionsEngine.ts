import { mutation, MutationCtx } from '../_generated/server';
import { v } from 'convex/values';
import { 
  withConvexErrorHandling, 
  validateConvexArgs, 
  safeConvexOperation,
  ErrorFactory,
  ErrorCode
} from '../../../apps/web/lib/errors/convex-exports';

export const logEmotionsEngineInteraction = mutation({
  args: {
    userId: v.optional(v.string()),
    context: v.any(),
    provider: v.string(),
    query: v.string(),
    response: v.any(),
    timestamp: v.number(),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const { userId, context, provider, query, response, timestamp } = args;
    return await ctx.db.insert('emotions_engine_logs', {
      userId,
      context,
      provider,
      query,
      response,
      timestamp,
    });
  },
});

export const setEmotionsEngineSetting = mutation({
  args: {
    key: v.string(),
    value: v.any(),
    updatedBy: v.optional(v.id('users')),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const existing = await ctx.db.query('emotions_engine_settings').filter(q => q.eq(q.field('key'), args.key)).first();
    if (existing) {
      return await ctx.db.patch(existing._id, {
        value: args.value,
        updatedAt: Date.now(),
        updatedBy: args.updatedBy,
      });
    }
    return await ctx.db.insert('emotions_engine_settings', {
      key: args.key,
      value: args.value,
      updatedAt: Date.now(),
      updatedBy: args.updatedBy,
    });
  },
});

export const deleteEmotionsEngineSetting = mutation({
  args: {
    key: v.string(),
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const existing = await ctx.db.query('emotions_engine_settings').filter(q => q.eq(q.field('key'), args.key)).first();
    if (existing) {
      await ctx.db.delete(existing._id);
      return true;
    }
    return false;
  },
}); 