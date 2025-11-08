import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { logger } from '@/lib/utils/logger';

// Convex-based Redis replacement service (excluding rate limiting)
export class ConvexRedisService {
  private static instance: ConvexRedisService;

  public static getInstance(): ConvexRedisService {
    if (!ConvexRedisService.instance) {
      ConvexRedisService.instance = new ConvexRedisService();
    }
    return ConvexRedisService.instance;
  }

  // Cache operations
  async setCache(key: string, value: any, options: { ttl?: number; prefix?: string } = {}) {
    const { ttl, prefix } = options;
    const ttlMs = ttl ? ttl * 1000 : undefined; // Convert seconds to milliseconds
    
    try {
      await fetch('/api/convex/mutation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'cache:setCache',
          args: { key, value, ttl: ttlMs, prefix }
        })
      });
    } catch (error) {
      logger.error('Failed to set cache:', error);
      throw error;
    }
  }

  async getCache<T = any>(key: string): Promise<T | null> {
    try {
      const response = await fetch('/api/convex/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'cache:getCacheValue',
          args: { key }
        })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      logger.error('Failed to get cache:', error);
      return null;
    }
  }

  async deleteCache(key: string): Promise<boolean> {
    try {
      const response = await fetch('/api/convex/mutation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'cache:deleteCache',
          args: { key }
        })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      logger.error('Failed to delete cache:', error);
      return false;
    }
  }

  // Session management
  async setSession(sessionId: string, data: any, ttl: number = 86400): Promise<void> {
    try {
      await fetch('/api/convex/mutation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'sessions:setSession',
          args: { sessionId, data, ttl: ttl * 1000 }
        })
      });
    } catch (error) {
      logger.error('Failed to set session:', error);
      throw error;
    }
  }

  async getSession<T = any>(sessionId: string): Promise<T | null> {
    try {
      const response = await fetch('/api/convex/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'sessions:getSession',
          args: { sessionId }
        })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      logger.error('Failed to get session:', error);
      return null;
    }
  }

  async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/convex/mutation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'sessions:deleteSession',
          args: { sessionId }
        })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      logger.error('Failed to delete session:', error);
      return false;
    }
  }

  // Job queue operations
  async enqueueJob(jobType: string, payload: any, options: {
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    maxAttempts?: number;
  } = {}): Promise<string> {
    try {
      const response = await fetch('/api/convex/mutation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'jobQueue:enqueueJob',
          args: {
            jobType,
            payload,
            priority: options.priority || 'normal',
            maxAttempts: options.maxAttempts || 3
          }
        })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      logger.error('Failed to enqueue job:', error);
      throw error;
    }
  }

  // Presence tracking
  async joinSession(sessionId: string, userId: string): Promise<string> {
    try {
      const response = await fetch('/api/convex/mutation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'presence:joinSession',
          args: { sessionId, userId }
        })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      logger.error('Failed to join session:', error);
      throw error;
    }
  }

  async leaveSession(sessionId: string, userId: string): Promise<string | null> {
    try {
      const response = await fetch('/api/convex/mutation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          function: 'presence:leaveSession',
          args: { sessionId, userId }
        })
      });
      
      const result = await response.json();
      return result;
    } catch (error) {
      logger.error('Failed to leave session:', error);
      return null;
    }
  }
}

// React hooks for Convex-based Redis replacement
export function useConvexCache() {
  const setCache = useMutation(api.mutations.cache.setCache);
  const getCache = useMutation(api.mutations.cache.getCache);
  const deleteCache = useMutation(api.mutations.cache.deleteCache);

  return {
    setCache,
    getCache,
    deleteCache,
  };
}

export function useConvexSessions() {
  const setSession = useMutation(api.mutations.sessions.setSession);
  const getSession = useMutation(api.mutations.sessions.getSession);
  const deleteSession = useMutation(api.mutations.sessions.deleteSession);

  return {
    setSession,
    getSession,
    deleteSession,
  };
}

export function useConvexJobQueue() {
  const enqueueJob = useMutation(api.mutations.jobQueue.enqueueJob);

  return {
    enqueueJob,
  };
}

export function useConvexPresence() {
  const joinSession = useMutation(api.mutations.presence.joinSession);
  const leaveSession = useMutation(api.mutations.presence.leaveSession);

  return {
    joinSession,
    leaveSession,
  };
}

// Export singleton instance
export const convexRedisService = ConvexRedisService.getInstance(); 