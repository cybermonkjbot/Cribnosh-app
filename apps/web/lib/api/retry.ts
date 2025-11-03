/**
 * Robust retry mechanism with exponential backoff for network requests
 * Handles NetworkError, timeout, and other transient failures
 */

export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  jitter?: boolean;
  retryCondition?: (error: Error) => boolean;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  jitter: true,
  retryCondition: (error: Error) => {
    // Retry on network errors, timeouts, and 5xx server errors
    const retryableErrors = [
      'NetworkError',
      'TypeError',
      'AbortError',
      'CONNECT_TIMEOUT',
      'TIMEOUT',
      'ECONNRESET',
      'ENOTFOUND',
      'ECONNREFUSED'
    ];
    
    const errorMessage = error.message.toLowerCase();
    const errorName = error.name.toLowerCase();
    
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError.toLowerCase()) ||
      errorName.includes(retryableError.toLowerCase())
    );
  }
};

/**
 * Sleep utility with jitter for better distribution
 */
const sleep = (ms: number, jitter: boolean = false): Promise<void> => {
  const delay = jitter ? ms + Math.random() * 1000 : ms;
  return new Promise(resolve => setTimeout(resolve, delay));
};

/**
 * Calculate delay with exponential backoff and jitter
 */
const calculateDelay = (
  attempt: number, 
  baseDelay: number, 
  maxDelay: number, 
  multiplier: number,
  jitter: boolean
): number => {
  const exponentialDelay = baseDelay * Math.pow(multiplier, attempt - 1);
  const delay = Math.min(exponentialDelay, maxDelay);
  return jitter ? delay + Math.random() * 1000 : delay;
};

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<RetryResult<T>> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const startTime = Date.now();
  let lastError: Error;

  for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
    try {
      const data = await fn();
      return {
        success: true,
        data,
        attempts: attempt,
        totalTime: Date.now() - startTime
      };
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry if it's the last attempt or error is not retryable
      if (attempt === opts.maxAttempts || !opts.retryCondition(lastError)) {
        break;
      }

      // Calculate delay and wait before next attempt
      const delay = calculateDelay(
        attempt,
        opts.baseDelay,
        opts.maxDelay,
        opts.backoffMultiplier,
        opts.jitter
      );
      
      console.warn(`[RETRY] Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      await sleep(delay, opts.jitter);
    }
  }

  return {
    success: false,
    error: lastError!,
    attempts: opts.maxAttempts,
    totalTime: Date.now() - startTime
  };
}

/**
 * Enhanced fetch with retry logic and timeout
 */
export async function fetchWithRetry(
  url: string | URL,
  options: RequestInit & { timeout?: number; retry?: RetryOptions } = {}
): Promise<Response> {
  const { timeout = 30000, retry = {}, ...fetchOptions } = options;
  
  const fetchWithTimeout = async (): Promise<Response> => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...fetchOptions,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      // Don't retry on client errors (4xx)
      if (response.status >= 400 && response.status < 500) {
        throw new Error(`Client error: ${response.status} ${response.statusText}`);
      }
      
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  };

  const result = await withRetry(fetchWithTimeout, {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 5000,
    ...retry
  });

  if (!result.success) {
    throw new Error(`Fetch failed after ${result.attempts} attempts: ${result.error?.message}`);
  }

  return result.data!;
}

/**
 * Critical operation retry wrapper for essential functions
 */
export async function retryCritical<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const result = await withRetry(fn, {
    maxAttempts: 5,
    baseDelay: 500,
    maxDelay: 8000,
    ...options
  });

  if (!result.success) {
    throw result.error || new Error('Critical operation failed');
  }

  return result.data!;
}

/**
 * Circuit breaker pattern for external services
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000,
    private resetTimeout: number = 30000
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }

  getState(): string {
    return this.state;
  }
}

// Global circuit breakers for external services
export const circuitBreakers = {
  convex: new CircuitBreaker(3, 30000, 60000),
  email: new CircuitBreaker(5, 30000, 30000),
  external: new CircuitBreaker(3, 30000, 60000)
};