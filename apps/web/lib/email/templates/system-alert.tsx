import React from 'react';
import { emailUrls } from '../utils/urls';
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
  Alert,
  StatsHighlight,
  ProgressBar,
  Timeline,
} from './components';

interface SystemAlertEmailProps {
  alertType: 'maintenance' | 'outage' | 'security' | 'update' | 'feature' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  customerName: string;
  affectedServices?: string[];
  estimatedDuration?: string;
  startTime?: string;
  endTime?: string;
  currentStatus?: 'scheduled' | 'in_progress' | 'resolved' | 'cancelled';
  progress?: number;
  timeline?: Array<{
    time: string;
    status: string;
    description: string;
    completed: boolean;
  }>;
  actions?: Array<{
    title: string;
    description: string;
    url: string;
    urgent: boolean;
  }>;
  workarounds?: Array<{
    title: string;
    description: string;
    steps: string[];
  }>;
  contactInfo?: {
    phone: string;
    email: string;
    chatUrl: string;
    statusPage: string;
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
  { href: 'emailUrls.status()', text: 'Status Page' },
  { href: 'emailUrls.faq()', text: 'FAQ' },
];

export const SystemAlertEmail: React.FC<SystemAlertEmailProps> = ({
  alertType,
  severity,
  title,
  description,
  customerName,
  affectedServices = [],
  estimatedDuration,
  startTime,
  endTime,
  currentStatus = 'scheduled',
  progress,
  timeline = [],
  actions = [],
  workarounds = [],
  contactInfo,
  unsubscribeUrl,
  companyAddress,
}) => {
  const getAlertIcon = () => {
    switch (alertType) {
      case 'maintenance': return 'MAINT';
      case 'outage': return 'OUT';
      case 'security': return 'SEC';
      case 'update': return 'UPD';
      case 'feature': return 'NEW';
      case 'emergency': return 'URG';
      default: return 'INFO';
    }
  };

  const getSeverityColor = () => {
    switch (severity) {
      case 'low': return colors.info;
      case 'medium': return colors.warning;
      case 'high': return colors.error;
      case 'critical': return colors.error;
      default: return colors.textMuted;
    }
  };

  const getStatusColor = () => {
    switch (currentStatus) {
      case 'scheduled': return colors.warning;
      case 'in_progress': return colors.error;
      case 'resolved': return colors.success;
      case 'cancelled': return colors.textMuted;
      default: return colors.textMuted;
    }
  };

  const getStatusText = () => {
    switch (currentStatus) {
      case 'scheduled': return 'Scheduled';
      case 'in_progress': return 'In Progress';
      case 'resolved': return 'Resolved';
      case 'cancelled': return 'Cancelled';
      default: return 'Unknown';
    }
  };

  const getAlertVariant = () => {
    switch (severity) {
      case 'low': return 'info';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'info';
    }
  };

  return (
    <Html>
      <Head />
      <Preview>{title} - {severity.toUpperCase()} Alert</Preview>
      <EmailWrapper
        previewText={`${title} - ${severity.toUpperCase()} Alert`}
        title="System Alert"
        backgroundColor={severity === 'critical' ? colors.errorLight : colors.backgroundSecondary}
      >
        <ProfessionalHeader
          title={`${getAlertIcon()} ${title}`}
          subtitle={`${severity.toUpperCase()} System Alert`}
          showLogo
          backgroundColor={getSeverityColor()}
        />

        <Section style={{ padding: `${spacing['2xl']} ${spacing.xl}` }}>
          <ContentText variant="large" color="text">
            Hi {customerName}!
          </ContentText>

          <ContentText>
            {description}
          </ContentText>

          {/* Status Overview */}
          <StatsHighlight
            value={getStatusText()}
            label="Current Status"
            description={estimatedDuration ? `Estimated duration: ${estimatedDuration}` : ''}
            color={getStatusColor()}
          />

          {/* Progress Bar */}
          {progress !== undefined && (
            <ProgressBar
              progress={progress}
              label="Resolution Progress"
              color={getStatusColor()}
            />
          )}

          {/* Affected Services */}
          {affectedServices.length > 0 && (
            <div style={{ margin: `${spacing.xl} 0`, padding: spacing.lg, backgroundColor: colors.backgroundSecondary, borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.md }}>
                <div style={{ 
                  fontSize: '16px', 
                  marginRight: spacing.sm,
                  width: '32px',
                  height: '32px',
                  backgroundColor: colors.primary,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.background,
                  fontWeight: 'bold'
                }}>
                  S
                </div>
                <div>
                  <ContentText style={{ ...typography.heading.h4, margin: '0 0 4px 0' }}>
                    Affected Services
                  </ContentText>
                  <ContentText variant="small" color="textSecondary">
                    The following services may be impacted
                  </ContentText>
                </div>
              </div>
              <div style={{ marginTop: spacing.md }}>
                {affectedServices.map((service, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: spacing.sm,
                    backgroundColor: colors.background,
                    borderRadius: '6px',
                    marginBottom: spacing.xs,
                  }}>
                    <div style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: getSeverityColor(),
                      marginRight: spacing.sm,
                    }} />
                    <ContentText style={{ ...typography.body.small, margin: '0' }}>
                      {service}
                    </ContentText>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {timeline.length > 0 && (
            <div style={{ margin: `${spacing.xl} 0`, padding: spacing.lg, backgroundColor: colors.backgroundSecondary, borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.md }}>
                <div style={{ 
                  fontSize: '16px', 
                  marginRight: spacing.sm,
                  width: '32px',
                  height: '32px',
                  backgroundColor: colors.primary,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.background,
                  fontWeight: 'bold'
                }}>
                  T
                </div>
                <div>
                  <ContentText style={{ ...typography.heading.h4, margin: '0 0 4px 0' }}>
                    Incident Timeline
                  </ContentText>
                  <ContentText variant="small" color="textSecondary">
                    Track the progress of this issue
                  </ContentText>
                </div>
              </div>
              <div style={{ marginTop: spacing.md }}>
                {timeline.map((event, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    marginBottom: spacing.md,
                    padding: spacing.sm,
                    backgroundColor: event.completed ? colors.successLight : colors.background,
                    borderRadius: '6px',
                  }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      backgroundColor: event.completed ? colors.success : colors.textMuted,
                      marginRight: spacing.sm,
                      flexShrink: 0,
                      marginTop: '4px',
                    }} />
                    <div style={{ flex: 1 }}>
                      <ContentText style={{ ...typography.body.small, fontWeight: '600', margin: '0 0 2px 0' }}>
                        {event.time} - {event.status}
                      </ContentText>
                      <ContentText style={{ ...typography.body.xs, color: colors.textMuted, margin: '0' }}>
                        {event.description}
                      </ContentText>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Workarounds */}
          {workarounds.length > 0 && (
            <div style={{ margin: `${spacing.xl} 0`, padding: spacing.lg, backgroundColor: colors.backgroundSecondary, borderRadius: '8px', border: `2px solid ${colors.primary}` }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.md }}>
                <div style={{ 
                  fontSize: '16px', 
                  marginRight: spacing.sm,
                  width: '32px',
                  height: '32px',
                  backgroundColor: colors.primary,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.background,
                  fontWeight: 'bold'
                }}>
                  W
                </div>
                <div>
                  <ContentText style={{ ...typography.heading.h4, margin: '0 0 4px 0' }}>
                    Workarounds
                  </ContentText>
                  <ContentText variant="small" color="textSecondary">
                    Try these solutions while we resolve the issue
                  </ContentText>
                </div>
              </div>
              <div style={{ marginTop: spacing.md }}>
                {workarounds.map((workaround, index) => (
                  <div key={index} style={{
                    padding: spacing.md,
                    backgroundColor: colors.background,
                    borderRadius: '8px',
                    marginBottom: spacing.sm,
                  }}>
                    <ContentText style={{ ...typography.body.small, fontWeight: '600', margin: '0 0 8px 0' }}>
                      {workaround.title}
                    </ContentText>
                    <ContentText style={{ ...typography.body.small, margin: '0 0 8px 0' }}>
                      {workaround.description}
                    </ContentText>
                    <div>
                      {workaround.steps.map((step, stepIndex) => (
                        <div key={stepIndex} style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          marginBottom: spacing.xs,
                        }}>
                          <div style={{
                            backgroundColor: colors.primary,
                            color: colors.background,
                            borderRadius: '50%',
                            width: '16px',
                            height: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '10px',
                            fontWeight: 'bold',
                            marginRight: spacing.sm,
                            flexShrink: 0,
                            marginTop: '2px',
                          }}>
                            {stepIndex + 1}
                          </div>
                          <ContentText style={{ margin: '0', ...typography.body.xs }}>
                            {step}
                          </ContentText>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {actions.length > 0 && (
            <div style={{ margin: `${spacing.xl} 0`, padding: spacing.lg, backgroundColor: colors.backgroundSecondary, borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: spacing.md }}>
                <div style={{ 
                  fontSize: '16px', 
                  marginRight: spacing.sm,
                  width: '32px',
                  height: '32px',
                  backgroundColor: colors.primary,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: colors.background,
                  fontWeight: 'bold'
                }}>
                  A
                </div>
                <div>
                  <ContentText style={{ ...typography.heading.h4, margin: '0 0 4px 0' }}>
                    Required Actions
                  </ContentText>
                  <ContentText variant="small" color="textSecondary">
                    Please take the following actions
                  </ContentText>
                </div>
              </div>
              <div style={{ marginTop: spacing.md }}>
                {actions.map((action, index) => (
                  <div key={index} style={{
                    padding: spacing.md,
                    backgroundColor: action.urgent ? colors.errorLight : colors.background,
                    borderRadius: '8px',
                    marginBottom: spacing.sm,
                    border: action.urgent ? `2px solid ${colors.error}` : 'none',
                  }}>
                    <ContentText style={{ ...typography.body.small, fontWeight: '600', margin: '0 0 4px 0' }}>
                      {action.urgent && '[URGENT] '}{action.title}
                    </ContentText>
                    <ContentText style={{ ...typography.body.small, margin: '0 0 8px 0' }}>
                      {action.description}
                    </ContentText>
                    <EmailButton
                      href={action.url}
                      variant={action.urgent ? 'error' : 'primary'}
                      size="small"
                    >
                      Take Action
                    </EmailButton>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Contact Information */}
          {contactInfo && (
            <Alert variant={getAlertVariant()} title="Need Help?">
              <div style={{ marginTop: spacing.sm }}>
                <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                  Phone: {contactInfo.phone}
                </ContentText>
                <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                  Email: {contactInfo.email}
                </ContentText>
                <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                  Live Chat: <a href={contactInfo.chatUrl} style={{ color: colors.link }}>Start Chat</a>
                </ContentText>
                <ContentText style={{ ...typography.body.small, margin: '0' }}>
                  Status Page: <a href={contactInfo.statusPage} style={{ color: colors.link }}>View Status</a>
                </ContentText>
              </div>
            </Alert>
          )}

          {/* Call to Action */}
          <CallToActionSection
            title="Stay Updated"
            description="We'll keep you informed as we work to resolve this issue"
            buttonText="View Status Page"
            buttonUrl={contactInfo?.statusPage || 'emailUrls.status()'}
            secondaryButtonText="Contact Support"
            secondaryButtonUrl="emailUrls.support()"
          />

          {/* Additional Information */}
          <Alert variant="info" title="Additional Information">
            <div style={{ marginTop: spacing.sm }}>
              <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                • We apologize for any inconvenience this may cause
              </ContentText>
              <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                • Our team is working around the clock to resolve this issue
              </ContentText>
              <ContentText style={{ ...typography.body.small, margin: '0 0 4px 0' }}>
                • We'll send updates as the situation changes
              </ContentText>
              <ContentText style={{ ...typography.body.small, margin: '0' }}>
                • Thank you for your patience and understanding
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

export default SystemAlertEmail;
