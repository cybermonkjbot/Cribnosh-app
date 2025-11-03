// Apple Maps API service layer for backend integration
import {
    ChefMarker,
    DirectionsRequest,
    DirectionsResponse,
    GeocodeRequest,
    GeocodeResponse,
    MapLocation,
    PlacesSearchRequest,
    PlacesSearchResponse,
    ReverseGeocodeRequest,
    ReverseGeocodeResponse,
} from '@/types/maps';

import { API_CONFIG } from '@/constants/api';

// Base API configuration (uses env variable with fallback to production)
const API_BASE_URL = API_CONFIG.baseUrlNoTrailing;

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  method: 'GET' | 'POST' = 'POST',
  body?: any
): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        // Add authentication headers if needed
        // 'Authorization': `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error?.message || 'API request failed');
    }

    return data;
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
}

// ============================================================================
// CHEF LOCATION SERVICES
// ============================================================================

/**
 * Get nearby chefs with location data
 */
export async function getNearbyChefs(
  latitude: number,
  longitude: number,
  radius: number = 5,
  limit: number = 20,
  page: number = 1
): Promise<{ chefs: ChefMarker[]; pagination: any }> {
  const params = new URLSearchParams({
    latitude: latitude.toString(),
    longitude: longitude.toString(),
    radius: radius.toString(),
    limit: limit.toString(),
    page: page.toString(),
  });

  const response = await apiRequest<any>(`/customer/chefs/nearby?${params}`, 'GET');
  
  return {
    chefs: response.data.chefs,
    pagination: response.data.pagination,
  };
}

/**
 * Search chefs by location/address
 */
export async function searchChefsByLocation(
  query: string,
  location: MapLocation,
  radius: number = 3,
  cuisine?: string,
  limit: number = 10
): Promise<{ chefs: ChefMarker[]; searchMetadata: any }> {
  const request = {
    query,
    location,
    radius,
    cuisine,
    limit,
  };

  const response = await apiRequest<any>('/customer/chefs/search-by-location', 'POST', request);
  
  return {
    chefs: response.data.chefs,
    searchMetadata: response.data.search_metadata,
  };
}

/**
 * Get chef details with location
 */
export async function getChefDetails(chefId: string): Promise<ChefMarker> {
  const response = await apiRequest<any>(`/customer/chefs/${chefId}`, 'GET');
  return response.data;
}

// ============================================================================
// GEOCODING SERVICES
// ============================================================================

/**
 * Convert an address to coordinates using Apple Maps API
 */
export async function geocodeAddress(
  address: string,
  countryCode: string = 'US',
  language: string = 'en'
): Promise<GeocodeResponse> {
  const request: GeocodeRequest = {
    address,
    countryCode,
    language,
  };

  return apiRequest<GeocodeResponse>('/apple-maps/geocode', 'POST', request);
}

/**
 * Convert coordinates to an address using Apple Maps API
 */
export async function reverseGeocode(
  latitude: number,
  longitude: number,
  language: string = 'en'
): Promise<ReverseGeocodeResponse> {
  const request: ReverseGeocodeRequest = {
    latitude,
    longitude,
    language,
  };

  return apiRequest<ReverseGeocodeResponse>('/apple-maps/reverse-geocode', 'POST', request);
}

// ============================================================================
// PLACES SEARCH SERVICES
// ============================================================================

/**
 * Search for nearby places using Apple Maps API
 */
export async function searchPlaces(
  query: string,
  location: MapLocation,
  radius: number = 5000,
  language: string = 'en',
  categories?: string[]
): Promise<PlacesSearchResponse> {
  const request: PlacesSearchRequest = {
    query,
    location,
    radius,
    language,
    categories,
  };

  return apiRequest<PlacesSearchResponse>('/apple-maps/places-search', 'POST', request);
}

/**
 * Search for restaurants specifically
 */
export async function searchRestaurants(
  location: MapLocation,
  radius: number = 5000,
  language: string = 'en'
): Promise<PlacesSearchResponse> {
  return searchPlaces('restaurants', location, radius, language, ['restaurant', 'food']);
}

/**
 * Search for specific cuisine types
 */
export async function searchCuisine(
  cuisine: string,
  location: MapLocation,
  radius: number = 5000,
  language: string = 'en'
): Promise<PlacesSearchResponse> {
  return searchPlaces(cuisine, location, radius, language, ['restaurant']);
}

// ============================================================================
// DIRECTIONS SERVICES
// ============================================================================

/**
 * Get turn-by-turn directions between two points
 */
export async function getDirections(
  origin: MapLocation,
  destination: MapLocation,
  mode: 'driving' | 'walking' | 'transit' = 'driving',
  language: string = 'en'
): Promise<DirectionsResponse> {
  const request: DirectionsRequest = {
    origin,
    destination,
    mode,
    language,
  };

  return apiRequest<DirectionsResponse>('/apple-maps/directions', 'POST', request);
}

/**
 * Get driving directions to a chef/restaurant
 */
export async function getDirectionsToChef(
  userLocation: MapLocation,
  chefLocation: MapLocation,
  mode: 'driving' | 'walking' | 'transit' = 'driving'
): Promise<DirectionsResponse> {
  return getDirections(userLocation, chefLocation, mode);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

/**
 * Format distance for display
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)}m away`;
  } else {
    return `${distanceKm.toFixed(1)}km away`;
  }
}

/**
 * Get current location using browser/device geolocation
 */
export function getCurrentLocation(): Promise<MapLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        reject(new Error(`Geolocation error: ${error.message}`));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutes
      }
    );
  });
}

/**
 * Validate coordinates
 */
export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return (
    latitude >= -90 &&
    latitude <= 90 &&
    longitude >= -180 &&
    longitude <= 180 &&
    !isNaN(latitude) &&
    !isNaN(longitude)
  );
}

/**
 * Create a map region from center point and radius
 */
export function createMapRegion(
  center: MapLocation,
  radiusKm: number = 5
): { latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } {
  // Approximate conversion from km to degrees
  const latitudeDelta = radiusKm / 111; // 1 degree ≈ 111 km
  const longitudeDelta = radiusKm / (111 * Math.cos(center.latitude * Math.PI / 180));

  return {
    latitude: center.latitude,
    longitude: center.longitude,
    latitudeDelta,
    longitudeDelta,
  };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

export class MapsApiError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: Record<string, any>
  ) {
    super(message);
    this.name = 'MapsApiError';
  }
}

/**
 * Handle API errors consistently
 */
export function handleApiError(error: any): MapsApiError {
  if (error instanceof MapsApiError) {
    return error;
  }

  if (error.response?.data?.error) {
    const apiError = error.response.data.error;
    return new MapsApiError(
      apiError.message || 'API request failed',
      apiError.code,
      apiError.details
    );
  }

  return new MapsApiError(
    error.message || 'An unexpected error occurred',
    'UNKNOWN_ERROR'
  );
}
