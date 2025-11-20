import { v } from 'convex/values';
import { query } from '../_generated/server';
import { requireAuth, isAdmin, isStaff } from '../utils/auth';
import { Id } from '../_generated/dataModel';

/**
 * Get all certificates for a chef
 */
export const getByChefId = query({
  args: {
    chefId: v.id("chefs"),
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
    
    // Users can only access their own certificates, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    const certificates = await ctx.db
      .query('certificates')
      .withIndex('by_chef', q => q.eq('chefId', args.chefId))
      .collect();
    
    // Enrich certificates with document URLs
    const enrichedCertificates = await Promise.all(
      certificates.map(async (cert) => {
        let documentUrl = cert.documentUrl;
        
        if (cert.documentStorageId) {
          try {
            const url = await ctx.storage.getUrl(cert.documentStorageId);
            if (url) {
              documentUrl = url;
            }
          } catch (error) {
            console.error(`Error getting URL for certificate ${cert._id}:`, error);
          }
        }
        
        return {
          ...cert,
          documentUrl,
        };
      })
    );
    
    return enrichedCertificates;
  },
});

/**
 * Get certificate by course
 */
export const getByChefAndCourse = query({
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
    
    // Users can only access their own certificates, staff/admin can access any
    if (!isAdmin(user) && !isStaff(user) && chef.userId !== user._id) {
      throw new Error('Access denied');
    }
    
    // Get enrollment to find certificate ID
    const enrollment = await ctx.db
      .query('chefCourses')
      .withIndex('by_chef_course', q => 
        q.eq('chefId', args.chefId).eq('courseId', args.courseId)
      )
      .first();
    
    if (!enrollment || !enrollment.certificateId) {
      return null;
    }
    
    const certificate = await ctx.db.get(enrollment.certificateId);
    
    if (!certificate) {
      return null;
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
 * Get certificate by certificate number (public verification)
 */
export const getByCertificateNumber = query({
  args: {
    certificateNumber: v.string(),
  },
  handler: async (ctx, args) => {
    // This is a public query for certificate verification
    // No authentication required
    
    const certificate = await ctx.db
      .query('certificates')
      .withIndex('by_certificate_number', q => q.eq('certificateNumber', args.certificateNumber))
      .first();
    
    if (!certificate || certificate.status !== 'active') {
      return null;
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

