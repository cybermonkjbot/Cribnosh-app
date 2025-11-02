import { query } from "../_generated/server";
import { v } from "convex/values";

export const getGDPRCompliance = query({
  args: {},
  handler: async (ctx: any) => {
    // Get GDPR compliance settings from database
    const gdprSetting = await ctx.db
      .query("complianceSettings")
      .withIndex("by_setting_id", (q: any) => q.eq("settingId", "gdpr-compliance"))
      .first();

    // Get audit logs for GDPR-related activities
    const auditLogs = await ctx.db
      .query("adminActivity")
      .filter((q: any) => q.eq(q.field("type"), "compliance_updated"))
      .order("desc")
      .take(10);

    // Calculate compliance score based on settings
    let complianceScore = 0;
    if (gdprSetting?.dataProcessing) {
      const dpFields = Object.values(gdprSetting.dataProcessing).filter(Boolean).length;
      complianceScore += (dpFields / 7) * 40; // 40% weight for data processing
    }
    if (gdprSetting?.userRights) {
      const urFields = Object.values(gdprSetting.userRights).filter(Boolean).length;
      complianceScore += (urFields / 7) * 30; // 30% weight for user rights
    }
    if (gdprSetting?.dataRetention) {
      complianceScore += 30; // 30% weight for data retention
    }

    return {
      dataProcessing: gdprSetting?.dataProcessing || {
        lawfulBasis: "consent",
        dataMinimization: true,
        purposeLimitation: true,
        storageLimitation: true,
        accuracy: true,
        security: true,
        accountability: true,
      },
      userRights: gdprSetting?.userRights || {
        rightToAccess: true,
        rightToRectification: true,
        rightToErasure: true,
        rightToRestrictProcessing: true,
        rightToDataPortability: true,
        rightToObject: true,
        rightsRelatedToAutomatedDecisionMaking: true,
      },
      dataRetention: gdprSetting?.dataRetention || {
        userData: "3 years",
        transactionData: "7 years",
        marketingData: "2 years",
        analyticsData: "1 year",
      },
      complianceScore: Math.round(complianceScore),
      lastModified: gdprSetting?.lastModified || Date.now(),
      version: gdprSetting?.version || 1,
      isActive: gdprSetting?.isActive || false,
      auditHistory: auditLogs.map((log: any) => ({
        timestamp: log.timestamp,
        description: log.description,
        modifiedBy: log.metadata?.details?.modifiedBy,
      })),
    };
  },
});

export const getSecurityCompliance = query({
  args: {},
  handler: async (ctx: any) => {
    // Get security compliance settings from database
    const securitySetting = await ctx.db
      .query("complianceSettings")
      .withIndex("by_setting_id", (q: any) => q.eq("settingId", "security-compliance"))
      .first();

    // Get security incident logs
    const securityLogs = await ctx.db
      .query("adminActivity")
      .filter((q: any) => q.eq(q.field("type"), "security_updated"))
      .order("desc")
      .take(10);

    // Calculate security score based on settings
    let securityScore = 0;
    if (securitySetting?.accessControls) {
      const acFields = Object.values(securitySetting.accessControls).filter(Boolean).length;
      securityScore += (acFields / 4) * 50; // 50% weight for access controls
    }
    if (securitySetting?.dataEncryption) {
      const deFields = Object.values(securitySetting.dataEncryption).filter(Boolean).length;
      securityScore += (deFields / 3) * 50; // 50% weight for data encryption
    }

    return {
      accessControls: securitySetting?.accessControls || {
        mfaEnabled: true,
        passwordPolicy: "strong",
        sessionTimeout: "30 minutes",
        roleBasedAccess: true,
      },
      dataEncryption: securitySetting?.dataEncryption || {
        atRest: true,
        inTransit: true,
        keyManagement: "secure",
      },
      securityScore: Math.round(securityScore),
      lastModified: securitySetting?.lastModified || Date.now(),
      version: securitySetting?.version || 1,
      isActive: securitySetting?.isActive || false,
      auditHistory: securityLogs.map((log: any) => ({
        timestamp: log.timestamp,
        description: log.description,
        modifiedBy: log.metadata?.details?.modifiedBy,
      })),
    };
  },
});

export const getComplianceLogs = query({
  args: {
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const limit = args.limit || 50;
    
    try {
      // Get real compliance logs from adminActivity table
      let query = ctx.db.query("adminActivity");
      
      // Filter by compliance-related types
      const complianceTypes = [
        "compliance_updated",
        "security_updated", 
        "data_request",
        "security_incident",
        "gdpr_consent",
        "data_access",
        "security_audit"
      ];
      
      if (args.type) {
        query = query.filter((q: any) => q.eq(q.field("type"), args.type));
      } else {
        query = query.filter((q: any) => 
          complianceTypes.some(type => q.eq(q.field("type"), type))
        );
      }
      
      const logs = await query
        .order("desc")
        .take(limit);
      
      // Transform the logs to match expected format
      return logs.map((log: any) => ({
        id: log._id,
        type: log.type,
        description: log.description,
        timestamp: log.timestamp,
        userId: log.userId || log.metadata?.details?.userId || "system",
        details: log.metadata?.details || {},
      }));
      
    } catch (error) {
      console.error('Failed to fetch compliance logs:', error);
      // Return empty array on error
      return [];
    }
  },
});

