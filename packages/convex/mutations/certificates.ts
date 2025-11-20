import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requireAuth, isAdmin, isStaff } from '../utils/auth';
import { Id } from '../_generated/dataModel';

/**
 * Generate a certificate for a completed course
 * This is called automatically when a course is completed
 */
export const generateCertificate = mutation({
  args: {
    chefId: v.id("chefs"),
    courseId: v.string(),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    // Get chef to verify ownership
    const chef = await ctx.db.get(args.chefId);
    
    if (!chef) {
      throw new Error('Chef not found');
    }
    
    // Users can only generate certificates for themselves, staff/admin can generate for any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    // Get course enrollment
    const enrollment = await ctx.db
      .query('chefCourses')
      .withIndex('by_chef_course', q => 
        q.eq('chefId', args.chefId).eq('courseId', args.courseId)
      )
      .first();
    
    if (!enrollment) {
      throw new Error('Course enrollment not found');
    }
    
    if (enrollment.status !== 'completed') {
      throw new Error('Course must be completed before generating certificate');
    }
    
    // Check if certificate already exists
    if (enrollment.certificateId) {
      const existingCert = await ctx.db.get(enrollment.certificateId);
      if (existingCert) {
        return existingCert._id;
      }
    }
    
    // Generate certificate number (format: CERT-{courseId}-{chefId}-{timestamp})
    const timestamp = Date.now();
    const certificateNumber = `CERT-${args.courseId.toUpperCase()}-${args.chefId.slice(-8)}-${timestamp}`;
    
    // Get user for chef name
    const chefUser = await ctx.db.get(chef.userId);
    const chefName = chefUser?.name || chef.name || 'Chef';
    
    const now = Date.now();
    
    // Create certificate record
    // Note: PDF generation would happen in an action, for now we just create the record
    const certificateId = await ctx.db.insert('certificates', {
      chefId: args.chefId,
      courseId: args.courseId,
      courseName: enrollment.courseName,
      certificateNumber,
      issuedAt: now,
      chefName,
      status: 'active',
      createdAt: now,
    });
    
    // Update enrollment with certificate ID
    await ctx.db.patch(enrollment._id, {
      certificateId,
      updatedAt: now,
    });
    
    return certificateId;
  },
});

/**
 * Get certificate by ID
 */
export const getCertificate = mutation({
  args: {
    certificateId: v.id("certificates"),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    const certificate = await ctx.db.get(args.certificateId);
    
    if (!certificate) {
      throw new Error('Certificate not found');
    }
    
    // Get chef to verify ownership
    const chef = await ctx.db.get(certificate.chefId);
    
    if (!chef) {
      throw new Error('Chef not found');
    }
    
    // Users can only access their own certificates, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    // Get document URL if available
    let documentUrl = certificate.documentUrl;
    if (certificate.documentStorageId) {
      try {
        const url = await ctx.storage.getUrl(certificate.documentStorageId);
        if (url) {
          documentUrl = url;
        }
      } catch (error) {
        console.error('Error getting certificate document URL:', error);
      }
    }
    
    return {
      ...certificate,
      documentUrl,
    };
  },
});

/**
 * Revoke a certificate (admin/staff only)
 */
export const revokeCertificate = mutation({
  args: {
    certificateId: v.id("certificates"),
    reason: v.optional(v.string()),
    sessionToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Require admin/staff authentication
    const user = await requireAuth(ctx, args.sessionToken);
    
    if (!isAdmin(user) && !isStaff(user)) {
      throw new Error('Access denied: Admin or staff required');
    }
    
    const certificate = await ctx.db.get(args.certificateId);
    
    if (!certificate) {
      throw new Error('Certificate not found');
    }
    
    await ctx.db.patch(args.certificateId, {
      status: 'revoked',
      updatedAt: Date.now(),
    });
    
    return certificate._id;
  },
});

