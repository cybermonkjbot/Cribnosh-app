// Uses fetch (native in Node 18+ and Bun)
import { EmotionsEngineRequest } from '../types';

export async function queryHuggingFace(
  systemPrompt: string,
  userInput: string
): Promise<string> {
  const apiKey = process.env.HF_TOKEN;
  if (!apiKey) {
    return JSON.stringify({ response_type: 'fallback', message: 'HuggingFace API key not configured' });
  }
  
  try {
    const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        inputs: `<s>[INST] ${systemPrompt}\n\n${userInput} [/INST]`,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.9,
          return_full_text: false
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    
    // Handle different response formats
    if (Array.isArray(data)) {
      // Standard format
      const reply = data[0]?.generated_text || '';
      return reply.trim();
    } else if (data.generated_text) {
      // Alternative format
      return data.generated_text.trim();
    } else if (data.error) {
      // Error format
      throw new Error(data.error);
    } else {
      throw new Error('Unexpected response format from HuggingFace');
    }
  } catch (err: any) {
    console.error('HuggingFace API error:', err);
    return JSON.stringify({ 
      response_type: 'fallback', 
      message: 'HuggingFace error: ' + (err?.message || 'Unknown error') 
    });
  }
} 