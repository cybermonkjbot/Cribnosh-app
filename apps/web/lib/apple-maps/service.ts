/**
 * Apple Maps API Service Utilities
 * Provides helper functions for Apple Maps integration
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface AddressComponents {
  streetNumber?: string;
  streetName?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

interface AppleAddressComponent {
  types: string[];
  longName: string;
  shortName: string;
}

export interface GeocodeResult {
  coordinates: Coordinates;
  formattedAddress: string;
  components: AddressComponents;
}

export interface ReverseGeocodeResult {
  formattedAddress: string;
  components: AddressComponents;
}

export interface PlaceResult {
  id: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  phoneNumber?: string;
  website?: string;
  categories: string[];
  rating?: number;
  priceLevel?: number;
  distance?: number;
}

export interface DirectionsStep {
  instruction: string;
  distance: {
    value: number;
    text: string;
  };
  duration: {
    value: number;
    text: string;
  };
  coordinates: Coordinates[];
}

export interface DirectionsRoute {
  distance: {
    value: number;
    text: string;
  };
  duration: {
    value: number;
    text: string;
  };
  steps: DirectionsStep[];
}

export interface DirectionsResult {
  routes: DirectionsRoute[];
  summary: {
    totalDistance: number;
    totalDuration: number;
    mode: string;
  };
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(coord2.latitude - coord1.latitude);
  const dLon = toRadians(coord2.longitude - coord1.longitude);
  const lat1 = toRadians(coord1.latitude);
  const lat2 = toRadians(coord2.latitude);

  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  return R * c; // Distance in meters
}

/**
 * Calculate distance in miles
 */
export function calculateDistanceMiles(coord1: Coordinates, coord2: Coordinates): number {
  const meters = calculateDistance(coord1, coord2);
  return meters * 0.000621371; // Convert meters to miles
}

/**
 * Calculate distance in kilometers
 */
