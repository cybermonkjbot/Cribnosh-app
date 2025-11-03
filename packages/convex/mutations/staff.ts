import { v } from 'convex/values';
import { mutation, MutationCtx } from '../_generated/server';
import { 
  withConvexErrorHandling, 
  validateConvexArgs, 
  safeConvexOperation,
  ErrorFactory,
  ErrorCode
} from '../../../apps/web/lib/errors/convex-exports';
import { Id } from '../_generated/dataModel';

// Staff Email Campaign Mutations
export const createStaffEmailCampaign = mutation({
  args: {
    name: v.string(),
    subject: v.string(),
    content: v.string(),
    recipientType: v.union(
      v.literal("all_waitlist"),
      v.literal("pending_waitlist"),
      v.literal("approved_waitlist"),
      v.literal("converted_users"),
      v.literal("all_users")
    ),
  },
  returns: v.id("staffEmailCampaigns"),
  handler: async (ctx, args) => {
    // Get recipient count based on type
    let recipientCount = 0;

    if (args.recipientType === "all_waitlist") {
      const allWaitlist = await ctx.db
        .query("waitlist")
        .collect();
      recipientCount = allWaitlist.length;
    } else if (args.recipientType === "pending_waitlist") {
      const pendingWaitlist = await ctx.db
        .query("waitlist")
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();
      recipientCount = pendingWaitlist.length;
    } else if (args.recipientType === "approved_waitlist") {
      const approvedWaitlist = await ctx.db
        .query("waitlist")
        .filter((q) => q.eq(q.field("status"), "approved"))
        .collect();
      recipientCount = approvedWaitlist.length;
    } else if (args.recipientType === "converted_users") {
      const convertedUsers = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("roles"), ["customer"]))
        .collect();
      recipientCount = convertedUsers.length;
    } else if (args.recipientType === "all_users") {
      const allUsers = await ctx.db
        .query("users")
        .collect();
      recipientCount = allUsers.length;
    }

    const campaignId = await ctx.db.insert("staffEmailCampaigns", {
      name: args.name,
      subject: args.subject,
      content: args.content,
      status: "draft",
      recipientType: args.recipientType,
      recipientCount,
      sentCount: 0,
      createdAt: Date.now(),
    });

    return campaignId;
  },
});

export const sendStaffEmailCampaign = mutation({
  args: {
    campaignId: v.id("staffEmailCampaigns"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    const campaign = await ctx.db.get(args.campaignId);
    if (!campaign) {
      throw new Error("Campaign not found");
    }

    // Update campaign status to sending
    await ctx.db.patch(args.campaignId, {
      status: "sending",
    });

    // Get recipients based on campaign type
    let recipients: any[] = [];

    if (campaign.recipientType === "all_waitlist") {
      recipients = await ctx.db
        .query("waitlist")
        .collect();
    } else if (campaign.recipientType === "pending_waitlist") {
      recipients = await ctx.db
        .query("waitlist")
        .filter((q) => q.eq(q.field("status"), "pending"))
        .collect();
    } else if (campaign.recipientType === "approved_waitlist") {
      recipients = await ctx.db
        .query("waitlist")
        .filter((q) => q.eq(q.field("status"), "approved"))
        .collect();
    } else if (campaign.recipientType === "converted_users") {
      recipients = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("roles"), ["customer"]))
        .collect();
    } else if (campaign.recipientType === "all_users") {
      recipients = await ctx.db
        .query("users")
        .collect();
    }

    // Queue emails for sending
    const emailPromises = recipients.map(async (recipient) => {
      try {
        // Add email to queue for processing
        await ctx.db.insert("emailQueue", {
          templateId: "staff-campaign-template",
          recipientEmail: recipient.email,
          recipientData: {
            name: recipient.name,
            email: recipient.email,
            campaignId: campaign._id,
            campaignName: campaign.name,
            subject: campaign.subject,
            content: campaign.content,
            recipientType: "external",
          },
          priority: "medium",
          scheduledFor: Date.now(),
          status: "pending",
          attempts: 0,
          maxAttempts: 3,
        });
      } catch (error) {
        console.error(`Failed to queue email for ${recipient.email}:`, error);
      }
    });

    // Wait for all emails to be queued
    await Promise.all(emailPromises);

    // Update campaign status to sent
    await ctx.db.patch(args.campaignId, {
      status: "sent",
      sentAt: Date.now(),
      sentCount: recipients.length,
    });

    return { success: true, sentCount: recipients.length };
  },
});

