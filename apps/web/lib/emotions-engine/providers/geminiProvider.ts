// Real Gemini Pro REST API call using Vertex AI
import { EmotionsEngineRequest } from '../types';

export async function queryGemini(
  systemPrompt: string,
  userInput: string
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return JSON.stringify({ response_type: 'fallback', message: 'Gemini API key not configured' });
  }
  
  try {
    // Use Vertex AI REST endpoint with proper authentication
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: systemPrompt },
              { text: userInput }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_MEDIUM_AND_ABOVE'
          }
        ]
      })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Handle Gemini response format
    if (data.candidates && data.candidates.length > 0) {
      const candidate = data.candidates[0];
      if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
        return candidate.content.parts[0].text;
      }
    }
    
    // Handle safety blocks
    if (data.promptFeedback && data.promptFeedback.blockReason) {
      return JSON.stringify({ 
        response_type: 'safety_blocked', 
        message: `Content blocked: ${data.promptFeedback.blockReason}` 
      });
    }
    
    return JSON.stringify({ response_type: 'fallback', message: 'No valid response from Gemini' });
  } catch (err: any) {
    console.error('Gemini API error:', err);
    return JSON.stringify({ 
      response_type: 'fallback', 
      message: 'Gemini error: ' + (err?.message || 'Unknown error') 
    });
  }
} 