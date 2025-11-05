import { Anthropic } from '@anthropic-ai/sdk';
import { EmotionsEngineRequest } from '../types';

type TextContentBlock = {
  type: 'text';
  text: string;
};

export async function queryClaude(
  systemPrompt: string,
  userInput: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return JSON.stringify({ response_type: 'fallback', message: 'Anthropic API key not configured' });
  }
  
  try {
    const anthropic = new Anthropic({ apiKey });
    const response = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 500,
      temperature: 0.6,
      system: systemPrompt,
      messages: [
        { role: 'user', content: userInput }
      ]
    });
    
    // Extract text content from the response
    let reply = '';
    for (const block of response.content) {
      const textBlock = block as TextContentBlock;
      if (textBlock.type === 'text' && textBlock.text) {
        reply += textBlock.text + '\n';
      }
    }
    reply = reply.trim();
    return reply;
  } catch (err: any) {
    return JSON.stringify({ 
      response_type: 'fallback', 
      message: 'Claude error: ' + (err?.message || 'Unknown error') 
    });
  }
} 