export const deleteStaffEmailCampaign = mutation({
  args: {
    campaignId: v.id("staffEmailCampaigns"),
  },
  returns: v.any(),
  handler: async (ctx, args) => {
    await ctx.db.delete(args.campaignId);
    return { success: true };
  },
});

// Work Email Request Mutations
export const createWorkEmailRequest = mutation({
  args: {
    userId: v.id("users"),
    requestedEmail: v.string(),
    reason: v.string(),
    department: v.string(),
    position: v.string(),
  },
  returns: v.id("workEmailRequests"),
  handler: async (ctx: MutationCtx, args) => {
    const requestId = await ctx.db.insert('workEmailRequests', {
      ...args,
      status: 'pending',
      submittedAt: Date.now(),
    });
    
    // Log admin activity
    await ctx.db.insert('adminActivity', {
      type: 'work_email_request_created',
      userId: args.userId,
      description: `Work email request created for ${args.requestedEmail}`,
      timestamp: Date.now(),
      metadata: {
        entityId: requestId,
        entityType: 'workEmailRequest',
        details: { requestedEmail: args.requestedEmail, department: args.department }
      },
    });
    
    return requestId;
  },
});

// Helper to fetch admin info
function isUser(obj: any): obj is { email: string; name: string } {
  return obj && typeof obj.email === 'string' && typeof obj.name === 'string';
}

async function getAdminInfo(ctx: MutationCtx, adminId: Id<"users"> | Id<"chefs"> | string) {
  // Try to get as user first
  try {
    const userId = adminId as Id<"users">;
    const user = await ctx.db.get(userId);
    if (user && 'email' in user && 'name' in user) {
      return {
        email: user.email ?? '',
        name: user.name ?? '',
        id: adminId,
      };
    }
  } catch {
    // Not a user, continue
  }
  
  // If not a user, try to get as chef and fetch the related user
  try {
    const chefId = adminId as Id<"chefs">;
    const chef = await ctx.db.get(chefId);
    if (chef && 'userId' in chef && chef.userId) {
      const relatedUser = await ctx.db.get(chef.userId);
      return {
        email: relatedUser?.email ?? '',
        name: relatedUser?.name ?? '',
        id: adminId,
      };
    }
  } catch {
    // Not a chef, continue
  }
  
  return {
    email: '',
    name: '',
    id: adminId,
  };
}

interface AuthWithPermissions {
  isAdmin?: boolean;
  isManagement?: boolean;
  isDeveloper?: boolean;
  isCompliance?: boolean;
  canApproveLeave?: boolean;
  permissions?: string[];
}

function hasAuthPermission(auth: unknown, ...checks: Array<keyof AuthWithPermissions>): boolean {
  if (!auth || typeof auth !== 'object') return false;
  const authObj = auth as Record<string, unknown>;
  return checks.some(check => {
    const value = authObj[check];
    if (check === 'permissions' && Array.isArray(value)) {
      return value.includes('leave:approve');
    }
    return value === true;
  });
}

function isAdminUser(obj: unknown): boolean {
  if (!obj || typeof obj !== 'object') return false;
  
  // Check if it's a user object with roles
  if ('roles' in obj && Array.isArray(obj.roles)) {
    return obj.roles.includes('admin') || obj.roles.includes('management') || 
           obj.roles.includes('developer') || obj.roles.includes('compliance');
  }
  
  // Check if it's a chef object with role property
  if ('role' in obj && typeof obj.role === 'string') {
    return obj.role === 'admin' || obj.role === 'management' || 
           obj.role === 'developer' || obj.role === 'compliance';
  }
  
  return false;
}

