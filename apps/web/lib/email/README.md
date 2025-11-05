# CribNosh Email System

A comprehensive, professional email system built with React Email, featuring modern design, accessibility, analytics, and internationalization support.

## 🚀 Features

### ✨ **Professional Design System**
- **Brand-Consistent Colors**: CribNosh red (#F23E2E) with proper contrast ratios
- **Typography**: Asgard for headings, Satoshi for body text
- **Responsive Design**: Mobile-first approach with proper breakpoints
- **Modern Components**: Cards, buttons, progress bars, timelines, and more

### 🎨 **Advanced Components**
- **ProgressBar**: Visual progress indicators with customizable colors
- **CountdownTimer**: Time-sensitive offers with automatic expiry
- **RatingStars**: Interactive rating displays
- **Timeline**: Step-by-step process visualization
- **SocialProof**: Testimonials and statistics
- **InteractiveButton**: Enhanced buttons with tracking support

### 🌍 **Internationalization**
- **Multi-Language Support**: English, Spanish, French
- **Automatic Detection**: Language detection from user preferences
- **Localized Content**: All text content translated
- **RTL Support**: Ready for right-to-left languages

### 🌙 **Dark Mode Support**
- **Complete Dark Theme**: All templates available in dark mode
- **Automatic Detection**: User preference-based switching
- **Accessibility**: Proper contrast ratios maintained
- **Consistent Branding**: CribNosh colors adapted for dark mode

### 📊 **Analytics & Tracking**
- **Open Tracking**: Pixel-based email open tracking
- **Click Tracking**: Link click analytics with element identification
- **Device Detection**: Mobile, desktop, tablet identification
- **Email Client Detection**: Gmail, Outlook, Apple Mail, etc.
- **Performance Metrics**: Render time, size, and compatibility analysis

### ♿ **Accessibility**
- **Screen Reader Support**: Proper ARIA labels and semantic HTML
- **Color Contrast**: WCAG AA compliant color combinations
- **Keyboard Navigation**: Full keyboard accessibility
- **Alt Text**: Comprehensive image alt text support
- **Focus Management**: Proper focus indicators

### 🧪 **Testing & Validation**
- **Template Validation**: Automated template testing
- **Performance Testing**: Render time and memory usage analysis
- **Accessibility Testing**: Automated accessibility checks
- **Email Client Testing**: Compatibility across major email clients
- **Preview System**: Development preview with sample data

## 📁 File Structure

```
lib/email/
├── components.tsx              # Core email components and design system
├── templates/
│   ├── welcome.tsx            # Welcome email template
│   ├── order-confirmation.tsx # Order confirmation with progress tracking
│   ├── otp-verification.tsx   # OTP verification email
│   ├── promotional.tsx        # Promotional email with countdown
│   ├── chef-application.tsx   # Chef application confirmation
│   ├── generic-notification.tsx # Generic notification template
│   ├── form-confirmation.tsx  # Form submission confirmation
│   ├── admin-notification.tsx # Admin notification template
│   └── dark-mode.tsx         # Dark mode variants
├── analytics.ts               # Email analytics and tracking
├── i18n.ts                   # Internationalization system
├── testing.ts                # Testing and validation utilities
├── preview.tsx               # Email preview system
└── README.md                 # This file
```

## 🛠 Usage

### Basic Email Template

```typescript
import { WelcomeEmail } from './templates/welcome';
import { render } from '@react-email/render';

const emailHtml = render(WelcomeEmail({
  name: 'John Doe',
  verificationUrl: 'https://cribnosh.com/verify?token=abc123',
  unsubscribeUrl: 'https://cribnosh.com/unsubscribe',
  companyAddress: 'CribNosh – Personalized Dining, Every Time.',
}));
```

### Advanced Components

```typescript
import { 
  ProgressBar, 
  CountdownTimer, 
  RatingStars, 
  Timeline,
  SocialProof 
} from './templates/components';

// Progress bar
<ProgressBar 
  progress={75} 
  label="Order Progress" 
  color="#F23E2E" 
/>

// Countdown timer
<CountdownTimer 
  targetDate="2024-12-31T23:59:59Z" 
  label="Offer expires in" 
/>

// Rating stars
<RatingStars 
  rating={4.8} 
  maxRating={5} 
  size="large" 
/>

// Timeline
<Timeline 
  steps={[
    { title: 'Order Confirmed', completed: true },
    { title: 'Preparing', completed: false },
    { title: 'Delivered', completed: false }
  ]}
  currentStep={1}
/>

// Social proof
<SocialProof 
  stats={[
    { value: '10,000+', label: 'Happy Customers' },
    { value: '4.9/5', label: 'Average Rating' }
  ]}
  testimonials={[
    {
      quote: "Amazing food!",
      author: "Sarah M.",
      role: "Customer"
    }
  ]}
/>
```

### Internationalization

```typescript
import { translate, detectLanguage, getLocalizedSubject } from './i18n';

// Detect user language
const language = detectLanguage({
  language: 'es',
  country: 'ES'
});

// Get localized content
const subject = getLocalizedSubject('welcome', language, {
  name: 'Juan'
});
// Returns: "¡Bienvenido a CribNosh - Tu Viaje Culinario Personal Comienza!"

// Translate specific text
const greeting = translate('es', 'welcome.greeting', { name: 'Juan' });
// Returns: "¡Hola Juan! 👋"
```

### Analytics & Tracking

```typescript
import { 
  generateTrackingPixel, 
  trackLink, 
  addTrackingToEmail 
} from './analytics';

// Add tracking to email
const emailId = 'email_123';
const trackedHtml = addTrackingToEmail(originalHtml, emailId);

// Track specific links
const trackedUrl = trackLink(
  'https://cribnosh.com/order',
  emailId,
  'cta_button'
);
```

### Dark Mode

```typescript
import { DarkModeOTPVerificationEmail } from './templates/dark-mode';

const darkModeHtml = render(DarkModeOTPVerificationEmail({
  otpCode: '123456',
  recipientName: 'John Doe',
  expiryMinutes: 5
}));
```

### Testing & Validation

```typescript
import { runComprehensiveEmailTests } from './testing';

// Run all tests
const testResults = await runComprehensiveEmailTests();

console.log(`✅ ${testResults.summary.passedTemplates}/${testResults.summary.totalTemplates} templates passed`);
console.log(`📈 Average score: ${testResults.summary.averageScore}%`);

// Generate test report
console.log(testResults.report);
```

## 🎨 Design System

### Colors
- **Primary**: #F23E2E (CribNosh Red)
- **Secondary**: #1A1A1A (Deep Black)
- **Success**: #10B981
- **Warning**: #F59E0B
- **Error**: #EF4444
- **Info**: #3B82F6

### Typography
- **Headings**: Asgard font family
- **Body Text**: Satoshi font family
- **Sizes**: 12px, 14px, 16px, 18px, 20px, 24px, 28px, 30px, 36px, 48px

### Spacing
- **Scale**: 4px, 8px, 16px, 24px, 32px, 48px, 64px
- **Consistent**: Used throughout all components

## 📱 Responsive Design

All email templates are built mobile-first with:
- **Breakpoints**: Mobile (default), Tablet (768px+), Desktop (1024px+)
- **Flexible Layouts**: Tables and CSS Grid for email client compatibility
- **Touch-Friendly**: Large buttons and touch targets
- **Readable Text**: Proper font sizes and line heights

## ♿ Accessibility Features

- **WCAG AA Compliance**: Color contrast ratios meet accessibility standards
- **Screen Reader Support**: Proper semantic HTML and ARIA labels
- **Keyboard Navigation**: All interactive elements are keyboard accessible
- **Alt Text**: All images include descriptive alt text
- **Focus Indicators**: Clear focus states for interactive elements

## 🧪 Testing

### Automated Tests
- **Template Validation**: Ensures all templates render correctly
- **Performance Testing**: Measures render time and memory usage
- **Accessibility Testing**: Checks for accessibility compliance
- **Email Client Testing**: Validates compatibility across clients

### Manual Testing
- **Preview System**: Visual preview of all templates
- **Sample Data**: Pre-populated with realistic test data
- **Multiple Devices**: Test on various screen sizes
- **Email Clients**: Test in Gmail, Outlook, Apple Mail, etc.

## 🚀 Performance

- **Fast Rendering**: Optimized for quick email generation
- **Small File Size**: Compressed HTML output
- **Efficient Components**: Reusable, optimized components
- **Caching**: Template caching for improved performance

## 📊 Analytics

### Tracked Events
- **Email Opens**: Pixel-based tracking
- **Link Clicks**: Individual link click tracking
- **Device Types**: Mobile, desktop, tablet detection
- **Email Clients**: Gmail, Outlook, Apple Mail, etc.
- **Geographic Data**: Country and region tracking

### Metrics Available
- **Open Rate**: Percentage of emails opened
- **Click Rate**: Percentage of links clicked
- **Unsubscribe Rate**: Percentage of unsubscribes
- **Bounce Rate**: Percentage of bounced emails
- **Complaint Rate**: Percentage of spam complaints

## 🌍 Internationalization

### Supported Languages
- **English** (en) - Default
- **Spanish** (es) - Español
- **French** (fr) - Français

### Adding New Languages
1. Add language code to `supportedLanguages` array
2. Create translation object in `translations` record
3. Add language name to `languageNames` object
4. Test with new language

## 🔧 Configuration

### Environment Variables
```bash
EMAIL_TRACKING_BASE_URL=https://api.cribnosh.com
RESEND_API_KEY=your_resend_api_key
```

### Customization
- **Colors**: Modify color palette in `components.tsx`
- **Typography**: Update font families and sizes
- **Spacing**: Adjust spacing scale
- **Components**: Add new components as needed

## 📈 Best Practices

### Email Design
- Keep emails under 100KB for better delivery
- Use tables for layout (email client compatibility)
- Include alt text for all images
- Test across multiple email clients
- Use web-safe fonts with fallbacks

### Performance
- Optimize images for email
- Minimize external dependencies
- Use inline CSS for styling
- Test render performance regularly

### Accessibility
- Maintain proper color contrast
- Use semantic HTML elements
- Provide text alternatives for images
- Ensure keyboard navigation works
- Test with screen readers

## 🐛 Troubleshooting

### Common Issues
1. **Template not rendering**: Check data structure matches interface
2. **Styling issues**: Ensure inline CSS is used
3. **Tracking not working**: Verify tracking URLs are accessible
4. **Dark mode not working**: Check dark mode component usage

### Debug Mode
```typescript
// Enable debug logging
process.env.EMAIL_DEBUG = 'true';
```

## 📝 License

This email system is part of the CribNosh project and follows the same licensing terms.

## 🤝 Contributing

1. Follow the existing code style
2. Add tests for new features
3. Update documentation
4. Test across email clients
5. Ensure accessibility compliance

## 📞 Support

For questions or issues with the email system:
- Check the troubleshooting section
- Review the testing utilities
- Test with the preview system
- Contact the development team

---

**Built with ❤️ for CribNosh - Personalized Dining, Every Time.**
