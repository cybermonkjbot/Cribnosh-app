import { Html as EmailHtml, Head, Preview, Section } from '@react-email/components';
import { EmailWrapper, ProfessionalHeader, ContentText, FooterSection, SocialLinks, colors, spacing, FeatureCard, typography } from './components';

import { emailUrls } from '../utils/urls';
interface ChefApplicationEmailProps {
  chefName: string;
  nextSteps: string[];
  timeline: string;
  documentsNeeded?: string[];
  contactEmail: string;
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

export const ChefApplicationEmail = ({
  chefName,
  nextSteps,
  timeline,
  documentsNeeded,
  contactEmail,
  unsubscribeUrl,
  companyAddress,
}: ChefApplicationEmailProps) => (
  <EmailHtml>
    <Head />
    <Preview>Welcome to CribNosh! Your food creator application is being reviewed</Preview>
    <EmailWrapper previewText="Welcome to CribNosh! Your food creator application is being reviewed" title="Application Received">
      <ProfessionalHeader
        title="Application Received!"
        subtitle="Welcome to the CribNosh food creator community"
        showLogo
      />
      
      <Section style={{ padding: `${spacing['2xl']} ${spacing.xl}` }}>
        <ContentText variant="large" color="text">
          Hi {chefName}! 👋
        </ContentText>
        
        <ContentText>
          Thank you for applying to share your culinary passion with CribNosh! We're excited about the possibility 
          of having you join our community of amazing food creators.
        </ContentText>

        <FeatureCard
          icon="👨‍🍳"
          title="What Happens Next"
          description="Here's our review process to ensure the best experience for everyone"
          highlight
        />

        <div style={{ margin: `${spacing.xl} 0` }}>
          {nextSteps.map((step, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'flex-start', 
              marginBottom: spacing.md,
              padding: spacing.md,
              backgroundColor: colors.backgroundSecondary,
              borderRadius: '8px',
            }}>
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
                marginRight: spacing.md,
                flexShrink: 0,
                marginTop: '2px',
              }}>
                {i + 1}
              </div>
              <ContentText style={{ margin: '0', flex: 1 }}>
                {step}
              </ContentText>
            </div>
          ))}
        </div>

        <FeatureCard
          icon="⏰"
          title="Timeline"
          description={timeline}
        />

        {documentsNeeded && (
          <FeatureCard
            icon="📋"
            title="Required Documents"
            description="Please have these ready for your review"
          >
            <div style={{ marginTop: spacing.md }}>
              {documentsNeeded.map((doc, i) => (
                <div key={i} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: spacing.sm,
                }}>
                  <div style={{
                    width: '6px',
                    height: '6px',
                    backgroundColor: colors.primary,
                    borderRadius: '50%',
                    marginRight: spacing.sm,
                  }} />
                  <ContentText style={{ margin: '0', ...typography.body.small }}>
                    {doc}
                  </ContentText>
                </div>
              ))}
            </div>
          </FeatureCard>
        )}

        <ContentText style={{ 
          marginTop: spacing.xl, 
          textAlign: 'center',
          backgroundColor: colors.infoLight,
          padding: spacing.lg,
          borderRadius: '8px',
          border: `1px solid ${colors.info}`,
        }}>
          <strong>Questions?</strong> We're here to help! Email us at{' '}
          <a href={`mailto:${contactEmail}`} style={{ 
            color: colors.link, 
            textDecoration: 'none',
            fontWeight: '600',
          }}>
            {contactEmail}
          </a>
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
  </EmailHtml>
);
