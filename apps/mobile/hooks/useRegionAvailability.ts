/**
 * React Hook for Regional Availability Checking
 *
 * Provides a hook to check if an address or location is in a supported region
 * for ordering. Uses Convex queries for real-time availability checks.
 */

import { api } from '@/convex/_generated/api';
import { getConvexReactClient } from "@/lib/convexClient";
import { CustomerAddress } from "@/types/customer";
import {
  RegionalAvailabilityConfig,
  getDefaultRegionalConfig,
  isAddressInSupportedRegion,
  isCountrySupported,
} from "@/utils/regionValidation";
import { useAction, useQuery } from "convex/react";
import { useCallback, useMemo, useState } from "react";

export interface UseRegionAvailabilityResult {
  config: RegionalAvailabilityConfig | null;
  isLoading: boolean;
  isChecking: boolean;
  checkAddress: (address: CustomerAddress) => Promise<boolean>;
  checkCity: (city: string, country?: string) => Promise<boolean>;
  isSupported: boolean | null; // null if config not loaded yet
}

/**
 * Hook to check regional availability for ordering
 *
 * @returns Object with config, loading state, and check methods
 */
export function useRegionAvailability(): UseRegionAvailabilityResult {
  // Fetch regional availability config from Convex
  const configData: RegionalAvailabilityConfig | undefined = useQuery(api.queries.admin.getRegionalAvailabilityConfig, {});
  const validateStuartAddress = useAction(api.actions.stuart.validateDeliveryAddress);
  const configLoading = configData === undefined;

  // Track checking state for on-demand region checks
  const [isChecking, setIsChecking] = useState(false);

  // Use default config if query returns undefined (not loaded yet)
  const effectiveConfig = useMemo(() => {
    if (configLoading) {
      return null; // Still loading
    }
    if (configData) {
      return configData;
    }
    return getDefaultRegionalConfig();
  }, [configData, configLoading]);

  const isLoading = configLoading;

  /**
   * Check if an address is in a supported region using Convex query
   * Falls back to config-based check if query fails
   */
  const checkAddress = useCallback(
    async (address: CustomerAddress): Promise<boolean> => {
      setIsChecking(true);
      try {
        const convex = getConvexReactClient();
        const request: {
          city?: string;
          country?: string;
          address?: {
            city?: string;
            country?: string;
            coordinates?: { latitude: number; longitude: number };
          };
        } = {};

        // If we have coordinates, use them
        if (address.coordinates) {
          request.address = {
            city: address.city,
            country: address.country,
            coordinates: {
              latitude: address.coordinates.latitude,
              longitude: address.coordinates.longitude,
            },
          };
        } else if (address.city || address.country) {
          // Use city/country directly
          request.city = address.city;
          request.country = address.country;
        } else {
          // No location info provided
          setIsChecking(false);
          return false;
        }

        // Call Convex query directly for regional availability
        const isSupported = await convex.query(api.queries.admin.checkRegionAvailability, request);

        if (isSupported) {
          // If supported by our internal list, it's definitely supported
          setIsChecking(false);
          return true;
        }

        // If not in our manual list, check if Stuart can handle it (fallback)
        const fullAddress = `${address.street}, ${address.city}, ${address.postal_code}, ${address.country}`;
        const stuartResult = await validateStuartAddress({ address: fullAddress });

        setIsChecking(false);
        return stuartResult.valid === true;
      } catch (error: any) {
        setIsChecking(false);
        // Handle error gracefully - check if we can use config as fallback
        const errorMessage = error?.message || '';

        // Only log unexpected errors
        if (!errorMessage.includes('Server Error')) {
          console.warn("Error checking region availability:", {
            message: errorMessage,
          });
        }

        // Fallback to config-based check if available
        if (effectiveConfig) {
          try {
            return isAddressInSupportedRegion(address, effectiveConfig);
          } catch (fallbackError) {
            // If fallback also fails, return false as safety measure
            if (fallbackError instanceof Error) {
              console.warn("Fallback region check failed:", fallbackError.message);
            }
            return false;
          }
        }

        // If no config available, return false as a safety measure
        // (better to deny than allow unsupported regions)
        return false;
      }
    },
    [effectiveConfig, validateStuartAddress]
  );

  /**
   * Check if a city (and optionally country) is in a supported region using Convex query
   * Falls back to config-based check if query fails
   */
  const checkCity = useCallback(
    async (city: string, country?: string): Promise<boolean> => {
      setIsChecking(true);
      try {
        const convex = getConvexReactClient();
        const request: {
          city?: string;
          country?: string;
        } = {
          city,
          country: country || "UK", // Default to UK if not provided
        };

        // Call Convex query directly
        const isSupported = await convex.query(api.queries.admin.checkRegionAvailability, request);
        setIsChecking(false);
        return isSupported === true;
      } catch (error: any) {
        setIsChecking(false);
        // Handle error gracefully - check if we can use config as fallback
        const errorMessage = error?.message || '';

        // Only log unexpected errors
        if (!errorMessage.includes('Server Error')) {
          console.warn("Error checking region availability:", {
            message: errorMessage,
          });
        }

        // Fallback to config-based check if available
        if (effectiveConfig && city) {
          try {
            const countryToCheck = country || "UK";

            // Check country support
            if (!isCountrySupported(countryToCheck, effectiveConfig)) {
              return false;
            }

            // Check city support if config has supported cities
            if (effectiveConfig.supportedCities && effectiveConfig.supportedCities.length > 0) {
              const normalizedCity = city.trim().toLowerCase();
              const isSupported = effectiveConfig.supportedCities.some(
                (supportedCity) => supportedCity.toLowerCase() === normalizedCity
              );
              return isSupported;
            }

            // If no city list but country is supported, allow it
            return true;
          } catch (fallbackError) {
            // If fallback also fails, return false as safety measure
            if (fallbackError instanceof Error) {
              console.warn("Fallback region check failed:", fallbackError.message);
            }
            return false;
          }
        }

        // If no config available, return false as a safety measure
        // (better to deny than allow unsupported regions)
        return false;
      }
    },
    [effectiveConfig]
  );

  // Determine if region is supported (null means config not loaded)
  const isSupported = useMemo(() => {
    if (effectiveConfig === null) {
      return null;
    }
    return effectiveConfig.enabled;
  }, [effectiveConfig]);

  return {
    config: effectiveConfig,
    isLoading,
    isChecking,
    checkAddress,
    checkCity,
    isSupported,
  };
}
