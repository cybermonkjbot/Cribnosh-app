import { mattermostService } from './mattermost.service';

/**
 * Utility function to notify about user activity
 */
export async function notifyUserActivity(activity: {
  type: 'login' | 'signup' | 'profile_update' | 'preference_change';
  userId?: string;
  email?: string;
  details?: Record<string, any>;
}) {
  if (!mattermostService.isConfigured()) return;

  const activityMessages = {
    login: ':key: User logged in',
    signup: ':new: New user signup',
    profile_update: ':pencil: Profile updated',
    preference_change: ':gear: Preferences changed',
  };

  await mattermostService.notifyUserActivity({
    type: activity.type,
    userId: activity.userId || '',
    email: activity.email || '',
    details: activity.details,
  });
}

/**
 * Utility function to notify about system events
 */
export async function notifySystemEvent(event: {
  type: 'error' | 'warning' | 'info' | 'success';
  component: string;
  message: string;
  details?: Record<string, any>;
}) {
  if (!mattermostService.isConfigured()) return;

  const statusMap = {
    error: 'error' as const,
    warning: 'warning' as const,
    info: 'healthy' as const,
    success: 'healthy' as const,
  };

  await mattermostService.notifySystemHealth({
    status: statusMap[event.type],
    message: `[${event.component}] ${event.message}`,
    details: event.details,
  });
}

/**
 * Utility function to notify about business metrics
 */
