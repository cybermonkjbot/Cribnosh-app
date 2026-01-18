import React from 'react';
import { emailUrls } from '../utils/urls';
import {
  Html as EmailHtml,
  Head,
  Preview,
  Container,
  Section,
  Row,
  Column,
} from '@react-email/components';
import {
  EmailWrapper,
  ProfessionalHeader,
  ContentText,
  EmailButton,
  FooterSection,
  FeatureCard,
  CallToActionSection,
  SocialLinks,
  colors,
  spacing,
  typography,
  ProgressBar,
  Timeline,
  RatingStars,
  StatsHighlight,
  Alert,
} from './components';

interface OrderUpdateEmailProps {
  orderNumber: string;
  customerName: string;
  updateType: 'status_change' | 'delivery_update' | 'delay_notification' | 'ready_for_pickup' | 'delivered';
  currentStatus: string;
  previousStatus?: string;
  estimatedTime?: string;
  actualTime?: string;
  chef: {
    name: string;
    kitchen: string;
    image: string;
    phone?: string;
  };
  deliveryInfo?: {
    driverName?: string;
    driverPhone?: string;
    vehicleInfo?: string;
    trackingUrl: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    status: 'preparing' | 'ready' | 'out_for_delivery' | 'delivered';
  }>;
  deliveryAddress: string;
  specialInstructions?: string;
  nextSteps?: string[];
  supportContact?: {
    phone: string;
    email: string;
    chatUrl: string;
  };
  unsubscribeUrl: string;
  companyAddress: string;
}

const socialLinks = [
  {
    href: 'https://x.com/CribNosh?t=YDYNvB1ZIaVe0IX5NDe9YQ&s=09',
    icon: 'https://cdn-icons-png.flaticon.com/512/733/733579.png',
    alt: 'X (Twitter)',
    label: 'X (Twitter)',
  },
  {
    href: 'https://www.instagram.com/cribnoshuk?igsh=MXM3NWxsOHpsbDB1bA==',
    icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
    alt: 'Instagram',
    label: 'Instagram',
  },
];

const footerLinks = [
  { href: 'emailUrls.support()', text: 'Support' },
  { href: 'emailUrls.faq()', text: 'FAQ' },
  { href: 'emailUrls.track()', text: 'Track Order' },
];

