// CribNosh Email Admin Configuration System
// Comprehensive admin interface for email management

import { emailUrls } from './utils/urls';

export interface EmailAdminConfig {
  id: string;
  name: string;
  description: string;
  category: 'templates' | 'automation' | 'branding' | 'delivery' | 'analytics' | 'compliance';
  settings: Record<string, any>;
  isEnabled: boolean;
  lastModified: Date;
  modifiedBy: string;
  version: number;
}

export interface EmailTemplateConfig {
  templateId: string;
  name: string;
  isActive: boolean;
  subject: string;
  previewText: string;
  senderName: string;
  senderEmail: string;
  replyToEmail: string;
  customFields: Record<string, any>;
  styling: {
    primaryColor: string;
    secondaryColor: string;
    accent: string;
    fontFamily: string;
    logoUrl: string;
    footerText: string;
  };
  scheduling: {
    timezone: string;
    sendTime: string;
    frequency: 'immediate' | 'scheduled' | 'recurring';
    recurringPattern?: {
      frequency: 'daily' | 'weekly' | 'monthly';
      interval: number;
      daysOfWeek?: number[];
      dayOfMonth?: number;
    };
  };
  targeting: {
    audience: 'all' | 'segment' | 'custom';
    segmentId?: string;
    customFilters?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    excludeFilters?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };
  testing: {
    testEmails: string[];
    testData: Record<string, any>;
    previewMode: boolean;
  };
  lastModified?: Date;
  version?: number;
}

export interface EmailAutomationConfig {
  automationId: string;
  name: string;
  description: string;
  isActive: boolean;
  triggers: Array<{
    event: string;
    conditions: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    delay: number;
    priority: 'low' | 'medium' | 'high' | 'critical';
  }>;
  templates: Array<{
    templateId: string;
    data: Record<string, any>;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  }>;
  schedule: {
    startDate: Date;
    endDate?: Date;
    timezone: string;
  };
  limits: {
    maxEmailsPerDay: number;
    maxEmailsPerHour: number;
    maxEmailsPerUser: number;
  };
  lastModified?: Date;
  version?: number;
}

export interface EmailBrandingConfig {
  brandId: string;
  name: string;
  isDefault: boolean;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    text: string;
    textSecondary: string;
    background: string;
    backgroundSecondary: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
    headingSizes: Record<string, string>;
    bodySizes: Record<string, string>;
  };
  logo: {
    url: string;
    width: number;
    height: number;
    altText: string;
  };
  footer: {
    companyName: string;
    address: string;
    phone: string;
    email: string;
    website: string;
    socialLinks: Array<{
      platform: string;
      url: string;
      icon: string;
    }>;
    legalLinks: Array<{
      text: string;
      url: string;
    }>;
  };
  spacing: {
    scale: number[];
    defaultPadding: string;
    defaultMargin: string;
  };
  lastModified?: Date;
  version?: number;
}

