import {
  Body,
  Column,
  Container,
  Font,
  Head,
  Hr,
  Html as EmailHtml,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components';
import { emailUrls } from '../utils/urls';

export const colors = {
  // CribNosh Brand Colors - Following brand guidelines
  primary: '#ff3b30', // CribNosh Red
  primaryLight: '#ff5e54',
  primaryDark: '#ed1d12',
  secondary: '#1A1A1A', // Deep Black for contrast
  accent: '#FFD700', // Gold accent for highlights

  // Status Colors
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  error: '#EF4444',
  errorLight: '#FEE2E2',
  info: '#3B82F6',
  infoLight: '#DBEAFE',

  // Text Colors - Following brand voice
  text: '#1A1A1A',
  textSecondary: '#4B5563',
  textMuted: '#6B7280',
  textLight: '#9CA3AF',

  // Background Colors
  background: '#FFFFFF',
  backgroundSecondary: '#FFFFFF',
  backgroundTertiary: '#FAFAFA',

  // Border Colors
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  borderDark: '#D1D5DB',

  // Interactive Colors
  link: '#ff3b30',
  linkHover: '#ed1d12',
  buttonHover: '#ed1d12',

  // Shadow and Effects
  shadow: 'rgba(0, 0, 0, 0.08)',
  shadowLight: 'rgba(0, 0, 0, 0.04)',
  shadowDark: 'rgba(0, 0, 0, 0.12)',
} as const;

const fontFamily = {
  asgard: 'Asgard, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  satoshi: 'Satoshi, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  mono: 'SF Mono, Monaco, Inconsolata, "Roboto Mono", Consolas, "Courier New", monospace',
} as const;

// Enhanced spacing system
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

// Enhanced Typography System - Following CribNosh brand guidelines
export const typography = {
  heading: {
    h1: {
      fontSize: '36px',
      lineHeight: '1.1',
      fontWeight: '700',
      letterSpacing: '-0.02em',
      fontFamily: fontFamily.asgard
    },
    h2: {
      fontSize: '30px',
      lineHeight: '1.2',
      fontWeight: '600',
      letterSpacing: '-0.01em',
      fontFamily: fontFamily.asgard
    },
    h3: {
      fontSize: '24px',
      lineHeight: '1.3',
      fontWeight: '600',
      fontFamily: fontFamily.asgard
    },
    h4: {
      fontSize: '20px',
      lineHeight: '1.4',
      fontWeight: '500',
      fontFamily: fontFamily.asgard
    },
  },
  body: {
    large: {
      fontSize: '18px',
      lineHeight: '1.6',
      fontFamily: fontFamily.satoshi
    },
    medium: {
      fontSize: '16px',
      lineHeight: '1.6',
      fontFamily: fontFamily.satoshi
    },
    small: {
      fontSize: '14px',
      lineHeight: '1.5',
      fontFamily: fontFamily.satoshi
    },
    xs: {
      fontSize: '12px',
      lineHeight: '1.4',
      fontFamily: fontFamily.satoshi
    },
  },
  display: {
    hero: {
      fontSize: '48px',
      lineHeight: '1.1',
      fontWeight: '700',
      letterSpacing: '-0.03em',
      fontFamily: fontFamily.asgard
    }
  }
} as const;

export const Logo = ({
  width = 155,
  height = 40,
  alt = "CribNosh Logo"
}: {
  width?: number;
  height?: number;
  alt?: string;
}) => (
  <Img
    src={`${emailUrls.base}/logo.svg`}
    width={width}
    height={height}
    alt={alt}
    style={{
      display: 'block',
      margin: '0 auto',
    }}
  />
);

// Enhanced Header with better typography and spacing
export const HeaderSection = ({
  title,
  subtitle,
  showLogo = true
}: {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
}) => (
  <Section style={{ padding: `${spacing.xl} 0`, textAlign: 'center' }}>
    {showLogo && <Logo />}
    <Text
      style={{
        ...typography.heading.h1,
        color: colors.text,
        marginTop: showLogo ? spacing.lg : '0',
        marginBottom: subtitle ? spacing.sm : '0',
      }}
    >
      {title}
    </Text>
    {subtitle && (
      <Text
        style={{
          ...typography.body.large,
          color: colors.textLight,
          marginTop: spacing.sm,
        }}
      >
        {subtitle}
      </Text>
    )}
  </Section>
);

// Enhanced Button with multiple variants
export const EmailButton = ({
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
      bg: `linear-gradient(135deg, #ffffff 0%, ${colors.primary}15 30%, ${colors.primary}25 100%)`,
      color: colors.text,
      border: colors.primary
    },
    secondary: {
      bg: `linear-gradient(135deg, ${colors.secondary} 0%, #000000 100%)`,
      color: colors.background,
      border: colors.secondary
    },
    outline: {
      bg: 'transparent',
      color: colors.primary,
      border: colors.primary
    },
    ghost: {
      bg: `linear-gradient(135deg, ${colors.backgroundSecondary} 0%, ${colors.backgroundTertiary} 100%)`,
      color: colors.text,
      border: 'transparent'
    },
    success: {
      bg: `linear-gradient(135deg, ${colors.success} 0%, #059669 100%)`,
      color: colors.background,
      border: colors.success
    },
    warning: {
      bg: `linear-gradient(135deg, ${colors.warning} 0%, #D97706 100%)`,
      color: colors.background,
      border: colors.warning
    },
    error: {
      bg: `linear-gradient(135deg, ${colors.error} 0%, #DC2626 100%)`,
      color: colors.background,
      border: colors.error
    },
  };

  const sizes = {
    small: { padding: '8px 16px', fontSize: '14px' },
    medium: { padding: '12px 24px', fontSize: '16px' },
    large: { padding: '16px 32px', fontSize: '18px' },
  };

  const safeVariant = variant || 'primary';
  const safeSize = size || 'medium';
  const style = variants[safeVariant] || variants.primary;
  const sizeStyle = sizes[safeSize] || sizes.medium;

  return disabled ? (
    <span
      style={{
        backgroundColor: colors.textMuted,
        color: colors.background,
        border: `1px solid ${colors.textMuted}`,
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
    <Link
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
    </Link>
  );
};

// Keep backward compatibility
export const PrimaryButton = ({ href, children }: { href: string; children: React.ReactNode }) => (
  <EmailButton href={href} variant="primary">{children}</EmailButton>
);

// Enhanced Content Text with better typography
export const ContentText = ({
  children,
  variant = 'medium',
  color = 'text',
  align = 'left',
  style = {},
}: {
  children: React.ReactNode;
  variant?: 'large' | 'medium' | 'small' | 'xs';
  color?: keyof typeof colors;
  align?: 'left' | 'center' | 'right';
  style?: React.CSSProperties;
}) => (
  <Text
    style={{
      ...typography.body[variant],
      color: colors[color],
      textAlign: align,
      margin: '0 0 16px 0',
      ...style,
    }}
  >
    {children}
  </Text>
);

// Enhanced Card with better shadows and spacing
export const CardSection = ({
  children,
  padding = 'lg',
  shadow = true,
  style = {},
}: {
  children: React.ReactNode;
  padding?: keyof typeof spacing;
  shadow?: boolean;
  style?: React.CSSProperties;
}) => (
  <Container
    style={{
      background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.backgroundSecondary} 100%)`,
      padding: spacing[padding],
      borderRadius: '12px',
      border: `1px solid ${colors.border}`,
      boxShadow: shadow ? `0 2px 8px ${colors.shadow}` : 'none',
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
      background: `radial-gradient(circle at 20% 20%, ${colors.primary}05 0%, transparent 50%)`,
      borderRadius: '12px',
      pointerEvents: 'none',
    }} />
    <div style={{ position: 'relative', zIndex: 1 }}>
      {children}
    </div>
  </Container>
);

// Enhanced Divider with variants
export const Divider = ({
  variant = 'default',
  spacing: dividerSpacing = 'lg'
}: {
  variant?: 'default' | 'light' | 'thick';
  spacing?: keyof typeof spacing;
}) => {
  const variants = {
    default: { borderTop: `1px solid ${colors.border}` },
    light: { borderTop: `1px solid ${colors.borderLight}` },
    thick: { borderTop: `2px solid ${colors.border}` },
  };

  return (
    <Hr
      style={{
        ...variants[variant],
        margin: `${spacing[dividerSpacing]} 0`,
        border: 'none',
        ...variants[variant],
      }}
    />
  );
};

// Enhanced Social Links with better accessibility
export const SocialLinks = ({
  links = [
    {
      href: 'https://x.com/CribNosh?t=YDYNvB1ZIaVe0IX5NDe9YQ&s=09',
      icon: 'https://cdn-icons-png.flaticon.com/512/733/733579.png',
      alt: 'X (Twitter)',
      label: 'X (Twitter)'
    },
    {
      href: 'https://www.instagram.com/cribnoshuk?igsh=MXM3NWxsOHpsbDB1bA==',
      icon: 'https://cdn-icons-png.flaticon.com/512/2111/2111463.png',
      alt: 'Instagram',
      label: 'Instagram'
    },
    {
      href: 'https://www.facebook.com/share/16yzxEUqpx/',
      icon: 'https://cdn-icons-png.flaticon.com/512/733/733547.png',
      alt: 'Facebook',
      label: 'Facebook'
    }
  ]
}: {
  links?: Array<{
    href: string;
    icon: string;
    alt: string;
    label: string;
  }>;
}) => (
  <Section style={{ textAlign: 'center', padding: `${spacing.md} 0` }}>
    {links.map((link, index) => (
      <Link
        key={index}
        href={link.href}
        style={{
          display: 'inline-block',
          margin: `0 ${spacing.md}`,
          textDecoration: 'none',
        }}
        title={link.label || link.alt}
      >
        <Img
          src={link.icon}
          width={32}
          height={32}
          alt={link.alt}
          style={{
            borderRadius: '50%',
            transition: 'opacity 0.2s ease',
          }}
        />
      </Link>
    ))}
  </Section>
);

// Enhanced Footer with better structure
export const FooterSection = ({
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
  <Section style={{ padding: `${spacing.xl} 0`, borderTop: showDivider ? `1px solid ${colors.border}` : 'none' }}>
    {companyName && (
      <Text
        style={{
          ...typography.body.small,
          color: colors.textLight,
          textAlign: 'center',
          marginBottom: spacing.sm,
          fontWeight: '600',
        }}
      >
        {companyName}
      </Text>
    )}

    <Text
      style={{
        ...typography.body.xs,
        color: colors.textMuted,
        textAlign: 'center',
        marginBottom: spacing.sm,
      }}
    >
      {address}
    </Text>

    {additionalLinks.length > 0 && (
      <Text
        style={{
          ...typography.body.xs,
          color: colors.textMuted,
          textAlign: 'center',
        }}
      >
        {additionalLinks.map((link, index) => (
          <span key={index}>
            <Link
              href={link.href}
              style={{
                color: colors.link,
                textDecoration: 'underline',
              }}
            >
              {link.text}
            </Link>
            {index < additionalLinks.length - 1 && ' | '}
          </span>
        ))}
      </Text>
    )}

    <Text
      style={{
        ...typography.body.xs,
        color: colors.textMuted,
        textAlign: 'center',
      }}
    >
      <Link
        href={unsubscribeUrl}
        style={{
          color: colors.link,
          textDecoration: 'underline',
        }}
      >
        Unsubscribe
      </Link>{' '}
      from these emails
    </Text>
  </Section>
);

// New utility components
export const Spacer = ({ size = 'md' }: { size?: keyof typeof spacing }) => (
  <div style={{ height: spacing[size] }} />
);

export const Badge = ({
  children,
  variant = 'primary',
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
}) => {
  const variants = {
    primary: { bg: colors.primary, color: colors.background },
    secondary: { bg: colors.secondary, color: colors.background },
    success: { bg: colors.success, color: colors.background },
    warning: { bg: colors.warning, color: colors.background },
    error: { bg: colors.error, color: colors.background },
  };

  const safeVariant = variant || 'primary';
  const style = variants[safeVariant] || variants.primary;

  return (
    <span
      style={{
        backgroundColor: style.bg,
        color: style.color,
        padding: '4px 8px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500',
        display: 'inline-block',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}
    >
      {children}
    </span>
  );
};

export const Alert = ({
  children,
  variant = 'info',
  title,
}: {
  children: React.ReactNode;
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
}) => {
  const variants = {
    info: { bg: colors.backgroundSecondary, border: colors.secondary, color: colors.text },
    success: { bg: '#f0f9f0', border: colors.success, color: colors.text },
    warning: { bg: '#fff8e1', border: colors.warning, color: colors.text },
    error: { bg: '#fef2f2', border: colors.error, color: colors.text },
  };

  const safeVariant = variant || 'info';
  const style = variants[safeVariant] || variants.info;

  return (
    <Container
      style={{
        backgroundColor: style.bg,
        border: `1px solid ${colors.border}`,
        borderRadius: '8px',
        padding: spacing.md,
        margin: `${spacing.md} 0`,
      }}
    >
      {title && (
        <Text
          style={{
            ...typography.body.medium,
            fontWeight: '600',
            color: style.color,
            marginBottom: spacing.sm,
          }}
        >
          {title}
        </Text>
      )}
      <Text
        style={{
          ...typography.body.medium,
          color: style.color,
          margin: '0',
        }}
      >
        {children}
      </Text>
    </Container>
  );
};

// Professional Email wrapper component with enhanced structure
export const EmailWrapper = ({
  children,
  previewText,
  title = "CribNosh Email",
  backgroundColor = colors.backgroundSecondary
}: {
  children: React.ReactNode;
  previewText?: string;
  title?: string;
  backgroundColor?: string;
}) => (
  <EmailHtml>
    <Head>
      <title>{title}</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8" />
      <Font
        fontFamily="Asgard"
        fallbackFontFamily="serif"
        webFont={{
          url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
          format: 'woff2',
        }}
        fontWeight={400}
        fontStyle="normal"
      />
      <Font
        fontFamily="Satoshi"
        fallbackFontFamily="sans-serif"
        webFont={{
          url: 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap',
          format: 'woff2',
        }}
        fontWeight={400}
        fontStyle="normal"
      />
    </Head>
    {previewText && <Preview>{previewText}</Preview>}
    <Body style={{
      background: colors.background,
      margin: '0',
      padding: '0',
      lineHeight: '1.6',
      color: colors.text
    }}>
      <Container
        style={{
          maxWidth: '600px',
          margin: '0 auto',
          background: colors.background,
          borderRadius: '16px',
          overflow: 'hidden',
          boxShadow: `0 4px 12px ${colors.shadow}`,
          border: `1px solid ${colors.borderLight}`,
        }}
      >
        {children}
      </Container>
    </Body>
  </EmailHtml>
);

// Professional Email Header with enhanced branding
export const ProfessionalHeader = ({
  title,
  subtitle,
  showLogo = true,
  backgroundColor = colors.primary,
  textColor = colors.background
}: {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  backgroundColor?: string;
  textColor?: string;
}) => (
  <Section style={{
    padding: `${spacing['2xl']} ${spacing.xl}`,
    textAlign: 'center',
    background: colors.background,
    position: 'relative',
    borderBottom: `1px solid ${colors.borderLight}`,
  }}>
    {/* minimal gradient for depth */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: `radial-gradient(circle at 50% 100%, ${colors.primary}05 0%, transparent 100%)`,
      pointerEvents: 'none',
    }} />
    {showLogo && (
      <div style={{ marginBottom: spacing.lg, position: 'relative', zIndex: 1 }}>
        <Logo />
      </div>
    )}
    <Text
      style={{
        ...typography.heading.h1,
        color: colors.text,
        margin: '0 0 8px 0',
        position: 'relative',
        zIndex: 1,
      }}
    >
      {title}
    </Text>
    {subtitle && (
      <Text
        style={{
          ...typography.body.large,
          color: colors.textSecondary,
          margin: '0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {subtitle}
      </Text>
    )}
  </Section>
);

// Enhanced Feature Card for highlighting key information
export const FeatureCard = ({
  icon,
  title,
  description,
  highlight = false,
  children,
}: {
  icon?: string;
  title: string;
  description: string;
  highlight?: boolean;
  children?: React.ReactNode;
}) => (
  <Container
    style={{
      backgroundColor: highlight ? colors.primaryLight + '10' : colors.background,
      border: `1px solid ${highlight ? colors.primary : colors.border}`,
      borderRadius: '12px',
      padding: spacing.lg,
      margin: `${spacing.md} 0`,
      textAlign: 'center',
    }}
  >
    {icon && (
      <div style={{ marginBottom: spacing.md }}>
        <Img
          src={icon}
          alt={title}
          width="48"
          height="48"
          style={{ margin: '0 auto' }}
        />
      </div>
    )}
    <Text
      style={{
        ...typography.heading.h4,
        color: colors.text,
        margin: '0 0 8px 0',
      }}
    >
      {title}
    </Text>
    <Text
      style={{
        ...typography.body.medium,
        color: colors.textSecondary,
        margin: '0',
      }}
    >
      {description}
    </Text>
    {children}
  </Container>
);

// Professional Stats/Highlight Component
export const StatsHighlight = ({
  value,
  label,
  description,
  color = colors.primary,
}: {
  value: string;
  label: string;
  description?: string;
  color?: string;
}) => (
  <Container
    style={{
      backgroundColor: color + '10',
      border: `2px solid ${color}`,
      borderRadius: '12px',
      padding: spacing.lg,
      textAlign: 'center',
      margin: `${spacing.md} 0`,
    }}
  >
    <Text
      style={{
        ...typography.display.hero,
        color: color,
        margin: '0 0 4px 0',
        fontSize: '40px',
      }}
    >
      {value}
    </Text>
    <Text
      style={{
        ...typography.heading.h4,
        color: colors.text,
        margin: '0 0 8px 0',
      }}
    >
      {label}
    </Text>
    {description && (
      <Text
        style={{
          ...typography.body.small,
          color: colors.textSecondary,
          margin: '0',
        }}
      >
        {description}
      </Text>
    )}
  </Container>
);

// Enhanced Call-to-Action Section
export const CallToActionSection = ({
  title,
  description,
  buttonText,
  buttonUrl,
  secondaryButtonText,
  secondaryButtonUrl,
  variant = 'primary',
}: {
  title: string;
  description: string;
  buttonText: string;
  buttonUrl: string;
  secondaryButtonText?: string;
  secondaryButtonUrl?: string;
  variant?: 'primary' | 'secondary';
}) => (
  <Section
    style={{
      padding: `${spacing['2xl']} ${spacing.xl}`,
      textAlign: 'center',
      background: variant === 'primary'
        ? `linear-gradient(135deg, #ffffff 0%, ${colors.primary}10 30%, ${colors.primary}15 100%)`
        : `linear-gradient(135deg, ${colors.backgroundSecondary} 0%, ${colors.backgroundTertiary} 100%)`,
      position: 'relative',
    }}
  >
    {/* Gradient overlay for depth */}
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: variant === 'primary'
        ? `radial-gradient(circle at 30% 30%, ${colors.primary}10 0%, transparent 60%)`
        : `radial-gradient(circle at 70% 70%, ${colors.primary}05 0%, transparent 60%)`,
      pointerEvents: 'none',
    }} />
    <div style={{ position: 'relative', zIndex: 1 }}>
      <Text
        style={{
          ...typography.heading.h2,
          color: colors.text,
          margin: '0 0 16px 0',
        }}
      >
        {title}
      </Text>
      <Text
        style={{
          ...typography.body.large,
          color: colors.textSecondary,
          margin: '0 0 32px 0',
          maxWidth: '480px',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        {description}
      </Text>
      <div style={{ display: 'flex', gap: spacing.md, justifyContent: 'center', flexWrap: 'wrap' }}>
        <EmailButton href={buttonUrl} variant="primary" size="large">
          {buttonText}
        </EmailButton>
        {secondaryButtonText && secondaryButtonUrl && (
          <EmailButton href={secondaryButtonUrl} variant="outline" size="large">
            {secondaryButtonText}
          </EmailButton>
        )}
      </div>
    </div>
  </Section>
);

// Professional Testimonial Component
export const TestimonialCard = ({
  quote,
  author,
  role,
  avatar,
}: {
  quote: string;
  author: string;
  role: string;
  avatar?: string;
}) => (
  <Container
    style={{
      backgroundColor: colors.background,
      border: `1px solid ${colors.border}`,
      borderRadius: '12px',
      padding: spacing.xl,
      margin: `${spacing.lg} 0`,
      textAlign: 'center',
      position: 'relative',
    }}
  >
    <Text
      style={{
        ...typography.body.large,
        color: colors.text,
        fontStyle: 'italic',
        margin: '0 0 24px 0',
        lineHeight: '1.7',
      }}
    >
      "{quote}"
    </Text>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: spacing.md }}>
      {avatar && (
        <Img
          src={avatar}
          alt={author}
          width="48"
          height="48"
          style={{ borderRadius: '50%' }}
        />
      )}
      <div>
        <Text
          style={{
            ...typography.body.medium,
            color: colors.text,
            fontWeight: '600',
            margin: '0 0 4px 0',
          }}
        >
          {author}
        </Text>
        <Text
          style={{
            ...typography.body.small,
            color: colors.textMuted,
            margin: '0',
          }}
        >
          {role}
        </Text>
      </div>
    </div>
  </Container>
);

