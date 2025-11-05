import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as inferenceModule from '@/lib/emotions-engine/core/inferenceEngine';
import * as contextModule from '@/lib/emotions-engine/core/contextAggregation';
import { POST } from './route';

const mockRequest = (body: any) => ({
  json: async () => body,
  cookies: {
    get: (name: string) => undefined // Mock empty cookies
  }
});

describe('Emotions Engine API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns a successful response from runInference', async () => {
    vi.spyOn(inferenceModule, 'runInference').mockResolvedValueOnce({
      success: true,
      data: { response_type: 'recommendation', intent: 'mood_food', message: 'Eat jollof rice', inferred_context: {} },
      message: 'ok',
    });
    
    // Mock the context aggregation to avoid Convex calls
    vi.spyOn(contextModule, 'aggregateContext').mockResolvedValueOnce({
      mood_score: 3,
      location: 'Lagos',
      diet_type: 'none',
    } as any);
    
    const req = mockRequest({ user_input: 'What should I eat?', mood_score: 3, location: 'Lagos', timeOfDay: '18:00', active_screen: 'home', device_type: 'mobile', user_tier: 'premium' });
    // @ts-ignore
    const res = await POST(req);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.response_type).toBe('recommendation');
    expect(json.data.message).toBe('Eat jollof rice');
  });

  it('returns an error response if runInference throws', async () => {
    vi.spyOn(inferenceModule, 'runInference').mockRejectedValueOnce(new Error('LLM error'));
    
    // Mock the context aggregation to avoid Convex calls
    vi.spyOn(contextModule, 'aggregateContext').mockResolvedValueOnce({
      mood_score: 3,
      location: 'Lagos',
      diet_type: 'none',
    } as any);
    
    const req = mockRequest({ user_input: 'What should I eat?', mood_score: 3, location: 'Lagos', timeOfDay: '18:00', active_screen: 'home', device_type: 'mobile', user_tier: 'premium' });
    // @ts-ignore
    const res = await POST(req);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.message).toMatch(/API error/);
    expect(json.error).toMatch(/LLM error/);
  });
}); 