export const updateWorkEmailRequestStatus = mutation({
  args: {
    requestId: v.id("workEmailRequests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    reviewedBy: v.id("users"),
    reviewNotes: v.optional(v.string()),
    approvedEmail: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx: MutationCtx, args) => {
    if (!hasAuthPermission(ctx.auth, 'isAdmin', 'isManagement', 'isDeveloper', 'isCompliance')) {
      throw ErrorFactory.authorization('Permission denied: Only admins, management, developer, or compliance can approve or reject work email requests.');
    }
    const { requestId, ...updates } = args;
    // Permission check
    const admin = await ctx.db.get(updates.reviewedBy);
    if (!isAdminUser(admin)) {
      throw ErrorFactory.authorization('Permission denied: Only admins, management, developer, or compliance can approve or reject work email requests.');
    }
    await ctx.db.patch(requestId, {
      ...updates,
      reviewedAt: Date.now(),
    });
    // Audit log with admin info
    const adminInfo = await getAdminInfo(ctx, updates.reviewedBy as string);
    await ctx.db.insert('adminActivity', {
      type: 'work_email_request_updated',
      userId: updates.reviewedBy,
      description: `Work email request ${args.status}`,
      timestamp: Date.now(),
      metadata: {
        entityId: requestId,
        entityType: 'workEmailRequest',
        details: { status: args.status, reviewNotes: args.reviewNotes, performedBy: adminInfo },
      },
    });
    // Email notification
    const req = await ctx.db.get(requestId);
    if (req && req.userId) {
      const user = await ctx.db.get(req.userId);
      if (user && user && 'email' in user ? user.email : '') {
        let subject = '';
        let message = '';
        if (args.status === 'approved') {
          subject = 'Your work email request was approved';
          message = `Congratulations! Your request for a work email (${req.requestedEmail}) has been approved.`;
        } else {
          subject = 'Your work email request was rejected';
          message = `Unfortunately, your request for a work email (${req.requestedEmail}) was rejected.`;
          if (args.reviewNotes) message += `\nReason: ${args.reviewNotes}`;
        }
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notify-staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: user && 'email' in user ? user.email : '', subject, message }),
        });
      }
    }
    return null;
  },
});

// Leave Request Mutations
export const createLeaveRequest = mutation({
  args: {
    userId: v.id("users"),
    leaveType: v.union(v.literal("annual"), v.literal("sick"), v.literal("personal"), v.literal("maternity"), v.literal("paternity"), v.literal("bereavement"), v.literal("other")),
    startDate: v.string(),
    endDate: v.string(),
    totalDays: v.number(),
    reason: v.string(),
    emergencyContact: v.optional(v.string()),
    isHalfDay: v.optional(v.boolean()),
  },
  returns: v.id("leaveRequests"),
  handler: async (ctx: MutationCtx, args) => {
    const requestId = await ctx.db.insert('leaveRequests', {
      ...args,
      status: 'pending',
      submittedAt: Date.now(),
    });
    
    // Log admin activity
    await ctx.db.insert('adminActivity', {
      type: 'leave_request_created',
      userId: args.userId,
      description: `Leave request created for ${args.leaveType} leave`,
      timestamp: Date.now(),
      metadata: {
        entityId: requestId,
        entityType: 'leaveRequest',
        details: { leaveType: args.leaveType, totalDays: args.totalDays, startDate: args.startDate, endDate: args.endDate }
      },
    });
    
    return requestId;
  },
});

