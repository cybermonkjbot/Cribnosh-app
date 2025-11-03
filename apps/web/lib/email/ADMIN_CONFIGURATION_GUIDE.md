# CribNosh Email Admin Configuration Guide

## 🎯 **Overview**

The CribNosh Email Admin Configuration system provides comprehensive management capabilities for all aspects of the email platform. Administrators can configure templates, automation, branding, delivery, analytics, and compliance settings through an intuitive web interface.

## 🚀 **Features**

### **1. Template Management**
- **Create & Edit Templates**: Full template configuration with visual editor
- **Template Validation**: Real-time validation with error checking
- **Preview System**: Live preview of templates with sample data
- **Testing**: Send test emails to verify template functionality
- **Version Control**: Track changes and maintain template versions

### **2. Automation Configuration**
- **Trigger Management**: Set up event-based email triggers
- **Campaign Scheduling**: Configure scheduled and recurring campaigns
- **Workflow Design**: Create complex automation workflows
- **Performance Monitoring**: Track automation performance and success rates

### **3. Branding Management**
- **Color Schemes**: Customize primary, secondary, and accent colors
- **Typography**: Configure fonts and text styling
- **Logo Management**: Upload and manage brand logos
- **Footer Configuration**: Customize footer content and links

### **4. Delivery Configuration**
- **Provider Management**: Configure multiple email service providers
- **Rate Limiting**: Set delivery rate limits and retry policies
- **Bounce Handling**: Configure bounce and suppression management
- **Webhook Integration**: Set up delivery status webhooks

### **5. Analytics & Tracking**
- **Open Tracking**: Monitor email open rates
- **Click Tracking**: Track link clicks and user engagement
- **Device Analytics**: Monitor device and client usage
- **Custom Events**: Track custom email events

### **6. Compliance Management**
- **GDPR Compliance**: Ensure GDPR compliance settings
- **CAN-SPAM**: Configure CAN-SPAM compliance
- **Data Retention**: Set data retention policies
- **Consent Management**: Manage user consent preferences

## 📁 **File Structure**

```
lib/email/
├── admin-config.ts                    # Core admin configuration system
app/api/admin/email-config/
├── route.ts                          # Main configuration API
├── export/route.ts                   # Configuration export
├── import/route.ts                   # Configuration import
└── validate/route.ts                 # Configuration validation
components/admin/
├── email-config-dashboard.tsx        # Main admin dashboard
└── email-template-editor.tsx         # Template editor component
app/admin/email-config/
├── page.tsx                          # Main admin page
├── template/
│   ├── [id]/page.tsx                 # Edit template page
│   └── new/page.tsx                  # Create template page
```

## 🔧 **API Endpoints**

### **Configuration Management**

#### **GET /api/admin/email-config**
Get all or specific email configurations.

**Query Parameters:**
- `category` (optional): Filter by category (templates, automations, branding, delivery, analytics, compliance)
- `id` (optional): Get specific configuration by ID

**Response:**
```json
{
  "configs": {
    "templates": [...],
    "automations": [...],
    "branding": [...],
    "delivery": [...],
    "analytics": [...],
    "compliance": [...]
  }
}
```

#### **PUT /api/admin/email-config**
Update email configuration.

**Request Body:**
```json
{
  "category": "templates",
  "configId": "welcome-email",
  "config": {
    "name": "Welcome Email",
    "subject": "Welcome to CribNosh!",
    "isActive": true,
    "styling": {
      "primaryColor": "#F23E2E",
      "fontFamily": "Satoshi"
    }
  }
}
```

#### **DELETE /api/admin/email-config**
Delete email configuration.

**Query Parameters:**
- `category`: Configuration category
- `id`: Configuration ID

### **Import/Export**

#### **GET /api/admin/email-config/export**
Export configurations to file.

**Query Parameters:**
- `category`: Configuration category to export
- `format`: Export format (json, yaml)

#### **POST /api/admin/email-config/import**
Import configurations from file.

**Request Body:**
- `file`: Configuration file (multipart/form-data)
- `category`: Configuration category
- `overwrite`: Whether to overwrite existing configurations

### **Validation**

#### **POST /api/admin/email-config/validate**
Validate configuration before saving.

