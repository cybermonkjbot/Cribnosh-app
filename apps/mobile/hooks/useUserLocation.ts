// Custom hook for managing user location
import * as Location from 'expo-location';
import { useCallback, useEffect, useRef, useState } from 'react';
import { LocationPermissionResult, MapLocation, UserLocationState } from '@/types/maps';

export function useUserLocation() {
  const [state, setState] = useState<UserLocationState>({
    location: null,
    isLoading: false,
    error: null,
    permissionStatus: 'undetermined',
  });
  const isMountedRef = useRef(true);

  // Request location permissions
  const requestPermission = useCallback(async (): Promise<LocationPermissionResult> => {
    try {
      if (!isMountedRef.current) {
        return {
          granted: false,
          canAskAgain: false,
          status: 'denied',
        };
      }
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (!isMountedRef.current) {
        return {
          granted: false,
          canAskAgain: false,
          status: 'denied',
        };
      }

      const result: LocationPermissionResult = {
        granted: status === 'granted',
        canAskAgain: status !== 'denied',
        status: status === 'granted' ? 'granted' : 'denied',
      };

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          permissionStatus: result.status,
          isLoading: false,
        }));
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request location permission';
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
          permissionStatus: 'denied',
        }));
      }
      
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
      if (!isMountedRef.current) return null;
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Check if we have permission first
      const { status } = await Location.getForegroundPermissionsAsync();
      if (status !== 'granted') {
        const permissionResult = await requestPermission();
        if (!permissionResult.granted) {
          if (isMountedRef.current) {
            setState(prev => ({
              ...prev,
              error: 'Location permission denied',
              isLoading: false,
            }));
          }
          return null;
        }
      }

      if (!isMountedRef.current) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 1000,
        distanceInterval: 1,
      });

      if (!isMountedRef.current) return null;

      const mapLocation: MapLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          location: mapLocation,
          isLoading: false,
          error: null,
          permissionStatus: 'granted',
        }));
      }

      return mapLocation;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get current location';
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          error: errorMessage,
          isLoading: false,
        }));
      }
      return null;
    }
  }, [requestPermission]);

  // Watch location updates
  const watchLocation = useCallback(() => {
    let subscription: Location.LocationSubscription | null = null;

    const startWatching = async () => {
      try {
        if (!isMountedRef.current) return;

        // Check permissions first
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status !== 'granted') {
          const permissionResult = await requestPermission();
          if (!permissionResult.granted || !isMountedRef.current) {
            return;
          }
        }

        if (!isMountedRef.current) return;

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 5000, // Update every 5 seconds
            distanceInterval: 10, // Update every 10 meters
          },
          (location) => {
            if (!isMountedRef.current) return;
            const mapLocation: MapLocation = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };

            if (isMountedRef.current) {
              setState(prev => ({
                ...prev,
                location: mapLocation,
                error: null,
              }));
            }
          }
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to watch location';
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            error: errorMessage,
          }));
        }
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
        if (isMountedRef.current) {
          setState(prev => ({
            ...prev,
            error: 'Location services are disabled. Please enable them in your device settings.',
          }));
        }
      }
      return enabled;
    } catch (error) {
      if (isMountedRef.current) {
        setState(prev => ({
          ...prev,
          error: 'Failed to check location services',
        }));
      }
      return false;
    }
  }, []);

  // Initialize location on mount
  useEffect(() => {
    const initializeLocation = async () => {
      if (!isMountedRef.current) return;
      const servicesEnabled = await checkLocationServices();
      if (servicesEnabled && isMountedRef.current) {
        await getCurrentLocation();
      }
    };

    initializeLocation();

    return () => {
      isMountedRef.current = false;
    };
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
