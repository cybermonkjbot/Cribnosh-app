/**
 * React Hook for Regional Availability Checking
 * 
 * Provides a hook to check if an address or location is in a supported region
 * for ordering. Caches the config for performance.
 */

import { useMemo } from 'react';
import { CustomerAddress } from '@/types/customer';
import {
  isAddressInSupportedRegion,
  getDefaultRegionalConfig,
  RegionalAvailabilityConfig,
} from '@/utils/regionValidation';
import { useGetRegionalAvailabilityConfigQuery } from '@/store/customerApi';

export interface UseRegionAvailabilityResult {
  config: RegionalAvailabilityConfig | null;
  isLoading: boolean;
  checkAddress: (address: CustomerAddress) => boolean;
  checkCity: (city: string, country?: string) => boolean;
  isSupported: boolean | null; // null if config not loaded yet
}

/**
 * Hook to check regional availability for ordering
 * 
 * @returns Object with config, loading state, and check methods
 */
export function useRegionAvailability(): UseRegionAvailabilityResult {
  // Fetch regional availability config from API
  const { data: configData, isLoading: configLoading } = useGetRegionalAvailabilityConfigQuery();
  
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
   * Check if an address is in a supported region
   */
  const checkAddress = useMemo(() => {
    return (address: CustomerAddress): boolean => {
      if (!effectiveConfig) {
        return false; // Default to false if config not loaded
      }
      return isAddressInSupportedRegion(address, effectiveConfig);
    };
  }, [effectiveConfig]);

  /**
   * Check if a city (and optionally country) is in a supported region
   */
  const checkCity = useMemo(() => {
    return (city: string, country?: string): boolean => {
      if (!effectiveConfig) {
        return false; // Default to false if config not loaded
      }
      
      const address: CustomerAddress = {
        city,
        country: country || 'UK', // Default to UK if not provided
      };
      
      return isAddressInSupportedRegion(address, effectiveConfig);
    };
  }, [effectiveConfig]);

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
    checkAddress,
    checkCity,
    isSupported,
  };
}

