import { describe, it, expect } from 'vitest';
import { chooseProvider } from './providerSelection';
import { EmotionsEngineRequest } from '../types';

describe('chooseProvider', () => {
  const base: EmotionsEngineRequest = {
    user_input: 'test',
    mood_score: 5,
    location: 'Lagos',
    timeOfDay: '12:00',
    active_screen: 'home',
    device_type: 'mobile',
    user_tier: 'premium',
  };

  it('returns huggingface for free user', () => {
    expect(chooseProvider({ ...base, user_tier: 'free' })).toBe('huggingface');
  });

  it('returns claude for very long prompt', () => {
    expect(chooseProvider({ ...base, user_input: 'a'.repeat(3001) })).toBe('claude');
  });

  it('returns gpt-4 for high priority', () => {
    expect(chooseProvider({ ...base, priority: true })).toBe('gpt-4');
  });

  it('returns gpt-4 for low mood', () => {
    expect(chooseProvider({ ...base, mood_score: 2 })).toBe('gpt-4');
  });

  it('returns huggingface if no user input', () => {
    expect(chooseProvider({ ...base, user_input: '' })).toBe('huggingface');
  });

  it('returns gemini for longish prompt', () => {
    expect(chooseProvider({ ...base, user_input: 'a'.repeat(1600) })).toBe('gemini');
  });

  it('returns gpt-3.5 for default', () => {
    expect(chooseProvider(base)).toBe('gpt-3.5');
  });
}); 