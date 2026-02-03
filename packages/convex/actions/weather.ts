// @ts-nocheck
"use node";

import { v } from 'convex/values';
import { action } from '../_generated/server';
import { CACHE_TTL } from '../cacheConfig';

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

    // Create a location key by rounding to 1 decimal place (approx 11km precision)
    // This allows grouping nearby users to share weather data
    const locationKey = `${latitude.toFixed(1)},${longitude.toFixed(1)}`;

    // Check cache first using generic generic action cache
    try {
      const cachedData = await ctx.runQuery(internal.queries.cache.get, {
        action: 'weather',
        key: locationKey,
        ttlMs: CACHE_TTL.WEATHER
      });
      if (cachedData) {
        console.log(`Returning cached weather for key: ${locationKey}`);
        return cachedData;
      }
    } catch (error) {
      console.error('Error checking weather cache:', error);
      // Continue to fetch from API if cache check fails
    }

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
      console.log(`Fetching weather from API for key: ${locationKey}`);
      // Call OpenWeatherMap API
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json() as any;

      // Map OpenWeatherMap condition codes to our condition strings
      const conditionCode = data.weather?.[0]?.main?.toLowerCase() || 'clear';
      const condition = mapWeatherCondition(conditionCode);

      const weatherData = {
        condition,
        temperature: Math.round(data.main?.temp || 20),
        description: data.weather?.[0]?.description || undefined,
        humidity: data.main?.humidity || undefined,
        windSpeed: data.wind?.speed ? Math.round(data.wind.speed * 3.6) : undefined, // Convert m/s to km/h
      };

      // Cache the result asynchronously
      try {
        await ctx.runMutation(internal.mutations.cache.set, {
          action: 'weather',
          key: locationKey,
          data: weatherData,
          ttlMs: CACHE_TTL.WEATHER,
        });
      } catch (cacheError) {
        console.error('Error caching weather data:', cacheError);
        // Don't fail the request if caching fails
      }

      return weatherData;
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

