import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuth } from '../utils/auth';

/**
 * Get payout history for a chef
 */
export const getHistory = query({
  args: {
    chefId: v.id('chefs'),
    status: v.optional(v.union(
      v.literal('pending'),
      v.literal('processing'),
      v.literal('completed'),
      v.literal('failed'),
      v.literal('cancelled')
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    sessionToken: v.optional(v.string()),
  },
  returns: v.object({
    payouts: v.array(v.object({
      payoutId: v.string(),
      amount: v.number(), // in pence
      currency: v.literal('gbp'),
      status: v.union(
        v.literal('pending'),
        v.literal('processing'),
        v.literal('completed'),
        v.literal('failed'),
        v.literal('cancelled')
      ),
      requestedAt: v.number(),
      processedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      estimatedArrivalDate: v.optional(v.number()),
      actualArrivalDate: v.optional(v.number()),
      failureReason: v.optional(v.string()),
      bankAccount: v.optional(v.object({
        accountHolderName: v.string(),
        bankName: v.string(),
        last4: v.string(),
      })),
    })),
    total: v.number(),
  }),
  handler: async (ctx, args) => {
    const user = await requireAuth(ctx, args.sessionToken);
    const chef = await ctx.db.get(args.chefId);
    
    if (!chef) {
      throw new Error('Chef not found');
    }

    // Verify ownership
    if (chef.userId !== user._id) {
      throw new Error('Access denied');
    }

    // TODO: Query chefPayouts table when implemented
    // For now, return empty array
    return {
      payouts: [],
      total: 0,
    };
  },
});

/**
 * Get a specific payout by ID
 */
export const getById = query({
  args: {
    payoutId: v.string(),
    sessionToken: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      payoutId: v.string(),
      amount: v.number(),
      currency: v.literal('gbp'),
      status: v.union(
        v.literal('pending'),
        v.literal('processing'),
        v.literal('completed'),
        v.literal('failed'),
        v.literal('cancelled')
      ),
      requestedAt: v.number(),
      processedAt: v.optional(v.number()),
      completedAt: v.optional(v.number()),
      estimatedArrivalDate: v.optional(v.number()),
      actualArrivalDate: v.optional(v.number()),
      failureReason: v.optional(v.string()),
      bankAccount: v.optional(v.object({
        accountHolderName: v.string(),
        bankName: v.string(),
        last4: v.string(),
      })),
    }),
    v.null()
  ),
  handler: async (ctx, args) => {
    await requireAuth(ctx, args.sessionToken);

    // TODO: Query chefPayouts table when implemented
    return null;
  },
});

