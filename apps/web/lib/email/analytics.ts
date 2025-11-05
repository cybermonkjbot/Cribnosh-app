// Email Analytics and Tracking System
export interface EmailAnalytics {
  emailId: string;
  recipientEmail: string;
  templateName: string;
  sentAt: Date;
  openedAt?: Date;
  clickedAt?: Date;
  unsubscribedAt?: Date;
  bouncedAt?: Date;
  complaintAt?: Date;
  deviceType?: 'mobile' | 'desktop' | 'tablet';
  emailClient?: string;
  location?: {
    country: string;
    city: string;
    region: string;
  };
  userAgent?: string;
  ipAddress?: string;
}

export interface EmailMetrics {
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  totalUnsubscribed: number;
  totalBounced: number;
  totalComplaints: number;
  openRate: number;
  clickRate: number;
  unsubscribeRate: number;
  bounceRate: number;
  complaintRate: number;
}

export interface TemplateMetrics {
  templateName: string;
  metrics: EmailMetrics;
  topPerformingElements: Array<{
    element: string;
    clicks: number;
    clickRate: number;
  }>;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  emailClientBreakdown: Record<string, number>;
  locationBreakdown: Record<string, number>;
}

// Tracking pixel generator
export const generateTrackingPixel = (emailId: string, event: 'open' | 'click' | 'unsubscribe' = 'open') => {
  const baseUrl = process.env.EMAIL_TRACKING_BASE_URL || 'https://api.cribnosh.com';
  return `${baseUrl}/email/track/${event}/${emailId}`;
};

// Link tracking wrapper
export const trackLink = (url: string, emailId: string, elementId?: string) => {
  const baseUrl = process.env.EMAIL_TRACKING_BASE_URL || 'https://api.cribnosh.com';
  const trackingUrl = new URL(`${baseUrl}/email/track/click/${emailId}`);
  
  if (elementId) {
    trackingUrl.searchParams.set('element', elementId);
  }
  
  trackingUrl.searchParams.set('redirect', encodeURIComponent(url));
  return trackingUrl.toString();
};

// Email template with tracking
export const addTrackingToEmail = (html: string, emailId: string) => {
  // Add tracking pixel
  const trackingPixel = generateTrackingPixel(emailId, 'open');
  const pixelHtml = `<img src="${trackingPixel}" width="1" height="1" style="display:none;" alt="" />`;
  
  // Add tracking to all links
  const linkRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>/g;
  const trackedHtml = html.replace(linkRegex, (match, url) => {
    // Skip if already has tracking or is a mailto link
    if (url.includes('mailto:') || url.includes('/email/track/')) {
      return match;
    }
    
    const trackedUrl = trackLink(url, emailId);
    return match.replace(url, trackedUrl);
  });
  
  // Insert tracking pixel before closing body tag
  return trackedHtml.replace('</body>', `${pixelHtml}</body>`);
};

// Email client detection
export const detectEmailClient = (userAgent: string): string => {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('outlook')) return 'Outlook';
  if (ua.includes('gmail')) return 'Gmail';
  if (ua.includes('apple mail')) return 'Apple Mail';
  if (ua.includes('thunderbird')) return 'Thunderbird';
  if (ua.includes('yahoo')) return 'Yahoo Mail';
  if (ua.includes('hotmail') || ua.includes('outlook.com')) return 'Outlook.com';
  if (ua.includes('aol')) return 'AOL Mail';
  
  return 'Unknown';
};

// Device type detection
export const detectDeviceType = (userAgent: string): 'mobile' | 'desktop' | 'tablet' => {
  const ua = userAgent.toLowerCase();
  
  if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
    return 'mobile';
  }
  
  if (ua.includes('tablet') || ua.includes('ipad')) {
    return 'tablet';
  }
  
  return 'desktop';
};

