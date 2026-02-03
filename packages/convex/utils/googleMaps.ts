// @ts-nocheck
// Google Maps API Types
interface DistanceMatrixResponse {
    status: string;
    rows: {
        elements: {
            status: string;
            distance: { value: number; text: string };
            duration: { value: number; text: string };
        }[];
    }[];
}

interface GeocodingResponse {
    status: string;
    results: {
        geometry: {
            location: { lat: number; lng: number };
        };
    }[];
}

export class GoogleMapsService {
    private apiKey: string;

    constructor(apiKey: string) {
        this.apiKey = apiKey;
    }

    /**
     * Calculate distance and duration between two points using Google Distance Matrix API
     */
    async calculateRouteDistance(
        origin: { lat: number; lng: number },
        destination: { lat: number; lng: number }
    ): Promise<{ distanceKm: number; durationMins: number } | null> {
        try {
            const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${origin.lat},${origin.lng}&destinations=${destination.lat},${destination.lng}&key=${this.apiKey}`;
            const response = await fetch(url);
            const data = await response.json() as DistanceMatrixResponse;

            if (data.status !== 'OK' || !data.rows[0] || !data.rows[0].elements[0]) {
                console.error('Google Maps API Error:', data);
                return null;
            }

            const element = data.rows[0].elements[0];
            if (element.status !== 'OK') {
                return null;
            }

            return {
                distanceKm: element.distance.value / 1000,
                durationMins: Math.round(element.duration.value / 60),
            };
        } catch (error) {
            console.error('Failed to fetch route distance:', error);
            return null;
        }
    }

    /**
     * Geocode an address string to coordinates
     */
    async geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
        try {
            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
            const response = await fetch(url);
            const data = await response.json() as GeocodingResponse;

            if (data.status !== 'OK' || !data.results[0]) {
                console.error('Google Maps Geocoding Error:', data);
                return null;
            }

            return data.results[0].geometry.location;
        } catch (error) {
            console.error('Failed to geocode address:', error);
            return null;
        }
    }
}