export interface EmailDeliveryConfig {
  provider: 'resend' | 'sendgrid' | 'mailgun' | 'ses';
  apiKey: string;
  apiSecret?: string;
  region?: string;
  fromEmail: string;
  fromName: string;
  replyToEmail: string;
  bounceEmail: string;
  unsubscribeUrl: string;
  trackingDomain: string;
  webhookUrl: string;
  rateLimits: {
    requestsPerSecond: number;
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  retryPolicy: {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
  };
  bounceHandling: {
    softBounceRetries: number;
    hardBounceAction: 'disable' | 'delete' | 'flag';
    bounceThreshold: number;
  };
  suppression: {
    enableSuppression: boolean;
    suppressionList: string[];
    autoSuppress: boolean;
    suppressionReasons: string[];
  };
  lastModified?: Date;
  version?: number;
}

export interface EmailAnalyticsConfig {
  trackingEnabled: boolean;
  openTracking: boolean;
  clickTracking: boolean;
  deviceTracking: boolean;
  locationTracking: boolean;
  utmTracking: boolean;
  customEvents: Array<{
    name: string;
    description: string;
    trigger: string;
    data: Record<string, any>;
  }>;
  reporting: {
    frequency: 'real-time' | 'hourly' | 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    metrics: string[];
    format: 'json' | 'csv' | 'pdf';
  };
  dashboards: Array<{
    name: string;
    description: string;
    widgets: Array<{
      type: string;
      config: Record<string, any>;
    }>;
    refreshInterval: number;
  }>;
  alerts: Array<{
    name: string;
    condition: string;
    threshold: number;
    recipients: string[];
    channels: string[];
  }>;
  lastModified?: Date;
  version?: number;
}

export interface EmailComplianceConfig {
  gdprCompliant: boolean;
  ccpaCompliant: boolean;
  canSpamCompliant: boolean;
  unsubscribeRequired: boolean;
  unsubscribeMethod: 'link' | 'reply' | 'both';
  dataRetention: {
    enabled: boolean;
    period: number; // days
    anonymizeAfter: number; // days
  };
  consentManagement: {
    enabled: boolean;
    consentTypes: string[];
    consentRequired: boolean;
    doubleOptIn: boolean;
  };
  dataProcessing: {
    purpose: string;
    legalBasis: string;
    dataCategories: string[];
    retentionPeriod: number;
  };
  privacyPolicy: {
    url: string;
    lastUpdated: Date;
    version: string;
  };
  termsOfService: {
    url: string;
    lastUpdated: Date;
    version: string;
  };
  lastModified?: Date;
  version?: number;
}

// Email Admin Configuration Manager
export class EmailAdminConfigManager {
  private configs: Map<string, EmailAdminConfig> = new Map();
  private templateConfigs: Map<string, EmailTemplateConfig> = new Map();
  private automationConfigs: Map<string, EmailAutomationConfig> = new Map();
  private brandingConfigs: Map<string, EmailBrandingConfig> = new Map();
  private deliveryConfigs: Map<string, EmailDeliveryConfig> = new Map();
  private analyticsConfigs: Map<string, EmailAnalyticsConfig> = new Map();
  private complianceConfigs: Map<string, EmailComplianceConfig> = new Map();

  // Template Configuration Management
  async getTemplateConfig(templateId: string): Promise<EmailTemplateConfig | null> {
    return this.templateConfigs.get(templateId) || null;
  }

  async updateTemplateConfig(templateId: string, config: Partial<EmailTemplateConfig>): Promise<void> {
    const existing = this.templateConfigs.get(templateId);
    if (existing) {
      this.templateConfigs.set(templateId, {
        ...existing,
        ...config,
        lastModified: new Date(),
        version: (existing.version || 0) + 1,
      });
    } else {
      this.templateConfigs.set(templateId, {
        templateId,
        name: config.name || templateId,
        isActive: config.isActive || true,
        subject: config.subject || '',
        previewText: config.previewText || '',
        senderName: config.senderName || 'CribNosh',
        senderEmail: config.senderEmail || 'noreply@cribnosh.com',
        replyToEmail: config.replyToEmail || 'support@cribnosh.com',
        customFields: config.customFields || {},
        styling: config.styling || {
          primaryColor: '#ff3b30',
          secondaryColor: '#1A1A1A',
          accent: '#FFD700',
          fontFamily: 'Satoshi',
          logoUrl: `${emailUrls.base}/logo.svg`,
          footerText: 'CribNosh – Personalized Dining, Every Time.',
        },
        scheduling: config.scheduling || {
          timezone: 'UTC',
          sendTime: '09:00',
          frequency: 'immediate',
        },
        targeting: config.targeting || {
          audience: 'all',
        },
        testing: config.testing || {
          testEmails: [],
          testData: {},
          previewMode: false,
        },
      });
    }
  }

  async getAllTemplateConfigs(): Promise<EmailTemplateConfig[]> {
    return Array.from(this.templateConfigs.values());
  }

  async deleteTemplateConfig(templateId: string): Promise<void> {
    this.templateConfigs.delete(templateId);
  }

  // Automation Configuration Management
  async getAutomationConfig(automationId: string): Promise<EmailAutomationConfig | null> {
    return this.automationConfigs.get(automationId) || null;
  }

  async updateAutomationConfig(automationId: string, config: Partial<EmailAutomationConfig>): Promise<void> {
    const existing = this.automationConfigs.get(automationId);
    if (existing) {
      this.automationConfigs.set(automationId, {
        ...existing,
        ...config,
        lastModified: new Date(),
        version: (existing.version || 0) + 1,
      });
    } else {
      this.automationConfigs.set(automationId, {
        automationId,
        name: config.name || automationId,
        description: config.description || '',
        isActive: config.isActive || false,
        triggers: config.triggers || [],
        templates: config.templates || [],
        schedule: config.schedule || {
          startDate: new Date(),
          timezone: 'UTC',
        },
        limits: config.limits || {
          maxEmailsPerDay: 1000,
          maxEmailsPerHour: 100,
          maxEmailsPerUser: 10,
        },
      });
    }
  }

