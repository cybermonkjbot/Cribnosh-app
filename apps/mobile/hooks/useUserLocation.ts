// Custom hook for managing user location
import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';
import { LocationPermissionResult, MapLocation, UserLocationState } from '@/types/maps';

export function useUserLocation() {
  const [state, setState] = useState<UserLocationState>({
    location: null,
    isLoading: false,
    error: null,
    permissionStatus: 'undetermined',
  });

  // Request location permissions
  const requestPermission = useCallback(async (): Promise<LocationPermissionResult> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      const result: LocationPermissionResult = {
        granted: status === 'granted',
        canAskAgain: status !== 'denied',
        status: status === 'granted' ? 'granted' : 'denied',
      };

      setState(prev => ({
        ...prev,
        permissionStatus: result.status,
        isLoading: false,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request location permission';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
        permissionStatus: 'denied',
      }));
      
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }, []);

  // Get current location
  const getCurrentLocation = useCallback(async (): Promise<MapLocation | null> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if we have permission first
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const permissionResult = await requestPermission();
        if (!permissionResult.granted) {
          setState(prev => ({
            ...prev,
            error: 'Location permission denied',
            isLoading: false,
          }));
          return null;
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 1000,
        distanceInterval: 1,
      });

      const mapLocation: MapLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      setState(prev => ({
        ...prev,
        location: mapLocation,
        isLoading: false,
        error: null,
        permissionStatus: 'granted',
      }));

      return mapLocation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get current location';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        isLoading: false,
      }));
      return null;
    }
  }, [requestPermission]);

  // Watch location updates
  const watchLocation = useCallback(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      try {
        // Check permissions first
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const permissionResult = await requestPermission();
          if (!permissionResult.granted) {
            return;
          }
        }

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Update every 10 meters
          },
          (location) => {
            const mapLocation: MapLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };

            setState(prev => ({
              ...prev,
              location: mapLocation,
              error: null,
            }));
          }
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to watch location';
        setState(prev => ({
          ...prev,
          error: errorMessage,
        }));
      }
    };

    startWatching();

    // Return cleanup function
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [requestPermission]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Check if location services are enabled
  const checkLocationServices = useCallback(async (): Promise<boolean> => {
    try {
      const enabled = await Location.hasServicesEnabledAsync();
      if (!enabled) {
        setState(prev => ({
          ...prev,
          error: 'Location services are disabled. Please enable them in your device settings.',
        }));
      }
      return enabled;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: 'Failed to check location services',
      }));
      return false;
    }
  }, []);

  // Initialize location on mount
  useEffect(() => {
    const initializeLocation = async () => {
      const servicesEnabled = await checkLocationServices();
      if (servicesEnabled) {
        await getCurrentLocation();
      }
    };

    initializeLocation();
  }, [checkLocationServices, getCurrentLocation]);

  return {
    ...state,
    requestPermission,
    getCurrentLocation,
    watchLocation,
    clearError,
    checkLocationServices,
  };
}

// Hook for getting location with automatic permission handling
export function useLocationWithPermission() {
  const locationState = useUserLocation();

  const getLocationWithPermission = useCallback(async (): Promise<MapLocation | null> => {
    // If we already have location and permission, return it
    if (locationState.location && locationState.permissionStatus === 'granted') {
      return locationState.location;
    }

    // If permission is denied and we can't ask again, return null
    if (locationState.permissionStatus === 'denied') {
      return null;
    }

    // Otherwise, try to get current location (this will handle permission request)
    return await locationState.getCurrentLocation();
  }, [locationState]);

  return {
    ...locationState,
    getLocationWithPermission,
  };
}

// Hook for location-based features that need permission
export function useLocationFeature() {
  const locationState = useUserLocation();

  const canUseLocation = locationState.permissionStatus === 'granted' && locationState.location !== null;
  const needsPermission = locationState.permissionStatus === 'undetermined' || locationState.permissionStatus === 'denied';

  return {
    ...locationState,
    canUseLocation,
    needsPermission,
  };
}
