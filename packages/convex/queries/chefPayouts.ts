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
      v.literal('requested'),
      v.literal('processing'),
      v.literal('paid'),
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
      currency: v.string(), // changed to string to match mutation
      status: v.union(
        v.literal('requested'),
        v.literal('processing'),
        v.literal('paid'),
        v.literal('failed'),
        v.literal('cancelled')
      ),
      requestedAt: v.number(),
      processedAt: v.optional(v.number()),
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

    let query = ctx.db
      .query('chefPayouts')
      .withIndex('by_chef', q => q.eq('chefId', args.chefId));

    if (args.status) {
      query = query.filter(q => q.eq(q.field('status'), args.status));
    }

    // Get all matching payouts to sort and paginate in memory
    const allPayouts = await query.collect();

    // Sort by requestedAt desc
    allPayouts.sort((a, b) => b.requestedAt - a.requestedAt);

    const total = allPayouts.length;

    const limit = args.limit || 20;
    const offset = args.offset || 0;
    const paginatedPayouts = allPayouts.slice(offset, offset + limit);

    const payoutsWithBankDetails = await Promise.all(
      paginatedPayouts.map(async (p) => {
        let bankAccount = undefined;
        if (p.bankAccountId) {
          const bank = await ctx.db.get(p.bankAccountId);
          if (bank) {
            bankAccount = {
              accountHolderName: bank.accountHolderName,
              bankName: bank.bankName,
              last4: bank.last4,
            };
          }
        }

        return {
          payoutId: p._id,
          amount: p.amount,
          currency: p.currency,
          status: p.status,
          requestedAt: p.requestedAt,
          processedAt: p.processedAt,
          estimatedArrivalDate: p.metadata?.estimatedArrivalDate,
          actualArrivalDate: p.metadata?.actualArrivalDate,
          failureReason: p.failureReason,
          bankAccount,
        };
      })
    );

    return {
      payouts: payoutsWithBankDetails,
      total,
    };
  },
});

/**
 * Get a specific payout by ID
 */
export const getById = query({
  args: {
    payoutId: v.id('chefPayouts'),
    sessionToken: v.optional(v.string()),
  },
  returns: v.union(
    v.object({
      payoutId: v.string(),
      amount: v.number(),
      currency: v.string(),
      status: v.union(
        v.literal('requested'),
        v.literal('processing'),
        v.literal('paid'),
        v.literal('failed'),
        v.literal('cancelled')
      ),
      requestedAt: v.number(),
      processedAt: v.optional(v.number()),
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
    const user = await requireAuth(ctx, args.sessionToken);

    const payout = await ctx.db.get(args.payoutId);
    if (!payout) return null;

    const chef = await ctx.db.get(payout.chefId);
    if (!chef) return null;

    // Verify ownership
    if (chef.userId !== user._id) {
      return null;
    }

    let bankAccount = undefined;
    if (payout.bankAccountId) {
      const bank = await ctx.db.get(payout.bankAccountId);
      if (bank) {
        bankAccount = {
          accountHolderName: bank.accountHolderName,
          bankName: bank.bankName,
          last4: bank.last4,
        };
      }
    }

    return {
      payoutId: payout._id,
      amount: payout.amount,
      currency: payout.currency,
      status: payout.status,
      requestedAt: payout.requestedAt,
      processedAt: payout.processedAt,
      estimatedArrivalDate: payout.metadata?.estimatedArrivalDate,
      actualArrivalDate: payout.metadata?.actualArrivalDate,
      failureReason: payout.failureReason,
      bankAccount,
    };
  },
});
