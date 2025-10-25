// Map-related TypeScript types for Apple Maps integration

// ============================================================================
// CORE MAP TYPES
// ============================================================================

export interface MapLocation {
  latitude: number;
  longitude: number;
}

export interface MapRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// ============================================================================
// CHEF MARKER TYPES
// ============================================================================

export interface ChefMarker {
  id: string;
  name: string;
  kitchen_name: string;
  cuisine: string;
  rating: number;
  review_count: number;
  delivery_time: string;
  distance: string;
  image_url?: string;
  is_live?: boolean;
  live_viewers?: number;
  sentiment:
    | "bussing"
    | "mid"
    | "notIt"
    | "fire"
    | "slaps"
    | "decent"
    | "meh"
    | "trash"
    | "elite"
    | "solid"
    | "average"
    | "skip";
  location: MapLocation;
  address?: string;
  created_at: string;
}

// ============================================================================
// APPLE MAPS API TYPES
// ============================================================================

// Geocoding API
export interface GeocodeRequest {
  address: string;
  countryCode?: string;
  language?: string;
}

export interface GeocodeResponse {
  success: boolean;
  data: {
    coordinates: MapLocation;
    formattedAddress: string;
    components: {
      streetNumber?: string;
      streetName?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

// Reverse Geocoding API
export interface ReverseGeocodeRequest {
  latitude: number;
  longitude: number;
  language?: string;
}

export interface ReverseGeocodeResponse {
  success: boolean;
  data: {
    formattedAddress: string;
    components: {
      streetNumber?: string;
      streetName?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };
}

// Places Search API
export interface PlacesSearchRequest {
  query: string;
  location: MapLocation;
  radius?: number;
  language?: string;
  categories?: string[];
}

export interface MapPlace {
  id: string;
  name: string;
  address: string;
  coordinates: MapLocation;
  phoneNumber?: string;
  website?: string;
  categories: string[];
  rating?: number;
  priceLevel?: number;
  distance: number;
}

export interface PlacesSearchResponse {
  success: boolean;
  data: {
    places: MapPlace[];
    totalResults: number;
  };
}

// Directions API
export interface DirectionsRequest {
  origin: MapLocation;
  destination: MapLocation;
  mode: "driving" | "walking" | "transit";
  language?: string;
}

export interface DirectionStep {
  instruction: string;
  distance: {
    value: number;
    text: string;
  };
  duration: {
    value: number;
    text: string;
  };
  coordinates: MapLocation[];
}

export interface DirectionRoute {
  distance: {
    value: number;
    text: string;
  };
  duration: {
    value: number;
    text: string;
  };
  steps: DirectionStep[];
}

export interface DirectionsResponse {
  success: boolean;
  data: {
    routes: DirectionRoute[];
    summary: {
      totalDistance: number;
      totalDuration: number;
      mode: string;
    };
  };
}

// ============================================================================
// MAP COMPONENT PROPS
// ============================================================================

export interface MapViewProps {
  chefs: ChefMarker[];
  initialRegion?: MapRegion;
  onMarkerPress?: (chef: ChefMarker) => void;
  showUserLocation?: boolean;
  style?: any;
}

export interface MapMarkerProps {
  chef: ChefMarker;
  onPress?: (chef: ChefMarker) => void;
  isSelected?: boolean;
}

export interface MapBottomSheetProps {
  isVisible: boolean;
  onToggleVisibility: () => void;
  chefs: ChefMarker[];
  onChefSelect?: (chef: ChefMarker) => void;
  onGetDirections?: (chef: ChefMarker) => void;
  userLocation?: MapLocation;
}

// ============================================================================
// LOCATION HOOK TYPES
// ============================================================================

export interface UserLocationState {
  location: MapLocation | null;
  isLoading: boolean;
  error: string | null;
  permissionStatus: 'granted' | 'denied' | 'undetermined';
}

export interface LocationPermissionResult {
  granted: boolean;
  canAskAgain: boolean;
  status: 'granted' | 'denied' | 'undetermined';
}

// ============================================================================
// ERROR TYPES
// ============================================================================

export interface MapError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface ApiErrorResponse {
  success: false;
  error: MapError;
  timestamp: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type MapProvider = 'apple' | 'google';

export interface MapConfig {
  provider: MapProvider;
  apiKey?: string;
  region?: MapRegion;
  zoomLevel?: number;
}

export interface SearchFilters {
  radius?: number;
  cuisine?: string[];
  ratingMin?: number;
  priceLevel?: number[];
  isLive?: boolean;
}
