import React from 'react';
import { emailUrls } from '../utils/urls';
import {
  Html as EmailHtml,
  Head,
  Preview,
  Container,
  Section,
  Text,
} from '@react-email/components';
import {
  EmailWrapper,
  ProfessionalHeader,
  ContentText,
  FooterSection,
  Alert,
  StatsHighlight,
  colors,
  spacing,
  typography,
} from './components';

interface OTPVerificationEmailProps {
  otpCode: string;
  recipientName?: string;
  expiryMinutes?: number;
  unsubscribeUrl?: string;
  companyAddress?: string;
}

export const OTPVerificationEmail: React.FC<OTPVerificationEmailProps> = ({
  otpCode,
  recipientName = 'there',
  expiryMinutes = 5,
  unsubscribeUrl = 'emailUrls.unsubscribe()',
  companyAddress = 'CribNosh – Personalized Dining, Every Time.',
}) => {
  return (
    <EmailHtml>
      <Head />
      <Preview>Verify your email with CribNosh - Your verification code is ready</Preview>
      <EmailWrapper
        previewText="Verify your email with CribNosh - Your verification code is ready"
        title="Email Verification"
      >
        <ProfessionalHeader
          title="Verify Your Email"
          subtitle="Complete your CribNosh account setup"
          showLogo
        />
        
        <Section style={{ padding: `${spacing['2xl']} ${spacing.xl}` }}>
          <ContentText variant="large" color="text">
            Hi {recipientName}!
          </ContentText>
          
          <ContentText>
            Welcome to CribNosh! We're excited to have you join our community of food lovers. 
            To complete your waitlist signup, please use the verification code below:
          </ContentText>

          {/* OTP Code Display */}
          <div style={{ textAlign: 'center', margin: '32px 0' }}>
            <ContentText variant="small" color="textSecondary" style={{ marginBottom: '16px' }}>
              Your verification code:
            </ContentText>
            <div style={{
              backgroundColor: colors.backgroundSecondary,
              border: `2px solid ${colors.primary}`,
              borderRadius: '8px',
              padding: '20px 32px',
              display: 'inline-block',
              margin: '0 auto',
            }}>
              <span style={{
                color: colors.primary,
                fontSize: '32px',
                fontWeight: '700',
                letterSpacing: '4px',
                fontFamily: 'monospace',
              }}>
                {otpCode}
              </span>
            </div>
            <ContentText variant="small" color="textMuted" style={{ marginTop: '16px' }}>
              This code expires in {expiryMinutes} minutes.
            </ContentText>
          </div>

          <ContentText variant="small" color="textMuted" align="center" style={{ 
            margin: '24px 0',
            padding: '16px',
            backgroundColor: colors.warningLight,
            borderRadius: '8px',
            border: `1px solid ${colors.warning}`,
          }}>
            <strong>Security Notice:</strong> Never share this code with anyone. CribNosh will never ask for your verification code via phone, email, or any other method.
          </ContentText>

          <ContentText variant="small" color="textMuted" align="center">
            If you didn't request this verification code, please ignore this email. 
            Your account remains secure.
          </ContentText>
        </Section>

        <FooterSection
          unsubscribeUrl={unsubscribeUrl}
          address={companyAddress}
          companyName="CribNosh"
          additionalLinks={[
            { href: 'emailUrls.support()', text: 'Support' },
            { href: 'emailUrls.faq()', text: 'FAQ' },
            { href: 'emailUrls.privacy()', text: 'Privacy Policy' },
          ]}
          showDivider
        />
      </EmailWrapper>
    </EmailHtml>
  );
};

export default OTPVerificationEmail;
