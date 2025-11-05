// Requires: bun add openai
import { EmotionsEngineRequest } from '../types';

export async function queryOpenAI(
  model: 'gpt-4' | 'gpt-3.5',
  systemPrompt: string,
  userInput: string
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return JSON.stringify({ response_type: 'fallback', message: 'OpenAI API key not configured' });
  }
  try {
    // Dynamically import openai to avoid issues if not installed
    const { OpenAI } = await import('openai');
    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: model === 'gpt-4' ? 'gpt-4' : 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput }
      ],
      temperature: 0.7,
      max_tokens: 500,
    });
    const reply = response.choices?.[0]?.message?.content || '';
    return reply;
  } catch (err: any) {
    return JSON.stringify({ response_type: 'fallback', message: 'OpenAI error: ' + (err?.message || 'Unknown error') });
  }
} 