// Advanced Progress Bar Component
export const ProgressBar = ({
  progress,
  label,
  color = colors.primary,
  showPercentage = true,
}: {
  progress: number; // 0-100
  label?: string;
  color?: string;
  showPercentage?: boolean;
}) => (
  <Container style={{ margin: `${spacing.md} 0` }}>
    {label && (
      <Text style={{ ...typography.body.small, color: colors.textSecondary, marginBottom: spacing.sm }}>
        {label}
      </Text>
    )}
    <div style={{
      backgroundColor: colors.borderLight,
      borderRadius: '8px',
      height: '8px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      <div style={{
        backgroundColor: color,
        height: '100%',
        width: `${Math.min(100, Math.max(0, progress))}%`,
        borderRadius: '8px',
        transition: 'width 0.3s ease',
      }} />
    </div>
    {showPercentage && (
      <Text style={{
        ...typography.body.xs,
        color: colors.textMuted,
        textAlign: 'right',
        marginTop: spacing.xs
      }}>
        {Math.round(progress)}%
      </Text>
    )}
  </Container>
);

// Countdown Timer Component
export const CountdownTimer = ({
  targetDate,
  label = "Time remaining",
  onExpire,
}: {
  targetDate: string; // ISO date string
  label?: string;
  onExpire?: () => void;
}) => {
  const target = new Date(targetDate).getTime();
  const now = new Date().getTime();
  const difference = target - now;

  if (difference <= 0) {
    return (
      <Container style={{
        backgroundColor: colors.errorLight,
        border: `1px solid ${colors.error}`,
        borderRadius: '8px',
        padding: spacing.md,
        textAlign: 'center',
      }}>
        <Text style={{ ...typography.body.medium, color: colors.error, margin: '0' }}>
          ⏰ Time's up!
        </Text>
      </Container>
    );
  }

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <Container style={{
      backgroundColor: colors.warningLight,
      border: `1px solid ${colors.warning}`,
      borderRadius: '8px',
      padding: spacing.lg,
      textAlign: 'center',
    }}>
      <Text style={{ ...typography.body.small, color: colors.textSecondary, marginBottom: spacing.sm }}>
        {label}
      </Text>
      <div style={{ display: 'flex', justifyContent: 'center', gap: spacing.md }}>
        {days > 0 && (
          <div style={{ textAlign: 'center' }}>
            <Text style={{ ...typography.heading.h3, color: colors.warning, margin: '0' }}>
              {days}
            </Text>
            <Text style={{ ...typography.body.xs, color: colors.textMuted, margin: '0' }}>
              days
            </Text>
          </div>
        )}
        <div style={{ textAlign: 'center' }}>
          <Text style={{ ...typography.heading.h3, color: colors.warning, margin: '0' }}>
            {hours}
          </Text>
          <Text style={{ ...typography.body.xs, color: colors.textMuted, margin: '0' }}>
            hours
          </Text>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Text style={{ ...typography.heading.h3, color: colors.warning, margin: '0' }}>
            {minutes}
          </Text>
          <Text style={{ ...typography.body.xs, color: colors.textMuted, margin: '0' }}>
            minutes
          </Text>
        </div>
      </div>
    </Container>
  );
};

