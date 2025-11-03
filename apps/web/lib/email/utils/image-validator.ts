/**
 * Image validation utility to ensure no broken images are sent in emails
 */

interface ImageValidationResult {
  isValid: boolean;
  url: string;
  status?: number;
  error?: string;
}

/**
 * Checks if an image URL is accessible
 * @param imageUrl - The URL to validate
 * @param timeout - Maximum time to wait for response in milliseconds (default: 5000)
 * @returns Promise with validation result
 */
export async function validateImageUrl(
  imageUrl: string,
  timeout: number = 5000
): Promise<ImageValidationResult> {
  try {
    // Skip validation for data URIs and relative URLs (handled by email clients)
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('./') || imageUrl.startsWith('/')) {
      return { isValid: true, url: imageUrl };
    }

    // Skip validation for tracking pixels and mailto links
    if (imageUrl.includes('tracking') || imageUrl.includes('track') || imageUrl.includes('mailto:')) {
      return { isValid: true, url: imageUrl };
    }

    // Use HEAD request to minimize bandwidth
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(imageUrl, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'Accept': 'image/*',
      },
    });

    clearTimeout(timeoutId);

    const contentType = response.headers.get('content-type');
    const isValid = response.ok && contentType ? contentType.startsWith('image/') : false;
    
    if (!isValid) {
      console.warn(`Image validation failed for ${imageUrl}: Status ${response.status}, Content-Type: ${response.headers.get('content-type')}`);
    }

    return {
      isValid,
      url: imageUrl,
      status: response.status,
      error: isValid ? undefined : `HTTP ${response.status}`,
    };
  } catch (error) {
    console.error(`Error validating image ${imageUrl}:`, error);
    return {
      isValid: false,
      url: imageUrl,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validates all image URLs in HTML content
 * @param html - HTML content to check
 * @returns Promise with validated HTML and list of broken images
 */
export async function validateImagesInHtml(html: string): Promise<{
  html: string;
  brokenImages: string[];
  totalImages: number;
}> {
  // Extract all image URLs from HTML
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  const imageUrls = new Set<string>();
  let match;

  while ((match = imgRegex.exec(html)) !== null) {
    if (match[1]) {
      imageUrls.add(match[1]);
    }
  }

  // Also check background images in style attributes
  const bgImgRegex = /background-image:\s*url\(["']?([^"')]+)["']?\)/gi;
  while ((match = bgImgRegex.exec(html)) !== null) {
    if (match[1]) {
      imageUrls.add(match[1]);
    }
  }

  const imageArray = Array.from(imageUrls);
  const brokenImages: string[] = [];
  const validatedHtml = html;

  // Validate each image (with rate limiting)
  for (const imageUrl of imageArray) {
    const result = await validateImageUrl(imageUrl);
    if (!result.isValid) {
      brokenImages.push(imageUrl);
    }
  }

  // Remove broken images from HTML
  let cleanedHtml = validatedHtml;
  for (const brokenImage of brokenImages) {
    // Remove the entire <img> tag
    const imgTagRegex = new RegExp(`<img[^>]+src=["']${escapeRegex(brokenImage)}["'][^>]*>`, 'gi');
    cleanedHtml = cleanedHtml.replace(imgTagRegex, '<!-- Image removed: broken URL -->');
    
    // Also remove background images
    const bgImgRegex = new RegExp(`background-image:\\s*url\\(["']?${escapeRegex(brokenImage)}["']?\\)`, 'gi');
    cleanedHtml = cleanedHtml.replace(bgImgRegex, '/* Background image removed: broken URL */');
  }

  return {
    html: cleanedHtml,
    brokenImages,
    totalImages: imageArray.length,
  };
}

/**
 * Escape special characters in regex pattern
 */
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Batch validate multiple images with concurrency control
 */
export async function validateMultipleImages(
  imageUrls: string[],
  concurrency: number = 5,
  timeout: number = 5000
): Promise<ImageValidationResult[]> {
  const results: ImageValidationResult[] = [];
  
  // Process in batches to avoid overwhelming the network
  for (let i = 0; i < imageUrls.length; i += concurrency) {
    const batch = imageUrls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(url => validateImageUrl(url, timeout))
    );
    results.push(...batchResults);
  }
  
  return results;
}

/**
 * Get a fallback image URL for broken images
 */
export function getFallbackImageUrl(): string {
  // Return a simple placeholder or the brand logo
  return `${process.env.NEXT_PUBLIC_BASE_URL || 'https://cribnosh.com'}/logo.svg`;
}

/**
 * Validate and sanitize HTML content, optionally replacing broken images with placeholders
 */
export async function sanitizeEmailHtml(
  html: string,
  options: {
    removeBroken?: boolean;
    useFallback?: boolean;
    timeout?: number;
  } = {}
): Promise<{
  html: string;
  brokenImages: string[];
  totalImages: number;
  replaced: number;
}> {
  const {
    removeBroken = true,
    useFallback = false,
    timeout = 5000,
  } = options;

  const validationResult = await validateImagesInHtml(html);
  let sanitizedHtml = validationResult.html;
  let replaced = 0;

  if (useFallback && validationResult.brokenImages.length > 0) {
    const fallbackUrl = getFallbackImageUrl();
    for (const brokenImage of validationResult.brokenImages) {
      // Only replace if we found actual broken images
      const imgTagRegex = new RegExp(`(<img[^>]+src=["'])${escapeRegex(brokenImage)}(["'][^>]*>)`, 'gi');
      sanitizedHtml = sanitizedHtml.replace(imgTagRegex, `$1${fallbackUrl}$2`);
      replaced++;
    }
  }

  return {
    html: sanitizedHtml,
    brokenImages: validationResult.brokenImages,
    totalImages: validationResult.totalImages,
    replaced,
  };
}

