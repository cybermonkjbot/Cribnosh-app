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
  CallToActionSection,
  SocialLinks,
  colors,
  spacing,
  typography,
} from './components';
import { emailUrls } from '../utils/urls';

interface WelcomeEmailProps {
  name: string;
  verificationUrl: string;
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
  { href: emailUrls.support(), text: 'Support' },
  { href: emailUrls.faq(), text: 'FAQ' },
];

export const WelcomeEmail = ({
  name,
  verificationUrl,
  unsubscribeUrl,
  companyAddress,
}: WelcomeEmailProps) => (
  <EmailWrapper
    previewText="Welcome to CribNosh - Your Personal Food Journey Begins!"
    title="Welcome to CribNosh"
  >
    <ProfessionalHeader
      title="Welcome to CribNosh!"
      subtitle="Your Personal Food Journey Begins"
      showLogo
    />
    
    <Section style={{ padding: `${spacing['2xl']} ${spacing.xl}` }}>
      <ContentText variant="large" color="text">
        Hi {name}!
      </ContentText>
      
      <ContentText>
        We're absolutely thrilled to have you join our community of food lovers who appreciate 
        authentic, home-cooked meals that celebrate cultural diversity and personal connections.
      </ContentText>

      {/* Features */}
      <div style={{ margin: `${spacing.xl} 0` }}>
        <ContentText style={{ ...typography.heading.h3, marginBottom: spacing.lg, textAlign: 'center' }}>
          What Makes CribNosh Special
        </ContentText>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md, marginBottom: spacing.lg }}>
          <div style={{ flex: '1', minWidth: '250px', textAlign: 'center' }}>
            <div style={{ 
              fontSize: '32px', 
              marginBottom: spacing.sm,
              width: '48px',
              height: '48px',
              backgroundColor: colors.primary,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: colors.background,
              fontWeight: 'bold'
            }}>
              H
            </div>
            <ContentText style={{ ...typography.heading.h4, marginBottom: spacing.xs }}>
              Verified Kitchens
            </ContentText>
            <ContentText variant="small" color="textSecondary">
              Home kitchens with the highest safety and quality standards
            </ContentText>
          </div>
          
          <div style={{ flex: '1', minWidth: '250px', textAlign: 'center' }}>
            <div style={{ 
              fontSize: '32px', 
              marginBottom: spacing.sm,
              width: '48px',
              height: '48px',
              backgroundColor: colors.primary,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: colors.background,
              fontWeight: 'bold'
            }}>
              C
            </div>
            <ContentText style={{ ...typography.heading.h4, marginBottom: spacing.xs }}>
              Real Food Creators
            </ContentText>
            <ContentText variant="small" color="textSecondary">
              Authentic chefs sharing their cultural heritage through food
            </ContentText>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: spacing.md }}>
          <div style={{ flex: '1', minWidth: '250px', textAlign: 'center' }}>
            <div style={{ 
              fontSize: '32px', 
              marginBottom: spacing.sm,
              width: '48px',
              height: '48px',
              backgroundColor: colors.primary,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: colors.background,
              fontWeight: 'bold'
            }}>
              P
            </div>
            <ContentText style={{ ...typography.heading.h4, marginBottom: spacing.xs }}>
              Personalized Taste
            </ContentText>
            <ContentText variant="small" color="textSecondary">
              Recommendations tailored to your unique preferences
            </ContentText>
          </div>
          
          <div style={{ flex: '1', minWidth: '250px', textAlign: 'center' }}>
            <div style={{ 
              fontSize: '32px', 
              marginBottom: spacing.sm,
              width: '48px',
              height: '48px',
              backgroundColor: colors.primary,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px auto',
              color: colors.background,
              fontWeight: 'bold'
            }}>
              D
            </div>
            <ContentText style={{ ...typography.heading.h4, marginBottom: spacing.xs }}>
              Direct Connections
            </ContentText>
            <ContentText variant="small" color="textSecondary">
              Build relationships with your favorite food creators
            </ContentText>
          </div>
        </div>
      </div>

      <CallToActionSection
        title="Ready to Get Started?"
        description="Verify your email and complete your taste profile to discover amazing food creators in your area."
        buttonText="Verify Your Email"
        buttonUrl={verificationUrl}
        secondaryButtonText="Learn More"
        secondaryButtonUrl={emailUrls.howItWorks()}
      />

      <ContentText variant="small" color="textMuted" align="center" style={{ fontStyle: 'italic', marginTop: spacing.xl }}>
        "Every meal tells a story, and we're here to help you discover yours."
      </ContentText>
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
);