  async getAllAutomationConfigs(): Promise<EmailAutomationConfig[]> {
    return Array.from(this.automationConfigs.values());
  }

  async deleteAutomationConfig(automationId: string): Promise<void> {
    this.automationConfigs.delete(automationId);
  }

  // Branding Configuration Management
  async getBrandingConfig(brandId: string): Promise<EmailBrandingConfig | null> {
    return this.brandingConfigs.get(brandId) || null;
  }

  async updateBrandingConfig(brandId: string, config: Partial<EmailBrandingConfig>): Promise<void> {
    const existing = this.brandingConfigs.get(brandId);
    if (existing) {
      this.brandingConfigs.set(brandId, {
        ...existing,
        ...config,
        lastModified: new Date(),
        version: (existing.version || 0) + 1,
      });
    } else {
      this.brandingConfigs.set(brandId, {
        brandId,
        name: config.name || brandId,
        isDefault: config.isDefault || false,
        colors: config.colors || {
          primary: '#ff3b30',
          secondary: '#1A1A1A',
          accent: '#FFD700',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          info: '#3B82F6',
          text: '#1A1A1A',
          textSecondary: '#6B7280',
          background: '#FFFFFF',
          backgroundSecondary: '#F9FAFB',
        },
        typography: config.typography || {
          headingFont: 'Asgard',
          bodyFont: 'Satoshi',
          headingSizes: {
            h1: '36px',
            h2: '30px',
            h3: '24px',
            h4: '20px',
            h5: '18px',
            h6: '16px',
          },
          bodySizes: {
            large: '18px',
            medium: '16px',
            small: '14px',
            xs: '12px',
          },
        },
        logo: config.logo || {
          url: `${emailUrls.base}/logo.svg`,
          width: 155,
          height: 40,
          altText: 'CribNosh Logo',
        },
        footer: config.footer || {
          companyName: 'CribNosh',
          address: 'CribNosh – Personalized Dining, Every Time.',
          phone: '1-800-CRIBNOSH',
          email: 'support@cribnosh.com',
          website: emailUrls.home(),
          socialLinks: [
            {
              platform: 'Twitter',
              url: 'https://x.com/CribNosh',
              icon: 'https://cdn-icons-png.flaticon.com/512/733/733579.png',
            },
            {
              platform: 'Instagram',
              url: 'https://www.instagram.com/cribnoshuk',
              icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
            },
          ],
    legalLinks: [
      { text: 'Privacy Policy', url: emailUrls.privacy() },
      { text: 'Terms of Service', url: emailUrls.terms() },
      { text: 'Unsubscribe', url: emailUrls.unsubscribe() },
    ],
        },
        spacing: config.spacing || {
          scale: [4, 8, 16, 24, 32, 48, 64],
          defaultPadding: '16px',
          defaultMargin: '16px',
        },
      });
    }
  }

  async getAllBrandingConfigs(): Promise<EmailBrandingConfig[]> {
    return Array.from(this.brandingConfigs.values());
  }

  async setDefaultBranding(brandId: string): Promise<void> {
    // Set all other branding configs to not default
    for (const [id, config] of this.brandingConfigs) {
      config.isDefault = id === brandId;
    }
  }

  // Delivery Configuration Management
  async getDeliveryConfig(provider: string): Promise<EmailDeliveryConfig | null> {
    return this.deliveryConfigs.get(provider) || null;
  }

