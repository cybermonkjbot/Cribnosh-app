import { Resend } from 'resend';
import { ErrorCode, ErrorFactory } from '../errors';

// Lazy initialization to avoid errors during code analysis
let resendInstance: Resend | null = null;

function getResendClient(): Resend {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Missing RESEND_API_KEY environment variable. Please set it in your environment.');
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
}

export async function sendBroadcastEmail({
  user,
  templateId,
  dynamicFields = {},
}: {
  user: { email: string; name?: string };
  templateId: string;
  dynamicFields?: Record<string, string>;
}) {
  try {
    // Get template configuration from environment or database
    const templateConfig = getTemplateConfig(templateId);

    // Prepare dynamic data for template
    const templateData = {
      user_name: user.name || 'there',
      user_email: user.email,
      ...dynamicFields,
      unsubscribe_url: `${process.env.NEXT_PUBLIC_APP_URL}/unsubscribe?email=${encodeURIComponent(user.email)}`,
      company_name: 'CribNosh',
      company_address: '123 Food Street, San Francisco, CA 94102',
      current_year: new Date().getFullYear()
    };

    // Use Resend's template system if template exists, otherwise use inline HTML
    if (templateConfig.useResendTemplate) {
      // Generate HTML from template configuration for template-based emails
      const htmlContent = generateEmailHTML(templateConfig, templateData);

      return await getResendClient().emails.send({
        from: templateConfig.from || 'CribNosh <noreply@cribnosh.com>',
        to: user.email,
        html: htmlContent,
        subject: templateConfig.subject || 'Message from CribNosh',
        tags: [
          { name: 'template_id', value: templateId },
          { name: 'user_type', value: 'broadcast' }
        ]
      });
    } else {
      // Generate HTML from template configuration
      const htmlContent = generateEmailHTML(templateConfig, templateData);

      return await getResendClient().emails.send({
        from: templateConfig.from || 'CribNosh <noreply@cribnosh.com>',
        to: user.email,
        subject: templateConfig.subject || 'Update from CribNosh',
        html: htmlContent,
        tags: [
          { name: 'template_id', value: templateId },
          { name: 'user_type', value: 'broadcast' }
        ]
      });
    }
  } catch (error) {
    console.error('Failed to send broadcast email:', error);
    throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, `Failed to send broadcast email: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Helper function to get template configuration
function getTemplateConfig(templateId: string): any {
  const templates: Record<string, any> = {
    'welcome': {
      subject: 'Welcome to CribNosh! 🍽️',
      from: 'CribNosh <welcome@cribnosh.com>',
      useResendTemplate: false,
      template: 'welcome'
    },
    'newsletter': {
      subject: 'CribNosh Weekly Newsletter',
      from: 'CribNosh <newsletter@cribnosh.com>',
      useResendTemplate: false,
      template: 'newsletter'
    },
    'promotion': {
      subject: 'Special Offer from CribNosh!',
      from: 'CribNosh <offers@cribnosh.com>',
      useResendTemplate: false,
      template: 'promotion'
    },
    'announcement': {
      subject: 'Important Update from CribNosh',
      from: 'CribNosh <updates@cribnosh.com>',
      useResendTemplate: false,
      template: 'announcement'
    }
  };

  return templates[templateId] || {
    subject: 'Update from CribNosh',
    from: 'CribNosh <noreply@cribnosh.com>',
    useResendTemplate: false,
    template: 'default'
  };
}

// Helper function to generate email HTML
function generateEmailHTML(templateConfig: any, data: any): string {
  const baseStyles = `
    <style>
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #ffffff; color: #1A1A1A; }
      .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
      .header { background-color: #ffffff; color: #1A1A1A; padding: 40px 30px; text-align: center; border-bottom: 1px solid #F3F4F6; }
      .content { padding: 30px; line-height: 1.6; }
      .footer { background-color: #ffffff; color: #6B7280; padding: 30px; text-align: center; font-size: 12px; border-top: 1px solid #F3F4F6; }
      .button { display: inline-block; background-color: #ff3b30; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 20px 0; font-weight: 500; }
      .unsubscribe { color: #9CA3AF; font-size: 11px; margin-top: 20px; }
      h1 { margin: 0; font-size: 24px; font-weight: 700; color: #1A1A1A; }
      h2 { margin: 0 0 16px 0; font-size: 20px; font-weight: 600; color: #1A1A1A; }
      p { margin: 0 0 16px 0; }
    </style>
  `;

  switch (templateConfig.template) {
    case 'welcome':
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to CribNosh! 🍽️</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.user_name}!</h2>
              <p>Welcome to CribNosh, where amazing food meets convenience!</p>
              <p>We're excited to have you join our community of food lovers.</p>
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/explore" class="button">Start Exploring</a>
              <p>Best regards,<br>The CribNosh Team</p>
            </div>
            <div class="footer">
              <p>© ${data.current_year} CribNosh. All rights reserved.</p>
              <p class="unsubscribe"><a href="${data.unsubscribe_url}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

    case 'newsletter':
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CribNosh Weekly Newsletter</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.user_name}!</h2>
              <p>Here's what's happening this week at CribNosh:</p>
              ${data.content || '<p>Check out our latest features and delicious meals!</p>'}
              <a href="${process.env.NEXT_PUBLIC_APP_URL}" class="button">Visit CribNosh</a>
            </div>
            <div class="footer">
              <p>© ${data.current_year} CribNosh. All rights reserved.</p>
              <p class="unsubscribe"><a href="${data.unsubscribe_url}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `;

    default:
      return `
        <!DOCTYPE html>
        <html>
        <head>${baseStyles}</head>
        <body>
          <div class="container">
            <div class="header">
              <h1>CribNosh Update</h1>
            </div>
            <div class="content">
              <h2>Hello ${data.user_name}!</h2>
              <p>Here's an update from CribNosh.</p>
              ${Object.entries(data).filter(([key]) => !['user_name', 'user_email', 'unsubscribe_url', 'company_name', 'company_address', 'current_year'].includes(key))
          .map(([key, value]) => `<p><strong>${key.replace(/_/g, ' ')}:</strong> ${value}</p>`).join('')}
              <p>Best regards,<br>The CribNosh Team</p>
            </div>
            <div class="footer">
              <p>© ${data.current_year} CribNosh. All rights reserved.</p>
              <p class="unsubscribe"><a href="${data.unsubscribe_url}">Unsubscribe</a></p>
            </div>
          </div>
        </body>
        </html>
      `;
  }
}
