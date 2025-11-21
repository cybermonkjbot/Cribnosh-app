/**
 * Utility functions for parsing and handling media embeds
 */

export type EmbedType = 'youtube' | 'twitter' | 'tiktok' | 'image' | 'unknown';

export interface YouTubeEmbed {
  type: 'youtube';
  videoId: string;
  url: string;
}

export interface TwitterEmbed {
  type: 'twitter';
  tweetId: string;
  url: string;
}

export interface TikTokEmbed {
  type: 'tiktok';
  videoId: string;
  url: string;
}

export type EmbedData = YouTubeEmbed | TwitterEmbed | TikTokEmbed;

/**
 * Parse YouTube URL and extract video ID
 */
export function parseYouTubeUrl(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Parse Twitter/X URL and extract tweet ID
 */
export function parseTwitterUrl(url: string): { username: string; tweetId: string } | null {
  // Support both twitter.com and x.com
  const patterns = [
    /(?:twitter\.com|x\.com)\/(\w+)\/status\/(\d+)/,
    /(?:twitter\.com|x\.com)\/statuses\/(\d+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      if (match[2]) {
        // Full URL with username
        return { username: match[1], tweetId: match[2] };
      } else if (match[1]) {
        // Status ID only
        return { username: '', tweetId: match[1] };
      }
    }
  }

  return null;
}

/**
 * Parse TikTok URL and extract video ID
 */
export function parseTikTokUrl(url: string): string | null {
  const patterns = [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /vm\.tiktok\.com\/(\w+)/,
    /tiktok\.com\/t\/(\w+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Detect embed type from URL
 */
export function detectEmbedType(url: string): EmbedType {
  if (parseYouTubeUrl(url)) {
    return 'youtube';
  }
  if (parseTwitterUrl(url)) {
    return 'twitter';
  }
  if (parseTikTokUrl(url)) {
    return 'tiktok';
  }
  if (isImageUrl(url)) {
    return 'image';
  }
  return 'unknown';
}

/**
 * Check if URL is an image
 */
export function isImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname.toLowerCase();
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp'];
    return imageExtensions.some(ext => pathname.endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * Generate YouTube embed HTML
 */
export function generateYouTubeEmbed(videoId: string, usePrivacyMode = false): string {
  const domain = usePrivacyMode ? 'youtube-nocookie.com' : 'youtube.com';
  return `<div class="embed-responsive embed-youtube">
    <iframe 
      src="https://www.${domain}/embed/${videoId}" 
      frameborder="0" 
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
      allowfullscreen
      loading="lazy"
    ></iframe>
  </div>`;
}

/**
 * Generate Twitter embed HTML (uses Twitter's oEmbed script)
 */
export function generateTwitterEmbed(tweetUrl: string): string {
  return `<div class="embed-responsive embed-twitter">
    <blockquote class="twitter-tweet" data-theme="light">
      <a href="${tweetUrl}"></a>
    </blockquote>
  </div>`;
}

/**
 * Generate TikTok embed HTML
 */
export function generateTikTokEmbed(videoId: string, url: string): string {
  // TikTok requires the full URL for embedding
  return `<div class="embed-responsive embed-tiktok">
    <blockquote class="tiktok-embed" cite="${url}" data-video-id="${videoId}">
      <section></section>
    </blockquote>
  </div>`;
}

/**
 * Validate image URL by checking if it's accessible
 */
export async function validateImageUrl(url: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const urlObj = new URL(url);
    
    // Check protocol
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return { valid: false, error: 'Invalid URL protocol' };
    }

    // Check if it looks like an image URL
    if (!isImageUrl(url)) {
      return { valid: false, error: 'URL does not appear to be an image' };
    }

    // Try to fetch the image (with CORS handling)
    try {
      const response = await fetch(url, { method: 'HEAD', mode: 'no-cors' });
      // With no-cors, we can't check status, but we can verify the URL is valid
      return { valid: true };
    } catch {
      // If fetch fails, still allow it (might be CORS issue, but URL is valid)
      return { valid: true };
    }
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

/**
 * Get oEmbed URL for a platform
 */
export function getOEmbedUrl(type: EmbedType, url: string): string | null {
  switch (type) {
    case 'twitter':
      return `https://publish.twitter.com/oembed?url=${encodeURIComponent(url)}&theme=light`;
    case 'tiktok':
      return `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    default:
      return null;
  }
}