  async updateDeliveryConfig(provider: string, config: Partial<EmailDeliveryConfig>): Promise<void> {
    const existing = this.deliveryConfigs.get(provider);
    if (existing) {
      this.deliveryConfigs.set(provider, {
        ...existing,
        ...config,
        lastModified: new Date(),
        version: (existing.version || 0) + 1,
      });
    } else {
      this.deliveryConfigs.set(provider, {
        provider: provider as any,
        apiKey: config.apiKey || '',
        apiSecret: config.apiSecret || '',
        region: config.region || 'us-east-1',
        fromEmail: config.fromEmail || 'noreply@cribnosh.com',
        fromName: config.fromName || 'CribNosh',
        replyToEmail: config.replyToEmail || 'support@cribnosh.com',
        bounceEmail: config.bounceEmail || 'bounces@cribnosh.com',
        unsubscribeUrl: config.unsubscribeUrl || 'https://cribnosh.com/unsubscribe',
        trackingDomain: config.trackingDomain || 'track.cribnosh.com',
        webhookUrl: config.webhookUrl || `${emailUrls.base}/api/webhooks/email`,
        rateLimits: config.rateLimits || {
          requestsPerSecond: 10,
          requestsPerMinute: 600,
          requestsPerHour: 36000,
          requestsPerDay: 864000,
        },
        retryPolicy: config.retryPolicy || {
          maxRetries: 3,
          retryDelay: 1000,
          exponentialBackoff: true,
        },
        bounceHandling: config.bounceHandling || {
          softBounceRetries: 3,
          hardBounceAction: 'disable',
          bounceThreshold: 0.05,
        },
        suppression: config.suppression || {
          enableSuppression: true,
          suppressionList: [],
          autoSuppress: true,
          suppressionReasons: ['bounce', 'complaint', 'unsubscribe'],
        },
      });
    }
  }

  async getAllDeliveryConfigs(): Promise<EmailDeliveryConfig[]> {
    return Array.from(this.deliveryConfigs.values());
  }

  // Get all analytics configurations
  async getAllAnalyticsConfigs(): Promise<EmailAnalyticsConfig[]> {
    return Array.from(this.analyticsConfigs.values());
  }

  // Get all compliance configurations
  async getAllComplianceConfigs(): Promise<EmailComplianceConfig[]> {
    return Array.from(this.complianceConfigs.values());
  }

  // Analytics Configuration Management
  async getAnalyticsConfig(configId: string): Promise<EmailAnalyticsConfig | null> {
    return this.analyticsConfigs.get(configId) || null;
  }

  async updateAnalyticsConfig(configId: string, config: Partial<EmailAnalyticsConfig>): Promise<void> {
    const existing = this.analyticsConfigs.get(configId);
    if (existing) {
      this.analyticsConfigs.set(configId, {
        ...existing,
        ...config,
        lastModified: new Date(),
        version: (existing.version || 0) + 1,
      });
    } else {
      this.analyticsConfigs.set(configId, {
        trackingEnabled: config.trackingEnabled || true,
        openTracking: config.openTracking || true,
        clickTracking: config.clickTracking || true,
        deviceTracking: config.deviceTracking || true,
        locationTracking: config.locationTracking || false,
        utmTracking: config.utmTracking || true,
        customEvents: config.customEvents || [],
        reporting: config.reporting || {
          frequency: 'daily',
          recipients: ['admin@cribnosh.com'],
          metrics: ['open_rate', 'click_rate', 'bounce_rate'],
          format: 'json',
        },
        dashboards: config.dashboards || [],
        alerts: config.alerts || [],
      });
    }
  }

  // Compliance Configuration Management
  async getComplianceConfig(configId: string): Promise<EmailComplianceConfig | null> {
    return this.complianceConfigs.get(configId) || null;
  }

  async updateComplianceConfig(configId: string, config: Partial<EmailComplianceConfig>): Promise<void> {
    const existing = this.complianceConfigs.get(configId);
    if (existing) {
      this.complianceConfigs.set(configId, {
        ...existing,
        ...config,
        lastModified: new Date(),
        version: (existing.version || 0) + 1,
      });
    } else {
      this.complianceConfigs.set(configId, {
        gdprCompliant: config.gdprCompliant || true,
        ccpaCompliant: config.ccpaCompliant || true,
        canSpamCompliant: config.canSpamCompliant || true,
        unsubscribeRequired: config.unsubscribeRequired || true,
        unsubscribeMethod: config.unsubscribeMethod || 'link',
        dataRetention: config.dataRetention || {
          enabled: true,
          period: 365,
          anonymizeAfter: 30,
        },
        consentManagement: config.consentManagement || {
          enabled: true,
          consentTypes: ['marketing', 'transactional', 'newsletter'],
          consentRequired: true,
          doubleOptIn: true,
        },
        dataProcessing: config.dataProcessing || {
          purpose: 'Email marketing and customer communication',
          legalBasis: 'consent',
          dataCategories: ['email', 'name', 'preferences'],
          retentionPeriod: 365,
        },
        privacyPolicy: config.privacyPolicy || {
          url: 'https://cribnosh.com/privacy',
          lastUpdated: new Date(),
          version: '1.0',
        },
        termsOfService: config.termsOfService || {
          url: 'https://cribnosh.com/terms',
          lastUpdated: new Date(),
          version: '1.0',
        },
      });
    }
  }

