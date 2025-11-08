// CribNosh Email Automation System
// Advanced email automation with triggers, conditions, and scheduling

import { renderTemplate, EmailTemplateFactory } from './templates';
import { addTrackingToEmail, generateTrackingPixel } from './analytics';
import { translate, detectLanguage, getLocalizedSubject } from './i18n';
import { logger } from '@/lib/utils/logger';

export interface EmailTrigger {
  id: string;
  name: string;
  event: string;
  conditions: EmailCondition[];
  template: string;
  delay?: number; // in minutes
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface EmailCampaign {
  id: string;
  name: string;
  description: string;
  template: string;
  audience: EmailAudience;
  schedule: EmailSchedule;
  status: 'draft' | 'scheduled' | 'running' | 'paused' | 'completed' | 'cancelled';
  createdAt: Date;
  updatedAt: Date;
  sentCount: number;
  openCount: number;
  clickCount: number;
  unsubscribeCount: number;
}

export interface EmailAudience {
  type: 'all' | 'segment' | 'custom';
  segmentId?: string;
  customFilters?: EmailCondition[];
  excludeFilters?: EmailCondition[];
  limit?: number;
}

export interface EmailSchedule {
  type: 'immediate' | 'scheduled' | 'recurring';
  startDate?: Date;
  endDate?: Date;
  recurringPattern?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    dayOfMonth?: number;
  };
  timezone: string;
}

