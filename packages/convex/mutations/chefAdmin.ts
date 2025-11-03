import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { MutationCtx } from '../_generated/server';
import { api } from '../_generated/api';
import { 
  withConvexErrorHandling, 
  validateConvexArgs, 
  safeConvexOperation,
  ErrorFactory,
  ErrorCode
} from '../../../apps/web/lib/errors/convex-exports';

// Chef Management Mutations
export const updateChefVerification = mutation({
  args: {
    chefId: v.id('chefs'),
    verificationStatus: v.union(
      v.literal('pending'),
      v.literal('verified'),
      v.literal('rejected')
    ),
    verificationDocuments: v.optional(v.object({
      healthPermit: v.boolean(),
      insurance: v.boolean(),
      backgroundCheck: v.boolean(),
      certifications: v.array(v.string())
    })),
    notes: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const chef = await ctx.db.get(args.chefId);
    if (!chef) {
      throw ErrorFactory.conflict('Chef not found');
    }

    // Update chef verification status
    await ctx.db.patch(args.chefId, {
      verificationStatus: args.verificationStatus,
      verificationDocuments: args.verificationDocuments,
      updatedAt: Date.now()
    });

    // Log the activity
    await ctx.runMutation(api.mutations.admin.logActivity, {
      type: 'chef_verification_update',
      description: `Chef verification status updated to ${args.verificationStatus}`,
      metadata: {
        entityId: args.chefId,
        entityType: 'chef',
        details: {
          verificationStatus: args.verificationStatus,
          notes: args.notes
        }
      }
    });

    return { success: true };
  },
});

export const sendChefMessage = mutation({
  args: {
    chefId: v.id('chefs'),
    subject: v.string(),
    message: v.string(),
    messageType: v.union(
      v.literal('notification'),
      v.literal('warning'),
      v.literal('announcement'),
      v.literal('support')
    )
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const chef = await ctx.db.get(args.chefId);
    if (!chef) {
      throw ErrorFactory.conflict('Chef not found');
    }

    // Create a notification for the chef
    await ctx.db.insert('notifications', {
      userId: (chef as any)?.userId,
      type: 'admin_message',
      title: args.subject,
      message: args.message,
      data: {
        messageType: args.messageType,
        fromAdmin: true
      },
      read: false,
      createdAt: Date.now()
    });

    // Log the activity
    await ctx.runMutation(api.mutations.admin.logActivity, {
      type: 'chef_message_sent',
      description: `Message sent to chef: ${args.subject}`,
      metadata: {
        entityId: args.chefId,
        entityType: 'chef',
        details: {
          messageType: args.messageType,
          subject: args.subject
        }
      }
    });

    return { success: true };
  },
});

export const bulkUpdateChefStatus = mutation({
  args: {
    chefIds: v.array(v.id('chefs')),
    status: v.union(
      v.literal('active'),
      v.literal('inactive'),
      v.literal('suspended'),
      v.literal('pending_verification')
    ),
    reason: v.optional(v.string())
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const updatePromises = args.chefIds.map(chefId => 
      ctx.db.patch(chefId, {
        status: args.status,
        updatedAt: Date.now()
      })
    );

    await Promise.all(updatePromises);

    // Log the activity
    await ctx.runMutation(api.mutations.admin.logActivity, {
      type: 'bulk_chef_status_update',
      description: `Bulk status update for ${args.chefIds.length} chefs to ${args.status}`,
      metadata: {
        entityType: 'chef',
        details: {
          chefCount: args.chefIds.length,
          status: args.status,
          reason: args.reason
        }
      }
    });

    return { success: true, updatedCount: args.chefIds.length };
  },
});

export const updateChefPerformance = mutation({
  args: {
    chefId: v.id('chefs'),
    performanceData: v.object({
      totalOrders: v.number(),
      completedOrders: v.number(),
      averageRating: v.number(),
      totalEarnings: v.number()
    })
  },
  returns: v.any(),
  handler: async (ctx: MutationCtx, args) => {
    const chef = await ctx.db.get(args.chefId);
    if (!chef) {
      throw ErrorFactory.conflict('Chef not found');
    }

    // Update chef performance data
    await ctx.db.patch(args.chefId, {
      performance: args.performanceData,
      updatedAt: Date.now()
    });

    return { success: true };
  },
});