**Request Body:**
```json
{
  "category": "templates",
  "config": {
    "templateId": "welcome-email",
    "name": "Welcome Email",
    "subject": "Welcome to CribNosh!"
  }
}
```

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": [],
  "score": 100
}
```

## 🎨 **Configuration Types**

### **Template Configuration**

```typescript
interface EmailTemplateConfig {
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
  };
  targeting: {
    audience: 'all' | 'segment' | 'custom';
    segmentId?: string;
    customFilters?: Array<{
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
}
```

### **Automation Configuration**

```typescript
interface EmailAutomationConfig {
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
}
```

### **Branding Configuration**

```typescript
interface EmailBrandingConfig {
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
}
```

## 🚀 **Usage Examples**

### **1. Creating a New Template**

```typescript
// Create a new welcome email template
const templateConfig = {
  templateId: 'welcome-email-v2',
  name: 'Welcome Email V2',
  isActive: true,
  subject: 'Welcome to CribNosh! 🍽️',
  previewText: 'Your personalized dining experience starts here',
  senderName: 'CribNosh Team',
  senderEmail: 'welcome@cribnosh.com',
  replyToEmail: 'support@cribnosh.com',
  styling: {
    primaryColor: '#F23E2E',
    secondaryColor: '#1A1A1A',
    accent: '#FFD700',
    fontFamily: 'Satoshi',
    logoUrl: 'https://cribnosh.com/logo.svg',
    footerText: 'CribNosh – Personalized Dining, Every Time.',
  },
  scheduling: {
    timezone: 'UTC',
    sendTime: '09:00',
    frequency: 'immediate',
  },
  targeting: {
    audience: 'all',
  },
  testing: {
    testEmails: ['admin@cribnosh.com'],
    testData: {},
    previewMode: true,
  },
};

// Save the configuration
await fetch('/api/admin/email-config', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    category: 'templates',
    configId: 'welcome-email-v2',
    config: templateConfig,
  }),
});
```

### **2. Setting Up Automation**

```typescript
// Create a welcome series automation
const automationConfig = {
  automationId: 'welcome-series',
  name: 'Welcome Series',
  description: '3-email welcome sequence for new users',
  isActive: true,
  triggers: [
    {
      event: 'user_registered',
      conditions: [],
      delay: 0,
      priority: 'high',
    },
  ],
  templates: [
    {
      templateId: 'welcome-email',
      data: { step: 1 },
    },
    {
      templateId: 'getting-started',
      data: { step: 2 },
    },
    {
      templateId: 'first-order-incentive',
      data: { step: 3 },
    },
  ],
  schedule: {
    startDate: new Date(),
    timezone: 'UTC',
  },
  limits: {
    maxEmailsPerDay: 1000,
    maxEmailsPerHour: 100,
    maxEmailsPerUser: 3,
  },
};

