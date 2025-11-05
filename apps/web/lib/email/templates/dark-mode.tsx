import React from 'react';
import { colors as lightColors } from './components';
import { emailUrls } from '../utils/urls';

// Dark mode color palette
export const darkColors = {
  // CribNosh Brand Colors - Dark mode variants
  primary: '#ff5e54', // Slightly lighter for better contrast
  primaryLight: '#ff7b72',
  primaryDark: '#ed1d12',
  secondary: '#FFFFFF', // White text for contrast
  accent: '#FFD700', // Gold accent remains the same
  
  // Status Colors - Dark mode variants
  success: '#10B981',
  successLight: '#065F46',
  warning: '#F59E0B',
  warningLight: '#92400E',
  error: '#EF4444',
  errorLight: '#7F1D1D',
  info: '#3B82F6',
  infoLight: '#1E3A8A',
  
  // Text Colors - Dark mode
  text: '#FFFFFF',
  textSecondary: '#D1D5DB',
  textMuted: '#9CA3AF',
  textLight: '#6B7280',
  
  // Background Colors - Dark mode
  background: '#111827', // Dark gray
  backgroundSecondary: '#1F2937', // Slightly lighter dark gray
  backgroundTertiary: '#374151', // Even lighter dark gray
  
  // Border Colors - Dark mode
  border: '#374151',
  borderLight: '#4B5563',
  borderDark: '#6B7280',
  
  // Interactive Colors - Dark mode
  link: '#ff5e54',
  linkHover: '#ff7b72',
  buttonHover: '#ed1d12',
  
  // Shadow and Effects - Dark mode
  shadow: 'rgba(0, 0, 0, 0.3)',
  shadowLight: 'rgba(0, 0, 0, 0.2)',
  shadowDark: 'rgba(0, 0, 0, 0.4)',
} as const;

// Dark mode email wrapper
export const DarkModeEmailWrapper = ({ 
  children, 
  previewText,
  title = "CribNosh Email",
  backgroundColor = darkColors.backgroundSecondary
}: { 
  children: React.ReactNode;
  previewText?: string;
  title?: string;
  backgroundColor?: string;
}) => (
  <div style={{
    background: `linear-gradient(135deg, ${darkColors.backgroundSecondary} 0%, ${darkColors.backgroundTertiary} 100%)`,
    margin: '0',
    padding: '0',
    fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    lineHeight: '1.6',
    color: darkColors.text,
    minHeight: '100vh',
  }}>
    <div
      style={{
        maxWidth: '600px',
        margin: '0 auto',
        background: `linear-gradient(135deg, ${darkColors.background} 0%, ${darkColors.backgroundSecondary} 100%)`,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: `0 8px 32px ${darkColors.shadow}`,
        border: `1px solid ${darkColors.border}`,
      }}
    >
      {children}
    </div>
  </div>
);