export function calculateDistanceKm(coord1: Coordinates, coord2: Coordinates): number {
  const meters = calculateDistance(coord1, coord2);
  return meters / 1000; // Convert meters to kilometers
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)}m`;
  } else {
    return `${(meters / 1000).toFixed(1)}km`;
  }
}

/**
 * Format distance in miles for display
 */
export function formatDistanceMiles(meters: number): string {
  const miles = meters * 0.000621371;
  return `${miles.toFixed(1)} miles`;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Validate coordinates
 */
export function validateCoordinates(coordinates: Coordinates): boolean {
  return (
    typeof coordinates.latitude === 'number' &&
    typeof coordinates.longitude === 'number' &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  );
}

/**
 * Apple Maps API Client
 */
export class AppleMapsClient {
  private apiKey: string;
  private baseUrl = 'https://maps-api.apple.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Geocode an address to coordinates
   */
  async geocode(address: string, countryCode = 'US', language = 'en'): Promise<GeocodeResult> {
    const url = new URL(`${this.baseUrl}/geocode`);
    url.searchParams.set('q', address);
    url.searchParams.set('countryCode', countryCode);
    url.searchParams.set('language', language);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    const result = data.results[0];

    const components: AddressComponents = {};
    result.addressComponents.forEach((component: AppleAddressComponent) => {
      if (component.types.includes('street_number')) {
        components.streetNumber = component.longName;
      } else if (component.types.includes('route')) {
        components.streetName = component.longName;
      } else if (component.types.includes('locality')) {
        components.city = component.longName;
      } else if (component.types.includes('administrative_area_level_1')) {
        components.state = component.shortName;
      } else if (component.types.includes('postal_code')) {
        components.postalCode = component.longName;
      } else if (component.types.includes('country')) {
        components.country = component.longName;
      }
    });

    return {
      coordinates: {
        latitude: result.coordinate.latitude,
        longitude: result.coordinate.longitude,
      },
      formattedAddress: result.formattedAddress,
      components,
    };
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(coordinates: Coordinates, language = 'en'): Promise<ReverseGeocodeResult> {
    const url = new URL(`${this.baseUrl}/reverseGeocode`);
    url.searchParams.set('latitude', coordinates.latitude.toString());
    url.searchParams.set('longitude', coordinates.longitude.toString());
    url.searchParams.set('language', language);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Reverse geocoding failed: ${response.status}`);
    }

    const data = await response.json();
    const result = data.results[0];

    const components: AddressComponents = {};
    result.addressComponents.forEach((component: AppleAddressComponent) => {
      if (component.types.includes('street_number')) {
        components.streetNumber = component.longName;
      } else if (component.types.includes('route')) {
        components.streetName = component.longName;
      } else if (component.types.includes('locality')) {
        components.city = component.longName;
      } else if (component.types.includes('administrative_area_level_1')) {
        components.state = component.shortName;
      } else if (component.types.includes('postal_code')) {
        components.postalCode = component.longName;
      } else if (component.types.includes('country')) {
        components.country = component.longName;
      }
    });

    return {
      formattedAddress: result.formattedAddress,
      components,
    };
  }

  /**
   * Search for places
   */
  async searchPlaces(
    query: string,
    location?: Coordinates,
    radius = 5000,
    language = 'en',
    categories?: string[]
  ): Promise<PlaceResult[]> {
    const url = new URL(`${this.baseUrl}/search`);
    url.searchParams.set('q', query);
    url.searchParams.set('language', language);
    url.searchParams.set('radius', radius.toString());

    if (location) {
      url.searchParams.set('latitude', location.latitude.toString());
      url.searchParams.set('longitude', location.longitude.toString());
    }

    if (categories && categories.length > 0) {
      url.searchParams.set('categories', categories.join(','));
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Places search failed: ${response.status}`);
    }

    const data = await response.json();

    interface ApplePlace {
      placeId: string;
      name: string;
      formattedAddress: string;
      coordinate: { latitude: number; longitude: number };
      phoneNumber?: string;
      website?: string;
      categories?: string[];
      rating?: number;
      priceLevel?: string;
    }

    const placesData = data as { results: ApplePlace[] };
    return placesData.results.map((place) => {
      let distance: number | undefined;
      
      if (location) {
        distance = calculateDistance(location, {
          latitude: place.coordinate.latitude,
          longitude: place.coordinate.longitude,
        });
      }

      return {
        id: place.placeId,
        name: place.name,
        address: place.formattedAddress,
        coordinates: {
          latitude: place.coordinate.latitude,
          longitude: place.coordinate.longitude,
        },
        phoneNumber: place.phoneNumber,
        website: place.website,
        categories: place.categories || [],
        rating: place.rating,
        priceLevel: typeof place.priceLevel === 'string' ? parseInt(place.priceLevel) || undefined : place.priceLevel,
        distance,
      };
    });
  }

  /**
   * Get directions between two points
   */
  async getDirections(
    origin: Coordinates,
    destination: Coordinates,
    mode: 'driving' | 'walking' | 'transit' = 'driving',
    language = 'en'
  ): Promise<DirectionsResult> {
    const url = new URL(`${this.baseUrl}/directions`);
    url.searchParams.set('origin', `${origin.latitude},${origin.longitude}`);
    url.searchParams.set('destination', `${destination.latitude},${destination.longitude}`);
    url.searchParams.set('mode', mode);
    url.searchParams.set('language', language);

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Directions failed: ${response.status}`);
    }

    const data = await response.json();

    interface AppleRoute {
      distance: number;
      duration: number;
      legs: Array<{
        steps: Array<{
          instruction: string;
          distance: number;
          duration: number;
          coordinate: { latitude: number; longitude: number };
        }>;
      }>;
    }

    interface DirectionsData {
      routes: AppleRoute[];
    }

    const directionsData = data as DirectionsData;
    const routes = directionsData.routes.map((route) => {
      const formatDistance = (meters: number) => ({
        value: meters,
        text: meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`
      });
      
      const formatDuration = (seconds: number) => ({
        value: seconds,
        text: seconds >= 3600 ? `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m` : `${Math.floor(seconds / 60)}m`
      });

      return {
        distance: formatDistance(route.distance),
        duration: formatDuration(route.duration),
        steps: route.legs.flatMap((leg) => 
          leg.steps.map((step) => ({
            instruction: step.instruction,
            distance: formatDistance(step.distance),
            duration: formatDuration(step.duration),
            coordinates: [step.coordinate],
          }))
        ),
      };
    });

    const firstRoute = routes[0];
    return {
      routes,
      summary: {
        totalDistance: firstRoute?.distance.value || 0,
        totalDuration: firstRoute?.duration.value || 0,
        mode,
      },
    };
  }
}

/**
 * Create Apple Maps client instance
 */
export function createAppleMapsClient(): AppleMapsClient {
  const apiKey = process.env.APPLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('APPLE_MAPS_API_KEY environment variable is required');
  }
  return new AppleMapsClient(apiKey);
}
