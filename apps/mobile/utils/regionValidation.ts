/**
 * Client-side Regional Availability Validation Utilities
 * 
 * Provides utilities to check if a location (city, coordinates, or address)
 * is within supported regions for ordering.
 */

import { CustomerAddress } from '@/types/customer';

export interface RegionalAvailabilityConfig {
  enabled: boolean;
  supportedRegions: string[];
  supportedCities: string[];
  supportedCountries: string[];
}

/**
 * Normalize city name for comparison (case-insensitive, trim whitespace)
 */
export function normalizeCityName(city: string): string {
  return city.trim().toLowerCase();
}

/**
 * Normalize country name for comparison (case-insensitive, trim whitespace)
 */
export function normalizeCountryName(country: string): string {
  return country.trim().toLowerCase();
}

/**
 * Check if a city is in the supported cities list
 */
export function isCitySupported(
  city: string,
  config: RegionalAvailabilityConfig
): boolean {
  if (!config.enabled) {
    return true;
  }

  if (!city) {
    return false;
  }

  const normalizedCity = normalizeCityName(city);
  return config.supportedCities.some(
    (supportedCity) => normalizeCityName(supportedCity) === normalizedCity
  );
}

/**
 * Check if a country is in the supported countries list
 */
export function isCountrySupported(
  country: string,
  config: RegionalAvailabilityConfig
): boolean {
  if (!config.enabled) {
    return true;
  }

  if (!country) {
    return false;
  }

  const normalizedCountry = normalizeCountryName(country);
  return config.supportedCountries.some(
    (supportedCountry) => normalizeCountryName(supportedCountry) === normalizedCountry
  );
}

/**
 * Check if an address is in a supported region
 * 
 * Returns true if:
 * - Regional availability is disabled, OR
 * - The city is in supported cities AND country is in supported countries
 */
export function isAddressInSupportedRegion(
  address: CustomerAddress,
  config: RegionalAvailabilityConfig
): boolean {
  if (!config.enabled) {
    return true;
  }

  // Check city
  if (address.city) {
    if (!isCitySupported(address.city, config)) {
      return false;
    }
  }

  // Check country
  if (address.country) {
    if (!isCountrySupported(address.country, config)) {
      return false;
    }
  }

  // If we have both city and country and both passed, return true
  if (address.city && address.country) {
    return true;
  }

  // If we only have city and it's supported, return true
  if (address.city && !address.country) {
    return true;
  }

  // If we only have country and it's supported, return true
  if (address.country && !address.city) {
    return true;
  }

  // If we have coordinates but no city/country, we'd need reverse geocoding
  // For now, return false as a safety measure
  if (address.coordinates && !address.city && !address.country) {
    return false;
  }

  // No location info provided
  return false;
}

/**
 * Get default regional availability configuration
 */
export function getDefaultRegionalConfig(): RegionalAvailabilityConfig {
  return {
    enabled: true,
    supportedRegions: ["Midlands", "West Midlands", "East Midlands"],
    supportedCities: [
      "Birmingham",
      "Leicester",
      "Nottingham",
      "Coventry",
      "Stoke-on-Trent",
      "Derby",
      "Wolverhampton",
      "Northampton",
    ],
    supportedCountries: ["UK"],
  };
}

