"use node";

import { action } from '../_generated/server';
import { v } from 'convex/values';

/**
 * Weather Action
 * 
 * Fetches weather data from OpenWeatherMap API based on location coordinates.
 * This is an action because it needs to make external API calls.
 */

interface WeatherResponse {
  condition: string;
  temperature: number;
  description?: string;
  humidity?: number;
  windSpeed?: number;
}

/**
 * Get weather data for a location
 */
export const getWeather = action({
  args: {
    latitude: v.number(),
    longitude: v.number(),
  },
  returns: v.object({
    condition: v.string(),
    temperature: v.number(),
    description: v.optional(v.string()),
    humidity: v.optional(v.number()),
    windSpeed: v.optional(v.number()),
  }),
  handler: async (ctx, args): Promise<WeatherResponse> => {
    const { latitude, longitude } = args;
    
    // Get API key from environment
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;
    
    if (!apiKey) {
      // Return default weather if API key not configured
      console.warn('OpenWeatherMap API key not configured, returning default weather');
      return {
        condition: 'clear',
        temperature: 20,
        description: 'Weather data unavailable',
      };
    }
    
    try {
      // Call OpenWeatherMap API
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Map OpenWeatherMap condition codes to our condition strings
      const conditionCode = data.weather?.[0]?.main?.toLowerCase() || 'clear';
      const condition = mapWeatherCondition(conditionCode);
      
      return {
        condition,
        temperature: Math.round(data.main?.temp || 20),
        description: data.weather?.[0]?.description || undefined,
        humidity: data.main?.humidity || undefined,
        windSpeed: data.wind?.speed ? Math.round(data.wind.speed * 3.6) : undefined, // Convert m/s to km/h
      };
    } catch (error) {
      console.error('Error fetching weather:', error);
      
      // Return default weather on error
      return {
        condition: 'clear',
        temperature: 20,
        description: 'Weather data unavailable',
      };
    }
  },
});

/**
 * Map OpenWeatherMap condition codes to our condition strings
 */
function mapWeatherCondition(code: string): string {
  const conditionMap: Record<string, string> = {
    'clear': 'sunny',
    'clouds': 'cloudy',
    'rain': 'rainy',
    'drizzle': 'rainy',
    'thunderstorm': 'stormy',
    'snow': 'snowy',
    'mist': 'foggy',
    'fog': 'foggy',
    'haze': 'foggy',
  };
  
  return conditionMap[code] || 'clear';
}

