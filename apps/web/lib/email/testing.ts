// Email Template Testing and Validation Utilities
import { render } from '@react-email/render';
import { validateEmailTemplate, renderEmailTemplate } from './preview';
import { logger } from '@/lib/utils/logger';

export interface EmailTestResult {
  templateName: string;
  passed: boolean;
  score: number;
  issues: string[];
  warnings: string[];
  suggestions: string[];
  html: string;
  size: number;
  performance: {
    renderTime: number;
    htmlSize: number;
    imageCount: number;
    linkCount: number;
  };
  accessibility: {
    hasAltText: boolean;
    hasProperHeadings: boolean;
    hasUnsubscribeLink: boolean;
    hasCompanyInfo: boolean;
    colorContrast: 'good' | 'warning' | 'poor';
  };
  compatibility: {
    gmail: boolean;
    outlook: boolean;
    appleMail: boolean;
    yahoo: boolean;
  };
}

export interface EmailTestSuite {
  name: string;
  tests: Array<{
    name: string;
    template: string;
    data: any;
    expectedResults: Partial<EmailTestResult>;
  }>;
}

// Email template validation tests
export const runEmailValidationTests = async (): Promise<EmailTestResult[]> => {
  const templates = [
    'welcome',
    'orderConfirmation',
    'otpVerification',
    'promotional',
    'chefApplication',
    'genericNotification',
    'formConfirmation',
    'adminNotification',
  ];

  const results: EmailTestResult[] = [];

  for (const templateName of templates) {
    try {
      const startTime = performance.now();
      
      // Sample data for testing
      const sampleData = getSampleDataForTemplate(templateName);
      const validation = await validateEmailTemplate(templateName, sampleData);
      
      const renderTime = performance.now() - startTime;
      
      // Analyze HTML content
      const html = validation.html;
      const imageCount = (html.match(/<img/g) || []).length;
      const linkCount = (html.match(/<a/g) || []).length;
      const htmlSize = new Blob([html]).size;
      
      // Accessibility checks
      const accessibility = {
        hasAltText: (html.match(/alt="[^"]*"/g) || []).length > 0,
        hasProperHeadings: /<h[1-6][^>]*>/i.test(html),
        hasUnsubscribeLink: /unsubscribe/i.test(html),
        hasCompanyInfo: /CribNosh/i.test(html),
        colorContrast: checkColorContrast(html),
      };
      
      // Compatibility checks
      const compatibility = {
        gmail: checkGmailCompatibility(html),
        outlook: checkOutlookCompatibility(html),
        appleMail: checkAppleMailCompatibility(html),
        yahoo: checkYahooCompatibility(html),
      };
      
      // Generate issues and warnings
      const issues: string[] = [];
      const warnings: string[] = [];
      const suggestions: string[] = [];
      
      if (!validation.valid) {
        issues.push('Template validation failed');
      }
      
      if (htmlSize > 100000) { // 100KB
        warnings.push('Email size is large, may affect delivery');
      }
      
      if (imageCount > 10) {
        warnings.push('High number of images may affect loading');
      }
      
      if (!accessibility.hasAltText) {
        issues.push('Missing alt text for images');
      }
      
      if (!accessibility.hasUnsubscribeLink) {
        issues.push('Missing unsubscribe link (legal requirement)');
      }
      
      if (accessibility.colorContrast === 'poor') {
        issues.push('Poor color contrast affects readability');
      }
      
      if (renderTime > 1000) { // 1 second
        warnings.push('Slow rendering time');
      }
      
      // Generate suggestions
      if (htmlSize > 50000) {
        suggestions.push('Consider optimizing images and reducing content size');
      }
      
      if (imageCount === 0) {
        suggestions.push('Consider adding images to improve engagement');
      }
      
      if (linkCount < 2) {
        suggestions.push('Add more call-to-action links');
      }
      
      const result: EmailTestResult = {
        templateName,
        passed: issues.length === 0,
        score: validation.score,
        issues,
        warnings,
        suggestions,
        html,
        size: htmlSize,
        performance: {
          renderTime,
          htmlSize,
          imageCount,
          linkCount,
        },
        accessibility,
        compatibility,
      };
      
      results.push(result);
    } catch (error) {
      results.push({
        templateName,
        passed: false,
        score: 0,
        issues: [`Failed to render template: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        suggestions: ['Check template syntax and data structure'],
        html: '',
        size: 0,
        performance: {
          renderTime: 0,
          htmlSize: 0,
          imageCount: 0,
          linkCount: 0,
        },
        accessibility: {
          hasAltText: false,
          hasProperHeadings: false,
          hasUnsubscribeLink: false,
          hasCompanyInfo: false,
          colorContrast: 'poor',
        },
        compatibility: {
          gmail: false,
          outlook: false,
          appleMail: false,
          yahoo: false,
        },
      });
    }
  }
  
  return results;
};

// Get sample data for template testing
const getSampleDataForTemplate = (templateName: string): any => {
  const sampleData: Record<string, any> = {
    welcome: {
      name: 'John Doe',
      verificationUrl: 'https://cribnosh.com/verify?token=abc123',
      unsubscribeUrl: 'https://cribnosh.com/unsubscribe',
      companyAddress: 'CribNosh – Personalized Dining, Every Time.',
    },
    orderConfirmation: {
      orderNumber: 'CN-2024-001',
      customerName: 'John Doe',
      items: [
        { name: 'Chicken Biryani', quantity: 2, price: 15.99, specialInstructions: 'Extra spicy' },
        { name: 'Naan Bread', quantity: 4, price: 3.99 },
      ],
      chef: {
        name: 'Priya Sharma',
        kitchen: 'Priya\'s Kitchen',
        image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
      },
      total: 44.95,
      deliveryTime: '7:30 PM - 8:00 PM',
      deliveryAddress: '123 Main St, City, State 12345',
      trackingUrl: 'https://cribnosh.com/track/CN-2024-001',
      unsubscribeUrl: 'https://cribnosh.com/unsubscribe',
      companyAddress: 'CribNosh – Personalized Dining, Every Time.',
    },
    otpVerification: {
      otpCode: '123456',
      recipientName: 'John Doe',
      expiryMinutes: 5,
      unsubscribeUrl: 'https://cribnosh.com/unsubscribe',
      companyAddress: 'CribNosh – Personalized Dining, Every Time.',
    },
    promotional: {
      recipientName: 'John Doe',
      promotionCode: 'WELCOME20',
      discountPercentage: 20,
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      featuredChefs: [
        {
          name: 'Maria Rodriguez',
          cuisine: 'Mexican',
          rating: 4.9,
          image: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face',
          speciality: 'Authentic Tacos',
        },
      ],
      unsubscribeUrl: 'https://cribnosh.com/unsubscribe',
      companyAddress: 'CribNosh – Personalized Dining, Every Time.',
    },
    chefApplication: {
      chefName: 'John Doe',
      nextSteps: ['Review application', 'Complete certification', 'Start taking orders'],
      timeline: '2-3 business days',
      documentsNeeded: ['ID', 'Insurance', 'Bank details'],
      contactEmail: 'chefs@cribnosh.com',
      unsubscribeUrl: 'https://cribnosh.com/unsubscribe',
      companyAddress: 'CribNosh – Personalized Dining, Every Time.',
    },
    genericNotification: {
      title: 'New Feature Alert!',
      message: 'We\'ve launched a new feature.',
      unsubscribeUrl: 'https://cribnosh.com/unsubscribe',
      address: 'CribNosh – Personalized Dining, Every Time.',
    },
    formConfirmation: {
      formName: 'Contact Form',
      customerName: 'John Doe',
      summary: 'Test submission',
      nextSteps: 'We\'ll review your message',
      unsubscribeUrl: 'https://cribnosh.com/unsubscribe',
      companyAddress: 'CribNosh – Personalized Dining, Every Time.',
    },
    adminNotification: {
      title: 'System Alert',
      details: 'Test notification',
      companyAddress: 'CribNosh – Personalized Dining, Every Time.',
    },
  };
  
  return sampleData[templateName] || {};
};

// Color contrast checker
const checkColorContrast = (html: string): 'good' | 'warning' | 'poor' => {
  // This is a simplified check - in production, you'd use a proper color contrast analyzer
  const hasDarkBackground = /background.*#(0|1|2|3|4|5|6|7|8|9|a|b|c|d|e|f){6}/i.test(html);
  const hasLightText = /color.*#(f|e|d|c|b|a|9|8|7|6|5|4|3|2|1|0){6}/i.test(html);
  
  if (hasDarkBackground && hasLightText) {
    return 'good';
  } else if (hasDarkBackground || hasLightText) {
    return 'warning';
  }
  
  return 'poor';
};

// Email client compatibility checks
const checkGmailCompatibility = (html: string): boolean => {
  // Gmail-specific checks
  const hasTableStructure = /<table[^>]*>/i.test(html);
  const hasInlineStyles = /style="[^"]*"/i.test(html);
  const noExternalCSS = !/<link[^>]*rel="stylesheet"/i.test(html);
  
  return hasTableStructure && hasInlineStyles && noExternalCSS;
};

const checkOutlookCompatibility = (html: string): boolean => {
  // Outlook-specific checks
  const hasTableStructure = /<table[^>]*>/i.test(html);
  const hasMsoConditionals = /<!--\[if/i.test(html);
  const hasVmlElements = /<v:/i.test(html);
  
  return hasTableStructure && (hasMsoConditionals || hasVmlElements);
};

const checkAppleMailCompatibility = (html: string): boolean => {
  // Apple Mail checks
  const hasWebkitStyles = /-webkit-/i.test(html);
  const hasMediaQueries = /@media/i.test(html);
  
  return hasWebkitStyles || hasMediaQueries;
};

const checkYahooCompatibility = (html: string): boolean => {
  // Yahoo Mail checks
  const hasTableStructure = /<table[^>]*>/i.test(html);
  const hasInlineStyles = /style="[^"]*"/i.test(html);
  
  return hasTableStructure && hasInlineStyles;
};

// Email performance testing
export const runPerformanceTests = async (templateName: string, iterations: number = 10): Promise<{
  averageRenderTime: number;
  minRenderTime: number;
  maxRenderTime: number;
  memoryUsage: number;
}> => {
  const renderTimes: number[] = [];
  const sampleData = getSampleDataForTemplate(templateName);
  
  for (let i = 0; i < iterations; i++) {
    const startTime = performance.now();
    try {
      await renderEmailTemplate(templateName, sampleData);
    } catch (error) {
      logger.warn(`Render failed on iteration ${i}:`, error);
    }
    const endTime = performance.now();
    renderTimes.push(endTime - startTime);
  }
  
  const averageRenderTime = renderTimes.reduce((a, b) => a + b, 0) / renderTimes.length;
  const minRenderTime = Math.min(...renderTimes);
  const maxRenderTime = Math.max(...renderTimes);
  
  // Estimate memory usage (simplified)
  const memoryUsage = process.memoryUsage?.()?.heapUsed || 0;
  
  return {
    averageRenderTime,
    minRenderTime,
    maxRenderTime,
    memoryUsage,
  };
};

// Email accessibility testing
export const runAccessibilityTests = (html: string): {
  score: number;
  issues: string[];
  warnings: string[];
  suggestions: string[];
} => {
  const issues: string[] = [];
  const warnings: string[] = [];
  const suggestions: string[] = [];
  
  // Check for alt text on images
  const images = html.match(/<img[^>]*>/gi) || [];
  const imagesWithoutAlt = images.filter(img => !img.includes('alt='));
  if (imagesWithoutAlt.length > 0) {
    issues.push(`${imagesWithoutAlt.length} images missing alt text`);
  }
  
  // Check for proper heading structure
  const headings = html.match(/<h[1-6][^>]*>/gi) || [];
  if (headings.length === 0) {
    warnings.push('No heading tags found - consider adding h1, h2, etc.');
  }
  
  // Check for links without descriptive text
  const links = html.match(/<a[^>]*>([^<]*)<\/a>/gi) || [];
  const nonDescriptiveLinks = links.filter(link => {
    const text = link.match(/<a[^>]*>([^<]*)<\/a>/)?.[1] || '';
    return text.length < 3 || /^(click here|read more|here)$/i.test(text.trim());
  });
  if (nonDescriptiveLinks.length > 0) {
    warnings.push(`${nonDescriptiveLinks.length} links with non-descriptive text`);
  }
  
  // Check for color-only information
  const colorOnlyInfo = /color:\s*#[0-9a-f]{6}/gi.test(html) && !/background-color/i.test(html);
  if (colorOnlyInfo) {
    warnings.push('Information conveyed only through color - ensure alternative indicators');
  }
  
  // Check for table headers
  const tables = html.match(/<table[^>]*>/gi) || [];
  const tablesWithoutHeaders = tables.filter(table => !html.includes('<th'));
  if (tablesWithoutHeaders.length > 0) {
    suggestions.push('Consider adding table headers for better screen reader support');
  }
  
  // Calculate accessibility score
  const totalChecks = 5;
  const passedChecks = totalChecks - issues.length - Math.ceil(warnings.length / 2);
  const score = Math.max(0, Math.min(100, (passedChecks / totalChecks) * 100));
  
  return {
    score,
    issues,
    warnings,
    suggestions,
  };
};

// Generate test report
export const generateTestReport = (results: EmailTestResult[]): string => {
  const totalTemplates = results.length;
  const passedTemplates = results.filter(r => r.passed).length;
  const averageScore = results.reduce((sum, r) => sum + r.score, 0) / totalTemplates;
  
  let report = `# CribNosh Email Template Test Report\n\n`;
  report += `## Summary\n`;
  report += `- Total Templates: ${totalTemplates}\n`;
  report += `- Passed: ${passedTemplates} (${Math.round((passedTemplates / totalTemplates) * 100)}%)\n`;
  report += `- Average Score: ${Math.round(averageScore)}%\n\n`;
  
  report += `## Template Results\n\n`;
  
  results.forEach(result => {
    report += `### ${result.templateName}\n`;
    report += `- **Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n`;
    report += `- **Score**: ${Math.round(result.score)}%\n`;
    report += `- **Size**: ${Math.round(result.size / 1024)}KB\n`;
    report += `- **Render Time**: ${Math.round(result.performance.renderTime)}ms\n`;
    
    if (result.issues.length > 0) {
      report += `- **Issues**:\n`;
      result.issues.forEach(issue => report += `  - ❌ ${issue}\n`);
    }
    
    if (result.warnings.length > 0) {
      report += `- **Warnings**:\n`;
      result.warnings.forEach(warning => report += `  - ⚠️ ${warning}\n`);
    }
    
    if (result.suggestions.length > 0) {
      report += `- **Suggestions**:\n`;
      result.suggestions.forEach(suggestion => report += `  - 💡 ${suggestion}\n`);
    }
    
    report += `\n`;
  });
  
  return report;
};

// Run comprehensive email tests
export const runComprehensiveEmailTests = async (): Promise<{
  results: EmailTestResult[];
  report: string;
  summary: {
    totalTemplates: number;
    passedTemplates: number;
    averageScore: number;
    totalIssues: number;
    totalWarnings: number;
  };
}> => {
  logger.log('🧪 Running comprehensive email template tests...');
  
  const results = await runEmailValidationTests();
  const report = generateTestReport(results);
  
  const summary = {
    totalTemplates: results.length,
    passedTemplates: results.filter(r => r.passed).length,
    averageScore: Math.round(results.reduce((sum, r) => sum + r.score, 0) / results.length),
    totalIssues: results.reduce((sum, r) => sum + r.issues.length, 0),
    totalWarnings: results.reduce((sum, r) => sum + r.warnings.length, 0),
  };
  
  logger.log('✅ Email tests completed!');
  logger.log(`📊 Results: ${summary.passedTemplates}/${summary.totalTemplates} templates passed`);
  logger.log(`📈 Average score: ${summary.averageScore}%`);
  
  return {
    results,
    report,
    summary,
  };
};

export default {
  runEmailValidationTests,
  runPerformanceTests,
  runAccessibilityTests,
  generateTestReport,
  runComprehensiveEmailTests,
};
