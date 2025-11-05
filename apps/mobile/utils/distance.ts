/**
 * Distance estimation utility
 * Calculates and formats distance between two coordinates
 */

export interface Location {
  latitude: number;
  longitude: number;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param location1 First location (latitude, longitude)
 * @param location2 Second location (latitude, longitude)
 * @returns Distance in kilometers
 */
export function calculateDistanceKm(
  location1: Location,
  location2: Location
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (location2.latitude - location1.latitude) * Math.PI / 180;
  const dLon = (location2.longitude - location1.longitude) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(location1.latitude * Math.PI / 180) * 
    Math.cos(location2.latitude * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distance in kilometers
}

/**
 * Format distance for display
 * @param distanceKm Distance in kilometers
 * @returns Formatted distance string (e.g., "0.8 km", "500m")
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 0.1) {
    // Less than 100m, show in meters
    return `${Math.round(distanceKm * 1000)}m`;
  } else if (distanceKm < 1) {
    // Less than 1km, show with one decimal place
    return `${distanceKm.toFixed(1)} km`;
  } else {
    // 1km or more, show with one decimal place
    return `${distanceKm.toFixed(1)} km`;
  }
}

/**
 * Estimate distance between two locations and format for display
 * @param location1 First location
 * @param location2 Second location
 * @returns Formatted distance string (e.g., "0.8 km", "500m")
 */
export function estimateDistance(
  location1: Location,
  location2: Location
): string {
  const distanceKm = calculateDistanceKm(location1, location2);
  return formatDistance(distanceKm);
}

