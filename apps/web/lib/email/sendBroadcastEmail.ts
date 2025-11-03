import { Resend } from 'resend';
import { ErrorFactory, ErrorCode } from '../errors';

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'Missing RESEND_API_KEY environment variable. Please set it in your environment.');
}
const resend = new Resend(apiKey);

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
      
      return await resend.emails.send({
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
      
      return await resend.emails.send({
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
      body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f4f4f4; }
      .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
      .header { background: linear-gradient(135deg, #ff6b6b, #ee5a24); color: white; padding: 30px; text-align: center; }
      .content { padding: 30px; }
      .footer { background-color: #2c3e50; color: white; padding: 20px; text-align: center; font-size: 12px; }
      .button { display: inline-block; background-color: #ff6b6b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
      .unsubscribe { color: #95a5a6; font-size: 11px; }
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
