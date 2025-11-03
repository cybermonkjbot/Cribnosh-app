import { beforeEach, describe, expect, it, vi } from 'vitest';
import * as dispatchModule from '../providers/dispatch';
import { EmotionsEngineRequest } from '../types';
import { runInference } from './inferenceEngine';

const baseRequest: EmotionsEngineRequest = {
  user_input: 'What should I eat tonight?',
  mood_score: 3,
  location: 'Lagos',
  timeOfDay: '20:00',
  active_screen: 'home',
  device_type: 'mobile',
  user_tier: 'premium',
};

describe('runInference', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('parses a valid LLM response', async () => {
    vi.spyOn(dispatchModule, 'dispatchToProvider').mockResolvedValueOnce(
      JSON.stringify({ response_type: 'recommendation', intent: 'mood_food_suggestion', message: 'Try a light meal!' })
    );
    const result = await runInference(baseRequest);
    expect(result.success).toBe(true);
    expect(result.data.response_type).toBe('recommendation');
    expect(result.data.intent).toBe('mood_food_suggestion');
    expect(result.data.message).toBe('Try a light meal!');
  });

  it('returns fallback on invalid LLM response', async () => {
    vi.spyOn(dispatchModule, 'dispatchToProvider').mockResolvedValueOnce('not a json');
    const result = await runInference(baseRequest);
    expect(result.success).toBe(false);
    expect(result.data.response_type).toBe('fallback');
    expect(result.data.message).toMatch(/Failed to parse/);
  });

  it('returns fallback if response_type is missing', async () => {
    vi.spyOn(dispatchModule, 'dispatchToProvider').mockResolvedValueOnce(
      JSON.stringify({ intent: 'mood_food_suggestion', message: 'Missing type' })
    );
    const result = await runInference(baseRequest);
    expect(result.success).toBe(false);
    expect(result.data.response_type).toBe('fallback');
  });
}); 