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
  CallToActionSection,
  SocialLinks,
  colors,
  spacing,
  typography,
  ProgressBar,
  CountdownTimer,
  RatingStars,
  SocialProof,
  StatsHighlight,
  InteractiveButton,
} from './components';

interface PromotionalEmailProps {
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
  { href: 'emailUrls.terms()', text: 'Terms' },
];

export const PromotionalEmail: React.FC<PromotionalEmailProps> = ({
  recipientName,
  promotionCode,
  discountPercentage,
  expiryDate,
  featuredChefs,
  unsubscribeUrl,
  companyAddress,
}) => {
  return (
    <EmailHtml>
      <Head />
      <Preview>Exclusive {discountPercentage.toString()}% off your first CribNosh order!</Preview>
      <EmailWrapper
        previewText={`Exclusive ${discountPercentage.toString()}% off your first CribNosh order!`}
        title="Special Offer"
      >
        <ProfessionalHeader
          title="Special Offer Just for You!"
          subtitle="Exclusive discount on your first CribNosh order"
          showLogo
          backgroundColor={colors.primary}
        />
        
        <Section style={{ padding: `${spacing['2xl']} ${spacing.xl}` }}>
          <ContentText variant="large" color="text">
            Hi {recipientName}!
          </ContentText>
          
          <ContentText>
            We're excited to offer you an exclusive {discountPercentage}% discount on your first CribNosh order! 
            This is our way of welcoming you to our community of food lovers.
          </ContentText>

          {/* Countdown Timer */}
          <CountdownTimer
            targetDate={expiryDate}
            label="Offer expires in"
          />

          {/* Promotion Code Highlight */}
          <StatsHighlight
            value={promotionCode}
            label="Your Promo Code"
            description={`Save ${discountPercentage}% on your first order`}
            color={colors.primary}
          />

          {/* How to Use Instructions */}
          <div style={{ margin: `${spacing.xl} 0`, padding: spacing.lg, backgroundColor: colors.backgroundSecondary, borderRadius: '8px', border: `2px solid ${colors.primary}` }}>
            <ContentText style={{ ...typography.heading.h4, margin: '0 0 8px 0' }}>
              How to Use Your Code
            </ContentText>
            <ContentText variant="small" color="textSecondary" style={{ marginBottom: spacing.md }}>
              Follow these simple steps to claim your discount
            </ContentText>
            <div style={{ marginTop: spacing.md }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.sm }}>
                <div style={{
                  backgroundColor: colors.primary,
                  color: colors.background,
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginRight: spacing.sm,
                }}>
                  1
                </div>
                <ContentText style={{ margin: '0', ...typography.body.small }}>
                  Browse our amazing food creators
                </ContentText>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.sm }}>
                <div style={{
                  backgroundColor: colors.primary,
                  color: colors.background,
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginRight: spacing.sm,
                }}>
                  2
                </div>
                <ContentText style={{ margin: '0', ...typography.body.small }}>
                  Add items to your cart
                </ContentText>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.sm }}>
                <div style={{
                  backgroundColor: colors.primary,
                  color: colors.background,
                  borderRadius: '50%',
                  width: '24px',
                  height: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginRight: spacing.sm,
                }}>
                  3
                </div>
                <ContentText style={{ margin: '0', ...typography.body.small }}>
                  Enter code <strong>{promotionCode}</strong> at checkout
                </ContentText>
              </div>
            </div>
          </div>

          {/* Featured Chefs */}
          <ContentText style={{ ...typography.heading.h3, textAlign: 'center', margin: `${spacing.xl} 0 ${spacing.lg} 0` }}>
            Meet Our Featured Food Creators
          </ContentText>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg }}>
            {featuredChefs.slice(0, 2).map((chef, index) => (
              <div key={index} style={{ flex: '1', minWidth: '250px', textAlign: 'center', padding: spacing.lg, backgroundColor: colors.backgroundSecondary, borderRadius: '8px' }}>
                <img
                  src={chef.image}
                  alt={chef.name}
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    margin: '0 auto 12px auto',
                    display: 'block'
                  }}
                />
                <ContentText style={{ ...typography.heading.h4, margin: '0 0 8px 0' }}>
                  {chef.name}
                </ContentText>
                <ContentText variant="small" color="textSecondary" style={{ marginBottom: spacing.sm }}>
                  {chef.cuisine} • {chef.speciality}
                </ContentText>
                <div style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                  <RatingStars rating={chef.rating} size="small" />
                </div>
              </div>
            ))}
          </div>

          {featuredChefs.length > 2 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md }}>
              {featuredChefs.slice(2, 4).map((chef, index) => (
                <div key={index} style={{ flex: '1', minWidth: '250px', textAlign: 'center', padding: spacing.lg, backgroundColor: colors.backgroundSecondary, borderRadius: '8px' }}>
                  <img
                    src={chef.image}
                    alt={chef.name}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      margin: '0 auto 12px auto',
                      display: 'block'
                    }}
                  />
                  <ContentText style={{ ...typography.heading.h4, margin: '0 0 8px 0' }}>
                    {chef.name}
                  </ContentText>
                  <ContentText variant="small" color="textSecondary" style={{ marginBottom: spacing.sm }}>
                    {chef.cuisine} • {chef.speciality}
                  </ContentText>
                  <div style={{ marginTop: spacing.sm, textAlign: 'center' }}>
                    <RatingStars rating={chef.rating} size="small" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Call to Action */}
          <CallToActionSection
            title="Ready to Experience Authentic Home Cooking?"
            description={`Use code ${promotionCode} and save ${discountPercentage}% on your first order. 
            Discover amazing food creators in your area and taste the difference of home-cooked meals.`}
            buttonText="Start Ordering Now"
            buttonUrl="emailUrls.order()"
            secondaryButtonText="Browse Creators"
            secondaryButtonUrl="emailUrls.creators()"
          />

          {/* Social Proof */}
          <SocialProof
            stats={[
              { value: '10,000+', label: 'Happy Customers' },
              { value: '4.9/5', label: 'Average Rating' },
              { value: '50+', label: 'Food Creators' },
              { value: '15+', label: 'Cuisine Types' },
            ]}
            testimonials={[
              {
                quote: "CribNosh has completely changed my relationship with food delivery. Every meal feels like it was made with love.",
                author: "Emma L.",
                role: "Food Blogger",
              },
              {
                quote: "The quality and authenticity of the food is incredible. It's like having a personal chef from around the world!",
                author: "David K.",
                role: "Regular Customer",
              },
            ]}
          />

          {/* Terms and Conditions */}
          <Container style={{
            backgroundColor: colors.backgroundSecondary,
            padding: spacing.lg,
            borderRadius: '8px',
            margin: `${spacing.xl} 0`,
          }}>
            <ContentText style={{ ...typography.body.small, color: colors.textMuted, margin: '0' }}>
              <strong>Terms & Conditions:</strong> This offer is valid for first-time customers only. 
              Discount applies to food items only, not delivery fees. Offer expires on {new Date(expiryDate).toLocaleDateString()}. 
              Cannot be combined with other offers. CribNosh reserves the right to modify or cancel this promotion at any time.
            </ContentText>
          </Container>
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

export default PromotionalEmail;
