import { RetryConfig } from '../types';

export class RetryStrategy {
  constructor(private config: RetryConfig) {}

  calculateNextDelay(attempt: number): number {
    const delay = Math.min(
      this.config.maxDelay,
      this.config.initialDelay * Math.pow(this.config.backoffFactor, attempt - 1)
    );
    
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delay;
    return delay + jitter;
  }

  shouldRetry(attempt: number): boolean {
    return attempt < this.config.maxAttempts;
  }

  async execute<T>(
    operation: () => Promise<T>,
    onRetry?: (error: Error, attempt: number, delay: number) => void
  ): Promise<T> {
    let lastError: Error | null = null;
    let attempt = 1;

    while (attempt <= this.config.maxAttempts) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (!this.shouldRetry(attempt)) {
          break;
        }

        const delay = this.calculateNextDelay(attempt);
        
        if (onRetry) {
          onRetry(lastError, attempt, delay);
        }

        await new Promise(resolve => setTimeout(resolve, delay));
        attempt++;
      }
    }

    throw new Error(
      `Operation failed after ${attempt - 1} attempts. Last error: ${lastError?.message}`
    );
  }
} 