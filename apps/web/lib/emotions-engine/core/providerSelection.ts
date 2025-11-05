import { Provider, EmotionsEngineRequest } from '../types';

export function chooseProvider({
  user_tier,
  mood_score,
  user_input,
  priority,
  intent
}: EmotionsEngineRequest & { intent?: string }): Provider {
  const prompt_length = (user_input || '').length;
  const has_user_input = !!(user_input && user_input.trim());

  if (user_tier === 'free') {
    return 'huggingface';
  }
  if (prompt_length > 3000) {
    return 'claude';
  }
  if (priority || mood_score <= 2) {
    return 'gpt-4';
  }
  if (!has_user_input) {
    return 'huggingface';
  }
  if (prompt_length > 1500) {
    return 'gemini';
  }
  return 'gpt-3.5';
} 