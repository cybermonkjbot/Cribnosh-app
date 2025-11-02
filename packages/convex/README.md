# CribNosh Email Configuration Backend

This directory contains the complete Convex backend for the CribNosh email configuration system. The backend provides comprehensive email management capabilities including template configuration, automation, analytics, and monitoring.

## 🏗️ **Architecture Overview**

The backend is built using Convex and consists of:

- **Database Schema** (`schema.ts`) - Defines all data models and relationships
- **Configuration Management** (`emailConfig.ts`) - CRUD operations for email configurations
- **Automation Engine** (`emailAutomation.ts`) - Event-driven email automation
- **Analytics & Monitoring** (`emailAnalytics.ts`) - Email performance tracking and health monitoring
- **HTTP API** (`http.ts`) - RESTful endpoints for external access
- **Cron Jobs** (`crons.ts`) - Scheduled tasks for maintenance and processing

## 📊 **Database Schema**

### Core Tables

#### **Email Templates** (`emailTemplates`)
- Template configuration and metadata
- Styling, targeting, and testing settings
- Version control and change tracking

#### **Email Automations** (`emailAutomations`)
- Event-driven automation workflows
- Trigger conditions and template assignments
- Rate limiting and scheduling

#### **Email Branding** (`emailBranding`)
- Visual branding configurations
- Colors, typography, logos, and footer settings
- Multi-brand support

#### **Email Delivery** (`emailDelivery`)
- Email provider configurations
- Rate limits, retry settings, and bounce handling
- Webhook configurations

#### **Email Analytics** (`emailAnalytics`)
- Analytics configuration settings
- Tracking preferences and reporting options

#### **Email Compliance** (`emailCompliance`)
- GDPR, CAN-SPAM, and CCPA compliance settings
- Data retention and consent management

### Supporting Tables

#### **Email Queue** (`emailQueue`)
- Email processing queue
- Priority management and retry logic
- Status tracking and error handling

#### **Email Analytics Data** (`emailAnalyticsData`)
- Event tracking (opens, clicks, bounces, etc.)
- Device and location information
- Performance metrics

#### **Email Configuration History** (`emailConfigHistory`)
- Complete audit trail of configuration changes
- Change tracking and rollback support

#### **Email Test Results** (`emailTestResults`)
- Template testing and validation results
- Performance benchmarks and error tracking

## 🔧 **Core Functions**

### Configuration Management (`emailConfig.ts`)

#### **Template Management**
```typescript
// Get all templates
const templates = await ctx.runQuery(api.emailConfig.getEmailTemplates, {
  activeOnly: true,
  limit: 50
});

// Create new template
const templateId = await ctx.runMutation(api.emailConfig.createEmailTemplate, {
  templateId: "welcome-email-v2",
  name: "Welcome Email V2",
  // ... other template data
  changedBy: "admin@cribnosh.com"
});

// Update template
await ctx.runMutation(api.emailConfig.updateEmailTemplate, {
  templateId: "welcome-email-v2",
  updates: { isActive: false },
  changedBy: "admin@cribnosh.com",
  changeReason: "Disabling for maintenance"
});
```

#### **Automation Management**
```typescript
// Get automations by event
const automations = await ctx.runQuery(api.emailAutomation.getAutomationsByEvent, {
  event: "user_registered"
});

// Trigger automation
await ctx.runMutation(api.emailAutomation.triggerAutomation, {
  automationId: "welcome-series",
  userId: "user123",
  eventData: { registrationSource: "website" }
});
```

### Analytics & Monitoring (`emailAnalytics.ts`)

#### **Dashboard Statistics**
```typescript
// Get comprehensive email stats
const stats = await ctx.runQuery(api.emailAnalytics.getEmailDashboardStats, {
  startDate: Date.now() - 30 * 24 * 60 * 60 * 1000, // Last 30 days
  endDate: Date.now(),
  templateId: "welcome-email"
});

console.log(`Open Rate: ${stats.openRate}%`);
console.log(`Click Rate: ${stats.clickRate}%`);
console.log(`Bounce Rate: ${stats.bounceRate}%`);
```