// Interactive Rating Component
export const RatingStars = ({
  rating,
  maxRating = 5,
  size = 'medium',
  showValue = true,
}: {
  rating: number;
  maxRating?: number;
  size?: 'small' | 'medium' | 'large';
  showValue?: boolean;
}) => {
  const sizes = {
    small: '16px',
    medium: '20px',
    large: '24px',
  };

  const stars = [];
  for (let i = 1; i <= maxRating; i++) {
    const isFilled = i <= rating;
    const isHalfFilled = i - 0.5 <= rating && i > rating;

    stars.push(
      <span
        key={i}
        style={{
          color: isFilled ? colors.warning : colors.border,
          fontSize: sizes[size],
          marginRight: '2px',
        }}
      >
        {isHalfFilled ? '☆' : isFilled ? '★' : '☆'}
      </span>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: spacing.sm }}>
      <div>{stars}</div>
      {showValue && (
        <Text style={{ ...typography.body.small, color: colors.textSecondary, margin: '0' }}>
          {rating.toFixed(1)}/{maxRating}
        </Text>
      )}
    </div>
  );
};

// Timeline Component
export const Timeline = ({
  steps,
  currentStep = 0,
}: {
  steps: Array<{
    title: string;
    description?: string;
    completed?: boolean;
  }>;
  currentStep?: number;
}) => (
  <Container style={{ margin: `${spacing.lg} 0` }}>
    {steps.map((step, index) => (
      <div key={index} style={{ display: 'flex', marginBottom: spacing.lg }}>
        <div style={{
          width: '24px',
          height: '24px',
          borderRadius: '50%',
          backgroundColor: index <= currentStep ? colors.success : colors.borderLight,
          color: index <= currentStep ? colors.background : colors.textMuted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          marginRight: spacing.md,
          flexShrink: 0,
        }}>
          {index < currentStep ? '✓' : index + 1}
        </div>
        <div style={{ flex: 1 }}>
          <Text style={{
            ...typography.body.medium,
            color: index <= currentStep ? colors.text : colors.textMuted,
            fontWeight: index === currentStep ? '600' : '400',
            margin: '0 0 4px 0',
          }}>
            {step.title}
          </Text>
          {step.description && (
            <Text style={{
              ...typography.body.small,
              color: colors.textSecondary,
              margin: '0',
            }}>
              {step.description}
            </Text>
          )}
        </div>
      </div>
    ))}
  </Container>
);

