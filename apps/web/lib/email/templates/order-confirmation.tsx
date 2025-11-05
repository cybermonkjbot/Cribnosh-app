import {
  Html,
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
  Divider,
  colors,
  SocialLinks,
  spacing,
  StatsHighlight,
  typography,
  ProgressBar,
  Timeline,
  RatingStars,
  SocialProof,
} from './components';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  specialInstructions?: string;
}

interface ChefInfo {
  name: string;
  kitchen: string;
  image: string;
}

interface OrderConfirmationEmailProps {
  orderNumber: string;
  customerName: string;
  items: OrderItem[];
  chef: ChefInfo;
  total: number;
  deliveryTime: string;
  deliveryAddress: string;
  trackingUrl: string;
  unsubscribeUrl: string;
  companyAddress: string;
  estimatedPrepTime?: number; // in minutes
  orderStatus?: 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered';
  chefRating?: number;
  orderTimeline?: Array<{
    title: string;
    description?: string;
    completed?: boolean;
  }>;
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
];

export const OrderConfirmationEmail = ({
  orderNumber,
  customerName,
  items,
  chef,
  total,
  deliveryTime,
  deliveryAddress,
  trackingUrl,
  unsubscribeUrl,
  companyAddress,
  estimatedPrepTime = 30,
  orderStatus = 'confirmed',
  chefRating = 4.8,
  orderTimeline = [
    { title: 'Order Confirmed', description: 'Your order has been received', completed: true },
    { title: 'Preparing', description: 'Your food creator is preparing your meal', completed: false },
    { title: 'Ready for Pickup', description: 'Your order is ready for delivery', completed: false },
    { title: 'Out for Delivery', description: 'Your order is on its way', completed: false },
    { title: 'Delivered', description: 'Enjoy your meal!', completed: false },
  ],
}: OrderConfirmationEmailProps) => {
  const getStatusProgress = () => {
    switch (orderStatus) {
      case 'confirmed': return 20;
      case 'preparing': return 40;
      case 'ready': return 60;
      case 'out_for_delivery': return 80;
      case 'delivered': return 100;
      default: return 20;
    }
  };

  const getCurrentStep = () => {
    switch (orderStatus) {
      case 'confirmed': return 0;
      case 'preparing': return 1;
      case 'ready': return 2;
      case 'out_for_delivery': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  return (
  <EmailWrapper
    previewText={`Your CribNosh order #${orderNumber} is confirmed!`}
    title="Order Confirmed"
  >
    <ProfessionalHeader
      title="Order Confirmed!"
      subtitle="Your delicious meal is being prepared"
      showLogo
    />
    
    <Section style={{ padding: `${spacing['2xl']} ${spacing.xl}` }}>
      <ContentText variant="large" color="text">
        Hi {customerName}!
      </ContentText>
      
      <ContentText>
        Great news! Your order has been confirmed and is being prepared with care by our amazing food creators. 
        Here's everything you need to know:
      </ContentText>

      {/* Order Summary */}
      <StatsHighlight
        value={`#${orderNumber}`}
        label="Order Number"
        description="Keep this for your records"
        color={colors.success}
      />

      <div style={{ margin: `${spacing.xl} 0`, padding: spacing.lg, backgroundColor: colors.backgroundSecondary, borderRadius: '8px' }}>
        <ContentText style={{ ...typography.heading.h3, marginBottom: spacing.lg }}>
          Your Order Details
        </ContentText>
        {items.map((item, index) => (
          <Row key={index} style={{ marginBottom: spacing.md, paddingBottom: spacing.md, borderBottom: `1px solid ${colors.borderLight}` }}>
            <Column style={{ width: '70%' }}>
              <ContentText style={{ fontWeight: '600', marginBottom: '4px' }}>
                {item.quantity}x {item.name}
              </ContentText>
              {item.specialInstructions && (
                <ContentText
                  style={{
                    ...typography.body.small,
                    color: colors.textMuted,
                    fontStyle: 'italic',
                  }}
                >
                  Note: {item.specialInstructions}
                </ContentText>
              )}
            </Column>
            <Column style={{ textAlign: 'right', width: '30%' }}>
              <ContentText style={{ fontWeight: '600' }}>
                ${(item.price * item.quantity).toFixed(2)}
              </ContentText>
            </Column>
          </Row>
        ))}
        <Divider />
        <Row style={{ marginTop: spacing.md }}>
          <Column>
            <ContentText style={{ ...typography.heading.h4, color: colors.text }}>Total</ContentText>
          </Column>
          <Column style={{ textAlign: 'right' }}>
            <ContentText style={{ ...typography.heading.h4, color: colors.primary }}>
              ${total.toFixed(2)}
            </ContentText>
          </Column>
        </Row>
      </div>

      {/* Order Progress */}
      <div style={{ margin: `${spacing.xl} 0`, padding: spacing.lg, backgroundColor: colors.backgroundSecondary, borderRadius: '8px' }}>
        <ContentText style={{ ...typography.heading.h4, marginBottom: spacing.md }}>
          Order Progress
        </ContentText>
        <ProgressBar
          progress={getStatusProgress()}
          label={`Status: ${orderStatus.replace('_', ' ').toUpperCase()}`}
          color={colors.primary}
        />
        <Timeline
          steps={orderTimeline}
          currentStep={getCurrentStep()}
        />
      </div>

      {/* Chef Information */}
      <div style={{ margin: `${spacing.xl} 0`, padding: spacing.lg, backgroundColor: colors.backgroundSecondary, borderRadius: '8px' }}>
        <Row>
          <Column style={{ width: '80px' }}>
            <img
              src={chef.image}
              alt={chef.name}
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                objectFit: 'cover',
              }}
            />
          </Column>
          <Column>
            <ContentText style={{ ...typography.heading.h4, marginBottom: '4px' }}>
              Prepared by {chef.name}
            </ContentText>
            <ContentText
              style={{
                ...typography.body.medium,
                color: colors.textSecondary,
                marginBottom: '8px',
              }}
            >
              {chef.kitchen}
            </ContentText>
            <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm, marginBottom: '8px' }}>
              <RatingStars rating={chefRating} size="small" />
              <ContentText style={{ ...typography.body.small, color: colors.textMuted, margin: '0' }}>
                {chefRating}/5 rating
              </ContentText>
            </div>
            <ContentText
              style={{
                ...typography.body.small,
                color: colors.textMuted,
              }}
            >
              Your food creator is preparing your meal with love and care
            </ContentText>
          </Column>
        </Row>
      </div>

      {/* Delivery Information */}
      <div
        style={{
          margin: `${spacing.xl} 0`,
          padding: spacing.lg,
          backgroundColor: colors.successLight,
          border: `2px solid ${colors.success}`,
          borderRadius: '8px',
        }}
      >
        <ContentText style={{ ...typography.heading.h4, color: colors.success, marginBottom: spacing.md }}>
          Delivery Information
        </ContentText>
        <ContentText style={{ marginBottom: '8px' }}>
          <strong>Expected Time:</strong> {deliveryTime}
        </ContentText>
        <ContentText>
          <strong>Address:</strong> {deliveryAddress}
        </ContentText>
      </div>

      <Section style={{ padding: `${spacing.xl} 0`, textAlign: 'center' }}>
        <EmailButton href={trackingUrl} variant="primary" size="large">
          Track Your Order
        </EmailButton>
      </Section>

      <ContentText
        style={{
          textAlign: 'center',
          color: colors.textMuted,
          ...typography.body.small,
        }}
      >
        Questions about your order? Contact your food creator directly through the CribNosh app.
      </ContentText>
    </Section>

    {/* Social Proof Section */}
    <SocialProof
      stats={[
        { value: '10,000+', label: 'Happy Customers' },
        { value: '4.9/5', label: 'Average Rating' },
        { value: '50+', label: 'Food Creators' },
      ]}
      testimonials={[
        {
          quote: "The best home-cooked meals I've ever had delivered. The food creators really care about quality!",
          author: "Sarah M.",
          role: "Regular Customer",
        },
        {
          quote: "CribNosh has changed how I think about food delivery. It's like having a personal chef!",
          author: "Michael R.",
          role: "Food Enthusiast",
        },
      ]}
    />

    <SocialLinks links={socialLinks} />
    
    <FooterSection
      unsubscribeUrl={unsubscribeUrl}
      address={companyAddress}
      companyName="CribNosh"
      additionalLinks={footerLinks}
      showDivider
    />
  </EmailWrapper>
  );
};