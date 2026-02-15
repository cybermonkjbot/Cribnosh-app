import { render } from '@react-email/render';
import type React from 'react';
import { WelcomeEmail } from './templates/welcome';
import { OrderConfirmationEmail } from './templates/order-confirmation';
import { FoodCreatorRecommendationsEmail } from './templates/food-creator-recommendations';
import { FormConfirmationEmail } from './templates/form-confirmation';
import { FoodCreatorApplicationEmail } from './templates/food-creator-application';
import { GenericNotificationEmail } from './templates/generic-notification';
import { AdminNotificationEmail } from './templates/admin-notification';
import { OTPVerificationEmail } from './templates/otp-verification';

// Type assertion helper for render function
const renderEmail = render as (component: React.ReactElement) => Promise<string>;

export class EmailTemplateRenderer {
  private companyAddress: string;
  private defaultUnsubscribeUrl: string;

  constructor(config: {
    companyAddress: string;
    defaultUnsubscribeUrl: string;
  }) {
    this.companyAddress = config.companyAddress;
    this.defaultUnsubscribeUrl = config.defaultUnsubscribeUrl;
  }

  async renderWelcomeEmail(params: {
    name: string;
    verificationUrl: string;
    unsubscribeUrl?: string;
  }): Promise<string> {
    const html = render(
      WelcomeEmail({
        name: params.name,
        verificationUrl: params.verificationUrl,
        unsubscribeUrl: params.unsubscribeUrl || this.defaultUnsubscribeUrl,
        companyAddress: this.companyAddress,
      })
    );

    return html;
  }

  async renderOrderConfirmationEmail(params: {
    orderNumber: string;
    customerName: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      specialInstructions?: string;
    }>;
    foodCreator: {
      name: string;
      kitchen: string;
      image: string;
    };
    total: number;
    deliveryTime: string;
    deliveryAddress: string;
    trackingUrl: string;
    unsubscribeUrl?: string;
  }): Promise<string> {
    const html = render(
      OrderConfirmationEmail({
        ...params,
        unsubscribeUrl: params.unsubscribeUrl || this.defaultUnsubscribeUrl,
        companyAddress: this.companyAddress,
      })
    );

    return html;
  }

  async renderFoodCreatorRecommendationsEmail(params: {
    customerName: string;
    foodCreators: Array<{
      name: string;
      image: string;
      kitchen: string;
      specialties: string[];
      rating: number;
      ordersCompleted: number;
    }>;
    topDishes: Array<{
      name: string;
      description: string;
      image: string;
      price: number;
      dietaryInfo: string[];
    }>;
    browseUrl: string;
    unsubscribeUrl?: string;
  }): Promise<string> {
    const html = render(
      FoodCreatorRecommendationsEmail({
        ...params,
        unsubscribeUrl: params.unsubscribeUrl || this.defaultUnsubscribeUrl,
        companyAddress: this.companyAddress,
      })
    );

    return html;
  }

  async renderFormConfirmationEmail(params: {
    formName: string;
    customerName: string;
    summary: string;
    nextSteps: string;
    actionUrl?: string;
    actionText?: string;
    unsubscribeUrl?: string;
  }): Promise<string> {
    return render(
      FormConfirmationEmail({
        ...params,
        unsubscribeUrl: params.unsubscribeUrl || this.defaultUnsubscribeUrl,
        companyAddress: this.companyAddress,
      })
    );
  }

  async renderFoodCreatorApplicationEmail(params: {
    foodCreatorName: string;
    nextSteps: string[];
    timeline: string;
    documentsNeeded?: string[];
    contactEmail: string;
    unsubscribeUrl?: string;
  }): Promise<string> {
    return render(
      FoodCreatorApplicationEmail({
        ...params,
        unsubscribeUrl: params.unsubscribeUrl || this.defaultUnsubscribeUrl,
        companyAddress: this.companyAddress,
      })
    );
  }

  async renderGenericNotificationEmail(params: {
    title: string;
    message: string;
    unsubscribeUrl?: string;
    address?: string;
  }): Promise<string> {
    return render(
      GenericNotificationEmail({
        title: params.title,
        message: params.message,
        unsubscribeUrl: params.unsubscribeUrl || this.defaultUnsubscribeUrl,
        address: params.address || this.companyAddress,
      })
    );
  }

  async renderAdminNotificationEmail(params: {
    title: string;
    details: string;
    companyAddress?: string;
  }): Promise<string> {
    return render(
      AdminNotificationEmail({
        title: params.title,
        details: params.details,
        companyAddress: params.companyAddress || this.companyAddress,
      })
    );
  }

  async renderOTPVerificationEmail(params: {
    otpCode: string;
    recipientName?: string;
    expiryMinutes?: number;
    unsubscribeUrl?: string;
  }): Promise<string> {
    return await renderEmail(
      OTPVerificationEmail({
        otpCode: params.otpCode,
        recipientName: params.recipientName || 'there',
        expiryMinutes: params.expiryMinutes || 5,
        unsubscribeUrl: params.unsubscribeUrl || this.defaultUnsubscribeUrl,
        companyAddress: this.companyAddress,
      }) as React.ReactElement
    );
  }
}