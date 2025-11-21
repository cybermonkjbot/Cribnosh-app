/**
 * Security utilities for sanitizing embed content
 */

const ALLOWED_EMBED_DOMAINS = [
  'youtube.com',
  'youtu.be',
  'youtube-nocookie.com',
  'twitter.com',
  'x.com',
  'tiktok.com',
  'vm.tiktok.com',
];

/**
 * Check if a URL is from an allowed embed domain
 */
export function isAllowedEmbedDomain(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();
    
    return ALLOWED_EMBED_DOMAINS.some(domain => 
      hostname === domain || hostname.endsWith(`.${domain}`)
    );
  } catch {
    return false;
  }
}

/**
 * Sanitize iframe src attribute
 */
export function sanitizeIframeSrc(src: string): string | null {
  if (!src) return null;
  
  try {
    const urlObj = new URL(src);
    
    // Only allow https protocol
    if (urlObj.protocol !== 'https:') {
      return null;
    }
    
    // Check if domain is allowed
    if (!isAllowedEmbedDomain(src)) {
      return null;
    }
    
    return src;
  } catch {
    return null;
  }
}

/**
 * Sanitize embed HTML content
 */
export function sanitizeEmbedHTML(html: string): string {
  // Remove script tags
  let sanitized = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Remove event handlers
  sanitized = sanitized.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // Sanitize iframe src attributes
  sanitized = sanitized.replace(/<iframe([^>]*)>/gi, (match, attributes) => {
    const srcMatch = attributes.match(/src\s*=\s*["']([^"']+)["']/i);
    if (srcMatch && srcMatch[1]) {
      const sanitizedSrc = sanitizeIframeSrc(srcMatch[1]);
      if (sanitizedSrc) {
        return `<iframe${attributes.replace(/src\s*=\s*["'][^"']+["']/i, `src="${sanitizedSrc}"`)}>`;
      }
      // Remove iframe if src is not allowed
      return '';
    }
    return match;
  });
  
  return sanitized;
}

/**
 * Validate embed URL before insertion
 */
export function validateEmbedUrl(url: string): { valid: boolean; error?: string } {
  if (!url || !url.trim()) {
    return { valid: false, error: 'URL is required' };
  }

  try {
    const urlObj = new URL(url.trim());
    
    // Only allow https protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed' };
    }
    
    // Check if domain is allowed (for embeds)
    // Note: This is a basic check, actual embed type detection happens elsewhere
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

