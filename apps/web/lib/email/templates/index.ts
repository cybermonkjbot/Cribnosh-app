// CribNosh Email Templates Index
// Export all email templates for easy importing

// Core Templates
export { GenericNotificationEmail } from './generic-notification';
export { OrderConfirmationEmail } from './order-confirmation';
export { OTPVerificationEmail } from './otp-verification';
export { WelcomeEmail } from './welcome';
// Food Creator
export { AdminNotificationEmail } from './admin-notification';
export { FoodCreatorApplicationEmail } from './food-creator-application';
export { FoodCreatorRecommendationsEmail } from './food-creator-recommendations';
export { FormConfirmationEmail } from './form-confirmation';

// Advanced Templates
export { FeedbackRequestEmail } from './feedback-request';
export { LoyaltyRewardsEmail } from './loyalty-rewards';
export { OrderUpdateEmail } from './order-update';
export { PromotionalEmail } from './promotional';
export { SeasonalCampaignEmail } from './seasonal-campaign';
export { SystemAlertEmail } from './system-alert';

// Dark Mode Templates
export { DarkModeOTPVerificationEmail } from './dark-mode';

// Template Types
export interface EmailTemplateProps {
  // Common props for all templates
  customerName?: string;
  unsubscribeUrl?: string;
  companyAddress?: string;
}

export interface OrderTemplateProps extends EmailTemplateProps {
  orderNumber: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
    specialInstructions?: string;
  }>;
  chef: {
    name: string;
    kitchen: string;
    image: string;
  };
  total: number;
  deliveryTime: string;
  deliveryAddress: string;
  trackingUrl: string;
}

export interface PromotionalTemplateProps extends EmailTemplateProps {
  recipientName: string;
  promotionCode: string;
  discountPercentage: number;
  expiryDate: string;
  featuredChefs: Array<{
    name: string;
    cuisine: string;
    rating: number;
    image: string;
    speciality: string;
  }>;
}

export interface FeedbackTemplateProps extends EmailTemplateProps {
  customerName: string;
  orderNumber: string;
  orderDate: string;
  chef: {
    name: string;
    kitchen: string;
    image: string;
    cuisine: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  feedbackUrl: string;
  reviewUrl: string;
  ratingUrl: string;
  incentive?: {
    type: 'discount' | 'points' | 'free_item';
    value: string;
    description: string;
    expiryDate: string;
  };
}

export interface LoyaltyTemplateProps extends EmailTemplateProps {
  customerName: string;
  currentTier: 'bronze' | 'silver' | 'gold' | 'platinum';
  currentPoints: number;
  pointsToNextTier: number;
  totalPoints: number;
  recentEarnings: Array<{
    source: string;
    points: number;
    date: string;
    description: string;
  }>;
  availableRewards: Array<{
    id: string;
    name: string;
    description: string;
    pointsRequired: number;
    discount?: number;
    freeItem?: string;
    image?: string;
  }>;
  specialOffers: Array<{
    title: string;
    description: string;
    discount: number;
    expiryDate: string;
    code?: string;
  }>;
}

export interface SeasonalTemplateProps extends EmailTemplateProps {
  campaignName: string;
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'holiday' | 'special';
  customerName: string;
  theme: {
    primaryColor: string;
    secondaryColor: string;
    backgroundImage?: string;
    icon: string;
  };
  offer: {
    title: string;
    description: string;
    discount: number;
    code?: string;
    expiryDate: string;
    minOrder?: number;
  };
  featuredItems: Array<{
    name: string;
    description: string;
    price: number;
    originalPrice?: number;
    image: string;
    chef: string;
    cuisine: string;
    rating: number;
    limitedTime?: boolean;
  }>;
}

export interface SystemAlertTemplateProps extends EmailTemplateProps {
  alertType: 'maintenance' | 'outage' | 'security' | 'update' | 'feature' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  customerName: string;
  affectedServices?: string[];
  estimatedDuration?: string;
  currentStatus?: 'scheduled' | 'in_progress' | 'resolved' | 'cancelled';
  progress?: number;
  contactInfo?: {
    phone: string;
    email: string;
    chatUrl: string;
    statusPage: string;
  };
}

// Template Categories
export const templateCategories = {
  core: [
    'welcome',
    'orderConfirmation',
    'otpVerification',
    'genericNotification',
    'chefApplication',
    'formConfirmation',
    'adminNotification',
  ],
  advanced: [
    'promotional',
    'orderUpdate',
    'feedbackRequest',
    'loyaltyRewards',
    'seasonalCampaign',
    'systemAlert',
  ],
  darkMode: [
    'darkModeOTPVerification',
  ],
} as const;

// Template Metadata
export const templateMetadata = {
  welcome: {
    name: 'Welcome Email',
    description: 'Welcome new users to CribNosh',
    category: 'core',
    useCases: ['user_registration', 'account_verification'],
    estimatedRenderTime: 150,
    averageSize: 25000,
  },
  orderConfirmation: {
    name: 'Order Confirmation',
    description: 'Confirm order placement with details',
    category: 'core',
    useCases: ['order_placement', 'payment_confirmation'],
    estimatedRenderTime: 200,
    averageSize: 35000,
  },
  otpVerification: {
    name: 'OTP Verification',
    description: 'Email verification with OTP code',
    category: 'core',
    useCases: ['email_verification', 'two_factor_auth'],
    estimatedRenderTime: 100,
    averageSize: 15000,
  },
  promotional: {
    name: 'Promotional Email',
    description: 'Marketing campaigns with offers',
    category: 'advanced',
    useCases: ['marketing', 'promotions', 'seasonal_campaigns'],
    estimatedRenderTime: 300,
    averageSize: 45000,
  },
  orderUpdate: {
    name: 'Order Update',
    description: 'Real-time order status updates',
    category: 'advanced',
    useCases: ['order_tracking', 'status_updates', 'delivery_notifications'],
    estimatedRenderTime: 250,
    averageSize: 40000,
  },
  feedbackRequest: {
    name: 'Feedback Request',
    description: 'Request customer feedback and reviews',
    category: 'advanced',
    useCases: ['feedback_collection', 'review_generation', 'customer_satisfaction'],
    estimatedRenderTime: 200,
    averageSize: 30000,
  },
  loyaltyRewards: {
    name: 'Loyalty Rewards',
    description: 'Loyalty program updates and rewards',
    category: 'advanced',
    useCases: ['loyalty_program', 'rewards_notification', 'tier_updates'],
    estimatedRenderTime: 350,
    averageSize: 50000,
  },
  seasonalCampaign: {
    name: 'Seasonal Campaign',
    description: 'Seasonal and holiday marketing campaigns',
    category: 'advanced',
    useCases: ['seasonal_marketing', 'holiday_campaigns', 'special_events'],
    estimatedRenderTime: 400,
    averageSize: 60000,
  },
  systemAlert: {
    name: 'System Alert',
    description: 'System notifications and alerts',
    category: 'advanced',
    useCases: ['system_maintenance', 'outage_notifications', 'security_alerts'],
    estimatedRenderTime: 150,
    averageSize: 20000,
  },
} as const;

// Template Factory
export class EmailTemplateFactory {
  static createTemplate(templateName: string, props: any) {
    const templates: Record<string, any> = {
      welcome: () => import('./welcome').then(m => m.WelcomeEmail),
      orderConfirmation: () => import('./order-confirmation').then(m => m.OrderConfirmationEmail),
      otpVerification: () => import('./otp-verification').then(m => m.OTPVerificationEmail),
      promotional: () => import('./promotional').then(m => m.PromotionalEmail),
      orderUpdate: () => import('./order-update').then(m => m.OrderUpdateEmail),
      feedbackRequest: () => import('./feedback-request').then(m => m.FeedbackRequestEmail),
      loyaltyRewards: () => import('./loyalty-rewards').then(m => m.LoyaltyRewardsEmail),
      seasonalCampaign: () => import('./seasonal-campaign').then(m => m.SeasonalCampaignEmail),
      systemAlert: () => import('./system-alert').then(m => m.SystemAlertEmail),
      genericNotification: () => import('./generic-notification').then(m => m.GenericNotificationEmail),
      chefApplication: () => import('./food-creator-application').then(m => m.FoodCreatorApplicationEmail),
      formConfirmation: () => import('./form-confirmation').then(m => m.FormConfirmationEmail),
      adminNotification: () => import('./admin-notification').then(m => m.AdminNotificationEmail),
    };

    const Template = templates[templateName];
    if (!Template) {
      throw new Error(`Template ${templateName} not found`);
    }

    return Template(props);
  }