// Dark mode header component
export const DarkModeHeader = ({ 
  title, 
  subtitle, 
  showLogo = true,
  backgroundColor = darkColors.primary,
  textColor = darkColors.background
}: { 
  title: string; 
  subtitle?: string; 
  showLogo?: boolean;
  backgroundColor?: string;
  textColor?: string;
}) => (
  <div style={{ 
    padding: '48px 32px', 
    textAlign: 'center',
    background: `linear-gradient(135deg, #ffffff 0%, ${darkColors.primary}20 30%, ${darkColors.primary}35 100%)`,
    position: 'relative',
  }}>
    {/* Gradient overlay for depth */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `radial-gradient(circle at 20% 80%, ${darkColors.primaryLight}20 0%, transparent 50%), radial-gradient(circle at 80% 20%, ${darkColors.primary}40 0%, transparent 50%)`,
      pointerEvents: 'none',
    }} />
    {showLogo && (
      <div style={{ marginBottom: '24px', position: 'relative', zIndex: 1 }}>
        <img
          src={`${emailUrls.base}/logo.svg`}
          width={155}
          height={40}
          alt="CribNosh Logo"
          style={{
            display: 'block',
            margin: '0 auto',
            filter: 'brightness(0) invert(1)', // Make logo white
          }}
        />
      </div>
    )}
    <h1
      style={{
        fontSize: '36px',
        lineHeight: '1.1',
        fontWeight: '700',
        letterSpacing: '-0.02em',
        fontFamily: 'Asgard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
        color: textColor,
        margin: '0 0 8px 0',
        textShadow: '0 2px 4px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {title}
    </h1>
    {subtitle && (
      <p
        style={{
          fontSize: '18px',
          lineHeight: '1.6',
          fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: textColor,
          margin: '0',
          opacity: 0.9,
          position: 'relative',
          zIndex: 1,
        }}
      >
        {subtitle}
      </p>
    )}
  </div>
);

// Dark mode button component
export const DarkModeButton = ({
  href,
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
}) => {
  const variants = {
    primary: { 
      bg: `linear-gradient(135deg, #ffffff 0%, ${darkColors.primary}15 30%, ${darkColors.primary}25 100%)`, 
      color: darkColors.text, 
      border: darkColors.primary 
    },
    secondary: { 
      bg: `linear-gradient(135deg, ${darkColors.secondary} 0%, #000000 100%)`, 
      color: darkColors.background, 
      border: darkColors.secondary 
    },
    outline: { 
      bg: 'transparent', 
      color: darkColors.primary, 
      border: darkColors.primary 
    },
    ghost: { 
      bg: `linear-gradient(135deg, ${darkColors.backgroundSecondary} 0%, ${darkColors.backgroundTertiary} 100%)`, 
      color: darkColors.text, 
      border: 'transparent' 
    },
    success: { 
      bg: `linear-gradient(135deg, ${darkColors.success} 0%, #059669 100%)`, 
      color: darkColors.background, 
      border: darkColors.success 
    },
    warning: { 
      bg: `linear-gradient(135deg, ${darkColors.warning} 0%, #D97706 100%)`, 
      color: darkColors.background, 
      border: darkColors.warning 
    },
    error: { 
      bg: `linear-gradient(135deg, ${darkColors.error} 0%, #DC2626 100%)`, 
      color: darkColors.background, 
      border: darkColors.error 
    },
  };

  const sizes = {
    small: { padding: '8px 16px', fontSize: '14px' },
    medium: { padding: '12px 24px', fontSize: '16px' },
    large: { padding: '16px 32px', fontSize: '18px' },
  };

  const style = variants[variant];
  const sizeStyle = sizes[size];

  return disabled ? (
    <span
      style={{
        backgroundColor: darkColors.textMuted,
        color: darkColors.background,
        border: `1px solid ${darkColors.textMuted}`,
        padding: sizeStyle.padding,
        borderRadius: '8px',
        fontSize: sizeStyle.fontSize,
        fontWeight: '500',
        textDecoration: 'none',
        textAlign: 'center',
        display: fullWidth ? 'block' : 'inline-block',
        width: fullWidth ? '100%' : 'auto',
        cursor: 'not-allowed',
        opacity: 0.6,
        transition: 'all 0.2s ease',
      }}
    >
      {children}
    </span>
  ) : (
    <a
      href={href}
      style={{
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
        padding: sizeStyle.padding,
        borderRadius: '8px',
        fontSize: sizeStyle.fontSize,
        fontWeight: '500',
        textDecoration: 'none',
        textAlign: 'center',
        display: fullWidth ? 'block' : 'inline-block',
        width: fullWidth ? '100%' : 'auto',
        cursor: 'pointer',
        opacity: 1,
        transition: 'all 0.2s ease',
      }}
    >
      {children}
    </a>
  );
};

// Dark mode card component
export const DarkModeCard = ({
  children,
  padding = 'lg',
  shadow = true,
  style = {},
}: {
  children: React.ReactNode;
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  shadow?: boolean;
  style?: React.CSSProperties;
}) => {
  const paddingSizes = {
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  };

  return (
    <div
      style={{
        background: `linear-gradient(135deg, ${darkColors.background} 0%, ${darkColors.backgroundSecondary} 100%)`,
        padding: paddingSizes[padding],
        borderRadius: '12px',
        border: `1px solid ${darkColors.border}`,
        boxShadow: shadow ? `0 2px 8px ${darkColors.shadow}` : 'none',
        position: 'relative',
        ...style,
      }}
    >
      {/* Subtle gradient overlay */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: `radial-gradient(circle at 20% 20%, ${darkColors.primary}05 0%, transparent 50%)`,
        borderRadius: '12px',
        pointerEvents: 'none',
      }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {children}
      </div>
    </div>
  );
};

// Dark mode text component
export const DarkModeText = ({
  children,
  variant = 'medium',
  color = 'text',
  align = 'left',
  style = {},
}: {
  children: React.ReactNode;
  variant?: 'large' | 'medium' | 'small' | 'xs';
  color?: keyof typeof darkColors;
  align?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
}) => {
  const typography = {
    large: { fontSize: '18px', lineHeight: '1.6' },
    medium: { fontSize: '16px', lineHeight: '1.6' },
    small: { fontSize: '14px', lineHeight: '1.5' },
    xs: { fontSize: '12px', lineHeight: '1.4' },
  };

  return (
    <p
      style={{
        ...typography[variant],
        fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: darkColors[color],
        textAlign: align,
        margin: '0 0 16px 0',
        ...style,
      }}
    >
      {children}
    </p>
  );
};

// Dark mode footer component
export const DarkModeFooter = ({
  unsubscribeUrl,
  address,
  companyName,
  additionalLinks = [],
  showDivider = true,
}: {
  unsubscribeUrl: string;
  address: string;
  companyName?: string;
  additionalLinks?: Array<{ href: string; text: string }>;
  showDivider?: boolean;
}) => (
  <div style={{ 
    padding: '32px 0', 
    borderTop: showDivider ? `1px solid ${darkColors.border}` : 'none',
    backgroundColor: darkColors.backgroundSecondary,
  }}>
    {companyName && (
      <p
        style={{
          fontSize: '14px',
          lineHeight: '1.5',
          fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: darkColors.textSecondary,
          textAlign: 'center',
          marginBottom: '8px',
          fontWeight: '600',
        }}
      >
        {companyName}
      </p>
    )}
    
    <p
      style={{
        fontSize: '12px',
        lineHeight: '1.4',
        fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: darkColors.textMuted,
        textAlign: 'center',
        marginBottom: '8px',
      }}
    >
      {address}
    </p>

    {additionalLinks.length > 0 && (
      <p
        style={{
          fontSize: '12px',
          lineHeight: '1.4',
          fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: darkColors.textMuted,
          textAlign: 'center',
        }}
      >
        {additionalLinks.map((link, index) => (
          <span key={index}>
            <a
              href={link.href}
              style={{
                color: darkColors.link,
                textDecoration: 'underline',
              }}
            >
              {link.text}
            </a>
            {index < additionalLinks.length - 1 && ' | '}
          </span>
        ))}
      </p>
    )}

    <p
      style={{
        fontSize: '12px',
        lineHeight: '1.4',
        fontFamily: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        color: darkColors.textMuted,
        textAlign: 'center',
      }}
    >
      <a
        href={unsubscribeUrl}
        style={{
          color: darkColors.link,
          textDecoration: 'underline',
        }}
      >
        Unsubscribe
      </a>{' '}
      from these emails
    </p>
  </div>
);

// Dark mode OTP verification email
export const DarkModeOTPVerificationEmail = ({
  otpCode,
  recipientName = 'there',
  expiryMinutes = 5,
  unsubscribeUrl = emailUrls.unsubscribe(),
  companyAddress = 'CribNosh – Personalized Dining, Every Time.',
}: {
  otpCode: string;
  recipientName?: string;
  expiryMinutes?: number;
  unsubscribeUrl?: string;
  companyAddress?: string;
}) => {
  return (
    <DarkModeEmailWrapper
      previewText="Verify your email with CribNosh - Your verification code is ready"
      title="Email Verification"
    >
      <DarkModeHeader
        title="Verify Your Email"
        subtitle="Complete your CribNosh account setup"
        showLogo
      />
      
      <div style={{ padding: '48px 32px' }}>
        <DarkModeText variant="large" color="text">
          Hi {recipientName}!
        </DarkModeText>
        
        <DarkModeText>
          Welcome to CribNosh! We're excited to have you join our community of food lovers. 
          To complete your waitlist signup, please use the verification code below:
        </DarkModeText>

        {/* OTP Code Display */}
        <div style={{ textAlign: 'center', margin: '32px 0' }}>
          <DarkModeText variant="small" color="textSecondary" style={{ marginBottom: '16px' }}>
            Your verification code:
          </DarkModeText>
          <div style={{
            backgroundColor: darkColors.backgroundSecondary,
            border: `2px solid ${darkColors.primary}`,
            borderRadius: '8px',
            padding: '20px 32px',
            display: 'inline-block',
            margin: '0 auto',
          }}>
            <span style={{
              color: darkColors.primary,
              fontSize: '32px',
              fontWeight: '700',
              letterSpacing: '4px',
              fontFamily: 'monospace',
            }}>
              {otpCode}
            </span>
          </div>
          <DarkModeText variant="small" color="textMuted" style={{ marginTop: '16px' }}>
            This code expires in {expiryMinutes} minutes.
          </DarkModeText>
        </div>

        {/* Security Warning */}
        <DarkModeText variant="small" color="textMuted" align="center" style={{ 
          margin: '24px 0',
          padding: '16px',
          backgroundColor: darkColors.warningLight,
          borderRadius: '8px',
          border: `1px solid ${darkColors.warning}`,
        }}>
          <strong>Security Notice:</strong> Never share this code with anyone. CribNosh will never ask for your verification code via phone, email, or any other method.
        </DarkModeText>

        <DarkModeText variant="small" color="textMuted" align="center">
          If you didn't request this verification code, please ignore this email. 
          Your account remains secure.
        </DarkModeText>
      </div>

      <DarkModeFooter
        unsubscribeUrl={unsubscribeUrl}
        address={companyAddress}
        companyName="CribNosh"
        additionalLinks={[
          { href: emailUrls.support(), text: 'Support' },
          { href: emailUrls.faq(), text: 'FAQ' },
          { href: emailUrls.privacy(), text: 'Privacy Policy' },
        ]}
        showDivider
      />
    </DarkModeEmailWrapper>
  );
};

export default DarkModeOTPVerificationEmail;
