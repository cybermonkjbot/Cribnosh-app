import { API_CONFIG } from '../constants/api';

/**
 * Converts a relative image URL to an absolute URL
 * Handles URLs from the backend API that may be relative paths
 * 
 * @param url - The image URL (can be relative, absolute, or undefined)
 * @returns The absolute URL, or undefined if no URL provided
 */
export function getAbsoluteImageUrl(url?: string): string | undefined {
  if (!url) return undefined;
  
  // If it's already an absolute URL (starts with http:// or https://), return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // If it's a relative URL (starts with /), convert to absolute
  if (url.startsWith('/')) {
    // Extract the base domain from API_CONFIG.baseUrl (e.g., "https://cribnosh.com" from "https://cribnosh.com/api")
    const baseUrl = API_CONFIG.baseUrlNoTrailing;
    // Remove /api from the end if it exists, to get the base domain
    const baseDomain = baseUrl.replace(/\/api$/, '');
    // Combine base domain with the relative URL
    return `${baseDomain}${url}`;
  }
  
  // Otherwise, return as is (might be a local file URI)
  return url;
}

