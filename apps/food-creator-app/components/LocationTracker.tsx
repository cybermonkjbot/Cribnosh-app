import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { api } from '@/convex/_generated/api';
import { LocationData, locationService } from '@/services/LocationService';
import { useMutation } from 'convex/react';
import { useEffect } from 'react';

export function LocationTracker() {
    const { foodCreator: chef, isAuthenticated, sessionToken } = useFoodCreatorAuth();
    const updateChefLocation = useMutation(api.mutations.foodCreators.updateChefLocation);

    useEffect(() => {
        // Only track if authenticated and have chef profile
        if (!isAuthenticated || !chef?._id || !sessionToken) {
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
                    timeInterval: 60000, // Update every minute for chefs (less critical than drivers)
                    distanceInterval: 100, // Or every 100 meters
                }
            );
        };

        const updateLocation = (location: LocationData) => {
            if (!chef?._id) return;

            updateChefLocation({
                chefId: chef._id,
                lat: location.latitude,
                lng: location.longitude,
                sessionToken,
            }).catch((err) => {
                console.error('Failed to update chef location:', err);
            });
        };

        startTracking();

        return () => {
            locationService.stopLocationWatching();
        };
    }, [isAuthenticated, chef?._id, sessionToken]);

    return null; // Logic component only, no UI
}