export const updateLeaveRequestStatus = mutation({
  args: {
    requestId: v.id("leaveRequests"),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    reviewedBy: v.id("users"),
    reviewNotes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx: MutationCtx, args) => {
    if (!hasAuthPermission(ctx.auth, 'isAdmin', 'isManagement', 'isDeveloper', 'isCompliance', 'canApproveLeave', 'permissions')) {
      throw ErrorFactory.authorization('Permission denied: You do not have permission to approve leave requests.');
    }
    const { requestId, ...updates } = args;
    // Permission check
    const admin = await ctx.db.get(updates.reviewedBy);
    if (!isAdminUser(admin)) {
      throw ErrorFactory.authorization('Permission denied: Only admins, management, developer, or compliance can approve or reject leave requests.');
    }
    await ctx.db.patch(requestId, {
      ...updates,
      reviewedAt: Date.now(),
    });
    // Audit log with admin info
    const adminInfo = await getAdminInfo(ctx, updates.reviewedBy as string);
    await ctx.db.insert('adminActivity', {
      type: 'leave_request_updated',
      userId: updates.reviewedBy,
      description: `Leave request ${args.status}`,
      timestamp: Date.now(),
      metadata: {
        entityId: requestId,
        entityType: 'leaveRequest',
        details: { status: args.status, reviewNotes: args.reviewNotes, performedBy: adminInfo },
      },
    });
    // Email notification
    const req = await ctx.db.get(requestId);
    if (req && 'userId' in req) {
      const user = await ctx.db.get(req.userId);
      if (user && 'email' in user) {
        let subject = '';
        let message = '';
        if (args.status === 'approved') {
          subject = 'Your leave request was approved';
          message = `Your leave request (${'leaveType' in req ? req.leaveType : 'unknown'}, ${'startDate' in req ? req.startDate : 'unknown'} to ${'endDate' in req ? req.endDate : 'unknown'}) has been approved.`;
        } else {
          subject = 'Your leave request was rejected';
          message = `Your leave request (${'leaveType' in req ? req.leaveType : 'unknown'}, ${'startDate' in req ? req.startDate : 'unknown'} to ${'endDate' in req ? req.endDate : 'unknown'}) was rejected.`;
          if (args.reviewNotes) message += `\nReason: ${args.reviewNotes}`;
        }
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notify-staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: user && 'email' in user ? user.email : '', subject, message }),
        });
      }
    }
    return null;
  },
});

