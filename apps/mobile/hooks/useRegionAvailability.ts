/**
 * React Hook for Regional Availability Checking
 *
 * Provides a hook to check if an address or location is in a supported region
 * for ordering. Uses API endpoint for real-time availability checks.
 */

import {
  useCheckRegionAvailabilityMutation,
  useGetRegionalAvailabilityConfigQuery,
} from "@/store/customerApi";
import { CustomerAddress } from "@/types/customer";
import {
  getDefaultRegionalConfig,
  RegionalAvailabilityConfig,
} from "@/utils/regionValidation";
import { useCallback, useMemo } from "react";

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
  // Fetch regional availability config from API
  const { data: configData, isLoading: configLoading } =
    useGetRegionalAvailabilityConfigQuery();

  // Mutation for checking region availability
  const [checkRegionAvailability, { isLoading: isChecking }] =
    useCheckRegionAvailabilityMutation();

  // Use default config if query returns undefined (not loaded yet)
  const effectiveConfig = useMemo(() => {
    if (configLoading) {
      return null; // Still loading
    }
    if (configData?.success && configData.data) {
      return configData.data;
    }
    return getDefaultRegionalConfig();
  }, [configData, configLoading]);

  const isLoading = configLoading;

  /**
   * Check if an address is in a supported region using API endpoint
   */
  const checkAddress = useCallback(
    async (address: CustomerAddress): Promise<boolean> => {
      try {
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
          return false;
        }

        const result = await checkRegionAvailability(request).unwrap();
        return result.success && result.data?.isSupported === true;
      } catch (error) {
        console.error("Error checking region availability:", error);
        // On error, return false as a safety measure
        return false;
      }
    },
    [checkRegionAvailability]
  );

  /**
   * Check if a city (and optionally country) is in a supported region using API endpoint
   */
  const checkCity = useCallback(
    async (city: string, country?: string): Promise<boolean> => {
      try {
        const request: {
          city?: string;
          country?: string;
        } = {
          city,
          country: country || "UK", // Default to UK if not provided
        };

        const result = await checkRegionAvailability(request).unwrap();
        return result.success && result.data?.isSupported === true;
      } catch (error) {
        console.error("Error checking region availability:", error);
        // On error, return false as a safety measure
        return false;
      }
    },
    [checkRegionAvailability]
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
