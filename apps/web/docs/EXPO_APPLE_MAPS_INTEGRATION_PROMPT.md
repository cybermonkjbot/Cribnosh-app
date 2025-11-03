# Expo Apple Maps Integration Prompt

I need to integrate Apple Maps with my Expo React Native app. I have a CribNosh backend with Apple Maps API endpoints already set up. Here's what I need:

## Backend API Endpoints Available

### 1. Geocoding Endpoint
```
POST /api/apple-maps/geocode
```
**Purpose:** Convert addresses to coordinates

**Request Body:**
```json
{
  "address": "123 Main St, San Francisco, CA",
  "countryCode": "US", // optional, defaults to "US"
  "language": "en" // optional, defaults to "en"
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

### 2. Reverse Geocoding Endpoint
```
POST /api/apple-maps/reverse-geocode
```
**Purpose:** Convert coordinates to addresses

**Request Body:**
```json
{
  "latitude": 37.7749,
  "longitude": -122.4194,
  "language": "en" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
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

### 3. Places Search Endpoint
```
POST /api/apple-maps/places-search
```
**Purpose:** Search for nearby restaurants, businesses, and points of interest

**Request Body:**
```json
{
  "query": "restaurants",
  "location": {
    "latitude": 37.7749,
    "longitude": -122.4194
  },
  "radius": 5000, // meters, optional, defaults to 5000
  "language": "en", // optional
  "categories": ["restaurant", "food"] // optional array
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "places": [
      {
        "id": "place_123",
        "name": "Joe's Restaurant",
        "address": "123 Main St, San Francisco, CA",
        "coordinates": {
          "latitude": 37.7750,
          "longitude": -122.4190
        },
        "phoneNumber": "+1-555-123-4567",
        "website": "https://joesrestaurant.com",
        "categories": ["restaurant", "italian"],
        "rating": 4.5,
        "priceLevel": 2,
        "distance": 250 // meters from search location
      }
    ],
    "totalResults": 15
  }
}
```

### 4. Directions Endpoint
```
POST /api/apple-maps/directions
```
**Purpose:** Get turn-by-turn directions between two points

**Request Body:**
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
  "mode": "driving", // "driving", "walking", or "transit"
  "language": "en" // optional
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "distance": {
          "value": 1500,
          "text": "1.5 km"
        },
        "duration": {
          "value": 300,
          "text": "5 mins"
        },
        "steps": [
          {
            "instruction": "Head north on Main St",
            "distance": {
              "value": 200,
              "text": "200 m"
            },
            "duration": {
              "value": 60,
              "text": "1 min"
            },
            "coordinates": [
              {
                "latitude": 37.7750,
                "longitude": -122.4190
              }
            ]
          }
        ]
      }
    ],
    "summary": {
      "totalDistance": 1500,
      "totalDuration": 300,
      "mode": "driving"
    }
  }
}
```

## Requirements

### 1. MapKit JS Token Setup
- Help me create a MapKit JS token from Apple Developer Console
- Configure it for Expo/React Native usage
- Handle token restrictions properly

### 2. Expo Map Components
- Create reusable map components using `react-native-maps` or MapKit
- Support for displaying restaurants/chefs on maps
- Interactive markers with custom styling
- User location display

### 3. API Integration
- Create service functions to call my backend Apple Maps endpoints
- Handle geocoding for address input fields
- Implement places search with real-time results
- Add directions functionality

### 4. Key Features Needed
- **Restaurant/Chef Map View**: Show nearby chefs with custom markers
- **Address Search**: Geocode user-entered addresses
- **Location Services**: Get user's current location
- **Directions**: Show route from user to selected chef/restaurant
- **Distance Display**: Show distances in miles/km
- **Offline Support**: Cache map data when possible

### 5. UI Components
- Map screen with search overlay
- Location picker component
- Directions screen with step-by-step navigation
- Custom markers for different chef types
- Loading states and error handling

### 6. Technical Requirements
- Use TypeScript
- Follow Expo best practices
- Handle permissions (location, camera for AR features)
- Implement proper error handling
- Add loading states and user feedback
- Support both iOS and Android

### 7. Integration Points
- Connect with existing chef/restaurant data
- Integrate with user location context
- Work with existing search functionality
- Support dark/light theme switching

## Current Setup
- Expo SDK 50+
- React Native with TypeScript
- Existing location context already implemented
- Backend API running on `https://cribnosh.co.uk`

## Expected Deliverables
1. MapKit JS token configuration guide
2. Reusable map components
3. API service functions
4. Complete map integration
5. Example usage in existing screens
6. Error handling and edge cases

Please provide a complete implementation with proper TypeScript types, error handling, and integration examples.
