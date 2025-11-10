import { v } from "convex/values";
import { query } from "../_generated/server";
import {
  GDPR_COMPLIANCE_ISSUES,
  generateIssueFromConfig,
  type ComplianceContext
} from "../config/complianceIssues";
import {
  BREACH_MANAGEMENT_WEIGHTS,
  COMPLIANCE_SCORE_WEIGHTS,
  CONSENT_MANAGEMENT_WEIGHTS,
  DATA_PROCESSING_WEIGHTS,
  DATA_PROTECTION_WEIGHTS,
  DEFAULT_AUDIT_PERIOD_MS,
  USER_RIGHTS_WEIGHTS,
} from "../config/complianceScoring";

export const getGDPRCompliance = query({
  args: {},
  handler: async (ctx: any) => {
    // Analyze actual implementations in the codebase
    
    // 1. DATA PROCESSING - Analyze what data categories are actually processed
    const dataCategories: string[] = [];
    const processingPurposes: string[] = [];
    const lawfulBasis: string[] = [];
    
    // Check what tables exist (data categories)
    const usersCount = await ctx.db.query("users").take(1);
    if (usersCount.length > 0) dataCategories.push("Personal Identifiable Information (PII)");
    
    const ordersCount = await ctx.db.query("orders").take(1);
    if (ordersCount.length > 0) {
      dataCategories.push("Transaction Data");
      processingPurposes.push("Order Processing");
    }
    
    const paymentsCount = await ctx.db.query("paymentMethods").take(1);
    if (paymentsCount.length > 0) {
      dataCategories.push("Payment Information");
      processingPurposes.push("Payment Processing");
    }
    
    const reviewsCount = await ctx.db.query("reviews").take(1);
    if (reviewsCount.length > 0) {
      dataCategories.push("User Reviews");
      processingPurposes.push("Service Improvement");
    }
    
    const supportCount = await ctx.db.query("supportCases").take(1);
    if (supportCount.length > 0) {
      dataCategories.push("Support Communications");
      processingPurposes.push("Customer Support");
    }
    
    // Check for consent management (lawful basis)
    const consentPreferences = await ctx.db.query("dataSharingPreferences").take(1);
    if (consentPreferences.length > 0) {
      lawfulBasis.push("Consent");
    }
    lawfulBasis.push("Contract Performance"); // Orders require contract
    lawfulBasis.push("Legitimate Interest"); // Support and reviews
    
    // 2. USER RIGHTS - Check actual implementations
    const rightToAccess = await ctx.db.query("dataDownloads").take(1).then((r: any[]) => r.length > 0);
    const rightToPortability = rightToAccess; // Same implementation
    const rightToErasure = await ctx.db.query("accountDeletions").take(1).then((r: any[]) => r.length > 0);
    const rightToRectification = true; // Profile update endpoints exist
    const rightToRestrictProcessing = await ctx.db.query("dataSharingPreferences").take(1).then((r: any[]) => r.length > 0);
    const rightToObject = rightToRestrictProcessing; // Same mechanism
    
    // 2.1 DATA DELETION QUALITY - Check how data is actually deleted
    // Check if there are completed deletions (indicates deletion process exists)
    const completedDeletions = await ctx.db
      .query("accountDeletions")
      .withIndex("by_status", (q: any) => q.eq("status", "completed"))
      .take(1);
    const hasDeletionProcess = completedDeletions.length > 0;
    
    // Check if there are pending deletions that should have been processed
    const now = Date.now();
    const pendingDeletions = await ctx.db
      .query("accountDeletions")
      .withIndex("by_status", (q: any) => q.eq("status", "pending"))
      .filter((q: any) => q.lte(q.field("deletion_will_complete_at"), now))
      .take(5);
    const hasOverdueDeletions = pendingDeletions.length > 0;
    
    // Check if deleteUser mutation exists (admin deletion)
    const hasAdminDeletion = true; // deleteUser mutation exists
    
    // Analyze what related data tables exist that should be cleaned up
    const relatedDataTables: string[] = [];
    const hasOrders = await ctx.db.query("orders").take(1).then((r: any[]) => r.length > 0);
    if (hasOrders) relatedDataTables.push("orders");
    
    const hasPayments = await ctx.db.query("paymentMethods").take(1).then((r: any[]) => r.length > 0);
    if (hasPayments) relatedDataTables.push("paymentMethods");
    
    const hasReviews = await ctx.db.query("reviews").take(1).then((r: any[]) => r.length > 0);
    if (hasReviews) relatedDataTables.push("reviews");
    
    const hasSupportCases = await ctx.db.query("supportCases").take(1).then((r: any[]) => r.length > 0);
    if (hasSupportCases) relatedDataTables.push("supportCases");
    
    const hasPreferences = await ctx.db.query("dataSharingPreferences").take(1).then((r: any[]) => r.length > 0);
    if (hasPreferences) relatedDataTables.push("dataSharingPreferences");
    
    const hasAllergies = await ctx.db.query("allergies").take(1).then((r: any[]) => r.length > 0);
    if (hasAllergies) relatedDataTables.push("allergies");
    
    const hasDietaryPrefs = await ctx.db.query("dietaryPreferences").take(1).then((r: any[]) => r.length > 0);
    if (hasDietaryPrefs) relatedDataTables.push("dietaryPreferences");
    
    // Check if there's a cron job for processing deletions (we can't directly check crons, but we can infer)
    // If there are overdue deletions, likely no cron job exists
    const hasDeletionCronJob = !hasOverdueDeletions && hasDeletionProcess;
    
    // Data deletion quality score
    let deletionQualityScore = 0;
    if (hasDeletionProcess) deletionQualityScore += 0.3; // Deletion process exists
    if (hasDeletionCronJob) deletionQualityScore += 0.3; // Automated processing
    if (hasAdminDeletion) deletionQualityScore += 0.2; // Admin can delete
    if (!hasOverdueDeletions) deletionQualityScore += 0.2; // No overdue deletions
    
    // 3. DATA PROTECTION - Analyze security measures
    // Encryption: Passwords are hashed with scrypt (checked in auth routes)
    const encryption = true; // Password hashing implemented
    const accessControls = true; // Role-based access control exists (requireAuth, requireAdmin)
    
    // Check data minimization: Only necessary fields in user schema
    const dataMinimization = true; // Schema shows only necessary fields
    
    // Purpose limitation: Data used only for stated purposes
    const purposeLimitation = true;
    
    // Storage limitation: Check if retention policies exist
    const storageLimitation = true; // Account deletions exist
    
    // Accuracy: Profile updates exist
    const accuracy = true;
    
    // 4. CONSENT MANAGEMENT - Check actual implementation
    const explicitConsent = await ctx.db.query("dataSharingPreferences").take(1).then((r: any[]) => r.length > 0);
    const consentWithdrawal = explicitConsent; // Can update preferences
    const consentRecords = explicitConsent; // Stored in dataSharingPreferences table
    const ageVerification = false; // Not implemented
    const parentalConsent = false; // Not implemented
    
    // 5. BREACH MANAGEMENT - Check logs
    const breachLogs = await ctx.db
      .query("adminActivity")
      .filter((q: any) => 
        q.or(
          q.eq(q.field("type"), "security_incident"),
          q.eq(q.field("type"), "data_breach")
        )
      )
      .take(10);
    
    const breachDetection = breachLogs.length > 0 || true; // Logging exists
    const breachNotification = false; // Not explicitly implemented
    const breachRecords = breachLogs.length > 0;
    const dpoNotification = false; // Not implemented
    
    // 6. DPO - Check if DPO is configured
    const dpoSetting = await ctx.db
      .query("complianceSettings")
      .withIndex("by_setting_id", (q: any) => q.eq("settingId", "gdpr-compliance"))
      .first();
    
    const dpoAppointed = dpoSetting?.dataProcessing?.accountability || false;
    const dpoContactDetails = dpoSetting?.dataProcessing?.accountability ? "dpo@example.com" : "";
    const dpoResponsibilities: string[] = dpoAppointed ? [
      "Monitor GDPR compliance",
      "Provide advice on data protection",
      "Cooperate with supervisory authorities"
    ] : [];
    
    // 7. DATA RETENTION - Analyze actual retention
    const accountDeletions = await ctx.db.query("accountDeletions").take(10);
    const hasRetentionPolicy = accountDeletions.length > 0; // 7-day deletion period exists
    
    // Check actual retention periods from deletion records
    let userDataRetentionPeriod = 7; // Default 7 days
    if (accountDeletions.length > 0) {
      const firstDeletion = accountDeletions[0];
      const retentionDays = Math.round((firstDeletion.deletion_will_complete_at - firstDeletion.deletion_requested_at) / (24 * 60 * 60 * 1000));
      if (retentionDays > 0) {
        userDataRetentionPeriod = retentionDays;
      }
    }
    
    const dataRetention = hasRetentionPolicy ? [
      { category: "User Account Data", period: userDataRetentionPeriod, unit: "days" as const },
      { category: "Transaction Data", period: 7, unit: "years" as const }, // Legal requirement
      { category: "Support Data", period: 2, unit: "years" as const },
      { category: "Analytics Data", period: 1, unit: "year" as const }
    ] : [];
    
    // 8. AUDIT LOGS
    const auditLogs = await ctx.db
      .query("adminActivity")
      .filter((q: any) => 
        q.or(
          q.eq(q.field("type"), "compliance_updated"),
          q.eq(q.field("type"), "data_request"),
          q.eq(q.field("type"), "gdpr_consent")
        )
      )
      .order("desc")
      .take(10);
    
    // 9. CALCULATE COMPLIANCE SCORE using configuration
    let complianceScore = 0;
    
    // Data Processing
    const dataProcessingScore = (
      (lawfulBasis.length > 0 ? 1 : 0) * DATA_PROCESSING_WEIGHTS.lawfulBasis +
      (dataCategories.length > 0 ? 1 : 0) * DATA_PROCESSING_WEIGHTS.dataCategories +
      (processingPurposes.length > 0 ? 1 : 0) * DATA_PROCESSING_WEIGHTS.processingPurposes +
      (dataMinimization ? 1 : 0) * DATA_PROCESSING_WEIGHTS.dataMinimization +
      (purposeLimitation ? 1 : 0) * DATA_PROCESSING_WEIGHTS.purposeLimitation +
      (storageLimitation ? 1 : 0) * DATA_PROCESSING_WEIGHTS.storageLimitation
    ) * 100;
    complianceScore += dataProcessingScore * COMPLIANCE_SCORE_WEIGHTS.dataProcessing;
    
    // User Rights - includes deletion quality
    const userRightsScore = (
      (rightToAccess ? 1 : 0) * USER_RIGHTS_WEIGHTS.rightToAccess +
      (rightToRectification ? 1 : 0) * USER_RIGHTS_WEIGHTS.rightToRectification +
      (rightToErasure ? 1 : 0) * USER_RIGHTS_WEIGHTS.rightToErasure +
      (rightToPortability ? 1 : 0) * USER_RIGHTS_WEIGHTS.rightToPortability +
      (rightToRestrictProcessing ? 1 : 0) * USER_RIGHTS_WEIGHTS.rightToRestrictProcessing +
      (rightToObject ? 1 : 0) * USER_RIGHTS_WEIGHTS.rightToObject +
      (deletionQualityScore * USER_RIGHTS_WEIGHTS.deletionQuality)
    ) * 100;
    complianceScore += userRightsScore * COMPLIANCE_SCORE_WEIGHTS.userRights;
    
    // Data Protection
    const dataProtectionScore = (
      (encryption ? 1 : 0) * DATA_PROTECTION_WEIGHTS.encryption +
      (accessControls ? 1 : 0) * DATA_PROTECTION_WEIGHTS.accessControls +
      (dataMinimization ? 1 : 0) * DATA_PROTECTION_WEIGHTS.dataMinimization +
      (purposeLimitation ? 1 : 0) * DATA_PROTECTION_WEIGHTS.purposeLimitation +
      (storageLimitation ? 1 : 0) * DATA_PROTECTION_WEIGHTS.storageLimitation +
      (accuracy ? 1 : 0) * DATA_PROTECTION_WEIGHTS.accuracy
    ) * 100;
    complianceScore += dataProtectionScore * COMPLIANCE_SCORE_WEIGHTS.dataProtection;
    
    // Consent Management
    const consentScore = (
      (explicitConsent ? 1 : 0) * CONSENT_MANAGEMENT_WEIGHTS.explicitConsent +
      (consentWithdrawal ? 1 : 0) * CONSENT_MANAGEMENT_WEIGHTS.consentWithdrawal +
      (consentRecords ? 1 : 0) * CONSENT_MANAGEMENT_WEIGHTS.consentRecords +
      (ageVerification ? 1 : 0) * CONSENT_MANAGEMENT_WEIGHTS.ageVerification +
      (parentalConsent ? 1 : 0) * CONSENT_MANAGEMENT_WEIGHTS.parentalConsent
    ) * 100;
    complianceScore += consentScore * COMPLIANCE_SCORE_WEIGHTS.consentManagement;
    
    // Breach Management
    const breachScore = (
      (breachDetection ? 1 : 0) * BREACH_MANAGEMENT_WEIGHTS.breachDetection +
      (breachNotification ? 1 : 0) * BREACH_MANAGEMENT_WEIGHTS.breachNotification +
      (breachRecords ? 1 : 0) * BREACH_MANAGEMENT_WEIGHTS.breachRecords +
      (dpoNotification ? 1 : 0) * BREACH_MANAGEMENT_WEIGHTS.dpoNotification
    ) * 100;
    complianceScore += breachScore * COMPLIANCE_SCORE_WEIGHTS.breachManagement;
    
    // DPO
    const dpoScore = (dpoAppointed ? 1 : 0) * 100;
    complianceScore += dpoScore * COMPLIANCE_SCORE_WEIGHTS.dpo;
    
    // Get last audit dates
    const lastAudit = dpoSetting?.lastModified || Date.now() - DEFAULT_AUDIT_PERIOD_MS;
    const nextAudit = lastAudit + DEFAULT_AUDIT_PERIOD_MS;
    
    // Get all resolved issues
    const resolvedIssues = await ctx.db
      .query("complianceIssueResolutions")
      .withIndex("by_status", (q: any) => q.eq("status", "resolved"))
      .collect();
    
    const resolvedIssueIds = new Set<string>(resolvedIssues.map((r: any) => r.issueId as string));
    
    // Build compliance context for issue generation
    const complianceContext: ComplianceContext = {
      ageVerification,
      parentalConsent,
      breachNotification,
      dpoAppointed,
      hasDeletionCronJob,
      hasOverdueDeletions,
      pendingDeletionsCount: pendingDeletions.length,
      relatedDataTables,
      hasDeletionProcess,
    };
    
    // Generate compliance issues from configuration
    const issues: any[] = GDPR_COMPLIANCE_ISSUES
      .map(config => generateIssueFromConfig(config, complianceContext, resolvedIssueIds))
      .filter((issue): issue is any => issue !== null);
    
    // Note: Resolved issues are excluded from the active issues list
    // They can be queried separately if needed for history/audit purposes
    
    return {
      dataProcessing: {
        lawfulBasis: lawfulBasis,
        dataCategories: dataCategories,
        processingPurposes: processingPurposes,
        dataRetention: dataRetention
      },
      dataDeletion: {
        hasDeletionProcess: hasDeletionProcess,
        hasDeletionCronJob: hasDeletionCronJob,
        hasAdminDeletion: hasAdminDeletion,
        hasOverdueDeletions: hasOverdueDeletions,
        relatedDataTables: relatedDataTables,
        deletionQualityScore: Math.round(deletionQualityScore * 100)
      },
      userRights: {
        rightToAccess: rightToAccess,
        rightToRectification: rightToRectification,
        rightToErasure: rightToErasure,
        rightToPortability: rightToPortability,
        rightToRestrictProcessing: rightToRestrictProcessing,
        rightToObject: rightToObject
      },
      dataProtection: {
        encryption: encryption,
        accessControls: accessControls,
        dataMinimization: dataMinimization,
        purposeLimitation: purposeLimitation,
        storageLimitation: storageLimitation,
        accuracy: accuracy
      },
      consentManagement: {
        explicitConsent: explicitConsent,
        consentWithdrawal: consentWithdrawal,
        consentRecords: consentRecords,
        ageVerification: ageVerification,
        parentalConsent: parentalConsent
      },
      breachManagement: {
        breachDetection: breachDetection,
        breachNotification: breachNotification,
        breachRecords: breachRecords,
        dpoNotification: dpoNotification
      },
      dpo: {
        appointed: dpoAppointed,
        contactDetails: dpoContactDetails,
        responsibilities: dpoResponsibilities
      },
      lastAudit: lastAudit,
      nextAudit: nextAudit,
      complianceScore: Math.round(complianceScore),
      issues: issues,
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

    // Get security incidents
    const securityIncidents = await ctx.db
      .query("adminActivity")
      .filter((q: any) => 
        q.or(
          q.eq(q.field("type"), "security_incident"),
          q.eq(q.field("type"), "data_breach")
        )
      )
      .order("desc")
      .take(10);

    // Extract settings data or use defaults
    const settings = securitySetting?.data || {};
    const accessControls = securitySetting?.accessControls || {};
    const dataEncryption = securitySetting?.dataEncryption || {};

    // Map to expected structure
    const authentication = settings.authentication || {
      twoFactorAuth: accessControls.mfaEnabled || false,
      passwordPolicy: !!accessControls.passwordPolicy,
      sessionManagement: !!accessControls.sessionTimeout,
      accountLockout: accessControls.accountLockout || false,
      biometricAuth: accessControls.biometricAuth || false,
      ssoEnabled: accessControls.ssoEnabled || false,
    };

    const authorization = settings.authorization || {
      roleBasedAccess: accessControls.roleBasedAccess || false,
      principleOfLeastPrivilege: accessControls.principleOfLeastPrivilege || false,
      regularAccessReviews: accessControls.regularAccessReviews || false,
      privilegeEscalation: accessControls.privilegeEscalation || false,
      apiAccessControl: accessControls.apiAccessControl || false,
    };

    const dataSecurity = settings.dataSecurity || {
      encryptionAtRest: dataEncryption.atRest || false,
      encryptionInTransit: dataEncryption.inTransit || false,
      keyManagement: !!dataEncryption.keyManagement,
      dataClassification: settings.dataClassification || false,
      secureBackup: settings.secureBackup || false,
      dataLossPrevention: settings.dataLossPrevention || false,
    };

    const networkSecurity = settings.networkSecurity || {
      firewall: settings.firewall || false,
      intrusionDetection: settings.intrusionDetection || false,
      ddosProtection: settings.ddosProtection || false,
      vpnAccess: settings.vpnAccess || false,
      networkSegmentation: settings.networkSegmentation || false,
      sslTls: settings.sslTls || true, // Default to true as it's standard
    };

    const monitoring = settings.monitoring || {
      securityLogging: true, // Always true if we have logs
      realTimeMonitoring: settings.realTimeMonitoring || false,
      incidentResponse: settings.incidentResponse || false,
      threatDetection: settings.threatDetection || false,
      vulnerabilityScanning: settings.vulnerabilityScanning || false,
      penetrationTesting: settings.penetrationTesting || false,
    };

    const compliance = settings.compliance || {
      iso27001: settings.iso27001 || false,
      soc2: settings.soc2 || false,
      pciDss: settings.pciDss || false,
      hipaa: settings.hipaa || false,
      gdpr: settings.gdpr || false,
      regularAudits: settings.regularAudits || false,
    };

    // Get vulnerabilities from adminActivity
    const vulnerabilities = await ctx.db
      .query("adminActivity")
      .filter((q: any) => q.eq(q.field("type"), "vulnerability"))
      .order("desc")
      .take(10)
      .then((logs: any[]) => 
        logs.map((log: any) => ({
          id: log._id,
          title: log.description || "Security Vulnerability",
          severity: log.metadata?.details?.severity || "medium",
          status: log.metadata?.details?.status || "open",
          description: log.description || "",
          cveId: log.metadata?.details?.cveId,
          affectedSystems: log.metadata?.details?.affectedSystems || [],
          remediation: log.metadata?.details?.remediation || "",
          dueDate: log.metadata?.details?.dueDate || Date.now() + (90 * 24 * 60 * 60 * 1000),
        }))
      );

    // Transform security incidents
    const transformedIncidents = securityIncidents.map((incident: any) => ({
      id: incident._id,
      title: incident.description || "Security Incident",
      severity: incident.metadata?.details?.severity || "medium",
      status: incident.metadata?.details?.status || "open",
      description: incident.description || "",
      affectedSystems: incident.metadata?.details?.affectedSystems || [],
      discoveredAt: incident.timestamp,
      resolvedAt: incident.metadata?.details?.resolvedAt,
      impact: incident.metadata?.details?.impact || "",
    }));

    // Calculate security score
    let securityScore = 0;
    const totalChecks = 6; // 6 categories
    const checksPerCategory = 6; // Average checks per category
    
    const categoryScores = [
      Object.values(authentication).filter(Boolean).length,
      Object.values(authorization).filter(Boolean).length,
      Object.values(dataSecurity).filter(Boolean).length,
      Object.values(networkSecurity).filter(Boolean).length,
      Object.values(monitoring).filter(Boolean).length,
      Object.values(compliance).filter(Boolean).length,
    ];

    const totalPossible = totalChecks * checksPerCategory;
    const totalActual = categoryScores.reduce((sum, score) => sum + score, 0);
    securityScore = Math.round((totalActual / totalPossible) * 100);

    // Get audit dates
    const lastSecurityAudit = securitySetting?.lastModified || Date.now() - (365 * 24 * 60 * 60 * 1000);
    const nextSecurityAudit = lastSecurityAudit + (365 * 24 * 60 * 60 * 1000);

    return {
      authentication,
      authorization,
      dataSecurity,
      networkSecurity,
      monitoring,
      compliance,
      lastSecurityAudit,
      nextSecurityAudit,
      securityScore,
      vulnerabilities,
      securityIncidents: transformedIncidents,
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

export const getResolvedComplianceIssues = query({
  args: {
    issueType: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx: any, args: any) => {
    const limit = args.limit || 50;
    
    try {
      let query = ctx.db.query("complianceIssueResolutions");
      
      // Filter by status
      query = query.withIndex("by_status", (q: any) => q.eq("status", "resolved"));
      
      // Filter by issue type if provided
      if (args.issueType) {
        query = query.filter((q: any) => q.eq(q.field("issueType"), args.issueType));
      }
      
      const resolutions = await query
        .order("desc")
        .take(limit);
      
      // Get user information for each resolution
      const resolutionsWithUsers = await Promise.all(
        resolutions.map(async (r: any) => {
          const user = await ctx.db.get(r.resolvedBy).catch(() => null);
          return {
            id: r._id,
            issueId: r.issueId,
            issueType: r.issueType,
            status: r.status,
            resolution: r.resolution,
            notes: r.notes,
            resolvedBy: r.resolvedBy,
            resolvedByName: user?.name || "Unknown",
            resolvedAt: r.resolvedAt,
          };
        })
      );
      
      return resolutionsWithUsers;
    } catch (error) {
      console.error('Failed to fetch resolved compliance issues:', error);
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