  // Configuration Validation
  async validateTemplateConfig(config: EmailTemplateConfig): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.templateId) {
      errors.push('Template ID is required');
    }

    if (!config.name) {
      errors.push('Template name is required');
    }

    if (!config.subject) {
      errors.push('Subject is required');
    }

    if (!config.senderEmail) {
      errors.push('Sender email is required');
    }

    if (!config.senderEmail.includes('@')) {
      errors.push('Invalid sender email format');
    }

    if (config.senderEmail && !config.senderEmail.includes('@')) {
      errors.push('Invalid sender email format');
    }

    if (config.replyToEmail && !config.replyToEmail.includes('@')) {
      errors.push('Invalid reply-to email format');
    }

    if (config.testing.testEmails.length === 0) {
      warnings.push('No test emails configured');
    }

    if (config.targeting.audience === 'segment' && !config.targeting.segmentId) {
      errors.push('Segment ID is required when audience is set to segment');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  async validateAutomationConfig(config: EmailAutomationConfig): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!config.automationId) {
      errors.push('Automation ID is required');
    }

    if (!config.name) {
      errors.push('Automation name is required');
    }

    if (config.triggers.length === 0) {
      errors.push('At least one trigger is required');
    }

    if (config.templates.length === 0) {
      errors.push('At least one template is required');
    }

    if (config.limits.maxEmailsPerDay <= 0) {
      errors.push('Max emails per day must be greater than 0');
    }

    if (config.limits.maxEmailsPerHour <= 0) {
      errors.push('Max emails per hour must be greater than 0');
    }

    if (config.limits.maxEmailsPerUser <= 0) {
      errors.push('Max emails per user must be greater than 0');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  // Configuration Export/Import
  async exportConfig(category: string): Promise<string> {
    const configs = {
      templates: Array.from(this.templateConfigs.values()),
      automations: Array.from(this.automationConfigs.values()),
      branding: Array.from(this.brandingConfigs.values()),
      delivery: Array.from(this.deliveryConfigs.values()),
      analytics: Array.from(this.analyticsConfigs.values()),
      compliance: Array.from(this.complianceConfigs.values()),
    };

    return JSON.stringify(configs[category as keyof typeof configs], null, 2);
  }

  async importConfig(category: string, configData: string): Promise<void> {
    const configs = JSON.parse(configData);
    
    switch (category) {
      case 'templates':
        for (const config of configs) {
          this.templateConfigs.set(config.templateId, config);
        }
        break;
      case 'automations':
        for (const config of configs) {
          this.automationConfigs.set(config.automationId, config);
        }
        break;
      case 'branding':
        for (const config of configs) {
          this.brandingConfigs.set(config.brandId, config);
        }
        break;
      case 'delivery':
        for (const config of configs) {
          this.deliveryConfigs.set(config.provider, config);
        }
        break;
      case 'analytics':
        for (const config of configs) {
          this.analyticsConfigs.set(config.configId, config);
        }
        break;
      case 'compliance':
        for (const config of configs) {
          this.complianceConfigs.set(config.configId, config);
        }
        break;
    }
  }

  // Get all configurations
  async getAllConfigs(): Promise<{
    templates: EmailTemplateConfig[];
    automations: EmailAutomationConfig[];
    branding: EmailBrandingConfig[];
    delivery: EmailDeliveryConfig[];
    analytics: EmailAnalyticsConfig[];
    compliance: EmailComplianceConfig[];
  }> {
    return {
      templates: Array.from(this.templateConfigs.values()),
      automations: Array.from(this.automationConfigs.values()),
      branding: Array.from(this.brandingConfigs.values()),
      delivery: Array.from(this.deliveryConfigs.values()),
      analytics: Array.from(this.analyticsConfigs.values()),
      compliance: Array.from(this.complianceConfigs.values()),
    };
  }
}

// Singleton instance
export const emailAdminConfigManager = new EmailAdminConfigManager();

export default EmailAdminConfigManager;
