/**
 * Enhanced API client with robust error handling and monitoring
 */

import { fetchWithRetry, CircuitBreaker } from './retry';

export interface APIClientOptions {
  baseURL?: string;
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  circuitBreaker?: CircuitBreaker;
}

export interface APIResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
  timestamp: number;
}

export class EnhancedAPIClient {
  private baseURL: string;
  private timeout: number;
  private retries: number;
  private headers: Record<string, string>;
  private circuitBreaker?: CircuitBreaker;

  constructor(options: APIClientOptions = {}) {
    this.baseURL = options.baseURL || '';
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'CribNosh-API-Client/1.0',
      ...options.headers
    };
    this.circuitBreaker = options.circuitBreaker;
  }

  /**
   * Make a GET request with retry logic
   */
  async get<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...options
    });
  }

  /**
   * Make a POST request with retry logic
   */
  async post<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });
  }

  /**
   * Make a PUT request with retry logic
   */
  async put<T>(endpoint: string, data?: unknown, options: RequestInit = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...options
    });
  }

  /**
   * Make a DELETE request with retry logic
   */
  async delete<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...options
    });
  }

  /**
   * Core request method with circuit breaker and retry logic
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers
      }
    };

    const executeRequest = async (): Promise<APIResponse<T>> => {
      try {
        const response = await fetchWithRetry(url, {
          ...requestOptions,
          timeout: this.timeout,
          retry: {
            maxAttempts: this.retries,
            baseDelay: 1000,
            maxDelay: 5000
          }
        });

        let data: T;
        const contentType = response.headers.get('content-type');
        
        if (contentType?.includes('application/json')) {
          data = await response.json();
        } else {
          data = await response.text() as unknown as T;
        }

        return {
          success: response.ok,
          data: response.ok ? data : undefined,
          error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
          timestamp: Date.now()
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: Date.now()
        };
      }
    };

    // Use circuit breaker if available
    if (this.circuitBreaker) {
      return this.circuitBreaker.execute(executeRequest);
    }

    return executeRequest();
  }
}

/**
 * Pre-configured clients for different services
 */
export const apiClients = {
  // Internal API client
  internal: new EnhancedAPIClient({
    baseURL: process.env.NEXT_PUBLIC_API_URL || '',
    timeout: 15000,
    retries: 3
  }),

  // External API client with circuit breaker
  external: new EnhancedAPIClient({
    timeout: 30000,
    retries: 2,
    circuitBreaker: new CircuitBreaker(3, 30000, 60000)
  }),

  // Convex client wrapper
  convex: new EnhancedAPIClient({
    timeout: 20000,
    retries: 4,
    circuitBreaker: new CircuitBreaker(5, 30000, 30000)
  })
};

/**
 * Health check utility for API endpoints
 */
export async function checkAPIHealth(endpoint: string): Promise<boolean> {
  try {
    const response = await fetchWithRetry(`${endpoint}/api/health`, {
      method: 'GET',
      timeout: 10000,
      retry: { maxAttempts: 2 }
    });
    
    return response.ok;
  } catch (error) {
    console.error(`Health check failed for ${endpoint}:`, error);
    return false;
  }
}

/**
 * Batch request utility for multiple API calls
 */
export async function batchRequest<T>(
  requests: Array<() => Promise<APIResponse<T>>>,
  concurrency: number = 5
): Promise<APIResponse<T>[]> {
  const results: APIResponse<T>[] = [];
  
  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map(request => request())
    );
    
    results.push(...batchResults.map(result => 
      result.status === 'fulfilled' 
        ? result.value 
        : {
            success: false,
            error: result.reason?.message || 'Request failed',
            timestamp: Date.now()
          }
    ));
  }
  
  return results;
}