#### **Performance Metrics**
```typescript
// Get performance trends
const metrics = await ctx.runQuery(api.emailAnalytics.getEmailPerformanceMetrics, {
  startDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
  groupBy: "day"
});
```

#### **Device & Location Analytics**
```typescript
// Get device breakdown
const deviceAnalytics = await ctx.runQuery(api.emailAnalytics.getDeviceAnalytics, {
  startDate: Date.now() - 30 * 24 * 60 * 60 * 1000
});

// Get location analytics
const locationAnalytics = await ctx.runQuery(api.emailAnalytics.getLocationAnalytics, {
  startDate: Date.now() - 30 * 24 * 60 * 60 * 1000
});
```

### Email Testing (`emailAnalytics.ts`)

#### **Template Testing**
```typescript
// Run comprehensive template test
const testResult = await ctx.runMutation(api.emailAnalytics.runEmailTest, {
  templateId: "welcome-email",
  testType: "validation",
  testData: {
    userName: "John Doe",
    companyName: "CribNosh"
  },
  testedBy: "admin@cribnosh.com"
});
```

## 🌐 **HTTP API Endpoints**

### Template Management
- `GET /api/email/templates` - List all templates
- `GET /api/email/templates/:templateId` - Get specific template
- `POST /api/email/templates` - Create new template
- `PUT /api/email/templates/:templateId` - Update template
- `DELETE /api/email/templates/:templateId` - Delete template

### Analytics
- `GET /api/email/analytics/dashboard` - Dashboard statistics
- `GET /api/email/analytics/performance` - Performance metrics
- `GET /api/email/analytics/devices` - Device analytics
- `GET /api/email/analytics/locations` - Location analytics

### Testing
- `POST /api/email/test` - Run email test
- `GET /api/email/test/results` - Get test results

### Tracking
- `GET /api/email/track/click/:emailId/:linkId` - Click tracking
- `GET /api/email/track/open/:emailId` - Open tracking

### Export/Import
- `GET /api/email/export` - Export configurations
- `POST /api/email/import` - Import configurations

## ⏰ **Cron Jobs**

### Email Queue Processing
- **Frequency**: Every minute
- **Function**: `processEmailQueue`
- **Purpose**: Process pending emails in the queue

### Data Cleanup
- **Frequency**: Daily
- **Function**: `cleanupOldAnalyticsData`
- **Purpose**: Remove old analytics data (30+ days)

### Daily Reports
- **Frequency**: Daily
- **Function**: `generateDailyReports`
- **Purpose**: Generate automated email performance reports

### Health Monitoring
- **Frequency**: Every 5 minutes
- **Function**: `checkEmailHealthMetrics`
- **Purpose**: Monitor email system health and create alerts

## 🔄 **Email Automation Workflow**

1. **Event Trigger**: User action triggers automation
2. **Condition Evaluation**: Check if automation conditions are met
3. **Rate Limiting**: Verify rate limits are not exceeded
4. **Template Selection**: Choose appropriate template based on conditions
5. **Data Merging**: Combine user data with template data
6. **Queue Scheduling**: Add email to processing queue with delay
7. **Email Processing**: Background job processes and sends email
8. **Analytics Tracking**: Record delivery, open, and click events

## 📈 **Analytics & Monitoring**

### Key Metrics Tracked
- **Delivery Rate**: Percentage of emails successfully delivered
- **Open Rate**: Percentage of emails opened by recipients
- **Click Rate**: Percentage of emails with clicked links
- **Bounce Rate**: Percentage of emails that bounced
- **Unsubscribe Rate**: Percentage of recipients who unsubscribed
- **Complaint Rate**: Percentage of emails marked as spam

### Health Monitoring
- **Queue Size**: Number of pending emails
- **Processing Rate**: Emails processed per minute
- **Error Rate**: Percentage of failed email attempts
- **Average Delivery Time**: Time from queue to delivery