// Work ID Mutations
export const generateWorkId = mutation({
  args: {
    userId: v.id("users"),
    employeeId: v.string(),
    name: v.string(),
    department: v.string(),
    position: v.string(),
    photoUrl: v.optional(v.string()),
    issuedBy: v.id("users"),
    expiresInDays: v.optional(v.number()), // Default to 365 days if not provided
  },
  returns: v.null(),
  handler: async (ctx: MutationCtx, args) => {
    const { expiresInDays = 365, ...workIdData } = args;
    
    // Generate unique work ID number
    const workIdNumber = `CN-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    // Generate QR code data using qrcode library
    const qrCodeData = JSON.stringify({
      workIdNumber,
      employeeId: workIdData.employeeId,
      name: workIdData.name,
      department: workIdData.department,
      issuedAt: Date.now(),
    });
    
    // Generate QR code as base64 string
    const qrCodeBase64 = await generateQRCode(qrCodeData);
    
    const workId = await ctx.db.insert('workIds', {
      ...workIdData,
      workIdNumber,
      qrCode: qrCodeData,
      qrCodeBase64: qrCodeBase64, // Store the generated QR code image
      status: 'active',
      issuedAt: Date.now(),
      expiresAt: Date.now() + (expiresInDays * 24 * 60 * 60 * 1000), // Convert days to milliseconds
    });
    
    // Log admin activity
    await ctx.db.insert('adminActivity', {
      type: 'work_id_generated',
      userId: workIdData.issuedBy,
      description: `Work ID generated for ${workIdData.name}`,
      timestamp: Date.now(),
      metadata: {
        entityId: workId,
        entityType: 'workId',
        details: { workIdNumber, employeeId: workIdData.employeeId, department: workIdData.department }
      },
    });
    
    return null;
  },
});

export const updateWorkId = mutation({
  args: {
    workId: v.id("workIds"),
    name: v.optional(v.string()),
    department: v.optional(v.string()),
    position: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    digitalVersion: v.optional(v.string()),
    printableVersion: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx: MutationCtx, args) => {
    const { workId, ...updates } = args;
    
    await ctx.db.patch(workId, updates);
    
    return null;
  },
});

export const revokeWorkId = mutation({
  args: {
    workId: v.id("workIds"),
    revokedBy: v.id("users"),
    revocationReason: v.string(),
  },
  returns: v.null(),
  handler: async (ctx: MutationCtx, args) => {
    if (!hasAuthPermission(ctx.auth, 'isAdmin')) {
      throw ErrorFactory.authorization('Permission denied: Only admins can revoke Work IDs.');
    }
    const { workId, ...revocationData } = args;
    // Permission check
    const admin = await ctx.db.get(revocationData.revokedBy as any);
    if (!isAdminUser(admin)) {
      throw ErrorFactory.authorization('Permission denied: Only admins can revoke Work IDs.');
    }
    await ctx.db.patch(workId, {
      status: 'revoked',
      revokedAt: Date.now(),
      ...revocationData,
    });
    // Audit log with admin info
    const adminInfo = await getAdminInfo(ctx, revocationData.revokedBy);
    await ctx.db.insert('adminActivity', {
      type: 'work_id_revoked',
      userId: revocationData.revokedBy,
      description: `Work ID revoked`,
      timestamp: Date.now(),
      metadata: {
        entityId: workId,
        entityType: 'workId',
        details: { revocationReason: revocationData.revocationReason, performedBy: adminInfo },
      },
    });
    // Email notification
    const workIdObj = await ctx.db.get(workId);
    if (workIdObj && 'userId' in workIdObj) {
      const user = await ctx.db.get(workIdObj.userId);
      if (user && 'email' in user) {
        const subject = 'Your Work ID has been revoked';
        let message = `Your Work ID (${'workIdNumber' in workIdObj ? workIdObj.workIdNumber : 'unknown'}) has been revoked.`;
        if (args.revocationReason) message += `\nReason: ${args.revocationReason}`;
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notify-staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: user && 'email' in user ? user.email : '', subject, message }),
        });
      }
    }
    return null;
  },
});

export const renewWorkId = mutation({
  args: {
    workId: v.id("workIds"),
    renewedBy: v.id("users"),
    expiresInDays: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx: MutationCtx, args) => {
    if (!hasAuthPermission(ctx.auth, 'isAdmin')) {
      throw ErrorFactory.authorization('Permission denied: Only admins can renew Work IDs.');
    }
    const { workId, renewedBy, expiresInDays = 365 } = args;
    // Permission check
    const admin = await ctx.db.get(renewedBy as any);
    if (!isAdminUser(admin)) {
      throw ErrorFactory.authorization('Permission denied: Only admins can renew Work IDs.');
    }
    const newExpiresAt = Date.now() + (expiresInDays * 24 * 60 * 60 * 1000);
    await ctx.db.patch(workId, {
      status: 'active',
      expiresAt: newExpiresAt,
      revokedAt: undefined,
      revokedBy: undefined,
      revocationReason: undefined,
    });
    // Audit log with admin info
    const adminInfo = await getAdminInfo(ctx, renewedBy);
    await ctx.db.insert('adminActivity', {
      type: 'work_id_renewed',
      userId: renewedBy,
      description: `Work ID renewed`,
      timestamp: Date.now(),
      metadata: {
        entityId: workId,
        entityType: 'workId',
        details: { expiresAt: newExpiresAt, performedBy: adminInfo },
      },
    });
    // Email notification
    const workIdObj = await ctx.db.get(workId);
    if (workIdObj && 'userId' in workIdObj) {
      const user = await ctx.db.get(workIdObj.userId);
      if (user && 'email' in user) {
        const subject = 'Your Work ID has been renewed';
        const message = `Your Work ID (${'workIdNumber' in workIdObj ? workIdObj.workIdNumber : 'unknown'}) has been renewed and is now valid until ${new Date(newExpiresAt).toLocaleDateString()}.`;
        await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/notify-staff`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: user && 'email' in user ? user.email : '', subject, message }),
        });
      }
    }
    return null;
  },
});

