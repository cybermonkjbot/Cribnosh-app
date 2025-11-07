/**
 * Staff API Helper
 * Provides authenticated fetch helper for staff API calls with CSRF protection
 */

import { getCSRFToken } from './csrf-helper';

/**
 * Authenticated fetch helper for staff API calls
 * Automatically includes CSRF tokens and credentials
 */
export async function staffFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method || 'GET';
  const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase());

  // Prepare headers
  const headers = new Headers(options.headers);

  // Add CSRF token for state-changing operations
  if (isStateChanging) {
    try {
      const csrfToken = await getCSRFToken();
      headers.set('x-csrf-token', csrfToken);
    } catch (error) {
      // If CSRF token fetch fails, still try the request
      // The server will return 403 if CSRF is required
    }
  }

  // Ensure Content-Type is set for JSON requests
  if (options.body && typeof options.body === 'string' && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Merge with existing options
  const fetchOptions: RequestInit = {
    ...options,
    headers,
    credentials: 'include', // Always include cookies
  };

  return fetch(url, fetchOptions);
}

/**
 * Helper to get JSON response from staff API
 */
export async function staffFetchJSON<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await staffFetch(url, options);
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || `Request failed with status ${response.status}`);
  }

  return response.json();
}

