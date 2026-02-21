import { render } from '@react-email/render';
import React from 'react';
import { AdminNotificationEmail } from './templates/admin-notification';
import { FoodCreatorApplicationEmail } from './templates/food-creator-application';
import { FormConfirmationEmail } from './templates/form-confirmation';
import { GenericNotificationEmail } from './templates/generic-notification';
import { OrderConfirmationEmail } from './templates/order-confirmation';
import { OTPVerificationEmail } from './templates/otp-verification';
import { PromotionalEmail } from './templates/promotional';
import { WelcomeEmail } from './templates/welcome';

// Type assertion helper for render function
const renderEmail = render as (component: React.ReactElement) => Promise<string>;

// Email Preview Component for Development
export const EmailPreview = async () => {
  const sampleData = {
    welcome: {
      name: 'John Doe',
      verificationUrl: 'https://cribnosh.com/verify?token=abc123',
      unsubscribeUrl: 'https://cribnosh.com/unsubscribe',
      companyAddress: 'CribNosh – Personalized Dining, Every Time.',
    },
    orderConfirmation: {
      orderNumber: 'CN-2024-001',
      customerName: 'John Doe',
      items: [
        { name: 'Chicken Biryani', quantity: 2, price: 15.99, specialInstructions: 'Extra spicy' },
        { name: 'Naan Bread', quantity: 4, price: 3.99 },
        { name: 'Mango Lassi', quantity: 2, price: 4.99 },
      ],
      foodCreator: {
        name: 'Priya Sharma',
        kitchen: 'Priya\'s Kitchen',
        image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      },
      total: 44.95,
      deliveryTime: '7:30 PM - 8:00 PM',
      deliveryAddress: '123 Main St, City, State 12345',
      trackingUrl: 'https://cribnosh.com/track/CN-2024-001',
      unsubscribeUrl: 'https://cribnosh.com/unsubscribe',
      companyAddress: 'CribNosh – Personalized Dining, Every Time.',
      estimatedPrepTime: 25,
      orderStatus: 'preparing' as const,
      chefRating: 4.8,
    },
    otpVerification: {
      otpCode: '123456',
      recipientName: 'John Doe',
      expiryMinutes: 5,
      unsubscribeUrl: 'https://cribnosh.com/unsubscribe',
      companyAddress: 'CribNosh – Personalized Dining, Every Time.',
    },
    promotional: {
      recipientName: 'John Doe',
      promotionCode: 'WELCOME20',
      discountPercentage: 20,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
      featuredChefs: [
        {
          name: 'Maria Rodriguez',
          cuisine: 'Mexican',
          rating: 4.9,
          image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
          speciality: 'Authentic Tacos',
        },
        {
          name: 'Ahmed Hassan',
          cuisine: 'Middle Eastern',
          rating: 4.7,
          image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face',
          speciality: 'Falafel & Hummus',
        },
        {
          name: 'Li Wei',
          cuisine: 'Chinese',
          rating: 4.8,
          image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face',
          speciality: 'Dumplings',
        },
        {
          name: 'Giuseppe Romano',
          cuisine: 'Italian',
          rating: 4.9,
          image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face',
          speciality: 'Fresh Pasta',
        },
      ],
      unsubscribeUrl: 'https://cribnosh.com/unsubscribe',
      companyAddress: 'CribNosh – Personalized Dining, Every Time.',
    },
    chefApplication: {
      foodCreatorName: 'John Doe',
      nextSteps: [
        'We\'ll review your application within 24 hours',
        'Complete our food safety certification course',
        'Schedule a virtual kitchen inspection',
        'Submit required documents (ID, insurance, etc.)',
        'Start taking orders!',
      ],
      timeline: '2-3 business days',
      documentsNeeded: [
        'Government-issued ID',
        'Food safety certificate',
        'Kitchen insurance',
        'Bank account details',
      ],
      contactEmail: 'chefs@cribnosh.com',
      unsubscribeUrl: 'https://cribnosh.com/unsubscribe',
      companyAddress: 'CribNosh – Personalized Dining, Every Time.',
    },
    genericNotification: {
      title: 'New Feature Alert!',
      message: 'We\'ve just launched our new meal planning feature. Now you can schedule your favorite meals in advance and never miss out on your preferred food creators\' specials.',
      unsubscribeUrl: 'https://cribnosh.com/unsubscribe',
      address: 'CribNosh – Personalized Dining, Every Time.',
    },
    formConfirmation: {
      formName: 'Contact Form',
      customerName: 'John Doe',
      summary: 'I\'m interested in becoming a food creator on CribNosh. I have 10 years of experience cooking authentic Indian cuisine and would love to share my recipes with the community.',
      nextSteps: 'Our team will review your message and get back to you within 24 hours.',
      actionUrl: 'https://cribnosh.com/food-creator-application',
      actionText: 'Apply to be a Food Creator',
      unsubscribeUrl: 'https://cribnosh.com/unsubscribe',
      companyAddress: 'CribNosh – Personalized Dining, Every Time.',
    },
    adminNotification: {
      title: 'High Priority Alert',
      details: 'New driver application received from jane.doe@email.com. Vehicle: Honda Civic, Experience: 2 years. Please review and process within 24 hours.',
      companyAddress: 'CribNosh – Personalized Dining, Every Time.',
    },
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>CribNosh Email Templates Preview</h1>
      <p>This page shows all available email templates with sample data for development and testing.</p>

      <div style={{ marginBottom: '40px' }}>
        <h2>Welcome Email</h2>
        <div dangerouslySetInnerHTML={{
          __html: await render(WelcomeEmail(sampleData.welcome))
        }} />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>Order Confirmation Email</h2>
        <div dangerouslySetInnerHTML={{
          __html: await render(OrderConfirmationEmail(sampleData.orderConfirmation))
        }} />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>OTP Verification Email</h2>
        <div dangerouslySetInnerHTML={{
          __html: String(await renderEmail(OTPVerificationEmail(sampleData.otpVerification) as React.ReactElement))
        }} />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>Promotional Email</h2>
        <div dangerouslySetInnerHTML={{
          __html: String(await renderEmail(PromotionalEmail(sampleData.promotional) as React.ReactElement))
        }} />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>Food Creator Application Email</h2>
        <div dangerouslySetInnerHTML={{
          __html: await render(FoodCreatorApplicationEmail(sampleData.chefApplication))
        }} />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>Generic Notification Email</h2>
        <div dangerouslySetInnerHTML={{
          __html: await render(GenericNotificationEmail(sampleData.genericNotification))
        }} />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>Form Confirmation Email</h2>
        <div dangerouslySetInnerHTML={{
          __html: await render(FormConfirmationEmail(sampleData.formConfirmation))
        }} />
      </div>

      <div style={{ marginBottom: '40px' }}>
        <h2>Admin Notification Email</h2>
        <div dangerouslySetInnerHTML={{
          __html: await render(AdminNotificationEmail(sampleData.adminNotification))
        }} />
      </div>
    </div>
  );
};

