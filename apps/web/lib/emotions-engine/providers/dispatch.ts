import { Provider } from '../types';
import { queryOpenAI } from './openaiProvider';
import { queryClaude } from './claudeProvider';
import { queryGemini } from './geminiProvider';
import { queryHuggingFace } from './huggingfaceProvider';

export async function dispatchToProvider(
  provider: Provider,
  systemPrompt: string,
  userInput: string
): Promise<string> {
  try {
    if (provider === 'gpt-4') {
      return await queryOpenAI('gpt-4', systemPrompt, userInput);
    } else if (provider === 'gpt-3.5') {
      return await queryOpenAI('gpt-3.5', systemPrompt, userInput);
    } else if (provider === 'claude') {
      return await queryClaude(systemPrompt, userInput);
    } else if (provider === 'gemini') {
      return await queryGemini(systemPrompt, userInput);
    } else if (provider === 'huggingface') {
      return await queryHuggingFace(systemPrompt, userInput);
    }
  } catch (err) {
    // Fallback to HuggingFace on error
    return await queryHuggingFace(systemPrompt, userInput);
  }
  // If provider is unknown, fallback
  return await queryHuggingFace(systemPrompt, userInput);
} 