export interface EmailAutomation {
  id: string;
  name: string;
  description: string;
  triggers: EmailTrigger[];
  campaigns: EmailCampaign[];
  status: 'active' | 'paused' | 'stopped';
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailQueue {
  id: string;
  recipientEmail: string;
  recipientName: string;
  template: string;
  data: any;
  priority: number;
  scheduledFor: Date;
  status: 'pending' | 'processing' | 'sent' | 'failed' | 'cancelled';
  attempts: number;
  maxAttempts: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailAutomationStats {
  totalEmails: number;
  sentEmails: number;
  failedEmails: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  bounceRate: number;
  complaintRate: number;
  revenue: number;
  lastUpdated: Date;
}

// Email Automation Engine
export class EmailAutomationEngine {
  private triggers: Map<string, EmailTrigger> = new Map();
  private campaigns: Map<string, EmailCampaign> = new Map();
  private queue: EmailQueue[] = [];
  private stats: EmailAutomationStats = {
    totalEmails: 0,
    sentEmails: 0,
    failedEmails: 0,
    openRate: 0,
    clickRate: 0,
    unsubscribeRate: 0,
    bounceRate: 0,
    complaintRate: 0,
    revenue: 0,
    lastUpdated: new Date(),
  };

  // Add trigger
  addTrigger(trigger: EmailTrigger): void {
    this.triggers.set(trigger.id, trigger);
  }

  // Remove trigger
  removeTrigger(triggerId: string): void {
    this.triggers.delete(triggerId);
  }

  // Add campaign
  addCampaign(campaign: EmailCampaign): void {
    this.campaigns.set(campaign.id, campaign);
  }

  // Remove campaign
  removeCampaign(campaignId: string): void {
    this.campaigns.delete(campaignId);
  }

  // Process event
  async processEvent(event: string, data: any): Promise<void> {
    const matchingTriggers = Array.from(this.triggers.values())
      .filter(trigger => trigger.enabled && trigger.event === event);

    for (const trigger of matchingTriggers) {
      if (await this.evaluateConditions(trigger.conditions, data)) {
        await this.scheduleEmail(trigger, data);
      }
    }
  }

  // Evaluate conditions
  private async evaluateConditions(conditions: EmailCondition[], data: any): Promise<boolean> {
    if (conditions.length === 0) return true;

    let result = true;
    let logicalOperator: 'AND' | 'OR' = 'AND';

    for (const condition of conditions) {
      const conditionResult = this.evaluateCondition(condition, data);
      
      if (logicalOperator === 'AND') {
        result = result && conditionResult;
      } else {
        result = result || conditionResult;
      }

      logicalOperator = condition.logicalOperator || 'AND';
    }

    return result;
  }

  // Evaluate single condition
  private evaluateCondition(condition: EmailCondition, data: any): boolean {
    const fieldValue = this.getFieldValue(data, condition.field);
    const conditionValue = condition.value;

    switch (condition.operator) {
      case 'equals':
        return fieldValue === conditionValue;
      case 'not_equals':
        return fieldValue !== conditionValue;
      case 'contains':
        return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'not_contains':
        return !String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
      case 'greater_than':
        return Number(fieldValue) > Number(conditionValue);
      case 'less_than':
        return Number(fieldValue) < Number(conditionValue);
      case 'in':
        return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
      case 'not_in':
        return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
      default:
        return false;
    }
  }

  // Get field value from nested object
  private getFieldValue(data: any, field: string): any {
    return field.split('.').reduce((obj, key) => obj?.[key], data);
  }

  // Schedule email
  private async scheduleEmail(trigger: EmailTrigger, data: any): Promise<void> {
    const scheduledFor = new Date();
    if (trigger.delay) {
      scheduledFor.setMinutes(scheduledFor.getMinutes() + trigger.delay);
    }

    const emailQueue: EmailQueue = {
      id: `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipientEmail: data.email || data.recipientEmail,
      recipientName: data.name || data.customerName || data.recipientName,
      template: trigger.template,
      data: {
        ...data,
        triggerId: trigger.id,
        scheduledFor: scheduledFor.toISOString(),
      },
      priority: this.getPriorityValue(trigger.priority),
      scheduledFor,
      status: 'pending',
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.queue.push(emailQueue);
    this.queue.sort((a, b) => b.priority - a.priority || a.scheduledFor.getTime() - b.scheduledFor.getTime());
  }

  // Get priority value
  private getPriorityValue(priority: string): number {
    switch (priority) {
      case 'critical': return 4;
      case 'high': return 3;
      case 'medium': return 2;
      case 'low': return 1;
      default: return 1;
    }
  }

  // Process queue
  async processQueue(): Promise<void> {
    const now = new Date();
    const pendingEmails = this.queue.filter(
      email => email.status === 'pending' && email.scheduledFor <= now
    );

    for (const email of pendingEmails) {
      try {
        await this.sendEmail(email);
        email.status = 'sent';
        email.updatedAt = new Date();
        this.stats.sentEmails++;
      } catch (error) {
        email.attempts++;
        email.error = error instanceof Error ? error.message : 'Unknown error';
        email.updatedAt = new Date();

        if (email.attempts >= email.maxAttempts) {
          email.status = 'failed';
          this.stats.failedEmails++;
        } else {
          email.status = 'pending';
          // Reschedule for retry (exponential backoff)
          const retryDelay = Math.pow(2, email.attempts) * 5; // 5, 10, 20 minutes
          email.scheduledFor = new Date(now.getTime() + retryDelay * 60 * 1000);
        }
      }
    }

    this.stats.totalEmails = this.queue.length;
    this.stats.lastUpdated = new Date();
  }

  // Send email
  private async sendEmail(email: EmailQueue): Promise<void> {
    try {
      // Detect language
      const language = detectLanguage({
        language: email.data.language,
        country: email.data.country,
      });

      // Render template
      const html = await renderTemplate(email.template, email.data);

      // Add tracking
      const trackedHtml = addTrackingToEmail(html, email.id);

      // Get localized subject
      const subject = getLocalizedSubject(email.template as any, language, email.data);

      // Send email (implement with your email service)
      await this.sendEmailToProvider({
        to: email.recipientEmail,
        subject,
        html: trackedHtml,
        trackingId: email.id,
      });

      logger.log(`Email sent successfully: ${email.id}`);
    } catch (error) {
      logger.error(`Failed to send email ${email.id}:`, error);
      throw error;
    }
  }

  // Send email to provider (implement with your email service)
  private async sendEmailToProvider(emailData: {
    to: string;
    subject: string;
    html: string;
    trackingId: string;
  }): Promise<void> {
    // Implement with your email service (Resend, SendGrid, etc.)
    logger.log('Sending email:', emailData);
  }

  // Get queue status
  getQueueStatus(): {
    total: number;
    pending: number;
    processing: number;
    sent: number;
    failed: number;
  } {
    return {
      total: this.queue.length,
      pending: this.queue.filter(e => e.status === 'pending').length,
      processing: this.queue.filter(e => e.status === 'processing').length,
      sent: this.queue.filter(e => e.status === 'sent').length,
      failed: this.queue.filter(e => e.status === 'failed').length,
    };
  }

  // Get statistics
  getStats(): EmailAutomationStats {
    return { ...this.stats };
  }

  // Update statistics
  updateStats(updates: Partial<EmailAutomationStats>): void {
    this.stats = { ...this.stats, ...updates, lastUpdated: new Date() };
  }

  // Clear queue
  clearQueue(): void {
    this.queue = [];
  }

  // Get failed emails
  getFailedEmails(): EmailQueue[] {
    return this.queue.filter(email => email.status === 'failed');
  }

  // Retry failed emails
  async retryFailedEmails(): Promise<void> {
    const failedEmails = this.getFailedEmails();
    for (const email of failedEmails) {
      email.status = 'pending';
      email.attempts = 0;
      email.error = undefined;
      email.scheduledFor = new Date();
    }
  }
}

// Predefined Automation Workflows
export const predefinedWorkflows = {
  // Welcome Series
  welcomeSeries: {
    name: 'Welcome Series',
    description: '3-email welcome sequence for new users',
    triggers: [
      {
        id: 'welcome_1',
        name: 'Welcome Email',
        event: 'user_registered',
        conditions: [],
        template: 'welcome',
        delay: 0,
        priority: 'high' as const,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'welcome_2',
        name: 'Getting Started',
        event: 'user_registered',
        conditions: [],
        template: 'genericNotification',
        delay: 1440, // 24 hours
        priority: 'medium' as const,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'welcome_3',
        name: 'First Order Incentive',
        event: 'user_registered',
        conditions: [],
        template: 'promotional',
        delay: 4320, // 72 hours
        priority: 'medium' as const,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },

  // Order Lifecycle
  orderLifecycle: {
    name: 'Order Lifecycle',
    description: 'Complete order journey emails',
    triggers: [
      {
        id: 'order_confirmation',
        name: 'Order Confirmation',
        event: 'order_placed',
        conditions: [],
        template: 'orderConfirmation',
        delay: 0,
        priority: 'high' as const,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'order_update',
        name: 'Order Update',
        event: 'order_status_changed',
        conditions: [],
        template: 'orderUpdate',
        delay: 0,
        priority: 'high' as const,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'feedback_request',
        name: 'Feedback Request',
        event: 'order_delivered',
        conditions: [],
        template: 'feedbackRequest',
        delay: 1440, // 24 hours
        priority: 'medium' as const,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },

  // Loyalty Program
  loyaltyProgram: {
    name: 'Loyalty Program',
    description: 'Loyalty program management emails',
    triggers: [
      {
        id: 'tier_upgrade',
        name: 'Tier Upgrade',
        event: 'tier_upgraded',
        conditions: [],
        template: 'loyaltyRewards',
        delay: 0,
        priority: 'high' as const,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'points_earned',
        name: 'Points Earned',
        event: 'points_earned',
        conditions: [
          { field: 'points', operator: 'greater_than' as const, value: 100 }
        ],
        template: 'loyaltyRewards',
        delay: 0,
        priority: 'medium' as const,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },

  // Seasonal Campaigns
  seasonalCampaigns: {
    name: 'Seasonal Campaigns',
    description: 'Seasonal and holiday email campaigns',
    triggers: [
      {
        id: 'spring_campaign',
        name: 'Spring Campaign',
        event: 'seasonal_campaign',
        conditions: [
          { field: 'season', operator: 'equals' as const, value: 'spring' }
        ],
        template: 'seasonalCampaign',
        delay: 0,
        priority: 'medium' as const,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'holiday_campaign',
        name: 'Holiday Campaign',
        event: 'seasonal_campaign',
        conditions: [
          { field: 'season', operator: 'equals' as const, value: 'holiday' }
        ],
        template: 'seasonalCampaign',
        delay: 0,
        priority: 'high' as const,
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
  },
};

// Email Automation Manager
export class EmailAutomationManager {
  private engine: EmailAutomationEngine;
  private workflows: Map<string, EmailAutomation> = new Map();

  constructor() {
    this.engine = new EmailAutomationEngine();
    this.initializePredefinedWorkflows();
  }

  // Initialize predefined workflows
  private initializePredefinedWorkflows(): void {
    Object.entries(predefinedWorkflows).forEach(([key, workflow]) => {
      const automation: EmailAutomation = {
        id: key,
        name: workflow.name,
        description: workflow.description,
        triggers: workflow.triggers,
        campaigns: [],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      this.workflows.set(key, automation);
    });
  }

  // Start automation
  startAutomation(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.status = 'active';
      workflow.triggers.forEach(trigger => {
        this.engine.addTrigger(trigger);
      });
    }
  }

  // Stop automation
  stopAutomation(workflowId: string): void {
    const workflow = this.workflows.get(workflowId);
    if (workflow) {
      workflow.status = 'stopped';
      workflow.triggers.forEach(trigger => {
        this.engine.removeTrigger(trigger.id);
      });
    }
  }

  // Process event
  async processEvent(event: string, data: any): Promise<void> {
    await this.engine.processEvent(event, data);
  }

  // Process queue
  async processQueue(): Promise<void> {
    await this.engine.processQueue();
  }

  // Get statistics
  getStats(): EmailAutomationStats {
    return this.engine.getStats();
  }

  // Get queue status
  getQueueStatus() {
    return this.engine.getQueueStatus();
  }

  // Get workflows
  getWorkflows(): EmailAutomation[] {
    return Array.from(this.workflows.values());
  }
}

// Singleton instance
export const emailAutomationManager = new EmailAutomationManager();

export default EmailAutomationManager;