// Bulk Operations for Admin
export const bulkUpdateWorkEmailRequestStatus = mutation({
  args: {
    requestIds: v.array(v.id("workEmailRequests")),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    reviewedBy: v.id("users"),
    reviewNotes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx: MutationCtx, args) => {
    if (!hasAuthPermission(ctx.auth, 'isAdmin')) {
      throw ErrorFactory.authorization('Permission denied: Only admins can bulk update work email requests.');
    }
    const { requestIds, ...updates } = args;
    
    for (const requestId of requestIds) {
      await ctx.db.patch(requestId, {
        ...updates,
        reviewedAt: Date.now(),
      });
    }
    
    // Log admin activity
    await ctx.db.insert('adminActivity', {
      type: 'bulk_work_email_requests_updated',
      userId: updates.reviewedBy,
      description: `Bulk updated ${requestIds.length} work email requests to ${args.status}`,
      timestamp: Date.now(),
      metadata: {
        entityType: 'workEmailRequest',
        details: { count: requestIds.length, status: args.status, reviewNotes: args.reviewNotes }
      },
    });
    
    return null;
  },
});

export const bulkUpdateLeaveRequestStatus = mutation({
  args: {
    requestIds: v.array(v.id("leaveRequests")),
    status: v.union(v.literal("approved"), v.literal("rejected")),
    reviewedBy: v.id("users"),
    reviewNotes: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx: MutationCtx, args) => {
    if (!hasAuthPermission(ctx.auth, 'isAdmin')) {
      throw ErrorFactory.authorization('Permission denied: Only admins can bulk update leave requests.');
    }
    const { requestIds, ...updates } = args;
    
    for (const requestId of requestIds) {
      await ctx.db.patch(requestId, {
        ...updates,
        reviewedAt: Date.now(),
      });
    }
    
    // Log admin activity
    await ctx.db.insert('adminActivity', {
      type: 'bulk_leave_requests_updated',
      userId: updates.reviewedBy,
      description: `Bulk updated ${requestIds.length} leave requests to ${args.status}`,
      timestamp: Date.now(),
      metadata: {
        entityType: 'leaveRequest',
        details: { count: requestIds.length, status: args.status, reviewNotes: args.reviewNotes }
      },
    });
    
    return null;
  },
});

export const generateOnboardingCode = mutation({
  args: { email: v.string(), onboarding: v.optional(v.any()) },
  handler: async (ctx, args) => {
    // Generate a 6-digit code using Math.random (V8-compatible)
    const code = String(Math.floor(100000 + Math.random() * 900000));
    const now = Date.now();
    const expiresAt = now + 1000 * 60 * 60 * 24; // 24 hours
    await ctx.db.insert('onboardingCodes', {
      code,
      email: args.email,
      status: 'active',
      createdAt: now,
      expiresAt,
    });
    // If onboarding data is provided, patch it to the user
    if (args.onboarding) {
      const user = await ctx.db.query('users').filter(q => q.eq(q.field('email'), args.email)).first();
      if (user) {
        await ctx.db.patch(user._id, { onboarding: args.onboarding });
      }
    }
    return code;
  },
});

export const validateOnboardingCode = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const codeDoc = await ctx.db.query('onboardingCodes').filter(q => q.eq(q.field('code'), args.code)).first();
    if (!codeDoc || codeDoc.status !== 'active' || codeDoc.expiresAt < Date.now()) {
      return { valid: false };
    }
    return { valid: true, email: codeDoc.email };
  },
});