// Save the automation
await fetch('/api/admin/email-config', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    category: 'automations',
    configId: 'welcome-series',
    config: automationConfig,
  }),
});
```

### **3. Configuring Branding**

```typescript
// Set up brand colors and styling
const brandingConfig = {
  brandId: 'cribnosh-main',
  name: 'CribNosh Main Brand',
  isDefault: true,
  colors: {
    primary: '#F23E2E',
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
  typography: {
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
  logo: {
    url: 'https://cribnosh.com/logo.svg',
    width: 155,
    height: 40,
    altText: 'CribNosh Logo',
  },
  footer: {
    companyName: 'CribNosh',
    address: 'CribNosh – Personalized Dining, Every Time.',
    phone: '1-800-CRIBNOSH',
    email: 'support@cribnosh.com',
    website: 'https://cribnosh.com',
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
      { text: 'Privacy Policy', url: 'https://cribnosh.com/privacy' },
      { text: 'Terms of Service', url: 'https://cribnosh.com/terms' },
      { text: 'Unsubscribe', url: 'https://cribnosh.com/unsubscribe' },
    ],
  },
};

// Save the branding configuration
await fetch('/api/admin/email-config', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    category: 'branding',
    configId: 'cribnosh-main',
    config: brandingConfig,
  }),
});
```

## 🔒 **Security & Permissions**

### **Access Control**
- **Admin Only**: All configuration endpoints require admin authentication
- **Role-Based Access**: Different permission levels for different configuration types
- **Audit Logging**: All configuration changes are logged with user and timestamp

### **Data Validation**
- **Input Validation**: All inputs are validated before processing
- **Type Safety**: Full TypeScript support for configuration types
- **Sanitization**: All user inputs are sanitized to prevent XSS

### **Backup & Recovery**
- **Configuration Export**: Regular configuration backups
- **Version Control**: Track configuration changes over time
- **Rollback**: Ability to rollback to previous configurations

## 📊 **Monitoring & Analytics**

### **Configuration Metrics**
- **Template Usage**: Track which templates are used most
- **Automation Performance**: Monitor automation success rates
- **Delivery Statistics**: Track email delivery performance
- **Error Rates**: Monitor configuration errors and issues

### **Admin Dashboard**
- **Real-Time Monitoring**: Live view of email system status
- **Performance Metrics**: Template render times and success rates
- **Alert System**: Notifications for configuration issues
- **Usage Analytics**: Track admin configuration activity

## 🚀 **Best Practices**

### **1. Template Management**
- **Naming Convention**: Use descriptive, consistent template IDs
- **Version Control**: Keep track of template versions
- **Testing**: Always test templates before deploying
- **Documentation**: Document template purpose and usage

### **2. Automation Design**
- **Trigger Logic**: Keep trigger conditions simple and clear
- **Rate Limiting**: Set appropriate rate limits to avoid overwhelming users
- **Fallback Handling**: Include fallback logic for failed automations
- **Monitoring**: Monitor automation performance regularly

### **3. Branding Consistency**
- **Color Standards**: Maintain consistent color usage across all templates
- **Typography**: Use consistent font choices and sizing
- **Logo Usage**: Ensure proper logo sizing and placement
- **Brand Guidelines**: Follow established brand guidelines

### **4. Compliance Management**
- **Regular Audits**: Conduct regular compliance audits
- **Privacy Updates**: Keep privacy policies and terms updated
- **Consent Management**: Maintain proper consent tracking
- **Data Retention**: Follow data retention policies

## 🔧 **Troubleshooting**

### **Common Issues**

#### **Template Not Rendering**
- Check template ID and configuration
- Verify template is active
- Check for validation errors
- Test with sample data

#### **Automation Not Triggering**
- Verify trigger conditions
- Check automation is active
- Review event data format
- Check rate limiting settings

#### **Delivery Issues**
- Verify provider configuration
- Check rate limits and quotas
- Review bounce handling settings
- Check webhook configuration

#### **Branding Not Applied**
- Verify branding configuration is active
- Check template styling settings
- Ensure proper color format
- Verify logo URL accessibility

### **Debug Tools**
- **Configuration Validation**: Use validation endpoint to check configurations
- **Template Preview**: Use preview system to test templates
- **Test Emails**: Send test emails to verify functionality
- **Logs**: Check system logs for error details

## 📞 **Support**

### **Documentation**
- **API Reference**: Complete API documentation
- **Configuration Guide**: Detailed configuration examples
- **Troubleshooting**: Common issues and solutions
- **Best Practices**: Recommended configuration patterns

### **Contact**
- **Technical Support**: admin-support@cribnosh.com
- **Documentation**: docs@cribnosh.com
- **Feature Requests**: features@cribnosh.com

---

## 🎉 **Conclusion**

The CribNosh Email Admin Configuration system provides comprehensive management capabilities for all aspects of the email platform. With intuitive interfaces, robust validation, and extensive monitoring, administrators can efficiently manage email templates, automation, branding, and compliance settings.

**Key Benefits:**
- **Ease of Use**: Intuitive web interface for configuration management
- **Flexibility**: Comprehensive configuration options for all email aspects
- **Reliability**: Robust validation and error handling
- **Scalability**: Designed to handle high-volume email operations
- **Compliance**: Built-in compliance management and monitoring

**The admin configuration system is now ready to support CribNosh's email operations at scale! 🚀**

---

**Built with ❤️ for CribNosh - Personalized Dining, Every Time.**