// Interactive Button with Hover States
export const InteractiveButton = ({
  href,
  children,
  variant = 'primary',
  size = 'medium',
  fullWidth = false,
  disabled = false,
  trackingId,
}: {
  href: string;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'success' | 'warning' | 'error';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  disabled?: boolean;
  trackingId?: string;
}) => {
  const variants = {
    primary: { bg: colors.primary, color: colors.background, border: colors.primary },
    secondary: { bg: colors.secondary, color: colors.background, border: colors.secondary },
    outline: { bg: 'transparent', color: colors.primary, border: colors.primary },
    ghost: { bg: colors.backgroundSecondary, color: colors.text, border: 'transparent' },
    success: { bg: colors.success, color: colors.background, border: colors.success },
    warning: { bg: colors.warning, color: colors.background, border: colors.warning },
    error: { bg: colors.error, color: colors.background, border: colors.error },
  };

  const sizes = {
    small: { padding: '8px 16px', fontSize: '14px' },
    medium: { padding: '12px 24px', fontSize: '16px' },
    large: { padding: '16px 32px', fontSize: '18px' },
  };

  const safeVariant = variant || 'primary';
  const safeSize = size || 'medium';
  const style = variants[safeVariant] || variants.primary;
  const sizeStyle = sizes[safeSize] || sizes.medium;

  return disabled ? (
    <span
      style={{
        backgroundColor: colors.textMuted,
        color: colors.background,
        border: `1px solid ${colors.textMuted}`,
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
    <Link
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
        // Add tracking pixel for analytics
        ...(trackingId && {
          backgroundImage: `url('https://api.cribnosh.com/track/button/${trackingId}')`,
          backgroundSize: '1px 1px',
          backgroundRepeat: 'no-repeat',
        }),
      }}
    >
      {children}
    </Link>
  );
};

