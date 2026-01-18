import * as React from 'react';
import { Html as EmailHtml, Head, Preview, Container, Section } from '@react-email/components';
import { EmailWrapper, ProfessionalHeader, ContentText, FooterSection, colors, SocialLinks, spacing, Alert } from './components';

import { emailUrls } from '../utils/urls';
interface AdminNotificationEmailProps {
  title: string;
  details: string;
  companyAddress: string;
}

const socialLinks = [
  { href: 'https://x.com/CribNosh?t=YDYNvB1ZIaVe0IX5NDe9YQ&s=09', icon: 'https://cdn-icons-png.flaticon.com/512/733/733579.png', alt: 'X (Twitter)', label: 'X (Twitter)' },
  { href: 'https://www.instagram.com/cribnoshuk?igsh=MXM3NWxsOHpsbDB1bA==', icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png', alt: 'Instagram', label: 'Instagram' },
];

const footerLinks = [
  { href: 'emailUrls.support()', text: 'Support' },
  { href: 'emailUrls.faq()', text: 'FAQ' },
];

export const AdminNotificationEmail = ({ title, details, companyAddress }: AdminNotificationEmailProps) => (
  <EmailHtml>
    <Head />
    <Preview>{title}</Preview>
    <EmailWrapper previewText={title} title={title}>
      <ProfessionalHeader
        title={title}
        subtitle="Admin Notification"
        showLogo
        backgroundColor={colors.warning}
      />
      
      <Section style={{ padding: `${spacing['2xl']} ${spacing.xl}` }}>
        <Alert variant="info" title="System Notification">
          {details}
        </Alert>
        
        <ContentText variant="small" color="textMuted" align="center" style={{ marginTop: spacing.xl }}>
          This is an automated notification from the CribNosh system.
        </ContentText>
      </Section>

      <FooterSection
        unsubscribeUrl=""
        address={companyAddress}
        companyName="CribNosh"
        additionalLinks={footerLinks}
        showDivider
      />
    </EmailWrapper>
  </EmailHtml>
);
