// @ts-nocheck
import { internalMutation } from "../_generated/server";
import { v } from "convex/values";

export const cleanupExpiredOTPs = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    
    // Find all expired OTPs
    const expiredOtps = await ctx.db
      .query("otps")
      .filter((q) => q.lt(q.field("expiresAt"), now))
      .collect();
    
    // Delete expired OTPs
    for (const otp of expiredOtps) {
      await ctx.db.delete(otp._id);
    }
    
    console.log(`Cleaned up ${expiredOtps.length} expired OTPs`);
    
    return {
      success: true,
      deletedCount: expiredOtps.length,
      timestamp: now
    };
  },
});