export const OrderUpdateEmail: React.FC<OrderUpdateEmailProps> = ({
  orderNumber,
  customerName,
  updateType,
  currentStatus,
  previousStatus,
  estimatedTime,
  actualTime,
  chef,
  deliveryInfo,
  items,
  deliveryAddress,
  specialInstructions,
  nextSteps = [],
  supportContact,
  unsubscribeUrl,
  companyAddress,
}) => {
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return colors.info;
      case 'preparing': return colors.warning;
      case 'ready': return colors.success;
      case 'out_for_delivery': return colors.primary;
      case 'delivered': return colors.success;
      case 'delayed': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed': return 'FileText';
      case 'preparing': return 'ChefHat';
      case 'ready': return 'Check';
      case 'out_for_delivery': return 'Truck';
      case 'delivered': return 'PartyPopper';
      case 'delayed': return 'Clock';
      default: return 'Clipboard';
    }
  };

  const getUpdateTitle = () => {
    switch (updateType) {
      case 'status_change': return `Order Update: ${currentStatus}`;
      case 'delivery_update': return 'Delivery Update';
      case 'delay_notification': return 'Order Delay Notification';
      case 'ready_for_pickup': return 'Your Order is Ready!';
      case 'delivered': return 'Order Delivered Successfully!';
      default: return 'Order Update';
    }
  };

  const getUpdateMessage = () => {
    switch (updateType) {
      case 'status_change': 
        return `Your order status has been updated from "${previousStatus}" to "${currentStatus}".`;
      case 'delivery_update': 
        return 'We have an update about your delivery.';
      case 'delay_notification': 
        return 'We apologize for the delay in your order. Here\'s what\'s happening:';
      case 'ready_for_pickup': 
        return 'Great news! Your order is ready and waiting for you.';
      case 'delivered': 
        return 'Your order has been successfully delivered! We hope you enjoy your meal.';
      default: 
        return 'We have an update about your order.';
    }
  };

  const getProgressPercentage = () => {
    switch (currentStatus.toLowerCase()) {
      case 'confirmed': return 20;
      case 'preparing': return 40;
      case 'ready': return 60;
      case 'out_for_delivery': return 80;
      case 'delivered': return 100;
      default: return 20;
    }
  };

  const getTimelineSteps = () => {
    const steps = [
      { title: 'Order Confirmed', description: 'Your order has been received', completed: true },
      { title: 'Preparing', description: 'Your food creator is preparing your meal', completed: currentStatus === 'preparing' || currentStatus === 'ready' || currentStatus === 'out_for_delivery' || currentStatus === 'delivered' },
      { title: 'Ready', description: 'Your order is ready for delivery', completed: currentStatus === 'ready' || currentStatus === 'out_for_delivery' || currentStatus === 'delivered' },
      { title: 'Out for Delivery', description: 'Your order is on its way', completed: currentStatus === 'out_for_delivery' || currentStatus === 'delivered' },
      { title: 'Delivered', description: 'Enjoy your meal!', completed: currentStatus === 'delivered' },
    ];
    return steps;
  };

  const getCurrentStep = () => {
    switch (currentStatus.toLowerCase()) {
      case 'confirmed': return 0;
      case 'preparing': return 1;
      case 'ready': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  return (
    <EmailHtml>
      <Head />
      <Preview>{getUpdateTitle()} - Order #{orderNumber}</Preview>
      <EmailWrapper
        previewText={`${getUpdateTitle()} - Order #${orderNumber}`}
        title="Order Update"
      >
        <ProfessionalHeader
          title={`${getStatusIcon(currentStatus)} ${getUpdateTitle()}`}
          subtitle={`Order #${orderNumber}`}
          showLogo
          backgroundColor={getStatusColor(currentStatus)}
        />

        <Section style={{ padding: `${spacing['2xl']} ${spacing.xl}` }}>
          <ContentText variant="large" color="text">
            Hi {customerName}!
          </ContentText>

          <ContentText>
            {getUpdateMessage()}
          </ContentText>

          {/* Status Highlight */}
          <StatsHighlight
            value={currentStatus.replace('_', ' ').toUpperCase()}
            label="Current Status"
            description={estimatedTime ? `Expected: ${estimatedTime}` : actualTime ? `Completed: ${actualTime}` : ''}
            color={getStatusColor(currentStatus)}
          />

          {/* Progress Bar */}
          <ProgressBar
            progress={getProgressPercentage()}
            label="Order Progress"
            color={getStatusColor(currentStatus)}
          />

          {/* Timeline */}
          <Timeline
            steps={getTimelineSteps()}
            currentStep={getCurrentStep()}
          />

          {/* Delay Alert */}
          {updateType === 'delay_notification' && (
            <Alert variant="warning" title="Delay Notice">
              We apologize for any inconvenience. Our team is working hard to get your order to you as quickly as possible.
            </Alert>
          )}

          {/* Items Status */}
          <FeatureCard
            icon="Utensils"
            title="Order Items Status"
            description="Here's the current status of each item in your order"
            highlight
          >
            <div style={{ marginTop: spacing.md }}>
              {items.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: spacing.sm,
                  backgroundColor: colors.backgroundSecondary,
                  borderRadius: '6px',
                  marginBottom: spacing.xs,
                }}>
                  <div>
                    <ContentText style={{ ...typography.body.small, fontWeight: '600', margin: '0' }}>
                      {item.quantity}x {item.name}
                    </ContentText>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: spacing.xs }}>
                    <span style={{ fontSize: '12px' }}>
                      {getStatusIcon(item.status)}
                    </span>
                    <ContentText style={{ 
                      ...typography.body.xs, 
                      color: getStatusColor(item.status),
                      margin: '0',
                      textTransform: 'capitalize'
                    }}>
                      {item.status.replace('_', ' ')}
                    </ContentText>
                  </div>
                </div>
              ))}
            </div>
          </FeatureCard>

          {/* Chef Information */}
          <FeatureCard
            icon={chef.image}
            title={`Prepared by ${chef.name}`}
            description={chef.kitchen}
          >
            {chef.phone && (
              <div style={{ marginTop: spacing.sm }}>
                <ContentText style={{ ...typography.body.small, color: colors.textMuted, margin: '0' }}>
                  {chef.phone}
                </ContentText>
              </div>
            )}
          </FeatureCard>

          {/* Delivery Information */}
          {deliveryInfo && (
            <FeatureCard
              icon="Truck"
              title="Delivery Information"
              description="Your delivery details"
            >
              <div style={{ marginTop: spacing.sm }}>
                {deliveryInfo.driverName && (
                  <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                    <strong>Driver:</strong> {deliveryInfo.driverName}
                  </ContentText>
                )}
                {deliveryInfo.driverPhone && (
                  <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                    <strong>Phone:</strong> {deliveryInfo.driverPhone}
                  </ContentText>
                )}
                {deliveryInfo.vehicleInfo && (
                  <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                    <strong>Vehicle:</strong> {deliveryInfo.vehicleInfo}
                  </ContentText>
                )}
                <ContentText style={{ ...typography.body.small, margin: '0' }}>
                  <strong>Address:</strong> {deliveryAddress}
                </ContentText>
                {specialInstructions && (
                  <ContentText style={{ ...typography.body.small, margin: '4px 0 0 0', fontStyle: 'italic' }}>
                    <strong>Special Instructions:</strong> {specialInstructions}
                  </ContentText>
                )}
              </div>
            </FeatureCard>
          )}

          {/* Next Steps */}
          {nextSteps.length > 0 && (
            <FeatureCard
              icon="Clipboard"
              title="What's Next?"
              description="Here's what happens next with your order"
            >
              <div style={{ marginTop: spacing.md }}>
                {nextSteps.map((step, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: spacing.sm,
                  }}>
                    <div style={{
                      backgroundColor: colors.primary,
                      color: colors.background,
                      borderRadius: '50%',
                      width: '20px',
                      height: '20px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      marginRight: spacing.sm,
                      flexShrink: 0,
                      marginTop: '2px',
                    }}>
                      {index + 1}
                    </div>
                    <ContentText style={{ margin: '0', ...typography.body.small }}>
                      {step}
                    </ContentText>
                  </div>
                ))}
              </div>
            </FeatureCard>
          )}

          {/* Support Contact */}
          {supportContact && (
            <Alert variant="info" title="Need Help?">
              <div style={{ marginTop: spacing.sm }}>
                <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                  Call us: {supportContact.phone}
                </ContentText>
                <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                  Email us: {supportContact.email}
                </ContentText>
                <ContentText style={{ ...typography.body.small, margin: '0' }}>
                  Live chat: <a href={supportContact.chatUrl} style={{ color: colors.link }}>Start Chat</a>
                </ContentText>
              </div>
            </Alert>
          )}

          {/* Call to Action */}
          {deliveryInfo?.trackingUrl && (
            <CallToActionSection
              title="Track Your Order"
              description="Get real-time updates on your order's progress"
              buttonText="Track Order"
              buttonUrl={deliveryInfo.trackingUrl}
              secondaryButtonText="Contact Support"
              secondaryButtonUrl="emailUrls.support()"
            />
          )}
        </Section>

        <SocialLinks links={socialLinks} />
        
        <FooterSection
          unsubscribeUrl={unsubscribeUrl}
          address={companyAddress}
          companyName="CribNosh"
          additionalLinks={footerLinks}
          showDivider
        />
      </EmailWrapper>
    </EmailHtml>
  );
};

export default OrderUpdateEmail;
