import { Html, Head, Preview, Container, Section } from '@react-email/components';
import { EmailWrapper, ProfessionalHeader, ContentText, EmailButton, FooterSection, colors, SocialLinks, spacing, Alert, FeatureCard } from './components';

import { emailUrls } from '../utils/urls';
interface FormConfirmationEmailProps {
  formName: string;
  customerName: string;
  summary: string;
  nextSteps: string;
  actionUrl?: string;
  actionText?: string;
  unsubscribeUrl: string;
  companyAddress: string;
}

const socialLinks = [
  { href: 'emailUrls.social.twitter', icon: 'https://cdn-icons-png.flaticon.com/512/733/733579.png', alt: 'Twitter', label: 'Twitter' },
  { href: 'emailUrls.social.instagram', icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png', alt: 'Instagram', label: 'Instagram' },
  { href: 'emailUrls.home()', icon: 'https://cdn-icons-png.flaticon.com/512/25/25231.png', alt: 'Website', label: 'Website' },
];

const footerLinks = [
  { href: 'emailUrls.support()', text: 'Support' },
  { href: 'emailUrls.faq()', text: 'FAQ' },
];

export const FormConfirmationEmail = ({
  formName,
  customerName,
  summary,
  nextSteps,
  actionUrl,
  actionText,
  unsubscribeUrl,
  companyAddress,
}: FormConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Your {formName} submission is confirmed</Preview>
    <EmailWrapper previewText={`Your ${formName} submission is confirmed`} title={`${formName} Received`}>
      <ProfessionalHeader
        title={`${formName} Received! ✅`}
        subtitle="Thank you for your submission"
        showLogo
        backgroundColor={colors.success}
      />
      
      <Section style={{ padding: `${spacing['2xl']} ${spacing.xl}` }}>
        <ContentText variant="large" color="text">
          Hi {customerName}! 👋
        </ContentText>
        
        <ContentText>
          We've successfully received your {formName.toLowerCase()} submission and really appreciate you taking the time to reach out to us.
        </ContentText>

        <FeatureCard
          icon="📝"
          title="Your Submission Summary"
          description="Here's what you submitted"
          highlight
        >
          <div style={{ 
            backgroundColor: colors.backgroundSecondary, 
            padding: spacing.lg, 
            borderRadius: '8px', 
            marginTop: spacing.md,
            border: `1px solid ${colors.border}`,
          }}>
            <ContentText style={{ margin: '0', whiteSpace: 'pre-line' }}>
              {summary}
            </ContentText>
          </div>
        </FeatureCard>

        <FeatureCard
          icon="ArrowRight"
          title="What Happens Next"
          description={nextSteps}
        />

        {actionUrl && actionText && (
          <Section style={{ padding: `${spacing.xl} 0`, textAlign: 'center' }}>
            <EmailButton href={actionUrl} variant="primary" size="large">
              {actionText}
            </EmailButton>
          </Section>
        )}

        <Alert variant="info" title="Need Help?">
          We're here to help! Reply to this email or contact us at{' '}
          <a href="mailto:help@cribnosh.com" style={{ 
            color: colors.link, 
            textDecoration: 'none',
            fontWeight: '600',
          }}>
            help@cribnosh.com
          </a>
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
