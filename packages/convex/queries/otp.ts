// @ts-nocheck
import { v } from 'convex/values';
import { query } from '../_generated/server';

export const getEmailOTPStatus = query({
  args: {
    email: v.string(),
  },
  handler: async (ctx, args) => {
    const otp = await ctx.db
      .query('otps')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .order('desc')
      .first();

    if (!otp) {
      return {
        exists: false,
        isExpired: false,
        isUsed: false,
        attemptsRemaining: 0,
        expiresAt: null,
      };
    }

    const now = Date.now();
    const isExpired = now > otp.expiresAt;
    const attemptsRemaining = Math.max(0, otp.maxAttempts - otp.attempts);

    return {
      exists: true,
      isExpired,
      isUsed: otp.isUsed,
      attemptsRemaining,
      expiresAt: otp.expiresAt,
      createdAt: otp.createdAt,
    };
  },
});

export const getPhoneOTPStatus = query({
  args: {
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const otp = await ctx.db
      .query('otps')
      .withIndex('by_phone', (q) => q.eq('phone', args.phone))
      .order('desc')
      .first();

    if (!otp) {
      return {
        exists: false,
        isExpired: false,
        isUsed: false,
        attemptsRemaining: 0,
        expiresAt: null,
      };
    }

    const now = Date.now();
    const isExpired = now > otp.expiresAt;
    const attemptsRemaining = Math.max(0, otp.maxAttempts - otp.attempts);

    return {
      exists: true,
      isExpired,
      isUsed: otp.isUsed,
      attemptsRemaining,
      expiresAt: otp.expiresAt,
      createdAt: otp.createdAt,
    };
  },
});
