// @ts-nocheck
/**
 * Compliance Scoring Configuration
 * 
 * This file contains all the weights and scoring configurations for GDPR compliance.
 * Adjust these values to change how compliance scores are calculated.
 */

export interface ComplianceScoreWeights {
  dataProcessing: number;
  userRights: number;
  dataProtection: number;
  consentManagement: number;
  breachManagement: number;
  dpo: number;
}

export interface DataProcessingWeights {
  lawfulBasis: number;
  dataCategories: number;
  processingPurposes: number;
  dataMinimization: number;
  purposeLimitation: number;
  storageLimitation: number;
}

export interface UserRightsWeights {
  rightToAccess: number;
  rightToRectification: number;
  rightToErasure: number;
  rightToPortability: number;
  rightToRestrictProcessing: number;
  rightToObject: number;
  deletionQuality: number;
}

export interface DataProtectionWeights {
  encryption: number;
  accessControls: number;
  dataMinimization: number;
  purposeLimitation: number;
  storageLimitation: number;
  accuracy: number;
}

export interface ConsentManagementWeights {
  explicitConsent: number;
  consentWithdrawal: number;
  consentRecords: number;
  ageVerification: number;
  parentalConsent: number;
}

export interface BreachManagementWeights {
  breachDetection: number;
  breachNotification: number;
  breachRecords: number;
  dpoNotification: number;
}

/**
 * Main compliance score weights (must sum to 1.0)
 */
export const COMPLIANCE_SCORE_WEIGHTS: ComplianceScoreWeights = {
  dataProcessing: 0.30,      // 30%
  userRights: 0.25,           // 25%
  dataProtection: 0.25,       // 25%
  consentManagement: 0.10,    // 10%
  breachManagement: 0.05,     // 5%
  dpo: 0.05,                  // 5%
  // Total: 1.0 (100%)
};

/**
 * Data Processing sub-weights (must sum to 1.0)
 */
export const DATA_PROCESSING_WEIGHTS: DataProcessingWeights = {
  lawfulBasis: 0.20,
  dataCategories: 0.20,
  processingPurposes: 0.20,
  dataMinimization: 0.15,
  purposeLimitation: 0.15,
  storageLimitation: 0.10,
  // Total: 1.0
};

/**
 * User Rights sub-weights (must sum to 1.0)
 */
export const USER_RIGHTS_WEIGHTS: UserRightsWeights = {
  rightToAccess: 0.15,
  rightToRectification: 0.15,
  rightToErasure: 0.20,
  rightToPortability: 0.15,
  rightToRestrictProcessing: 0.10,
  rightToObject: 0.10,
  deletionQuality: 0.15,
  // Total: 1.0
};

/**
 * Data Protection sub-weights (must sum to 1.0)
 */
export const DATA_PROTECTION_WEIGHTS: DataProtectionWeights = {
  encryption: 0.25,
  accessControls: 0.25,
  dataMinimization: 0.15,
  purposeLimitation: 0.15,
  storageLimitation: 0.10,
  accuracy: 0.10,
  // Total: 1.0
};

/**
 * Consent Management sub-weights (must sum to 1.0)
 */
export const CONSENT_MANAGEMENT_WEIGHTS: ConsentManagementWeights = {
  explicitConsent: 0.30,
  consentWithdrawal: 0.30,
  consentRecords: 0.20,
  ageVerification: 0.10,
  parentalConsent: 0.10,
  // Total: 1.0
};

/**
 * Breach Management sub-weights (must sum to 1.0)
 */
export const BREACH_MANAGEMENT_WEIGHTS: BreachManagementWeights = {
  breachDetection: 0.30,
  breachNotification: 0.30,
  breachRecords: 0.20,
  dpoNotification: 0.20,
  // Total: 1.0
};

/**
 * Default audit period (in milliseconds)
 */
export const DEFAULT_AUDIT_PERIOD_MS = 365 * 24 * 60 * 60 * 1000; // 1 year