export const markOnboardingCodeUsed = mutation({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    const codeDoc = await ctx.db.query('onboardingCodes').filter(q => q.eq(q.field('code'), args.code)).first();
    if (!codeDoc) return false;
    await ctx.db.patch(codeDoc._id, { status: 'used' });
    return null;
  },
}); 

export const createStaffAssignment = mutation({
  args: {
    userId: v.id("users"),
    department: v.string(),
    position: v.string(),
    assignedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("staffAssignments", args);
  },
});

export const updateStaffAssignment = mutation({
  args: {
    assignmentId: v.id("staffAssignments"),
    department: v.optional(v.string()),
    position: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { assignmentId, ...updates } = args;
    await ctx.db.patch(assignmentId, updates);
    return null;
  },
}); 

export const updateMattermostSetup = mutation({
  args: {
    userId: v.id("users"),
    mattermostUsername: v.string(),
    mattermostEmail: v.string(),
    setupCompleted: v.boolean(),
    setupCompletedAt: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin or the user themselves
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser) {
      throw new Error("User not found");
    }

    // Allow if admin or if updating own profile
    if (currentUser._id !== args.userId && !currentUser.roles?.includes('admin')) {
      throw new Error("Not authorized");
    }

    // Update the user's Mattermost setup
    await ctx.db.patch(args.userId, {
      mattermostUserId: args.mattermostUsername, // Using mattermostUsername as the userId
    });

    return { success: true };
  },
});

// Create onboarding record for new staff
export const createOnboardingRecord = mutation({
  args: {
    userId: v.id("users"),
    onboardingData: v.object({
      department: v.string(),
      position: v.string(),
      startDate: v.string(),
      employmentType: v.string(),
      salary: v.optional(v.string()),
      emergencyContact: v.optional(v.object({
        name: v.string(),
        relationship: v.string(),
        phone: v.string(),
        email: v.string(),
      })),
      taxInfo: v.optional(v.object({
        ssn: v.string(),
        filingStatus: v.string(),
        allowances: v.number(),
      })),
      bankingInfo: v.optional(v.object({
        bankName: v.string(),
        accountNumber: v.string(),
        routingNumber: v.string(),
        accountType: v.string(),
      })),
      benefits: v.optional(v.object({
        healthInsurance: v.boolean(),
        dentalInsurance: v.boolean(),
        visionInsurance: v.boolean(),
        retirementPlan: v.boolean(),
        lifeInsurance: v.boolean(),
      })),
    }),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Not authenticated");
    }

    // Check if user is admin
    const currentUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", identity.email!))
      .first();

    if (!currentUser || !currentUser.roles?.includes('admin')) {
      throw new Error("Not authorized");
    }

    // Update the user with onboarding data
    await ctx.db.patch(args.userId, {
      onboarding: args.onboardingData,
      department: args.onboardingData.department,
      position: args.onboardingData.position,
      startDate: args.onboardingData.startDate,
      employmentType: args.onboardingData.employmentType,
      salary: args.onboardingData.salary,
      emergencyContact: args.onboardingData.emergencyContact,
      taxInfo: args.onboardingData.taxInfo,
      bankingInfo: args.onboardingData.bankingInfo,
      benefits: args.onboardingData.benefits,
      roles: ["staff"],
      lastModified: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Generate QR code as base64 string
 */
async function generateQRCode(data: string): Promise<string> {
  try {
    // Generate QR code using the qrcode library
    const QRCode = require('qrcode');
    
    const options = {
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 256
    };
    
    const qrCodeBase64 = await QRCode.toDataURL(data, options);
    return qrCodeBase64;
    
  } catch (error) {
    console.error('QR code generation error:', error);
    // Return a fallback base64 image if QR generation fails
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
  }
}