// Utility function to render any email template
export const renderEmailTemplate = async (templateName: string, data: any) => {
  const templates: Record<string, any> = {
    welcome: WelcomeEmail,
    orderConfirmation: OrderConfirmationEmail,
    otpVerification: OTPVerificationEmail,
    promotional: PromotionalEmail,
    chefApplication: FoodCreatorApplicationEmail,
    genericNotification: GenericNotificationEmail,
    formConfirmation: FormConfirmationEmail,
    adminNotification: AdminNotificationEmail,
  };

  const Template = templates[templateName];
  if (!Template) {
    throw new Error(`Template ${templateName} not found`);
  }

  return await render(Template(data));
};

// Email template validation utility
export const validateEmailTemplate = async (templateName: string, data: any) => {
  try {
    const html = await renderEmailTemplate(templateName, data);

    // Basic validation checks
    const checks = {
      hasTitle: html.includes('<title>'),
      hasPreview: html.includes('<preview>'),
      hasUnsubscribeLink: html.includes('unsubscribe'),
      hasCompanyName: html.includes('CribNosh'),
      hasProperStructure: html.includes('<html>') && html.includes('<body>'),
      hasResponsiveMeta: html.includes('viewport'),
    };

    const passedChecks = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    return {
      valid: passedChecks === totalChecks,
      score: (passedChecks / totalChecks) * 100,
      checks,
      html,
    };
  } catch (error) {
    return {
      valid: false,
      score: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
      checks: {},
      html: '',
    };
  }
};

export default EmailPreview;
