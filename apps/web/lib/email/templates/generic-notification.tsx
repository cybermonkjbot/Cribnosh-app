import { Html as EmailHtml, Head, Preview, Container, Section } from '@react-email/components';
import { EmailWrapper, ProfessionalHeader, ContentText, FooterSection, colors, SocialLinks, spacing } from './components';
import { emailUrls } from '../utils/urls';

interface GenericNotificationEmailProps {
  title: string;
  message: string;
  unsubscribeUrl: string;
  address: string;
}

const socialLinks = [
  { href: emailUrls.social.twitter, icon: 'https://cdn-icons-png.flaticon.com/512/733/733579.png', alt: 'Twitter', label: 'Twitter' },
  { href: emailUrls.social.instagram, icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png', alt: 'Instagram', label: 'Instagram' },
  { href: emailUrls.social.website(), icon: 'https://cdn-icons-png.flaticon.com/512/25/25231.png', alt: 'Website', label: 'Website' },
];

const footerLinks = [
  { href: emailUrls.support(), text: 'Support' },
  { href: emailUrls.faq(), text: 'FAQ' },
];

export const GenericNotificationEmail = (props: GenericNotificationEmailProps) => {
  const { title, message, unsubscribeUrl, address } = props;
  return (
    <EmailHtml>
      <Head />
      <Preview>{title}</Preview>
      <EmailWrapper previewText={title} title={title}>
        <ProfessionalHeader
          title={title}
          subtitle="Important Update from CribNosh"
          showLogo
        />
        
        <Section style={{ padding: `${spacing['2xl']} ${spacing.xl}` }}>
          <ContentText variant="large" color="text">
            {message}
          </ContentText>
          
          <ContentText variant="small" color="textMuted" align="center" style={{ marginTop: spacing.xl }}>
            Thank you for being part of the CribNosh community!
          </ContentText>
        </Section>

        <SocialLinks links={socialLinks} />
        
        <FooterSection
          unsubscribeUrl={unsubscribeUrl}
          address={address}
          companyName="CribNosh"
          additionalLinks={footerLinks}
          showDivider
        />
      </EmailWrapper>
    </EmailHtml>
  );
};