export async function notifyBusinessMetrics(metrics: {
  waitlistCount: number;
  chefApplications: number;
  driverApplications: number;
  contactSubmissions: number;
  period: 'daily' | 'weekly' | 'monthly';
}) {
  if (!mattermostService.isConfigured()) return;

  const periodEmoji = {
    daily: ':calendar:',
    weekly: ':chart_with_upwards_trend:',
    monthly: ':bar_chart:',
  };

  await mattermostService.sendAPIMessage({
    channel_id: process.env.MATTERMOST_CHANNEL_ID!,
    message: `${periodEmoji[metrics.period]} ${metrics.period.charAt(0).toUpperCase() + metrics.period.slice(1)} Business Metrics`,
    props: {
      attachments: [
        {
          fallback: `${metrics.period} business metrics`,
          color: '#36a64f',
          fields: [
            { title: 'Waitlist Signups', value: metrics.waitlistCount.toString(), short: true },
            { title: 'Chef Applications', value: metrics.chefApplications.toString(), short: true },
            { title: 'Driver Applications', value: metrics.driverApplications.toString(), short: true },
            { title: 'Contact Submissions', value: metrics.contactSubmissions.toString(), short: true },
          ],
          footer: 'CribNosh Business Metrics',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    },
  });
}

/**
 * Utility function to notify about location-based activity
 */
export async function notifyLocationActivity(activity: {
  city: string;
  region?: string;
  country?: string;
  type: 'waitlist' | 'chef_application' | 'driver_application';
  count: number;
}) {
  if (!mattermostService.isConfigured()) return;

  const typeEmoji = {
    waitlist: ':tada:',
    chef_application: ':chef:',
    driver_application: ':car:',
  };

  const location = [activity.city, activity.region, activity.country]
    .filter(Boolean)
    .join(', ');

  await mattermostService.sendAPIMessage({
    channel_id: process.env.MATTERMOST_CHANNEL_ID!,
    message: `${typeEmoji[activity.type]} New ${activity.type.replace('_', ' ')} in ${location}`,
    props: {
      attachments: [
        {
          fallback: `New ${activity.type} in ${location}`,
          color: '#ff6b35',
          fields: [
            { title: 'Location', value: location, short: true },
            { title: 'Activity Type', value: activity.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), short: true },
            { title: 'Count', value: activity.count.toString(), short: true },
          ],
          footer: 'CribNosh Location Activity',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    },
  });
}

/**
 * Utility function to check if Mattermost is available
 */
export function isMattermostAvailable(): boolean {
  return mattermostService.isConfigured();
}

/**
 * Utility function to get Mattermost configuration status
 */
export function getMattermostStatus() {
  return {
    configured: mattermostService.isConfigured(),
    webhook: !!process.env.MATTERMOST_WEBHOOK_URL,
    api: !!(process.env.MATTERMOST_BOT_TOKEN && process.env.MATTERMOST_SERVER_URL),
    channel: process.env.MATTERMOST_CHANNEL_ID,
    team: process.env.MATTERMOST_TEAM_ID,
  };
}

/**
 * Notify when staff completes onboarding
 */
export async function notifyStaffOnboardingComplete(data: {
  name: string;
  email: string;
  position?: string;
  department?: string;
}) {
  if (!mattermostService.isConfigured()) return;
  await mattermostService.sendAPIMessage({
    channel_id: process.env.MATTERMOST_CHANNEL_ID!,
    message: `:tada: Staff Onboarding Complete: ${data.name}`,
    props: {
      attachments: [
        {
          fallback: `Staff onboarding complete: ${data.name}`,
          color: '#36a64f',
          title: 'Staff Onboarding Complete',
          fields: [
            { title: 'Name', value: data.name, short: true },
            { title: 'Email', value: data.email, short: true },
            ...(data.position ? [{ title: 'Position', value: data.position, short: true }] : []),
            ...(data.department ? [{ title: 'Department', value: data.department, short: true }] : []),
          ],
          footer: 'CribNosh HR',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    },
  });
}

/**
 * Notify when onboarding is reviewed/approved/rejected
 */
export async function notifyStaffOnboardingReview(data: {
  name: string;
  email: string;
  status: 'approved' | 'rejected' | 'reviewed';
  reviewer?: string;
  notes?: string;
}) {
  if (!mattermostService.isConfigured()) return;
  const statusEmoji = {
    approved: ':white_check_mark:',
    rejected: ':x:',
    reviewed: ':mag:',
  };
  await mattermostService.sendAPIMessage({
    channel_id: process.env.MATTERMOST_CHANNEL_ID!,
    message: `${statusEmoji[data.status]} Onboarding ${data.status}: ${data.name}`,
    props: {
      attachments: [
        {
          fallback: `Onboarding ${data.status}: ${data.name}`,
          color: data.status === 'approved' ? '#36a64f' : data.status === 'rejected' ? '#ff0000' : '#4a90e2',
          title: `Onboarding ${data.status.charAt(0).toUpperCase() + data.status.slice(1)}`,
          fields: [
            { title: 'Name', value: data.name, short: true },
            { title: 'Email', value: data.email, short: true },
            ...(data.reviewer ? [{ title: 'Reviewer', value: data.reviewer, short: true }] : []),
            ...(data.notes ? [{ title: 'Notes', value: data.notes, short: false }] : []),
          ],
          footer: 'CribNosh HR',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    },
  });
}

/**
 * Notify when staff role/permissions change
 */
export async function notifyStaffRoleChange(data: {
  name: string;
  email: string;
  oldRole: string;
  newRole: string;
  changedBy?: string;
}) {
  if (!mattermostService.isConfigured()) return;
  await mattermostService.sendAPIMessage({
    channel_id: process.env.MATTERMOST_CHANNEL_ID!,
    message: `:busts_in_silhouette: Staff Role Changed: ${data.name}`,
    props: {
      attachments: [
        {
          fallback: `Role changed for ${data.name}`,
          color: '#4a90e2',
          title: 'Staff Role/Permission Change',
          fields: [
            { title: 'Name', value: data.name, short: true },
            { title: 'Email', value: data.email, short: true },
            { title: 'Old Role', value: data.oldRole, short: true },
            { title: 'New Role', value: data.newRole, short: true },
            ...(data.changedBy ? [{ title: 'Changed By', value: data.changedBy, short: true }] : []),
          ],
          footer: 'CribNosh Admin',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    },
  });
}

/**
 * Notify when staff is terminated/offboarded
 */
export async function notifyStaffTermination(data: {
  name: string;
  email: string;
  terminatedBy?: string;
  reason?: string;
}) {
  if (!mattermostService.isConfigured()) return;
  await mattermostService.sendAPIMessage({
    channel_id: process.env.MATTERMOST_CHANNEL_ID!,
    message: `:no_entry: Staff Terminated: ${data.name}`,
    props: {
      attachments: [
        {
          fallback: `Staff terminated: ${data.name}`,
          color: '#ff0000',
          title: 'Staff Termination/Exit',
          fields: [
            { title: 'Name', value: data.name, short: true },
            { title: 'Email', value: data.email, short: true },
            ...(data.terminatedBy ? [{ title: 'Terminated By', value: data.terminatedBy, short: true }] : []),
            ...(data.reason ? [{ title: 'Reason', value: data.reason, short: false }] : []),
          ],
          footer: 'CribNosh HR',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    },
  });
}

/**
 * Notify when payroll/banking info is updated
 */
export async function notifyPayrollInfoUpdate(data: {
  name: string;
  email: string;
  updatedBy?: string;
}) {
  if (!mattermostService.isConfigured()) return;
  await mattermostService.sendAPIMessage({
    channel_id: process.env.MATTERMOST_CHANNEL_ID!,
    message: `:money_with_wings: Payroll/Banking Info Updated: ${data.name}`,
    props: {
      attachments: [
        {
          fallback: `Payroll/banking info updated: ${data.name}`,
          color: '#f5a623',
          title: 'Payroll/Banking Info Update',
          fields: [
            { title: 'Name', value: data.name, short: true },
            { title: 'Email', value: data.email, short: true },
            ...(data.updatedBy ? [{ title: 'Updated By', value: data.updatedBy, short: true }] : []),
          ],
          footer: 'CribNosh HR',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    },
  });
}

/**
 * Notify when emergency contact is updated
 */
export async function notifyEmergencyContactUpdate(data: {
  name: string;
  email: string;
  updatedBy?: string;
}) {
  if (!mattermostService.isConfigured()) return;
  await mattermostService.sendAPIMessage({
    channel_id: process.env.MATTERMOST_CHANNEL_ID!,
    message: `:rotating_light: Emergency Contact Updated: ${data.name}`,
    props: {
      attachments: [
        {
          fallback: `Emergency contact updated: ${data.name}`,
          color: '#e67e22',
          title: 'Emergency Contact Update',
          fields: [
            { title: 'Name', value: data.name, short: true },
            { title: 'Email', value: data.email, short: true },
            ...(data.updatedBy ? [{ title: 'Updated By', value: data.updatedBy, short: true }] : []),
          ],
          footer: 'CribNosh HR',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    },
  });
}

/**
 * Notify when benefits are changed
 */
export async function notifyBenefitsChange(data: {
  name: string;
  email: string;
  updatedBy?: string;
}) {
  if (!mattermostService.isConfigured()) return;
  await mattermostService.sendAPIMessage({
    channel_id: process.env.MATTERMOST_CHANNEL_ID!,
    message: `:gift: Benefits Changed: ${data.name}`,
    props: {
      attachments: [
        {
          fallback: `Benefits changed: ${data.name}`,
          color: '#8e44ad',
          title: 'Benefits Enrollment/Change',
          fields: [
            { title: 'Name', value: data.name, short: true },
            { title: 'Email', value: data.email, short: true },
            ...(data.updatedBy ? [{ title: 'Updated By', value: data.updatedBy, short: true }] : []),
          ],
          footer: 'CribNosh HR/Benefits',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    },
  });
}

/**
 * Notify on failed/abnormal login attempt
 */
export async function notifyFailedLogin(data: {
  email: string;
  ip?: string;
  reason?: string;
}) {
  if (!mattermostService.isConfigured()) return;
  await mattermostService.sendAPIMessage({
    channel_id: process.env.MATTERMOST_CHANNEL_ID!,
    message: `:warning: Failed Login Attempt: ${data.email}`,
    props: {
      attachments: [
        {
          fallback: `Failed login: ${data.email}`,
          color: '#e74c3c',
          title: 'Failed/Abnormal Login Attempt',
          fields: [
            { title: 'Email', value: data.email, short: true },
            ...(data.ip ? [{ title: 'IP Address', value: data.ip, short: true }] : []),
            ...(data.reason ? [{ title: 'Reason', value: data.reason, short: false }] : []),
          ],
          footer: 'CribNosh IT/Security',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    },
  });
}

/**
 * Notify when a document is uploaded
 */
export async function notifyDocumentUpload(data: {
  name: string;
  email: string;
  documentType: string;
  uploadedBy?: string;
}) {
  if (!mattermostService.isConfigured()) return;
  await mattermostService.sendAPIMessage({
    channel_id: process.env.MATTERMOST_CHANNEL_ID!,
    message: `:page_facing_up: Document Uploaded: ${data.name}`,
    props: {
      attachments: [
        {
          fallback: `Document uploaded: ${data.name}`,
          color: '#2980b9',
          title: 'Document Upload',
          fields: [
            { title: 'Name', value: data.name, short: true },
            { title: 'Email', value: data.email, short: true },
            { title: 'Document Type', value: data.documentType, short: true },
            ...(data.uploadedBy ? [{ title: 'Uploaded By', value: data.uploadedBy, short: true }] : []),
          ],
          footer: 'CribNosh HR',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    },
  });
}

/**
 * Notify on onboarding error/exception
 */
export async function notifyOnboardingError(data: {
  email?: string;
  error: string;
  step?: string;
}) {
  if (!mattermostService.isConfigured()) return;
  await mattermostService.sendAPIMessage({
    channel_id: process.env.MATTERMOST_CHANNEL_ID!,
    message: `:x: Onboarding Error${data.email ? ` for ${data.email}` : ''}`,
    props: {
      attachments: [
        {
          fallback: `Onboarding error${data.email ? `: ${data.email}` : ''}`,
          color: '#c0392b',
          title: 'Onboarding Error/Exception',
          fields: [
            ...(data.email ? [{ title: 'Email', value: data.email, short: true }] : []),
            { title: 'Error', value: data.error, short: false },
            ...(data.step ? [{ title: 'Step', value: data.step, short: true }] : []),
          ],
          footer: 'CribNosh IT/Support',
          ts: Math.floor(Date.now() / 1000),
        },
      ],
    },
  });
} 