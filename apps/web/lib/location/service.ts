import { createAppleMapsClient, calculateDistanceKm, Coordinates, PlaceResult, DirectionsResult } from '@/lib/apple-maps/service';

export interface LocationData {
  ip: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number;
  longitude?: number;
  formattedAddress?: string;
  addressComponents?: Record<string, string>;
  [key: string]: unknown;
}

// You can use any geolocation API. Here we use ipapi.co as an example.
const GEO_API = 'https://ipapi.co';

export async function getLocationFromIp(ip: string): Promise<LocationData | null> {
  if (!ip) return null;
  try {
    const res = await fetch(`${GEO_API}/${ip}/json/`);
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    return {
      ip,
      city: data.city as string | undefined,
      region: data.region as string | undefined,
      country: data.country_name as string | undefined,
      latitude: data.latitude as number | undefined,
      longitude: data.longitude as number | undefined,
      ...data,
    };
  } catch {
    return null;
  }
}

/**
 * Enhanced location service using Apple Maps API
 */
export class LocationService {
  private appleMapsClient;

  constructor() {
    try {
      this.appleMapsClient = createAppleMapsClient();
    } catch (error) {
      console.warn('Apple Maps client not available:', error);
      this.appleMapsClient = null;
    }
  }

  /**
   * Get location from IP address with Apple Maps enhancement
   */
  async getLocationFromIp(ip: string): Promise<LocationData | null> {
    const basicLocation = await getLocationFromIp(ip);
    if (!basicLocation || !this.appleMapsClient) {
      return basicLocation;
    }

    try {
      // Enhance location data using Apple Maps reverse geocoding
      const enhancedLocation = await this.appleMapsClient.reverseGeocode({
        latitude: basicLocation.latitude!,
        longitude: basicLocation.longitude!,
      });

      return {
        ...basicLocation,
        formattedAddress: enhancedLocation.formattedAddress,
        addressComponents: enhancedLocation.components as Record<string, string>,
      };
    } catch (error) {
      console.warn('Apple Maps enhancement failed, using basic location:', error);
      return basicLocation;
    }
  }

  /**
   * Geocode an address to coordinates using Apple Maps
   */
  async geocodeAddress(address: string, countryCode = 'US'): Promise<{
    coordinates: Coordinates;
    formattedAddress: string;
    components: Record<string, string>;
  } | null> {
    if (!this.appleMapsClient) {
      throw new Error('Apple Maps client not available');
    }

    try {
      const result = await this.appleMapsClient.geocode(address, countryCode);
      return {
        coordinates: result.coordinates,
        formattedAddress: result.formattedAddress,
        components: result.components as Record<string, string>,
      };
    } catch (error) {
      console.error('Geocoding failed:', error);
      return null;
    }
  }

  /**
   * Calculate distance between two coordinates
   */
  calculateDistance(coord1: Coordinates, coord2: Coordinates): number {
    return calculateDistanceKm(coord1, coord2);
  }

  /**
   * Search for nearby places using Apple Maps
   */
  async searchNearbyPlaces(
    query: string,
    location: Coordinates,
    radius = 5000,
    categories?: string[]
  ): Promise<PlaceResult[]> {
    if (!this.appleMapsClient) {
      throw new Error('Apple Maps client not available');
    }

    try {
      return await this.appleMapsClient.searchPlaces(query, location, radius, 'en', categories);
    } catch (error) {
      console.error('Places search failed:', error);
      return [];
    }
  }

  /**
   * Get directions between two points
   */
  async getDirections(
    origin: Coordinates,
    destination: Coordinates,
    mode: 'driving' | 'walking' | 'transit' = 'driving'
  ): Promise<DirectionsResult | null> {
    if (!this.appleMapsClient) {
      throw new Error('Apple Maps client not available');
    }

    try {
      return await this.appleMapsClient.getDirections(origin, destination, mode);
    } catch (error) {
      console.error('Directions failed:', error);
      return null;
    }
  }
}

// Export singleton instance
export const locationService = new LocationService();
