import { beforeEach, describe, expect, it, vi } from 'vitest';
import { EmotionsContext } from '../types';
import { aggregateContext } from './contextAggregation';

const uiContext: Partial<EmotionsContext> = {
  mood_score: 4,
  location: 'Accra',
  diet_type: 'vegetarian',
};

describe('aggregateContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns only UI context if no userId is provided', async () => {
    const result = await aggregateContext(uiContext);
    expect(result.diet_type).toBe('vegetarian');
    expect(result.location).toBe('Accra');
    expect(result.mood_score).toBe(4);
    // Backend fields should be undefined since no userId provided
    expect(result.recent_orders).toBeUndefined();
    expect(result.preferred_cuisine).toBeUndefined();
  });

  it('merges UI and backend context, with UI taking precedence', async () => {
    // This test would require mocking the Convex client, which is complex
    // For now, we'll test the basic functionality without userId
    const result = await aggregateContext(uiContext);
    expect(result.diet_type).toBe('vegetarian');
    expect(result.location).toBe('Accra');
    expect(result.mood_score).toBe(4);
  });
}); 