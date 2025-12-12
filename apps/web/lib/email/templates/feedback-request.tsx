import {
  Column,
  Head,
  Html,
  Preview,
  Row,
  Section
} from '@react-email/components';
import React from 'react';
import {
  Alert,
  CallToActionSection,
  ContentText,
  EmailWrapper,
  FeatureCard,
  FooterSection,
  InteractiveButton,
  ProfessionalHeader,
  RatingStars,
  SocialLinks,
  SocialProof,
  colors,
  spacing,
  typography
} from './components';

interface FeedbackRequestEmailProps {
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
  unsubscribeUrl: string;
  companyAddress: string;
  incentive?: {
    type: 'discount' | 'points' | 'free_item';
    value: string;
    description: string;
    expiryDate: string;
  };
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
  { href: 'emailUrls.reviews()', text: 'Reviews' },
];

export const FeedbackRequestEmail: React.FC<FeedbackRequestEmailProps> = ({
  customerName,
  orderNumber,
  orderDate,
  chef,
  items,
  total,
  feedbackUrl,
  reviewUrl,
  ratingUrl,
  unsubscribeUrl,
  companyAddress,
  incentive,
}) => {
  const getIncentiveIcon = () => {
    switch (incentive?.type) {
      case 'discount': return 'PoundSterling';
      case 'points': return 'Star';
      case 'free_item': return 'Gift';
      default: return 'Gift';
    }
  };

  const getIncentiveColor = () => {
    switch (incentive?.type) {
      case 'discount': return colors.success;
      case 'points': return colors.warning;
      case 'free_item': return colors.primary;
      default: return colors.primary;
    }
  };

  return (
    <Html>
      <Head />
      <Preview>How was your CribNosh experience? Share your feedback and earn rewards!</Preview>
      <EmailWrapper
        previewText="How was your CribNosh experience? Share your feedback and earn rewards!"
        title="Share Your Feedback"
      >
        <ProfessionalHeader
          title="How Was Your Experience?"
          subtitle="Your feedback helps us improve and rewards you too!"
          showLogo
          backgroundColor={colors.primary}
        />

        <Section style={{ padding: `${spacing['2xl']} ${spacing.xl}` }}>
          <ContentText variant="large" color="text">
            Hi {customerName}! 👋
          </ContentText>

          <ContentText>
            We hope you enjoyed your recent order from <strong>{chef.name}</strong>!
            Your feedback is incredibly valuable to us and helps us improve the experience for everyone.
          </ContentText>

          {/* Order Summary */}
          <FeatureCard
            icon="📋"
            title="Your Order Summary"
            description={`Order #${orderNumber} • ${orderDate}`}
            highlight
          >
            <div style={{ marginTop: spacing.md }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.md }}>
                <img
                  src={chef.image}
                  alt={chef.name}
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    marginRight: spacing.sm,
                  }}
                />
                <div>
                  <ContentText style={{ ...typography.body.small, fontWeight: '600', margin: '0 0 2px 0' }}>
                    {chef.name}
                  </ContentText>
                  <ContentText style={{ ...typography.body.xs, color: colors.textMuted, margin: '0' }}>
                    {chef.kitchen} • {chef.cuisine}
                  </ContentText>
                </div>
              </div>

              {items.map((item, index) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: spacing.xs,
                  borderBottom: `1px solid ${colors.borderLight}`,
                }}>
                  <ContentText style={{ ...typography.body.small, margin: '0' }}>
                    {item.quantity}x {item.name}
                  </ContentText>
                  <ContentText style={{ ...typography.body.small, fontWeight: '600', margin: '0' }}>
                    ${(item.price * item.quantity).toFixed(2)}
                  </ContentText>
                </div>
              ))}

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: spacing.sm,
                backgroundColor: colors.backgroundSecondary,
                borderRadius: '6px',
                marginTop: spacing.sm,
              }}>
                <ContentText style={{ ...typography.body.medium, fontWeight: '600', margin: '0' }}>
                  Total
                </ContentText>
                <ContentText style={{ ...typography.body.medium, fontWeight: '600', color: colors.primary, margin: '0' }}>
                  ${total.toFixed(2)}
                </ContentText>
              </div>
            </div>
          </FeatureCard>

          {/* Incentive Offer */}
          {incentive && (
            <Alert variant="success" title={`${getIncentiveIcon()} Special Reward!`}>
              <div style={{ marginTop: spacing.sm }}>
                <ContentText style={{ ...typography.body.medium, fontWeight: '600', margin: '0 0 4px 0' }}>
                  {incentive.value}
                </ContentText>
                <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                  {incentive.description}
                </ContentText>
                <ContentText style={{ ...typography.body.xs, color: colors.textMuted, margin: '0' }}>
                  Valid until {new Date(incentive.expiryDate).toLocaleDateString()}
                </ContentText>
              </div>
            </Alert>
          )}

          {/* Quick Rating */}
          <FeatureCard
            icon="Star"
            title="Quick Rating"
            description="Rate your overall experience (1-5 stars)"
          >
            <div style={{ textAlign: 'center', marginTop: spacing.md }}>
              <div style={{ marginBottom: spacing.sm }}>
                <RatingStars rating={0} size="large" showValue={false} />
              </div>
              <ContentText style={{ ...typography.body.small, color: colors.textMuted, margin: '0' }}>
                Click the stars to rate your experience
              </ContentText>
            </div>
          </FeatureCard>

          {/* Feedback Options */}
          <Row style={{ margin: `${spacing.xl} 0` }}>
            <Column style={{ width: '50%', padding: '0 8px' }}>
              <FeatureCard
                icon="💬"
                title="Share Feedback"
                description="Tell us about your experience"
              >
                <div style={{ textAlign: 'center', marginTop: spacing.md }}>
                  <InteractiveButton
                    href={feedbackUrl}
                    variant="primary"
                    size="medium"
                    fullWidth
                    trackingId="feedback_button"
                  >
                    Share Feedback
                  </InteractiveButton>
                </div>
              </FeatureCard>
            </Column>
            <Column style={{ width: '50%', padding: '0 8px' }}>
              <FeatureCard
                icon="📝"
                title="Write Review"
                description="Help others discover great food"
              >
                <div style={{ textAlign: 'center', marginTop: spacing.md }}>
                  <InteractiveButton
                    href={reviewUrl}
                    variant="outline"
                    size="medium"
                    fullWidth
                    trackingId="review_button"
                  >
                    Write Review
                  </InteractiveButton>
                </div>
              </FeatureCard>
            </Column>
          </Row>

          {/* Social Proof */}
          <SocialProof
            stats={[
              { value: '4.9/5', label: 'Average Rating' },
              { value: '10,000+', label: 'Reviews' },
              { value: '95%', label: 'Would Recommend' },
            ]}
            testimonials={[
              {
                quote: "The food was absolutely amazing! The chef really knows how to bring out the authentic flavors.",
                author: "Sarah M.",
                role: "Regular Customer",
              },
              {
                quote: "CribNosh has changed how I think about food delivery. Every meal feels like it was made with love.",
                author: "Michael R.",
                role: "Food Enthusiast",
              },
            ]}
          />

          {/* Why Feedback Matters */}
          <FeatureCard
            icon="🤝"
            title="Why Your Feedback Matters"
            description="Your input helps us create better experiences"
          >
            <div style={{ marginTop: spacing.md }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: spacing.sm }}>
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
                  ✓
                </div>
                <ContentText style={{ margin: '0', ...typography.body.small }}>
                  Helps food creators improve their recipes and service
                </ContentText>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: spacing.sm }}>
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
                  ✓
                </div>
                <ContentText style={{ margin: '0', ...typography.body.small }}>
                  Guides other customers to discover amazing food
                </ContentText>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: spacing.sm }}>
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
                  ✓
                </div>
                <ContentText style={{ margin: '0', ...typography.body.small }}>
                  Earns you rewards and exclusive offers
                </ContentText>
              </div>
            </div>
          </FeatureCard>

          {/* Call to Action */}
          <CallToActionSection
            title="Ready to Share Your Experience?"
            description="It only takes 2 minutes and helps our community grow stronger"
            buttonText="Share Feedback Now"
            buttonUrl={feedbackUrl}
            secondaryButtonText="Skip This Time"
            secondaryButtonUrl="emailUrls.order()s"
          />

          {/* Alternative Contact */}
          <Alert variant="info" title="Prefer to Contact Us Directly?">
            <div style={{ marginTop: spacing.sm }}>
              <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                📧 Email: feedback@cribnosh.com
              </ContentText>
              <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                📞 Phone: 1-800-CRIBNOSH
              </ContentText>
              <ContentText style={{ ...typography.body.small, margin: '0' }}>
                💬 Live Chat: Available 24/7 in our app
              </ContentText>
            </div>
          </Alert>
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
    </Html>
  );
};

export default FeedbackRequestEmail;
