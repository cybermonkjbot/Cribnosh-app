import * as Location from 'expo-location';
import { Alert } from 'react-native';

export interface LocationData {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number | null;
    heading?: number | null;
    speed?: number | null;
    timestamp: number;
}

export interface AddressData {
    street?: string;
    streetNumber?: string;
    city?: string;
    region?: string;
    country?: string;
    postalCode?: string;
    formattedAddress: string;
}

export interface LocationWithAddress extends LocationData {
    address: AddressData;
}

export interface LocationServiceConfig {
    accuracy?: Location.Accuracy;
    timeInterval?: number;
    distanceInterval?: number;
    enableHighAccuracy?: boolean;
    maximumAge?: number;
}

export class LocationService {
    private static instance: LocationService;
    private permissionStatus: Location.PermissionStatus | null = null;
    private currentLocation: LocationData | null = null;
    private locationSubscription: Location.LocationSubscription | null = null;

    private constructor() { }

    public static getInstance(): LocationService {
        if (!LocationService.instance) {
            LocationService.instance = new LocationService();
        }
        return LocationService.instance;
    }

    /**
     * Request location permissions
     */
    public async requestPermissions(): Promise<boolean> {
        try {
            // Check current permission status
            const { status: currentStatus } = await Location.getForegroundPermissionsAsync();

            if (currentStatus === 'granted') {
                this.permissionStatus = currentStatus;
                return true;
            }

            // Request permission if not granted
            const { status } = await Location.requestForegroundPermissionsAsync();
            this.permissionStatus = status;

            if (status !== 'granted') {
                Alert.alert(
                    'Location Permission Required',
                    'This app needs location access to track your kitchen location. Please enable location permissions in your device settings.',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Open Settings', onPress: () => Location.enableNetworkProviderAsync() }
                    ]
                );
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error requesting location permissions:', error);
            Alert.alert('Permission Error', 'Unable to request location permissions');
            return false;
        }
    }

    /**
     * Get current location with error handling
     */
    public async getCurrentLocation(config?: LocationServiceConfig): Promise<LocationData | null> {
        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                return null;
            }

            const location = await Location.getCurrentPositionAsync({
                accuracy: config?.accuracy || Location.Accuracy.Balanced,
            });

            const locationData: LocationData = {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy ?? undefined,
                altitude: location.coords.altitude,
                heading: location.coords.heading,
                speed: location.coords.speed,
                timestamp: location.timestamp,
            };

            this.currentLocation = locationData;
            return locationData;
        } catch (error) {
            console.error('Error getting current location:', error);
            Alert.alert('Location Error', 'Unable to get your current location. Please check your GPS settings.');
            return null;
        }
    }

    /**
     * Get current location with address information
     */
    public async getCurrentLocationWithAddress(config?: LocationServiceConfig): Promise<LocationWithAddress | null> {
        try {
            const location = await this.getCurrentLocation(config);
            if (!location) {
                return null;
            }

            const address = await this.reverseGeocode(location.latitude, location.longitude);
            if (!address) {
                return null;
            }

            return {
                ...location,
                address,
            };
        } catch (error) {
            console.error('Error getting location with address:', error);
            return null;
        }
    }

    /**
     * Reverse geocode coordinates to get address
     */
    public async reverseGeocode(latitude: number, longitude: number): Promise<AddressData | null> {
        try {
            const addresses = await Location.reverseGeocodeAsync({
                latitude,
                longitude,
            });

            if (addresses.length === 0) {
                return null;
            }

            const address = addresses[0];
            const formattedAddress = this.formatAddress(address);

            return {
                street: address.street || undefined,
                streetNumber: address.streetNumber || undefined,
                city: address.city || undefined,
                region: address.region || undefined,
                country: address.country || undefined,
                postalCode: address.postalCode || undefined,
                formattedAddress,
            };
        } catch (error) {
            console.error('Error reverse geocoding:', error);
            return null;
        }
    }

    /**
     * Forward geocode address to get coordinates
     */
    public async forwardGeocode(address: string): Promise<LocationData | null> {
        try {
            const locations = await Location.geocodeAsync(address);

            if (locations.length === 0) {
                return null;
            }

            const location = locations[0];
            return {
                latitude: location.latitude,
                longitude: location.longitude,
                timestamp: Date.now(),
            };
        } catch (error) {
            console.error('Error forward geocoding:', error);
            return null;
        }
    }

    /**
     * Start watching location changes
     */
    public async startLocationWatching(
        onLocationUpdate: (location: LocationData) => void,
        config?: LocationServiceConfig
    ): Promise<boolean> {
        try {
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                return false;
            }

            // Stop existing subscription if any
            await this.stopLocationWatching();

            const subscription = await Location.watchPositionAsync(
                {
                    accuracy: config?.accuracy || Location.Accuracy.Balanced,
                    timeInterval: config?.timeInterval || 10000, // 10 seconds
                    distanceInterval: config?.distanceInterval || 10, // 10 meters
                },
                (location) => {
                    const locationData: LocationData = {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                        accuracy: location.coords.accuracy ?? undefined,
                        altitude: location.coords.altitude,
                        heading: location.coords.heading,
                        speed: location.coords.speed,
                        timestamp: location.timestamp,
                    };

                    this.currentLocation = locationData;
                    onLocationUpdate(locationData);
                }
            );

            this.locationSubscription = subscription;
            return true;
        } catch (error) {
            console.error('Error starting location watching:', error);
            return false;
        }
    }

    /**
     * Stop watching location changes
     */
    public async stopLocationWatching(): Promise<void> {
        if (this.locationSubscription) {
            this.locationSubscription.remove();
            this.locationSubscription = null;
        }
    }

    /**
     * Get cached current location
     */
    public getCachedLocation(): LocationData | null {
        return this.currentLocation;
    }

    /**
     * Check if location permission is granted
     */
    public async hasPermission(): Promise<boolean> {
        if (this.permissionStatus === 'granted') {
            return true;
        }

        const { status } = await Location.getForegroundPermissionsAsync();
        this.permissionStatus = status;
        return status === 'granted';
    }

    /**
     * Calculate distance between two coordinates in kilometers
     */
    public calculateDistance(
        lat1: number,
        lon1: number,
        lat2: number,
        lon2: number
    ): number {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) *
            Math.cos(this.deg2rad(lat2)) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }

    /**
     * Format address object into readable string
     */
    private formatAddress(address: Location.LocationGeocodedAddress): string {
        const parts = [
            address.streetNumber,
            address.street,
            address.city,
            address.region,
        ].filter(Boolean);

        return parts.join(', ');
    }

    /**
     * Convert degrees to radians
     */
    private deg2rad(deg: number): number {
        return deg * (Math.PI / 180);
    }

    /**
     * Clean up resources
     */
    public async cleanup(): Promise<void> {
        await this.stopLocationWatching();
        this.currentLocation = null;
        this.permissionStatus = null;
    }
}

// Export singleton instance
export const locationService = LocationService.getInstance();