### Alerting
- **Delivery Rate Below 95%**: High severity alert
- **Bounce Rate Above 5%**: Medium severity alert
- **Error Rate Above 10%**: Critical severity alert
- **Queue Size Above 1000**: Medium severity alert

## 🚀 **Getting Started**

### 1. Deploy to Convex
```bash
npx convex deploy
```

### 2. Set Environment Variables
```bash
# Email provider configuration
RESEND_API_KEY=your_resend_api_key

# Optional: Webhook secrets
EMAIL_WEBHOOK_SECRET=your_webhook_secret
```

### 3. Initialize Default Configurations
```typescript
// Create default branding
await ctx.runMutation(api.emailConfig.createEmailBranding, {
  brandId: "cribnosh-main",
  name: "CribNosh Main Brand",
  isDefault: true,
  // ... branding configuration
  changedBy: "system"
});

// Create default delivery configuration
await ctx.runMutation(api.emailConfig.createEmailDelivery, {
  deliveryId: "resend-primary",
  provider: "resend",
  apiKey: process.env.RESEND_API_KEY,
  // ... delivery configuration
  changedBy: "system"
});
```

### 4. Create Your First Template
```typescript
const templateId = await ctx.runMutation(api.emailConfig.createEmailTemplate, {
  templateId: "welcome-email",
  name: "Welcome Email",
  isActive: true,
  subject: "Welcome to CribNosh! 🍽️",
  previewText: "Your personalized dining experience starts here",
  senderName: "CribNosh Team",
  senderEmail: "welcome@cribnosh.com",
  replyToEmail: "support@cribnosh.com",
  // ... rest of template configuration
  changedBy: "admin@cribnosh.com"
});
```

## 🔒 **Security & Compliance**

### Data Protection
- All sensitive data is encrypted at rest
- API keys are stored securely
- User data is anonymized in analytics

### Compliance Features
- **GDPR**: Data retention controls and consent management
- **CAN-SPAM**: Unsubscribe handling and sender identification
- **CCPA**: Data processing transparency and user rights

### Access Control
- Admin-only configuration endpoints
- Role-based access to different configuration types
- Audit logging for all configuration changes

## 📚 **API Documentation**

### Authentication
All API endpoints require proper authentication. Include your Convex authentication token in the request headers:

```typescript
const response = await fetch('/api/email/templates', {
  headers: {
    'Authorization': `Bearer ${convexAuthToken}`,
    'Content-Type': 'application/json'
  }
});
```

### Error Handling
All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message describing what went wrong",
  "code": "ERROR_CODE"
}
```

### Rate Limiting
- API calls are rate limited per user
- Email sending is rate limited per template and recipient
- Queue processing respects configured limits

## 🛠️ **Development & Testing**

### Local Development
```bash
# Start Convex development server
npx convex dev

# Run tests
npm test

# Lint code
npm run lint
```

### Testing Email Templates
```typescript
// Test template rendering
const testResult = await ctx.runMutation(api.emailAnalytics.runEmailTest, {
  templateId: "welcome-email",
  testType: "preview",
  testData: { userName: "Test User" },
  testedBy: "developer@cribnosh.com"
});
```

### Monitoring in Development
- Check Convex dashboard for function logs
- Monitor email queue status
- Review analytics data in real-time

## 📞 **Support & Troubleshooting**

### Common Issues

#### **Template Not Rendering**
- Check template ID and configuration
- Verify template is active
- Test with sample data

#### **Automation Not Triggering**
- Verify trigger conditions
- Check automation is active
- Review event data format

#### **High Bounce Rate**
- Check sender reputation
- Verify email addresses
- Review content for spam triggers

#### **Queue Processing Issues**
- Check rate limits
- Verify email provider configuration
- Review error logs

### Getting Help
- Check Convex logs for detailed error messages
- Review configuration history for recent changes
- Test with simplified configurations
- Contact support with specific error details

---

**Built with ❤️ for CribNosh - Personalized Dining, Every Time.**
