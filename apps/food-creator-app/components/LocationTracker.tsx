import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { api } from '@/convex/_generated/api';
import { LocationData, locationService } from '@/services/LocationService';
import { useMutation } from 'convex/react';
import { useEffect } from 'react';

export function LocationTracker() {
    const { foodCreator, isAuthenticated, sessionToken } = useFoodCreatorAuth();
    const updateFoodCreatorLocation = useMutation(api.mutations.foodCreators.updateFoodCreatorLocation);

    useEffect(() => {
        // Only track if authenticated and have food creator profile
        if (!isAuthenticated || !foodCreator?._id || !sessionToken) {
            locationService.stopLocationWatching();
            return;
        }

        const startTracking = async () => {
            // Initial update
            const location = await locationService.getCurrentLocation();
            if (location) {
                updateLocation(location);
            }

            // Start watching
            await locationService.startLocationWatching(
                (location) => {
                    updateLocation(location);
                },
                {
                    timeInterval: 60000, // Update every minute for food creators (less critical than drivers)
                    distanceInterval: 100, // Or every 100 meters
                }
            );
        };

        const updateLocation = (location: LocationData) => {
            if (!foodCreator?._id) return;

            updateFoodCreatorLocation({
                foodCreatorId: foodCreator._id,
                lat: location.latitude,
                lng: location.longitude,
                sessionToken,
            }).catch((err) => {
                console.error('Failed to update food creator location:', err);
            });
        };

        startTracking();

        return () => {
            locationService.stopLocationWatching();
        };
    }, [isAuthenticated, foodCreator?._id, sessionToken]);

    return null; // Logic component only, no UI
}
