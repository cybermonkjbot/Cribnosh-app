# Environment Variables

This document lists all environment variables required for the Cribnosh application.

## Required Environment Variables

### OpenWeatherMap API Key
**Variable:** `OPENWEATHERMAP_API_KEY`  
**Location:** Convex backend (actions)  
**Purpose:** Used by the weather action to fetch weather data based on location coordinates  
**How to get:** Sign up at [OpenWeatherMap](https://openweathermap.org/api) and get your free API key  
**Required for:** Weather feature in mobile app (section ordering based on weather conditions)

### Example Configuration

#### Convex Environment Variables
Add to your Convex dashboard or `.env.local`:

```bash
OPENWEATHERMAP_API_KEY=your_api_key_here
```

#### Web App Environment Variables
The web app may also need this if weather is accessed directly:

```bash
OPENWEATHERMAP_API_KEY=your_api_key_here
```

## Optional Environment Variables

### Emotions Engine URL
**Variable:** `EMOTIONS_ENGINE_URL`  
**Default:** `http://localhost:3000/api/emotions-engine`  
**Purpose:** URL for the emotions engine API endpoint

## Notes

- The weather API key is optional - if not provided, the weather action will return default weather data
- Weather data is cached for 10 minutes to reduce API calls
- The weather feature gracefully degrades if the API is unavailable