// Enhanced Social Proof Component
export const SocialProof = ({
  testimonials,
  stats,
}: {
  testimonials?: Array<{
    quote: string;
    author: string;
    role: string;
    avatar?: string;
  }>;
  stats?: Array<{
    value: string;
    label: string;
  }>;
}) => (
  <Container style={{ margin: `${spacing.xl} 0` }}>
    {stats && (
      <div style={{
        display: 'flex',
        justifyContent: 'space-around',
        marginBottom: spacing.xl,
        flexWrap: 'wrap',
        gap: spacing.md,
      }}>
        {stats.map((stat, index) => (
          <div key={index} style={{ textAlign: 'center' }}>
            <Text style={{ ...typography.heading.h2, color: colors.primary, margin: '0' }}>
              {stat.value}
            </Text>
            <Text style={{ ...typography.body.small, color: colors.textSecondary, margin: '0' }}>
              {stat.label}
            </Text>
          </div>
        ))}
      </div>
    )}

    {testimonials && (
      <div>
        <Text style={{
          ...typography.heading.h3,
          textAlign: 'center',
          marginBottom: spacing.lg,
          color: colors.text,
        }}>
          What Our Community Says
        </Text>
        {testimonials.map((testimonial, index) => (
          <TestimonialCard
            key={index}
            quote={testimonial.quote}
            author={testimonial.author}
            role={testimonial.role}
            avatar={testimonial.avatar}
          />
        ))}
      </div>
    )}
  </Container>
);

// Export everything for backward compatibility
export {
  Body, Column, Container, Font, Head, Hr,
  Html, Img, Link, Preview, Row, Section,
  Text
};
