/**
 * Content sanitization utilities for blog posts and other content
 * Handles character encoding issues and standardizes punctuation
 */

export interface SanitizationOptions {
  normalizeQuotes?: boolean;
  normalizeDashes?: boolean;
  normalizeApostrophes?: boolean;
  normalizeTemperature?: boolean;
  normalizeAccents?: boolean;
}

const DEFAULT_OPTIONS: SanitizationOptions = {
  normalizeQuotes: true,
  normalizeDashes: true,
  normalizeApostrophes: true,
  normalizeTemperature: true,
  normalizeAccents: true,
};

/**
 * Common character encoding fixes
 */
const ENCODING_FIXES = [
  // Malformed en-dashes
  { from: /â€'/g, to: '–' },
  { from: /â€"/g, to: '–' },
  { from: /â€'/g, to: '–' },
  
  // Malformed apostrophes and quotes
  { from: /â€™/g, to: "'" },
  { from: /â€œ/g, to: '"' },
  { from: /â€/g, to: '"' },
  
  // Malformed bullets
  { from: /â€¢/g, to: '•' },
  
  // Malformed accented characters
  { from: /entrÃ©e/g, to: 'entrée' },
  { from: /Ã©/g, to: 'é' },
  { from: /Ã /g, to: 'à' },
  { from: /Ã¢/g, to: 'â' },
  { from: /Ã´/g, to: 'ô' },
  { from: /Ã¨/g, to: 'è' },
  { from: /Ã§/g, to: 'ç' },
  { from: /Ã¹/g, to: 'ù' },
  { from: /Ã®/g, to: 'î' },
  { from: /Ã¯/g, to: 'ï' },
  
  // Temperature symbols
  { from: /Â°C/g, to: '°C' },
  { from: /Â°F/g, to: '°F' },
  
  // Other common issues
  { from: /â€¦/g, to: '…' },
  { from: /â€"/g, to: '–' },
  
  // Invisible/zero-width characters (often used in email templates)
  { from: /â€Œ/g, to: '' },  // Zero-width non-joiner
  { from: /â€‹/g, to: '' },  // Zero-width space
  { from: /â€/g, to: '' },   // Zero-width space variant
  { from: /â€Ž/g, to: '' },  // Left-to-right mark
  { from: /â€/g, to: '' },   // Right-to-left mark
  { from: /ï»¿/g, to: '' },  // Zero-width no-break space (BOM)
  
  // Additional invisible characters
  { from: /\u200B/g, to: '' },  // Zero-width space
  { from: /\u200C/g, to: '' },  // Zero-width non-joiner
  { from: /\u200D/g, to: '' },  // Zero-width joiner
  { from: /\u200E/g, to: '' },  // Left-to-right mark
  { from: /\u200F/g, to: '' },  // Right-to-left mark
  { from: /\uFEFF/g, to: '' },  // Zero-width no-break space (BOM)
];

/**
 * Sanitizes text content by fixing common character encoding issues
 */
export function sanitizeContent(
  content: string,
  options: SanitizationOptions = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let sanitized = content;

  // Apply encoding fixes
  ENCODING_FIXES.forEach(({ from, to }) => {
    sanitized = sanitized.replace(from, to);
  });

  // Additional normalization based on options
  if (opts.normalizeQuotes) {
    // Normalize different quote types to standard quotes
    sanitized = sanitized
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'");
  }

  if (opts.normalizeDashes) {
    // Normalize different dash types to en-dash
    sanitized = sanitized
      .replace(/—/g, '–')  // em-dash to en-dash
      .replace(/-/g, '–'); // hyphen to en-dash (be careful with this one)
  }

  if (opts.normalizeApostrophes) {
    // Normalize different apostrophe types
    sanitized = sanitized
      .replace(/['']/g, "'");
  }

  return sanitized;
}

// Define interfaces for better type safety
interface ContentSection {
  id: string;
  title: string;
  paragraphs?: string[];
  bullets?: string[];
  checklist?: string[];
  proTips?: string[];
  callout?: {
    variant: string;
    text: string;
  };
}

interface BlogPost {
  title: string;
  description: string;
  content?: string;
  excerpt?: string;
  body?: string[];
  sections?: ContentSection[];
  headings?: Array<{ id: string; text: string }>;
  categories?: string[];
  [key: string]: unknown; // Allow additional properties
}

// Import the ByUsPost type from the posts module
import type { ByUsPost } from '../byus/posts';

/**
 * Sanitizes a blog post object
 */
export function sanitizeBlogPost(post: BlogPost): BlogPost {
  return {
    ...post,
    title: sanitizeContent(post.title),
    description: sanitizeContent(post.description),
    content: post.content ? sanitizeContent(post.content) : post.content,
    excerpt: post.excerpt ? sanitizeContent(post.excerpt) : post.excerpt,
    body: post.body ? post.body.map((paragraph: string) => sanitizeContent(paragraph)) : post.body,
    sections: post.sections ? post.sections.map((section: ContentSection) => ({
      ...section,
      title: sanitizeContent(section.title),
      paragraphs: section.paragraphs ? section.paragraphs.map((p: string) => sanitizeContent(p)) : section.paragraphs,
      bullets: section.bullets ? section.bullets.map((b: string) => sanitizeContent(b)) : section.bullets,
      checklist: section.checklist ? section.checklist.map((c: string) => sanitizeContent(c)) : section.checklist,
      proTips: section.proTips ? section.proTips.map((t: string) => sanitizeContent(t)) : section.proTips,
      callout: section.callout ? {
        ...section.callout,
        text: sanitizeContent(section.callout.text)
      } : section.callout,
    })) : post.sections,
  };
}

/**
 * Sanitizes a ByUsPost object specifically
 */
export function sanitizeByUsPost(post: ByUsPost): ByUsPost {
  return {
    ...post,
    title: sanitizeContent(post.title),
    description: sanitizeContent(post.description),
    body: post.body.map((paragraph: string) => sanitizeContent(paragraph)),
    sections: post.sections ? post.sections.map((section: any) => ({
      ...section,
      title: sanitizeContent(section.title),
      paragraphs: section.paragraphs.map((p: string) => sanitizeContent(p)),
      bullets: section.bullets ? section.bullets.map((b: string) => sanitizeContent(b)) : section.bullets,
      checklist: section.checklist ? section.checklist.map((c: string) => sanitizeContent(c)) : section.checklist,
      proTips: section.proTips ? section.proTips.map((t: string) => sanitizeContent(t)) : section.proTips,
      callout: section.callout ? {
        ...section.callout,
        text: sanitizeContent(section.callout.text)
      } : section.callout,
    })) : post.sections,
  };
}

/**
 * Validates that content doesn't contain malformed characters
 */
export function validateContent(content: string): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for common malformed characters
  const malformedPatterns = [
    { pattern: /â€'|â€"|â€'/g, message: 'Malformed en-dash detected' },
    { pattern: /â€™/g, message: 'Malformed apostrophe detected' },
    { pattern: /â€œ|â€/g, message: 'Malformed quotes detected' },
    { pattern: /â€¢/g, message: 'Malformed bullet point detected' },
    { pattern: /Â°[CF]/g, message: 'Malformed temperature symbol detected' },
    { pattern: /Ã[aeiouàâäéèêëïîôùûüÿç]/g, message: 'Malformed accented character detected' },
    { pattern: /â€Œ|â€‹|â€|â€Ž|â€|ï»¿/g, message: 'Invisible character detected' },
    { pattern: /[\u200B\u200C\u200D\u200E\u200F\uFEFF]/g, message: 'Invisible character detected' },
  ];

  malformedPatterns.forEach(({ pattern, message }) => {
    if (pattern.test(content)) {
      issues.push(message);
    }
  });

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Batch sanitize multiple content items
 */
export function sanitizeContentBatch<T extends Record<string, unknown>>(
  items: T[],
  textFields: (keyof T)[]
): T[] {
  return items.map(item => {
    const sanitized = { ...item };
    textFields.forEach(field => {
      if (typeof sanitized[field] === 'string') {
        (sanitized as T)[field] = sanitizeContent(sanitized[field] as string) as T[keyof T];
      }
    });
    return sanitized;
  });
}
