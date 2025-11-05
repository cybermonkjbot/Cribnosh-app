import { env } from '@/lib/config/env';

export interface MattermostMessage {
  text: string;
  channel?: string;
  username?: string;
  icon_url?: string;
  icon_emoji?: string;
  attachments?: MattermostAttachment[];
}

export interface MattermostAttachment {
  fallback: string;
  color?: string;
  pretext?: string;
  author_name?: string;
  author_link?: string;
  author_icon?: string;
  title?: string;
  title_link?: string;
  text?: string;
  fields?: MattermostField[];
  image_url?: string;
  thumb_url?: string;
  footer?: string;
  footer_icon?: string;
  ts?: number;
}

export interface MattermostField {
  title: string;
  value: string;
  short?: boolean;
}

export interface MattermostPost {
  channel_id: string;
  message: string;
  root_id?: string;
  file_ids?: string[];
  props?: Record<string, any>;
}

export class MattermostService {
  private webhookUrl?: string;
  private botToken?: string;
  private serverUrl?: string;
  private defaultChannel?: string;
  private defaultTeam?: string;

  constructor(config?: {
    webhookUrl?: string;
    botToken?: string;
    serverUrl?: string;
    defaultChannel?: string;
    defaultTeam?: string;
  }) {
    this.webhookUrl = config?.webhookUrl || env.MATTERMOST_WEBHOOK_URL;
    this.botToken = config?.botToken || env.MATTERMOST_BOT_TOKEN;
    this.serverUrl = config?.serverUrl || env.MATTERMOST_SERVER_URL;
    this.defaultChannel = config?.defaultChannel || env.MATTERMOST_CHANNEL_ID;
    this.defaultTeam = config?.defaultTeam || env.MATTERMOST_TEAM_ID;
  }

  /**
   * Send a message using API (more features, requires authentication)
   */
  async sendAPIMessage(post: MattermostPost): Promise<boolean> {
    if (!this.botToken || !this.serverUrl) {
      console.warn('Mattermost API credentials not configured');
      return false;
    }

    try {
      const response = await fetch(`${this.serverUrl}/api/v4/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.botToken}`,
        },
        body: JSON.stringify(post),
      });

