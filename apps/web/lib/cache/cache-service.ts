import { env } from '../config/env';
import { ErrorFactory, ErrorCode } from '@/lib/errors';
import { logger } from '@/lib/utils/logger';

interface CacheInvalidationOptions {
  paths?: string[];
  tags?: string[];
  everything?: boolean;
}

/**
 * Service to handle cache invalidation for Cloudflare
 * Uses both Cache Tags and URL purging for maximum reliability
 */
export class CacheService {
  private readonly zoneId: string;
  private readonly apiToken: string;
  private readonly baseUrl = 'https://api.cloudflare.com/client/v4';

  constructor() {
    if (!env.CLOUDFLARE_ZONE_ID) throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'CLOUDFLARE_ZONE_ID is required');
    if (!env.CLOUDFLARE_API_TOKEN) throw ErrorFactory.custom(ErrorCode.INTERNAL_ERROR, 'CLOUDFLARE_API_TOKEN is required');
    
    this.zoneId = env.CLOUDFLARE_ZONE_ID;
    this.apiToken = env.CLOUDFLARE_API_TOKEN;
  }

  /**
   * Invalidate cache using both Cache Tags and URL purging
   * @param options Cache invalidation options
   */
  async invalidateCache(options: CacheInvalidationOptions): Promise<void> {
    const promises: Promise<any>[] = [];

    // Purge by Cache Tags if specified
    if (options.tags?.length) {
      promises.push(this.purgeByCacheTags(options.tags));
    }

    // Purge by URLs if specified
    if (options.paths?.length) {
      promises.push(this.purgeByUrls(options.paths));
    }

    // Purge everything if specified
    if (options.everything) {
      promises.push(this.purgeEverything());
    }

    try {
      await Promise.all(promises);
    } catch (error) {
      logger.error('Cache invalidation failed:', error);
      throw error;
    }
  }

  /**
   * Purge cache by Cache Tags
   * @param tags Array of Cache Tags to purge
   */
  private async purgeByCacheTags(tags: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/zones/${this.zoneId}/cache/tags`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tags }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to purge cache tags: ${JSON.stringify(error)}`);
    }
  }

  /**
   * Purge cache by URLs
   * @param urls Array of URLs to purge
   */
  private async purgeByUrls(urls: string[]): Promise<void> {
    const response = await fetch(`${this.baseUrl}/zones/${this.zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ files: urls }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to purge URLs: ${JSON.stringify(error)}`);
    }
  }

  /**
   * Purge everything from cache
   */
  private async purgeEverything(): Promise<void> {
    const response = await fetch(`${this.baseUrl}/zones/${this.zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ purge_everything: true }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to purge everything: ${JSON.stringify(error)}`);
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService(); 