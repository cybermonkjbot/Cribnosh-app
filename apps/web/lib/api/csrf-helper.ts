/**
 * CSRF Token Helper
 * Fetches and caches CSRF tokens for API requests
 */

let csrfTokenCache: string | null = null;
let csrfTokenPromise: Promise<string> | null = null;

/**
 * Get CSRF token from cookie or fetch a new one
 * Caches the token in memory to avoid multiple requests
 */
export async function getCSRFToken(): Promise<string> {
  // Check if we have a cached token
  if (csrfTokenCache) {
    return csrfTokenCache;
  }

  // If there's already a request in progress, wait for it
  if (csrfTokenPromise) {
    return csrfTokenPromise;
  }

  // Start a new request
  csrfTokenPromise = (async () => {
    try {
      // First, try to get token from cookie
      const cookieToken = getCookie('csrf_token');
      if (cookieToken) {
        csrfTokenCache = cookieToken;
        return cookieToken;
      }

      // If no cookie, fetch a new token
      const response = await fetch('/api/csrf', {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      const token = data.data?.csrfToken || data.csrfToken;

      if (!token) {
        throw new Error('CSRF token not found in response');
      }

      csrfTokenCache = token;
      return token;
    } catch (error) {
      // Clear the promise so we can retry
      csrfTokenPromise = null;
      throw error;
    }
  })();

  return csrfTokenPromise;
}

/**
 * Get CSRF token from cookie (synchronous)
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') {
    return null;
  }

  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

/**
 * Clear CSRF token cache (useful for testing or after logout)
 */
export function clearCSRFTokenCache(): void {
  csrfTokenCache = null;
  csrfTokenPromise = null;
}

