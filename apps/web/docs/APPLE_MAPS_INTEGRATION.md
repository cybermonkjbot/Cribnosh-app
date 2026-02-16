# Apple Maps API Integration

This document explains how to integrate Apple Maps API with your CribNosh application for enhanced mapping capabilities.

## Overview

The Apple Maps API integration provides:
- **Geocoding**: Convert addresses to coordinates
- **Reverse Geocoding**: Convert coordinates to addresses
- **Places Search**: Find nearby restaurants, businesses, and points of interest
- **Directions**: Get turn-by-turn directions between locations
- **Distance Calculations**: Calculate distances between coordinates

## Setup

### 1. Apple Developer Account

1. Sign up for an [Apple Developer Account](https://developer.apple.com/)
2. Navigate to the [Apple Maps API Console](https://developer.apple.com/maps/)
3. Create a new API key for your project
4. Configure allowed domains and usage limits

### 2. Environment Variables

Add your Apple Maps API key to your environment:

```bash
# .env.local
APPLE_MAPS_API_KEY=your_apple_maps_api_key_here
```

### 3. API Endpoints

The following endpoints are available:

#### Geocoding
```
POST /api/apple-maps/geocode
```

**Request:**
```json
{
  "address": "123 Main St, San Francisco, CA",
  "countryCode": "US",
  "language": "en"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "coordinates": {
      "latitude": 37.7749,
      "longitude": -122.4194
    },
    "formattedAddress": "123 Main St, San Francisco, CA 94102, USA",
    "components": {
      "streetNumber": "123",
      "streetName": "Main St",
      "city": "San Francisco",
      "state": "CA",
      "postalCode": "94102",
      "country": "United States"
    }
  }
}
```

#### Reverse Geocoding
```
POST /api/apple-maps/reverse-geocode
```

**Request:**
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "language": "en"
}
```

#### Places Search
```
POST /api/apple-maps/places-search
```

**Request:**
```json
{
  "query": "restaurants near me",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "radius": 5000,
  "categories": ["restaurant", "food"]
}
```

#### Directions
```
POST /api/apple-maps/directions
```

**Request:**
```json
{
  "origin": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "destination": {
    "latitude": 37.7849,
    "longitude": -122.4094
  },
  "mode": "driving",
  "language": "en"
}
```

## Usage in Your App

### 1. Service Layer

Use the `LocationService` class for enhanced location functionality:

```typescript
import { locationService } from '@/lib/location/service';

// Geocode an address
const result = await locationService.geocodeAddress('123 Main St, San Francisco, CA');

// Search for nearby restaurants
const restaurants = await locationService.searchNearbyPlaces(
  'restaurants',
  { latitude: 37.7749, longitude: -122.4194 },
  5000,
  ['restaurant']
);

// Get directions
const directions = await locationService.getDirections(
  { latitude: 37.7749, longitude: -122.4194 },
  { latitude: 37.7849, longitude: -122.4094 },
  'driving'
);
```

### 2. Utility Functions

Use the utility functions for distance calculations:

```typescript
import { calculateDistanceKm, formatDistance } from '@/lib/apple-maps/service';

const distance = calculateDistanceKm(
  { latitude: 37.7749, longitude: -122.4194 },
  { latitude: 37.7849, longitude: -122.4094 }
);

const formattedDistance = formatDistance(distance * 1000); // Convert to meters
```

### 3. Expo Integration

For your Expo app, you can use these endpoints directly:

```typescript
// In your Expo app
const geocodeAddress = async (address: string) => {
  const response = await fetch('https://cribnosh.co.uk/api/apple-maps/geocode', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      address,
      countryCode: 'US',
      language: 'en'
    }),
  });
  
  const data = await response.json();
  return data.data;
};

// Search for nearby places
const searchPlaces = async (query: string, location: { latitude: number; longitude: number }) => {
  const response = await fetch('https://cribnosh.co.uk/api/apple-maps/places-search', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      query,
      location,
      radius: 5000,
      categories: ['restaurant', 'food']
    }),
  });
  
  const data = await response.json();
  return data.data.places;
};
```

## Integration with Existing Features

### 1. Search Results Enhancement

The search results component can now use Apple Maps for better distance calculations:

```typescript
// In components/try-it/search-results.tsx
import { calculateDistanceKm, formatDistanceMiles } from '@/lib/apple-maps/service';

function calculateDistance(userLocation: any, mealLocation: any): string {
  if (!userLocation || !mealLocation) {
    return "Distance unavailable";
  }

  const distanceKm = calculateDistanceKm(userLocation, mealLocation);
  return formatDistanceMiles(distanceKm * 1000); // Convert to meters then to miles
}
```

### 2. Food Creator Location Services

Enhance food creator location queries with Apple Maps:

```typescript
// In convex/queries/food creators.ts
import { locationService } from '@/lib/location/service';

export const getNearbyFood Creators = query({
  args: {
    latitude: v.number(),
    longitude: v.number(),
    radius: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Use Apple Maps for enhanced location services
    const location = { latitude: args.latitude, longitude: args.longitude };
    
    // Get enhanced location data
    const enhancedLocation = await locationService.reverseGeocode(location);
    
    // Search for nearby food creators using Apple Maps places search
    const nearbyPlaces = await locationService.searchNearbyPlaces(
      'food creator kitchen',
      location,
      args.radius || 5000,
      ['restaurant', 'food']
    );
    
    // Combine with your existing food creator data
    // ... rest of your implementation
  },
});
```

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  const result = await locationService.geocodeAddress('123 Main St');
  if (result) {
    console.log('Geocoding successful:', result);
  } else {
    console.log('No results found');
  }
} catch (error) {
  console.error('Geocoding failed:', error);
  // Fallback to basic location service
}
```

## Rate Limits and Caching

Apple Maps API has rate limits. Consider implementing:

1. **Caching**: Cache geocoding results to reduce API calls
2. **Rate Limiting**: Implement client-side rate limiting
3. **Fallbacks**: Use basic location services as fallback

## Security Considerations

1. **API Key Protection**: Never expose your API key in client-side code
2. **Domain Restrictions**: Configure allowed domains in Apple Developer Console
3. **Usage Monitoring**: Monitor API usage and costs

## Testing

Test the integration with sample data:

```typescript
// Test geocoding
const testAddress = '1600 Amphitheatre Parkway, Mountain View, CA';
const result = await locationService.geocodeAddress(testAddress);
console.log('Test result:', result);

// Test places search
const testLocation = { latitude: 37.7749, longitude: -122.4194 };
const places = await locationService.searchNearbyPlaces('restaurants', testLocation);
console.log('Found places:', places.length);
```

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify the key is correctly set in environment variables
   - Check domain restrictions in Apple Developer Console
   - Ensure the key has the correct permissions

2. **No Results Returned**
   - Check if the address/coordinates are valid
   - Verify the search radius is appropriate
   - Try different language codes

3. **Rate Limit Exceeded**
   - Implement caching for repeated requests
   - Add delays between requests
   - Monitor usage in Apple Developer Console

### Debug Mode

Enable debug logging:

```typescript
// Set environment variable
CONVEX_LOG_LEVEL=debug
```

## Related Files

- `app/api/apple-maps/` - API endpoints
- `lib/apple-maps/service.ts` - Service utilities
- `lib/location/service.ts` - Enhanced location service
- `env.template` - Environment variables template

## Next Steps

1. **Implement Caching**: Add Redis caching for geocoding results
2. **Add Monitoring**: Set up alerts for API usage and errors
3. **Optimize Performance**: Implement request batching and optimization
4. **User Experience**: Add loading states and error handling in UI components