  static getAvailableTemplates() {
    return Object.keys(templateMetadata);
  }

  static getTemplatesByCategory(category: keyof typeof templateCategories) {
    return templateCategories[category];
  }

  static getTemplateMetadata(templateName: string) {
    return templateMetadata[templateName as keyof typeof templateMetadata];
  }
}

// Template Validation
export const validateTemplateProps = (templateName: string, props: any): {
  valid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Common validation
  if (!props.customerName && !props.recipientName) {
    errors.push('Customer name is required');
  }

  if (!props.unsubscribeUrl) {
    warnings.push('Unsubscribe URL is recommended for compliance');
  }

  // Template-specific validation
  switch (templateName) {
    case 'orderConfirmation':
      if (!props.orderNumber) errors.push('Order number is required');
      if (!props.items || props.items.length === 0) errors.push('Order items are required');
      if (!props.chef) errors.push('Food Creator information is required');
      if (!props.total) errors.push('Total amount is required');
      break;

    case 'otpVerification':
      if (!props.otpCode) errors.push('OTP code is required');
      break;

    case 'promotional':
      if (!props.promotionCode) errors.push('Promotion code is required');
      if (!props.discountPercentage) errors.push('Discount percentage is required');
      if (!props.expiryDate) errors.push('Expiry date is required');
      break;

    case 'feedbackRequest':
      if (!props.orderNumber) errors.push('Order number is required');
      if (!props.feedbackUrl) errors.push('Feedback URL is required');
      break;

    case 'loyaltyRewards':
      if (!props.currentTier) errors.push('Current tier is required');
      if (props.currentPoints === undefined) errors.push('Current points are required');
      break;

    case 'seasonalCampaign':
      if (!props.campaignName) errors.push('Campaign name is required');
      if (!props.season) errors.push('Season is required');
      if (!props.theme) errors.push('Theme is required');
      break;

    case 'systemAlert':
      if (!props.alertType) errors.push('Alert type is required');
      if (!props.severity) errors.push('Severity is required');
      if (!props.title) errors.push('Title is required');
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

// Template Rendering Utilities
export const renderTemplate = async (templateName: string, props: any) => {
  const validation = validateTemplateProps(templateName, props);
  if (!validation.valid) {
    throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
  }

  const Template = EmailTemplateFactory.createTemplate(templateName, props);
  const { render } = await import('@react-email/render');
  return await render(Template);
};

// Template Preview Utilities
export const getTemplatePreview = (templateName: string) => {
  const metadata = templateMetadata[templateName as keyof typeof templateMetadata];
  if (!metadata) {
    throw new Error(`Template ${templateName} not found`);
  }

  return {
    name: metadata.name,
    description: metadata.description,
    category: metadata.category,
    estimatedRenderTime: metadata.estimatedRenderTime,
    averageSize: metadata.averageSize,
    useCases: metadata.useCases,
  };
};

export default EmailTemplateFactory;