// Email template performance analyzer
export const analyzeEmailPerformance = (analytics: EmailAnalytics[]): TemplateMetrics[] => {
  const templateGroups = analytics.reduce((acc, email) => {
    if (!acc[email.templateName]) {
      acc[email.templateName] = [];
    }
    acc[email.templateName].push(email);
    return acc;
  }, {} as Record<string, EmailAnalytics[]>);

  return Object.entries(templateGroups).map(([templateName, emails]) => {
    const totalSent = emails.length;
    const totalOpened = emails.filter(e => e.openedAt).length;
    const totalClicked = emails.filter(e => e.clickedAt).length;
    const totalUnsubscribed = emails.filter(e => e.unsubscribedAt).length;
    const totalBounced = emails.filter(e => e.bouncedAt).length;
    const totalComplaints = emails.filter(e => e.complaintAt).length;

    const metrics: EmailMetrics = {
      totalSent,
      totalOpened,
      totalClicked,
      totalUnsubscribed,
      totalBounced,
      totalComplaints,
      openRate: totalSent > 0 ? (totalOpened / totalSent) * 100 : 0,
      clickRate: totalSent > 0 ? (totalClicked / totalSent) * 100 : 0,
      unsubscribeRate: totalSent > 0 ? (totalUnsubscribed / totalSent) * 100 : 0,
      bounceRate: totalSent > 0 ? (totalBounced / totalSent) * 100 : 0,
      complaintRate: totalSent > 0 ? (totalComplaints / totalSent) * 100 : 0,
    };

    // Device breakdown
    const deviceBreakdown = emails.reduce((acc, email) => {
      if (email.deviceType) {
        acc[email.deviceType] = (acc[email.deviceType] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Email client breakdown
    const emailClientBreakdown = emails.reduce((acc, email) => {
      if (email.emailClient) {
        acc[email.emailClient] = (acc[email.emailClient] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Location breakdown
    const locationBreakdown = emails.reduce((acc, email) => {
      if (email.location?.country) {
        acc[email.location.country] = (acc[email.location.country] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      templateName,
      metrics,
      topPerformingElements: [], // This would be populated from click tracking data
      deviceBreakdown: {
        mobile: deviceBreakdown.mobile || 0,
        desktop: deviceBreakdown.desktop || 0,
        tablet: deviceBreakdown.tablet || 0,
      },
      emailClientBreakdown,
      locationBreakdown,
    };
  });
};

// Email A/B testing utilities
export interface ABTestVariant {
  name: string;
  template: string;
  weight: number; // 0-100
}

export interface ABTest {
  testId: string;
  name: string;
  variants: ABTestVariant[];
  startDate: Date;
  endDate: Date;
  status: 'draft' | 'running' | 'completed' | 'paused';
  winner?: string;
}

export const selectABTestVariant = (test: ABTest, userId: string): ABTestVariant => {
  // Simple hash-based selection for consistent user experience
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const random = Math.abs(hash) % 100;
  let cumulative = 0;
  
  for (const variant of test.variants) {
    cumulative += variant.weight;
    if (random < cumulative) {
      return variant;
    }
  }
  
  // Fallback to first variant
  return test.variants[0];
};

// Email deliverability checker
export const checkEmailDeliverability = (email: string): {
  valid: boolean;
  issues: string[];
  suggestions: string[];
} => {
  const issues: string[] = [];
  const suggestions: string[] = [];
  
  // Basic email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    issues.push('Invalid email format');
    return { valid: false, issues, suggestions: ['Please provide a valid email address'] };
  }
  
  // Check for common issues
  if (email.includes('+')) {
    suggestions.push('Consider using the base email address without aliases for better deliverability');
  }
  
  if (email.includes('..')) {
    issues.push('Email contains consecutive dots');
  }
  
  if (email.length > 254) {
    issues.push('Email address is too long');
  }
  
  // Check for disposable email domains
  const disposableDomains = [
    '10minutemail.com', 'tempmail.org', 'guerrillamail.com', 'mailinator.com'
  ];
  
  const domain = email.split('@')[1]?.toLowerCase();
  if (disposableDomains.includes(domain)) {
    issues.push('Disposable email address detected');
    suggestions.push('Please use a permanent email address');
  }
  
  return {
    valid: issues.length === 0,
    issues,
    suggestions,
  };
};

// Email template optimization suggestions
export const getOptimizationSuggestions = (templateMetrics: TemplateMetrics): string[] => {
  const suggestions: string[] = [];
  
  if (templateMetrics.metrics.openRate < 20) {
    suggestions.push('Consider improving subject line to increase open rates');
  }
  
  if (templateMetrics.metrics.clickRate < 2) {
    suggestions.push('Add more compelling call-to-action buttons');
  }
  
  if (templateMetrics.metrics.unsubscribeRate > 1) {
    suggestions.push('Review email frequency and content relevance');
  }
  
  if (templateMetrics.metrics.bounceRate > 5) {
    suggestions.push('Improve email list hygiene and validation');
  }
  
  if (templateMetrics.deviceBreakdown.mobile < 50) {
    suggestions.push('Optimize template for mobile devices');
  }
  
  return suggestions;
};

export default {
  generateTrackingPixel,
  trackLink,
  addTrackingToEmail,
  detectEmailClient,
  detectDeviceType,
  analyzeEmailPerformance,
  selectABTestVariant,
  checkEmailDeliverability,
  getOptimizationSuggestions,
};