      if (!response.ok) {
        throw new Error(`Mattermost API failed: ${response.status} ${response.statusText}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to send Mattermost API message:', error);
      return false;
    }
  }

  // Helper to convert attachments to API props
  private buildAPIMessage({ text, attachments, channel }: { text: string; attachments?: MattermostAttachment[]; channel?: string; }) {
    return {
      channel_id: channel || this.defaultChannel!,
      message: text,
      props: attachments ? { attachments } : undefined,
    };
  }

  // Refactored notification methods
  async notifyFormSubmission(formData: {
    type: string;
    name: string;
    email: string;
    phone?: string;
    message?: string;
    additionalData?: Record<string, any>;
  }): Promise<boolean> {
    const attachment: MattermostAttachment = {
      fallback: `New ${formData.type} submission from ${formData.name}`,
      color: this.getColorForFormType(formData.type),
      title: `New ${formData.type} Submission`,
      text: formData.message || 'No additional message provided',
      fields: [
        { title: 'Name', value: formData.name, short: true },
        { title: 'Email', value: formData.email, short: true },
        ...(formData.phone ? [{ title: 'Phone', value: formData.phone, short: true }] : []),
        ...Object.entries(formData.additionalData || {}).map(([key, value]) => ({
          title: key.charAt(0).toUpperCase() + key.slice(1),
          value: String(value),
          short: true,
        })),
      ],
      footer: 'CribNosh Form Submission',
      ts: Math.floor(Date.now() / 1000),
    };
    return this.sendAPIMessage(this.buildAPIMessage({ text: `:bell: New ${formData.type} submission received!`, attachments: [attachment] }));
  }

  async notifyWaitlistSignup(data: {
    email: string;
    location?: { city?: string; region?: string; country?: string; ip?: string };
    source?: string;
  }): Promise<boolean> {
    const attachment: MattermostAttachment = {
      fallback: `New waitlist signup: ${data.email}`,
      color: '#36a64f',
      title: 'New Waitlist Signup',
      fields: [
        { title: 'Email', value: data.email, short: true },
        { title: 'Source', value: data.source || 'Direct', short: true },
        ...(data.location ? [
          { title: 'Location', value: [data.location.city, data.location.region, data.location.country].filter(Boolean).join(', ') || 'Unknown', short: true },
          { title: 'IP Address', value: data.location.ip || 'Unknown', short: true },
        ] : []),
      ],
      footer: 'CribNosh Waitlist',
      ts: Math.floor(Date.now() / 1000),
    };
    return this.sendAPIMessage(this.buildAPIMessage({ text: ':tada: New waitlist signup!', attachments: [attachment] }));
  }

  async notifyChefApplication(data: {
    name: string;
    email: string;
    phone: string;
    experience: string;
    cuisines: string[];
    kitchenType: string;
    certifications?: string[];
    specialties?: string[];
  }): Promise<boolean> {
    const attachment: MattermostAttachment = {
      fallback: `New chef application from ${data.name}`,
      color: '#ff6b35',
      title: 'New Chef Application',
      fields: [
        { title: 'Name', value: data.name, short: true },
        { title: 'Email', value: data.email, short: true },
        { title: 'Phone', value: data.phone, short: true },
        { title: 'Experience', value: `${data.experience} years`, short: true },
        { title: 'Cuisines', value: data.cuisines.join(', '), short: false },
        { title: 'Kitchen Type', value: data.kitchenType, short: true },
        ...(data.certifications?.length ? [{ title: 'Certifications', value: data.certifications.join(', '), short: false }] : []),
        ...(data.specialties?.length ? [{ title: 'Specialties', value: data.specialties.join(', '), short: false }] : []),
      ],
      footer: 'CribNosh Chef Applications',
      ts: Math.floor(Date.now() / 1000),
    };
    return this.sendAPIMessage(this.buildAPIMessage({ text: ':chef: New chef application received!', attachments: [attachment] }));
  }

  async notifyEventChefRequest(data: {
    customerName: string;
    email: string;
    phone: string;
    eventDate: string;
    eventType: string;
    numberOfGuests: number;
    location: string;
    dietaryRequirements?: string;
    additionalNotes?: string;
  }): Promise<boolean> {
    const attachment: MattermostAttachment = {
      fallback: `New event chef request from ${data.customerName}`,
      color: '#ff6b35',
      title: 'New Event Chef Request',
      fields: [
        { title: 'Customer', value: data.customerName, short: true },
        { title: 'Email', value: data.email, short: true },
        { title: 'Phone', value: data.phone, short: true },
        { title: 'Event Date', value: data.eventDate, short: true },
        { title: 'Event Type', value: data.eventType, short: true },
        { title: 'Number of Guests', value: data.numberOfGuests.toString(), short: true },
        { title: 'Location', value: data.location, short: false },
        ...(data.dietaryRequirements ? [{ title: 'Dietary Requirements', value: data.dietaryRequirements, short: false }] : []),
        ...(data.additionalNotes ? [{ title: 'Additional Notes', value: data.additionalNotes, short: false }] : []),
      ],
      footer: 'CribNosh Event Chef Requests',
      ts: Math.floor(Date.now() / 1000),
    };
    return this.sendAPIMessage(this.buildAPIMessage({ text: ':calendar: New event chef request received!', attachments: [attachment] }));
  }

  async notifyDriverApplication(data: {
    name: string;
    email: string;
    vehicle: string;
    experience?: string;
  }): Promise<boolean> {
    const attachment: MattermostAttachment = {
      fallback: `New driver application from ${data.name}`,
      color: '#4a90e2',
      title: 'New Driver Application',
      fields: [
        { title: 'Name', value: data.name, short: true },
        { title: 'Email', value: data.email, short: true },
        { title: 'Vehicle', value: data.vehicle, short: true },
        ...(data.experience ? [{ title: 'Experience', value: data.experience, short: true }] : []),
      ],
      footer: 'CribNosh Driver Applications',
      ts: Math.floor(Date.now() / 1000),
    };
    return this.sendAPIMessage(this.buildAPIMessage({ text: ':car: New driver application received!', attachments: [attachment] }));
  }

  async notifyContactForm(data: {
    firstName: string;
    lastName?: string;
    email: string;
    subject: string;
    message: string;
  }): Promise<boolean> {
    const attachment: MattermostAttachment = {
      fallback: `New contact form from ${data.firstName} ${data.lastName || ''}`,
      color: '#9b59b6',
      title: 'New Contact Form Submission',
      pretext: `**Subject:** ${data.subject}`,
      fields: [
        { title: 'Name', value: `${data.firstName} ${data.lastName || ''}`.trim(), short: true },
        { title: 'Email', value: data.email, short: true },
        { title: 'Message', value: data.message.length > 500 ? `${data.message.substring(0, 500)}...` : data.message, short: false },
      ],
      footer: 'CribNosh Contact Form',
      ts: Math.floor(Date.now() / 1000),
    };
    return this.sendAPIMessage(this.buildAPIMessage({ text: `:envelope: New contact form: ${data.subject}`, attachments: [attachment] }));
  }

  async notifySystemHealth(data: {
    status: 'healthy' | 'warning' | 'error';
    message: string;
    details?: Record<string, any>;
  }): Promise<boolean> {
    const color = data.status === 'healthy' ? '#36a64f' : 
                  data.status === 'warning' ? '#ffa500' : '#ff0000';
    const attachment: MattermostAttachment = {
      fallback: `System Health: ${data.status.toUpperCase()} - ${data.message}`,
      color,
      title: `System Health: ${data.status.toUpperCase()}`,
      text: data.message,
      fields: data.details ? Object.entries(data.details).map(([key, value]) => ({
        title: key.charAt(0).toUpperCase() + key.slice(1),
        value: String(value),
        short: true,
      })) : [],
      footer: 'CribNosh System Monitor',
      ts: Math.floor(Date.now() / 1000),
    };
    return this.sendAPIMessage(this.buildAPIMessage({ text: `:warning: System Health Alert: ${data.status.toUpperCase()}`, attachments: [attachment] }));
  }

  async notifyUserActivity(data: {
    type: string;
    userId: string;
    email: string;
    details?: Record<string, any>;
  }): Promise<boolean> {
    const attachment: MattermostAttachment = {
      fallback: `User Activity: ${data.type} - ${data.email}`,
      color: '#4a90e2',
      title: `User Activity: ${data.type.charAt(0).toUpperCase() + data.type.slice(1)}`,
      fields: [
        { title: 'User ID', value: data.userId, short: true },
        { title: 'Email', value: data.email, short: true },
        ...Object.entries(data.details || {}).map(([key, value]) => ({
          title: key.charAt(0).toUpperCase() + key.slice(1),
          value: String(value),
          short: true,
        })),
      ],
      footer: 'CribNosh User Activity',
      ts: Math.floor(Date.now() / 1000),
    };
    return this.sendAPIMessage(this.buildAPIMessage({ text: `:bust_in_silhouette: User Activity: ${data.type}`, attachments: [attachment] }));
  }

  /**
   * Get color for different form types
   */
  private getColorForFormType(type: string): string {
    const colors: Record<string, string> = {
      'Chef Application': '#ff6b35',
      'Driver Application': '#4a90e2',
      'Contact Form': '#9b59b6',
      'Waitlist': '#36a64f',
      'General': '#95a5a6',
    };

    return colors[type] || colors['General'];
  }

  /**
   * Check if Mattermost is configured
   */
  isConfigured(): boolean {
    return !!(this.webhookUrl || (this.botToken && this.serverUrl));
  }

  /**
   * Create a new user in Mattermost via API
   * @param user { email, username, password, first_name, last_name }
   * @returns The created user object or null if failed
   */
  async createUser(user: {
    email: string;
    username: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }): Promise<any | null> {
    if (!this.botToken || !this.serverUrl) {
      console.warn('Mattermost API credentials not configured');
      return null;
    }
    try {
      const response = await fetch(`${this.serverUrl}/api/v4/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.botToken}`,
        },
        body: JSON.stringify(user),
      });
      if (!response.ok) {
        const error = await response.text();
        console.error('Mattermost user creation failed:', error);
        return null;
      }
      return await response.json();
    } catch (error) {
      console.error('Failed to create Mattermost user:', error);
      return null;
    }
  }

  /**
   * Add a user to a Mattermost team
   * @param userId The Mattermost user ID
   * @param teamId The Mattermost team ID (optional, uses default if not provided)
   * @returns True if successful, false otherwise
   */
  async addUserToTeam(userId: string, teamId?: string): Promise<boolean> {
    if (!this.botToken || !this.serverUrl) {
      console.warn('Mattermost API credentials not configured');
      return false;
    }
    const team = teamId || this.defaultTeam;
    if (!team) {
      console.error('No Mattermost team ID provided or configured.');
      return false;
    }
    try {
      const response = await fetch(`${this.serverUrl}/api/v4/teams/${team}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.botToken}`,
        },
        body: JSON.stringify({ team_id: team, user_id: userId }),
      });
      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to add user to Mattermost team:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error adding user to Mattermost team:', error);
      return false;
    }
  }

  /**
   * Add a user to a Mattermost channel
   * @param userId The Mattermost user ID
   * @param channelId The Mattermost channel ID (optional, uses default if not provided)
   * @returns True if successful, false otherwise
   */
  async addUserToChannel(userId: string, channelId?: string): Promise<boolean> {
    if (!this.botToken || !this.serverUrl) {
      console.warn('Mattermost API credentials not configured');
      return false;
    }
    const channel = channelId || this.defaultChannel;
    if (!channel) {
      console.error('No Mattermost channel ID provided or configured.');
      return false;
    }
    try {
      const response = await fetch(`${this.serverUrl}/api/v4/channels/${channel}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.botToken}`,
        },
        body: JSON.stringify({ channel_id: channel, user_id: userId }),
      });
      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to add user to Mattermost channel:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error adding user to Mattermost channel:', error);
      return false;
    }
  }

  /**
   * Set a custom theme for a Mattermost user
   * @param userId The Mattermost user ID
   * @param theme The theme object or JSON string
   * @param teamId Optional: set for a specific team, or leave blank for global
   * @returns True if successful, false otherwise
   */
  async setUserTheme(userId: string, theme: object | string, teamId: string = ""): Promise<boolean> {
    if (!this.botToken || !this.serverUrl) {
      console.warn('Mattermost API credentials not configured');
      return false;
    }
    try {
      const value = typeof theme === 'string' ? theme : JSON.stringify(theme);
      const payload = [
        {
          user_id: userId,
          category: 'theme',
          name: teamId, // empty string for global
          value,
        },
      ];
      const url = `${this.serverUrl}/api/v4/users/${userId}/preferences`;
      console.log('Setting theme at URL:', url); // Debug log
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.botToken}`,
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.text();
        console.error('Failed to set Mattermost user theme:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Error setting Mattermost user theme:', error);
      return false;
    }
  }
}

// Export singleton instance
export const mattermostService = new MattermostService(); 