export const getFoodCertifications = query({
  args: {
    userId: v.optional(v.id("users")),
    status: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    try {
      // Get real food certifications from documents table
      let query = ctx.db.query("documents");
      
      // Filter for certification documents
      query = query.filter((q: any) => 
        q.eq(q.field("documentType"), "certification")
      );
      
      if (args.userId) {
        query = query.filter((q: any) => q.eq(q.field("userId"), args.userId));
      }
      
      if (args.status) {
        query = query.filter((q: any) => q.eq(q.field("status"), args.status));
      }
      
      const documents = await query
        .order("desc")
        .collect();
      
      // Transform documents to certification format
      const certifications = await Promise.all(
        documents.map(async (doc: any) => {
          // Get user information
          const user = await ctx.db.get(doc.userId);
          
          // Determine status based on expiry date
          let status = "active";
          if (doc.expiryDate && doc.expiryDate < Date.now()) {
            status = "expired";
          } else if (doc.expiryDate && doc.expiryDate < Date.now() + (30 * 24 * 60 * 60 * 1000)) {
            status = "expiring_soon";
          }
          
          return {
            id: doc._id,
            userId: doc.userId,
            userName: user?.name || "Unknown User",
            type: doc.documentData?.certificationType || "Food Certification",
            level: doc.documentData?.level || "Level 1",
            issuingBody: doc.documentData?.issuingBody || "Unknown",
            certificateNumber: doc.documentData?.certificateNumber || `CERT-${doc._id.slice(-6)}`,
            issueDate: doc.issueDate || doc._creationTime,
            expiryDate: doc.expiryDate,
            status: status,
            verified: doc.status === "approved",
            documents: doc.fileUrl ? [
              {
                name: doc.fileName || "certificate.pdf",
                url: doc.fileUrl,
                uploadedAt: doc._creationTime,
              }
            ] : [],
            requirements: doc.documentData?.requirements || [
              "Food safety principles",
              "Hazard analysis",
              "Temperature control",
              "Personal hygiene"
            ]
          };
        })
      );
      
      return certifications;
      
    } catch (error) {
      console.error('Failed to fetch food certifications:', error);
      // Return empty array on error
      return [];
    }
  },
});

export const getPolicyAcceptance = query({
  args: {
    userId: v.optional(v.id("users")),
    policyType: v.optional(v.string()),
  },
  handler: async (ctx: any, args: any) => {
    try {
      // Get real policy acceptance data from adminActivity table
      let query = ctx.db.query("adminActivity");
      
      // Filter for policy acceptance activities
      query = query.filter((q: any) => 
        q.eq(q.field("type"), "policy_acceptance")
      );
      
      if (args.userId) {
        query = query.filter((q: any) => q.eq(q.field("userId"), args.userId));
      }
      
      const activities = await query
        .order("desc")
        .collect();
      
      // Transform activities to policy acceptance format
      const policyAcceptances = await Promise.all(
        activities.map(async (activity: any) => {
          // Get user information
          const user = await ctx.db.get(activity.userId);
          
          const details = activity.metadata?.details || {};
          
          return {
            id: activity._id,
            userId: activity.userId,
            userName: user?.name || "Unknown User",
            policyType: details.policyType || "Terms of Service",
            version: details.version || "1.0",
            acceptedAt: activity.timestamp,
            ipAddress: details.ipAddress || "Unknown",
            userAgent: details.userAgent || "Unknown",
            status: "accepted"
          };
        })
      );
      
      // Filter by policy type if specified
      let filteredAcceptances = policyAcceptances;
      if (args.policyType) {
        filteredAcceptances = policyAcceptances.filter(acceptance => 
          acceptance.policyType === args.policyType
        );
      }
      
      return filteredAcceptances;
      
    } catch (error) {
      console.error('Failed to fetch policy acceptance data:', error);
      // Return empty array on error
      return [];
    }
  },
});

export const getSecurityLogs = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const limit = args.limit || 50;
    
    try {
      // Get real security logs from adminActivity table
      let query = ctx.db.query("adminActivity");
      
      // Filter for security-related activities
      const securityTypes = [
        "security_incident",
        "security_updated",
        "authentication_failed",
        "authorization_failed",
        "suspicious_activity",
        "data_breach",
        "access_violation"
      ];
      
      query = query.filter((q: any) => 
        securityTypes.some(type => q.eq(q.field("type"), type))
      );
      
      // Apply date filters if provided
      if (args.startDate && args.endDate) {
        query = query.filter((q: any) => 
          q.and(
            q.gte(q.field("timestamp"), args.startDate),
            q.lte(q.field("timestamp"), args.endDate)
          )
        );
      }
      
      const activities = await query
        .order("desc")
        .take(limit);
      
      // Transform activities to security log format
      const logs = activities.map((activity: any) => {
        const details = activity.metadata?.details || {};
        
        // Determine severity based on activity type
        let severity = "info";
        if (activity.type.includes("failed") || activity.type.includes("violation")) {
          severity = "warning";
        }
        if (activity.type.includes("breach") || activity.type.includes("incident")) {
          severity = "error";
        }
        
        return {
          id: activity._id,
          timestamp: activity.timestamp,
          type: activity.type,
          severity: severity,
          message: activity.description,
          userId: activity.userId || details.userId || "system",
          ipAddress: details.ipAddress || "Unknown",
          userAgent: details.userAgent || "Unknown",
          status: details.status || "completed"
        };
      });
      
      return logs;
      
    } catch (error) {
      console.error('Failed to fetch security logs:', error);
      // Return empty array on error
      return [];
    }
  },
});
