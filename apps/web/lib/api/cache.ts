import { NextRequest, NextResponse } from 'next/server';
import { MonitoringService } from '../monitoring/monitoring.service';

const monitoring = MonitoringService.getInstance();

export interface CacheConfig {
  ttl: number; // Time to live in seconds
  keyPrefix: string;
  enableCompression: boolean;
  maxSize: number; // Maximum cache size in bytes
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
  size: number;
}

export class APICache {
  private config: CacheConfig;
  private memoryCache: Map<string, CacheEntry> = new Map();

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = {
      ttl: 300, // 5 minutes default
      keyPrefix: 'api:cache:',
      enableCompression: true,
      maxSize: 50 * 1024 * 1024, // 50MB default
      ...config,
    };
  }

  /**
   * Generate cache key from request
   */
  private generateKey(request: NextRequest, customKey?: string): string {
    if (customKey) {
      return `${this.config.keyPrefix}${customKey}`;
    }

    const url = new URL(request.url);
    const path = url.pathname;
    const query = url.searchParams.toString();
    const method = request.method;

    // Create a hash of the request
    const keyData = `${method}:${path}:${query}`;
    const hash = this.hashString(keyData);

    return `${this.config.keyPrefix}${hash}`;
  }

  /**
   * Simple string hashing function
   */
  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Get cached response
   */
  async get(request: NextRequest, customKey?: string): Promise<NextResponse | null> {
    const key = this.generateKey(request, customKey);

    try {
      // Try memory cache
      const memoryEntry = this.memoryCache.get(key);
      if (memoryEntry && Date.now() - memoryEntry.timestamp < memoryEntry.ttl * 1000) {
        monitoring.incrementMetric('cache_hits_total');
        return this.createResponseFromCache(memoryEntry);
      } else if (memoryEntry) {
        // Remove expired entry
        this.memoryCache.delete(key);
      }

      monitoring.incrementMetric('cache_misses_total');
      return null;
    } catch (error) {
      monitoring.logError(error as Error, { context: 'cache_get' });
      return null;
    }
  }

  /**
   * Set cached response
   */
  async set(
    request: NextRequest,
    response: NextResponse,
    ttl?: number,
    customKey?: string
  ): Promise<void> {
    const key = this.generateKey(request, customKey);
    const cacheTTL = ttl || this.config.ttl;

    try {
      // Extract response data
      const responseData = await response.clone().json().catch(() => null);
      if (!responseData) return; // Don't cache non-JSON responses

      const entry: CacheEntry = {
        data: responseData,
        timestamp: Date.now(),
        ttl: cacheTTL,
        size: JSON.stringify(responseData).length,
      };

      // Store in memory cache (with size limit)
      this.setMemoryCache(key, entry);

      monitoring.incrementMetric('cache_sets_total');
    } catch (error) {
      monitoring.logError(error as Error, { context: 'cache_set' });
    }
  }

  /**
   * Set memory cache with size management
   */
  private setMemoryCache(key: string, entry: CacheEntry): void {
    // Check if adding this entry would exceed max size
    const currentSize = Array.from(this.memoryCache.values())
      .reduce((total, e) => total + e.size, 0);

    if (currentSize + entry.size > this.config.maxSize) {
      // Remove oldest entries until we have space
      const entries = Array.from(this.memoryCache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp);

      for (const [oldKey] of entries) {
        const oldEntry = this.memoryCache.get(oldKey);
        if (oldEntry && currentSize + entry.size - oldEntry.size <= this.config.maxSize) {
          this.memoryCache.delete(oldKey);
          break;
        }
      }
    }

    this.memoryCache.set(key, entry);
  }

  /**
   * Create response from cache entry
   */
  private createResponseFromCache(entry: CacheEntry): NextResponse {
    const response = NextResponse.json(entry.data);
    
    // Add cache headers
    response.headers.set('X-Cache', 'HIT');
    response.headers.set('X-Cache-Timestamp', entry.timestamp.toString());
    response.headers.set('X-Cache-TTL', entry.ttl.toString());
    response.headers.set('Cache-Control', `public, max-age=${entry.ttl}`);

    return response;
  }

  /**
   * Invalidate cache entry
   */
  async invalidate(request: NextRequest, customKey?: string): Promise<void> {
    const key = this.generateKey(request, customKey);

    try {
      // Remove from memory cache
      this.memoryCache.delete(key);

      monitoring.incrementMetric('cache_invalidations_total');
    } catch (error) {
      monitoring.logError(error as Error, { context: 'cache_invalidate' });
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      // Clear memory cache
      this.memoryCache.clear();

      monitoring.logInfo('Cache cleared', {
        context: 'cache_clear'
      });

      monitoring.incrementMetric('cache_clears_total');
    } catch (error) {
      monitoring.logError(error as Error, { context: 'cache_clear' });
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    memorySize: number;
    memoryEntries: number;
    hitRate: number;
  } {
    const memorySize = Array.from(this.memoryCache.values())
      .reduce((total, entry) => total + entry.size, 0);
    const memoryEntries = this.memoryCache.size;

    return {
      memorySize,
      memoryEntries,
      hitRate: 0, // Would need to track hits/misses over time
    };
  }
}

// Export singleton instance
export const apiCache = new APICache();

/**
 * Higher-order function to add caching to API handlers
 */
export function withCaching(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: {
    ttl?: number;
    customKey?: string;
    skipCache?: (request: NextRequest) => boolean;
  } = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Skip cache for non-GET requests or if skipCache returns true
    if (request.method !== 'GET' || options.skipCache?.(request)) {
      return handler(request);
    }

    // Try to get from cache
    const cachedResponse = await apiCache.get(request, options.customKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Execute handler and cache response
    const response = await handler(request);
    await apiCache.set(request, response, options.ttl, options.customKey);

    return response;
  };
} 