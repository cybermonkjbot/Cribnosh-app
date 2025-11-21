import { query } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../utils/auth';

/**
 * Get tax year summary for a chef
 * UK tax year runs from April 6 to April 5
 */
export const getTaxYearSummary = query({
  args: {
    chefId: v.id('chefs'),
    taxYear: v.optional(v.number()), // Year (e.g., 2024 for tax year 2024-2025)
    sessionToken: v.optional(v.string()),
  },
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

    const taxYear = args.taxYear || new Date().getFullYear();
    
    // UK tax year: April 6 to April 5
    // For tax year 2024-2025, start is April 6, 2024, end is April 5, 2025
    const startDate = new Date(taxYear, 3, 6).getTime(); // April 6
    const endDate = new Date(taxYear + 1, 3, 5).getTime(); // April 5 of next year

    // Get all transactions for this chef in the tax year
    const transactions = await ctx.db
      .query('balanceTransactions')
      .withIndex('by_user_date', (q) => q.eq('userId', chef.userId))
      .filter(q => 
        q.and(
          q.gte(q.field('createdAt'), startDate),
          q.lte(q.field('createdAt'), endDate)
        )
      )
      .collect();

    // Calculate totals
    let totalEarnings = 0;
    let totalPlatformFees = 0;
    let totalPayouts = 0;
    let totalRefunds = 0;

    transactions.forEach(tx => {
      if (tx.type === 'credit' && tx.amount > 0 && !tx.description.toLowerCase().includes('refund')) {
        totalEarnings += tx.amount;
      } else if (tx.type === 'debit' && (tx.description.toLowerCase().includes('fee') || tx.description.toLowerCase().includes('commission'))) {
        totalPlatformFees += Math.abs(tx.amount);
      } else if (tx.type === 'debit' && tx.description.toLowerCase().includes('payout')) {
        totalPayouts += Math.abs(tx.amount);
      } else if (tx.description.toLowerCase().includes('refund')) {
        totalRefunds += Math.abs(tx.amount);
      }
    });

    const netEarnings = totalEarnings - totalPlatformFees - totalRefunds;

    // Monthly breakdown
    const monthlyBreakdown: Record<string, {
      earnings: number;
      fees: number;
      net: number;
    }> = {};

    transactions.forEach(tx => {
      const date = new Date(tx.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyBreakdown[monthKey]) {
        monthlyBreakdown[monthKey] = { earnings: 0, fees: 0, net: 0 };
      }

      if (tx.type === 'credit' && tx.amount > 0 && !tx.description.toLowerCase().includes('refund')) {
        monthlyBreakdown[monthKey].earnings += tx.amount;
      } else if (tx.type === 'debit' && (tx.description.toLowerCase().includes('fee') || tx.description.toLowerCase().includes('commission'))) {
        monthlyBreakdown[monthKey].fees += Math.abs(tx.amount);
      }
      
      monthlyBreakdown[monthKey].net = monthlyBreakdown[monthKey].earnings - monthlyBreakdown[monthKey].fees;
    });

    return {
      taxYear,
      startDate,
      endDate,
      totalEarnings,
      totalPlatformFees,
      totalPayouts,
      totalRefunds,
      netEarnings,
      monthlyBreakdown: Object.entries(monthlyBreakdown)
        .map(([month, data]) => ({
          month,
          ...data,
        }))
        .sort((a, b) => a.month.localeCompare(b.month)),
    };
  },
});

/**
 * Get available tax years for a chef
 */
export const getAvailableTaxYears = query({
  args: {
    chefId: v.id('chefs'),
    sessionToken: v.optional(v.string()),
  },
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

    // Get all transactions to find the earliest date
    const transactions = await ctx.db
      .query('balanceTransactions')
      .withIndex('by_user', (q) => q.eq('userId', chef.userId))
      .order('asc')
      .first();

    if (!transactions) {
      return [];
    }

    const earliestDate = new Date(transactions.createdAt);
    const currentDate = new Date();
    
    // Get tax year from date (UK tax year starts April 6)
    const getTaxYear = (date: Date) => {
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      // If before April 6, tax year is previous year
      if (month < 4 || (month === 4 && date.getDate() < 6)) {
        return year - 1;
      }
      return year;
    };

    const earliestTaxYear = getTaxYear(earliestDate);
    const currentTaxYear = getTaxYear(currentDate);

    const taxYears: number[] = [];
    for (let year = currentTaxYear; year >= earliestTaxYear; year--) {
      taxYears.push(year);
    }

    return taxYears;
  },
});

