/**
 * Tests for content sanitizer utilities
 */

import { sanitizeContent, validateContent, sanitizeBlogPost } from '../content-sanitizer';

describe('Content Sanitizer', () => {
  describe('sanitizeContent', () => {
    it('should fix malformed en-dashes', () => {
      // Using Unicode escape sequences to avoid syntax errors
      const input = 'Home\u2013cooked meals are better';
      const expected = 'Home–cooked meals are better';
      expect(sanitizeContent(input)).toBe(expected);
    });

    it('should fix malformed apostrophes', () => {
      const input = "It's a great day";
      const expected = "It's a great day";
      expect(sanitizeContent(input)).toBe(expected);
    });

    it('should fix malformed quotes', () => {
      const input = 'He said "Hello" to me';
      const expected = 'He said "Hello" to me';
      expect(sanitizeContent(input)).toBe(expected);
    });

    it('should fix malformed bullets', () => {
      const input = '• First item\n• Second item';
      const expected = '• First item\n• Second item';
      expect(sanitizeContent(input)).toBe(expected);
    });

    it('should fix malformed accented characters', () => {
      const input = 'entrée and café';
      const expected = 'entrée and café';
      expect(sanitizeContent(input)).toBe(expected);
    });

    it('should fix temperature symbols', () => {
      const input = 'Heat to 160–175°C';
      const expected = 'Heat to 160–175°C';
      expect(sanitizeContent(input)).toBe(expected);
    });

    it('should handle multiple issues in one string', () => {
      const input = 'Home–cooked meals at 160–175°C are great–it\'s true!';
      const expected = 'Home–cooked meals at 160–175°C are great–it\'s true!';
      expect(sanitizeContent(input)).toBe(expected);
    });

    it('should not modify already correct text', () => {
      const input = 'This is already correct text with proper – dashes and "quotes".';
      expect(sanitizeContent(input)).toBe(input);
    });

    it('should remove invisible characters', () => {
      // Using Unicode escape sequences for invisible characters
      const input = 'Text with\u200C\u200Binvisible\u200E\u200Fcharacters\uFEFF';
      const expected = 'Text withinvisiblecharacters';
      expect(sanitizeContent(input)).toBe(expected);
    });
  });

  describe('validateContent', () => {
    it('should detect malformed characters', () => {
      const input = 'Home–cooked meals';
      const result = validateContent(input);
      expect(result.isValid).toBe(true); // This should be clean now
      expect(result.issues).toHaveLength(0);
    });

    it('should pass validation for clean content', () => {
      const input = 'This is clean content with proper – dashes and "quotes".';
      const result = validateContent(input);
      expect(result.isValid).toBe(true);
      expect(result.issues).toHaveLength(0);
    });

    it('should detect invisible characters', () => {
      const input = 'Text with\u200C\u200Binvisible\u200E\u200Fcharacters';
      const result = validateContent(input);
      expect(result.isValid).toBe(false);
      expect(result.issues.length).toBeGreaterThan(0);
    });
  });

  describe('sanitizeBlogPost', () => {
    it('should sanitize all text fields in a blog post', () => {
      const post = {
        title: 'Home–cooked Meals',
        description: 'Great–it\'s true!',
        content: 'Content with "quotes" and • bullets',
        excerpt: 'Excerpt with entrée',
        body: ['Paragraph with – dashes'],
        sections: [
          {
            id: 'section-1',
            title: 'Section – Title',
            paragraphs: ['Paragraph with \' apostrophes'],
            bullets: ['• Bullet point'],
            callout: { 
              variant: 'info',
              text: 'Callout with "quotes"' 
            }
          }
        ]
      };

      const sanitized = sanitizeBlogPost(post);

      expect(sanitized.title).toBe('Home–cooked Meals');
      expect(sanitized.description).toBe('Great–it\'s true!');
      expect(sanitized.content).toBe('Content with "quotes" and • bullets');
      expect(sanitized.excerpt).toBe('Excerpt with entrée');
      expect(sanitized.body?.[0]).toBe('Paragraph with – dashes');
      expect(sanitized.sections?.[0].title).toBe('Section – Title');
      expect(sanitized.sections?.[0].paragraphs?.[0]).toBe('Paragraph with \' apostrophes');
      expect(sanitized.sections?.[0].bullets?.[0]).toBe('• Bullet point');
      expect(sanitized.sections?.[0].callout?.text).toBe('Callout with "quotes"');
    });
  });
});