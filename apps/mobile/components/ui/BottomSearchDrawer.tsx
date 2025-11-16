import { BlurView } from "expo-blur";
import * as Clipboard from "expo-clipboard";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { AlertCircle, Play, Search } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AccessibilityInfo,
  ActivityIndicator,
  Dimensions,
  Image,
  Platform,
  ScrollView,
  Share,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import {
  HeaderMessage,
  getCompleteDynamicHeader,
} from "../../utils/dynamicHeaderMessages";
import {
  SearchPrompt,
  getDynamicSearchPrompt,
} from "../../utils/dynamicSearchPrompts";
import SearchArea from "../SearchArea";
import {
  DynamicContent,
  DynamicSearchContent
} from "./BottomSearchDrawer/DynamicSearchContent";
import { FilterDropdown, FilterOption } from "./BottomSearchDrawer/FilterDropdown";
import { SearchSuggestionsSkeleton } from "./BottomSearchDrawer/SearchSkeletons";
import { Button } from "./Button";

// Customer API imports
import { useAuthContext } from "@/contexts/AuthContext";
import { useChefs } from "@/hooks/useChefs";
import { useOffers } from "@/hooks/useOffers";
import { useSearch } from "@/hooks/useSearch";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import {
  SearchChef,
  SearchResult,
  SearchSuggestion,
  TrendingItem,
} from "@/types/customer";
import { api } from "../../../../packages/convex/_generated/api";

// Global toast imports
import { showError, showInfo } from "../../lib/GlobalToastManager";

// Location hook
import { useUserLocation } from "@/hooks/useUserLocation";

// BlurEffect for Android fallback
import { BlurEffect } from "@/utils/blurEffects";

// Modal/Sheet context
import { useModalSheet } from "@/context/ModalSheetContext";

// Error boundary for icon components
const SafeIcon = ({
  children,
  fallback,
}: {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) => {
  try {
    return <>{children}</>;
  } catch {
    return <>{fallback || null}</>;
  }
};

// Link Icon Component
const LinkIcon = ({ size = 20, color = "#ffffff" }) => (
  <SafeIcon>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </SafeIcon>
);

// Vegan Leaf Icon Component
const VeganIcon = ({ size = 16, color = "#ffffff" }) => (
  <SafeIcon>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22L6.66 19.7C7.14 19.87 7.64 20 8 20C19 20 22 3 22 3C21 5 14 5.25 9 6.25C4 7.25 2 11.5 2 15.5C2 15.75 2 16.5 2 16.5S2.25 14 3.5 12C5.08 11.14 7.13 10.65 8.5 10.36C10.65 9.85 14.28 9.16 17 8Z"
        fill={color}
      />
    </Svg>
  </SafeIcon>
);

// Gluten Free Wheat Icon Component
const GlutenFreeIcon = ({ size = 16, color = "#ffffff" }) => (
  <SafeIcon>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2L13.09 8.26L16 7L14.5 12.5L19 10.5L16.5 16.5L22 15L18.5 20L12 22L5.5 20L2 15L7.5 16.5L5 10.5L9.5 12.5L8 7L10.91 8.26L12 2Z"
        stroke={color}
        strokeWidth="2"
        fill="none"
      />
      <Path
        d="M8 8L16 16M16 8L8 16"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </Svg>
  </SafeIcon>
);

// Spicy Chili Icon Component
const SpicyIcon = ({ size = 16, color = "#ffffff" }) => (
  <SafeIcon>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 8L13 10V18C13 19.1 12.1 20 11 20S9 19.1 9 18V14L7 12V18C7 20.2 8.8 22 11 22S15 20.2 15 18V12L21 9Z"
        fill={color}
      />
      <Path
        d="M12 6C12.5 6.5 13 7.2 13 8C13 8.8 12.5 9.5 12 10C11.5 9.5 11 8.8 11 8C11 7.2 11.5 6.5 12 6Z"
        fill={color}
      />
    </Svg>
  </SafeIcon>
);

// Food/Restaurant Icon Component
const RestaurantIcon = ({ size = 18, color = "#a3b3a8" }) => (
  <SafeIcon>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M8.1 13.34L13.34 8.1C13.73 7.71 14.36 7.71 14.75 8.1C15.14 8.49 15.14 9.12 14.75 9.51L9.51 14.75C9.12 15.14 8.49 15.14 8.1 14.75C7.71 14.36 7.71 13.73 8.1 13.34Z"
        fill={color}
      />
      <Path
        d="M8 5V2C8 1.45 8.45 1 9 1S10 1.45 10 2V5C10 5.55 9.55 6 9 6S8 5.55 8 5ZM12 5V2C12 1.45 12.45 1 13 1S14 1.45 14 2V5C14 5.55 13.55 6 13 6S12 5.55 12 5ZM16 5V2C16 1.45 16.45 1 17 1S18 1.45 18 2V5C18 5.55 17.55 6 17 6S16 5.55 16 5Z"
        fill={color}
      />
      <Path
        d="M4 7H20C20.55 7 21 7.45 21 8S20.55 9 20 9H4C3.45 9 3 8.55 3 8S3.45 7 4 7ZM5 21C4.45 21 4 20.55 4 20V11H20V20C20 20.55 19.55 21 19 21H5Z"
        fill={color}
      />
    </Svg>
  </SafeIcon>
);

// Removed unused SparkleIcon component

// Nike-style Share Arrow Icon Component for Invite Friend
const ShareArrowIcon = ({ size = 20, color = "#ffffff" }) => (
  <SafeIcon>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M7 17L17 7M17 7H12M17 7V12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </SafeIcon>
);

// Video Icon Component
const VideoIcon = ({ size = 16, color = "#ffffff" }) => (
  <SafeIcon>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M15 10L20.553 6.277C21.217 5.886 22 6.33 22 7.118V16.882C22 17.67 21.217 18.114 20.553 17.723L15 14V10Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill={color}
      />
      <Path
        d="M3 6C3 4.89543 3.89543 4 5 4H13C14.1046 4 15 4.89543 15 6V18C15 19.1046 14.1046 20 13 20H5C3.89543 20 3 19.1046 3 18V6Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </SafeIcon>
);

// Recipe/Book Icon Component
const RecipeIcon = ({ size = 16, color = "#ffffff" }) => (
  <SafeIcon>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M4 19.5C4 18.837 4.263 18.201 4.732 17.732C5.201 17.263 5.837 17 6.5 17H20"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6.5 2H20V22H6.5C5.837 22 5.201 21.737 4.732 21.268C4.263 20.799 4 20.163 4 19.5V4.5C4 3.837 4.263 3.201 4.732 2.732C5.201 2.263 5.837 2 6.5 2Z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 7H16M8 11H16M8 15H12"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </SafeIcon>
);

// Family/Home Icon Component for Setup Family
const FamilyIcon = ({ size = 20, color = "#ffffff" }) => (
  <SafeIcon>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M9 22V12h6v10"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 12a2 2 0 1 0 0-4 2 2 0 0 0 0 4z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M8 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 8a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </SafeIcon>
);

// Group Order Icon Component for Start Group Order
const GroupOrderIcon = ({ size = 20, color = "#ffffff" }) => (
  <SafeIcon>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M16 4a4 4 0 1 1-8 0 4 4 0 0 1 8 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 12a7 7 0 0 0-7 7v3h14v-3a7 7 0 0 0-7-7z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M20 6a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M22 18v-1a5 5 0 0 0-2-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M24 18v-1a5 5 0 0 0-2-4"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  </SafeIcon>
);

interface BottomSearchDrawerProps {
  onOpenAIChat?: () => void;
  onSearchSubmit?: (query: string, filter: string) => void;
  onSuggestionSelect?: (suggestion: any) => void;
  onMealPress?: (meal: any) => void;
  maxSuggestions?: number;
  enableHaptics?: boolean;
  accessibilityLabel?: string;
  userName?: string;
  isAuthenticated?: boolean;
}

// Safe screen dimensions with fallback
const getScreenDimensions = () => {
  try {
    const { height } = Dimensions.get("window");
    return { height: Math.max(height, 400) }; // Minimum height fallback
  } catch {
    return { height: 600 }; // Fallback height
  }
};

const { height: SCREEN_HEIGHT } = getScreenDimensions();
const DRAWER_HEIGHT = Math.min(SCREEN_HEIGHT * 0.85, 600); // Max 85% of screen or 600px
const COLLAPSED_HEIGHT = 100;

// Snap points represent the visible height of the drawer - no closed state
const SNAP_POINTS = {
  COLLAPSED: COLLAPSED_HEIGHT,
  EXPANDED: DRAWER_HEIGHT,
};

type SnapPoint = number;

const SPRING_CONFIG = {
  damping: 50,
  stiffness: 400,
  mass: 0.8,
};

const VELOCITY_THRESHOLD = 500;
const GESTURE_THRESHOLD = 50; // Minimum distance to trigger snap change

export function BottomSearchDrawer({
  onOpenAIChat,
  onSearchSubmit,
  onSuggestionSelect,
  onMealPress,
  maxSuggestions = 20,
  enableHaptics = true,
  accessibilityLabel = "Search drawer",
  userName = "there",
  isAuthenticated = false,
}: BottomSearchDrawerProps) {
  const router = useRouter();
  const { setSearchDrawerExpanded } = useModalSheet();
  const { isAuthenticated: authIsAuthenticated } = useAuthContext();
  const effectiveIsAuthenticated = isAuthenticated || authIsAuthenticated;
  
  // Profile state for preferences
  const [profileData, setProfileData] = useState<any>(null);
  
  // Fetch profile data to extract preferences
  useEffect(() => {
    const fetchProfile = async () => {
      if (!effectiveIsAuthenticated) return;
      
      try {
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          return;
        }

        const result = await (convex as any).action((api.actions as any).users.customerGetProfile, {
          sessionToken,
        });

        if (result.success === false) {
          return;
        }

        setProfileData({
          data: {
            ...result.user,
          },
        });
      } catch (error: any) {
        console.error('Error fetching profile for preferences:', error);
      }
    };

    if (effectiveIsAuthenticated) {
      fetchProfile();
    }
  }, [effectiveIsAuthenticated]);
  
  // Core animation values - using height instead of translateY
  const drawerHeight = useSharedValue(SNAP_POINTS.COLLAPSED);
  const currentSnapPoint = useSharedValue<SnapPoint>(SNAP_POINTS.COLLAPSED);
  const gestureState = useSharedValue<"idle" | "dragging" | "settling">("idle");

  // Gesture tracking
  const initialTouchY = useSharedValue(0);
  const lastSnapPoint = useSharedValue<SnapPoint>(SNAP_POINTS.COLLAPSED);

  // Track if the gesture was a swipe (to avoid focusing input)
  const wasSwipeGesture = useSharedValue(false);
  const startHeight = useSharedValue(0);
  const startSnapPoint = useSharedValue<SnapPoint>(SNAP_POINTS.COLLAPSED);
  const startTime = useSharedValue(0);

  // Search focus state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter chips state
  const [activeFilter, setActiveFilter] = useState("all");
  const [activeSearchFilter, setActiveSearchFilter] = useState("all");

  // Location hook
  const locationState = useUserLocation();
  const userLocation = locationState.location;

  // Natural language detection helper
  const isNaturalLanguageQuery = useCallback((query: string): boolean => {
    const naturalLanguagePatterns = [
      /^show me /i,
      /^i want /i,
      /^i need /i,
      /^find me /i,
      /what.*for (lunch|dinner|breakfast|meal)/i,
      /(lunch|dinner|breakfast|meal) options/i,
    ];
    return naturalLanguagePatterns.some((pattern) => pattern.test(query));
  }, []);

  // Map filter chip IDs to dietary restrictions and other filters
  const getDietaryFiltersFromActiveFilter = useCallback((filterId: string) => {
    switch (filterId) {
      // Dietary Restrictions
      case "vegan":
        return { dietary_restrictions: ["vegan"] };
      case "glutenfree":
        return { dietary_restrictions: ["gluten-free"] };
      case "vegetarian":
        return { dietary_restrictions: ["vegetarian"] };
      case "halal":
        return { dietary_restrictions: ["halal"] };
      case "kosher":
        return { dietary_restrictions: ["kosher"] };
      case "dairyfree":
        return { dietary_restrictions: ["dairy-free"] };
      case "nutfree":
        return { dietary_restrictions: ["nut-free"] };
      case "lowcarb":
        return { dietary_restrictions: ["low-carb"] };
      case "keto":
        return { dietary_restrictions: ["keto"] };
      case "healthy":
        return { dietary_restrictions: ["healthy"] };
      
      // Spice Levels
      case "spicy":
        return { spice_level: "spicy" };
      case "mild":
        return { spice_level: "mild" };
      case "medium":
        return { spice_level: "medium" };
      case "hot":
        return { spice_level: "hot" };
      case "extrahot":
        return { spice_level: "extra-hot" };
      
      // Price Ranges
      case "budget":
      case "under15":
        return { priceRange: { max: 15 } };
      case "under10":
        return { priceRange: { max: 10 } };
      case "under20":
        return { priceRange: { max: 20 } };
      case "under25":
        return { priceRange: { max: 25 } };
      case "premium":
        return { priceRange: { min: 25 } };
      
      // Delivery Time
      case "fast":
      case "delivery15":
        return { delivery_time_max: 15 };
      case "delivery30":
        return { delivery_time_max: 30 };
      case "delivery45":
        return { delivery_time_max: 45 };
      
      // Rating
      case "rating45":
        return { rating_min: 4.5 };
      case "rating4":
        return { rating_min: 4 };
      
      // Cuisine Types
      case "italian":
      case "mexican":
      case "chinese":
      case "indian":
      case "turkish":
      case "japanese":
      case "thai":
      case "mediterranean":
      case "american":
      case "french":
        return { cuisine: filterId };
      
      // Content Types
      case "videos":
        // Videos filter - return empty to handle separately
        return {};
      case "recipes":
        // Recipes filter - return empty to handle separately
        return {};
      
      case "all":
      default:
        return undefined;
    }
  }, []);

  // Search API hooks with dietary filters
  const { search: searchAction, isLoading: isLoadingSearchAction } = useSearch();
  const [searchData, setSearchData] = useState<any>(null);
  const [isLoadingSearch, setIsLoadingSearch] = useState(false);
  const [isErrorSearch, setIsErrorSearch] = useState(false);
  const [searchError, setSearchError] = useState<any>(null);
  
  // Filtered meals for display when filter is active
  const [filteredMealsData, setFilteredMealsData] = useState<any>(null);
  const [isLoadingFilteredMeals, setIsLoadingFilteredMeals] = useState(false);
  const [isErrorFilteredMeals, setIsErrorFilteredMeals] = useState(false);
  
  // Memoize dietary filters to prevent infinite loops
  const dietaryFilters = useMemo(() => {
    return getDietaryFiltersFromActiveFilter(activeFilter);
  }, [activeFilter]);
  
  // Load search results
  useEffect(() => {
    if (
      searchQuery.trim() &&
      isAuthenticated &&
      !isNaturalLanguageQuery(searchQuery) &&
      activeSearchFilter !== "chefs"
    ) {
      const loadSearch = async () => {
        try {
          setIsLoadingSearch(true);
          setIsErrorSearch(false);
          setSearchError(null);
          const result = await searchAction({
            query: searchQuery,
            limit: maxSuggestions,
            location: userLocation ? {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            } : undefined,
            filters: dietaryFilters ? {
              dietary: dietaryFilters.dietary_restrictions,
            } : undefined,
          });
          if (result.success) {
            setSearchData({ success: true, data: result.data });
          }
        } catch (error: any) {
          setIsErrorSearch(true);
          setSearchError(error);
        } finally {
          setIsLoadingSearch(false);
        }
      };
      loadSearch();
    } else {
      // Only set to null if it's not already null to prevent unnecessary updates
      if (searchData !== null) {
        setSearchData(null);
      }
    }
  }, [searchQuery, isAuthenticated, activeSearchFilter, maxSuggestions, userLocation, dietaryFilters, searchAction]);

  // Track which filters have resulted in empty state (cache to avoid reloading)
  // Use ref to avoid dependency issues
  const emptyFiltersCacheRef = useRef<Set<string>>(new Set());

  // Load filtered meals when a filter is active (not "all" and no search query)
  useEffect(() => {
    if (
      activeFilter !== "all" &&
      !searchQuery.trim() &&
      isAuthenticated
    ) {
      // Check if we already know this filter is empty - if so, set empty data immediately without loading
      if (emptyFiltersCacheRef.current.has(activeFilter)) {
        setFilteredMealsData({ success: true, data: { meals: [] } });
        setIsLoadingFilteredMeals(false);
        setIsErrorFilteredMeals(false);
        return;
      }
      
      // Clear old data and set loading state immediately to prevent flicker
      setFilteredMealsData(null);
      setIsLoadingFilteredMeals(true);
      setIsErrorFilteredMeals(false);
      
      const loadFilteredMeals = async () => {
        try {
          // Build filters based on active filter
          const filters: any = {};
          if (dietaryFilters?.dietary_restrictions) {
            filters.dietary = dietaryFilters.dietary_restrictions;
          }
          if (dietaryFilters?.priceRange) {
            filters.priceRange = dietaryFilters.priceRange;
          }
          if (dietaryFilters?.cuisine) {
            filters.cuisine = dietaryFilters.cuisine;
          }
          
          // Use a generic search query that will match meals with the filter
          // For cuisine filters, use the cuisine name as query
          let searchQuery = "";
          if (activeFilter === "spicy" || activeFilter === "hot" || activeFilter === "extrahot") {
            searchQuery = "spicy";
          } else if (["italian", "mexican", "chinese", "indian", "turkish", "japanese", "thai", "mediterranean", "american", "french"].includes(activeFilter)) {
            searchQuery = activeFilter;
          }
          
          const result = await searchAction({
            query: searchQuery,
            limit: 6, // Show 6 meals
            location: userLocation ? {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            } : undefined,
            filters: Object.keys(filters).length > 0 ? filters : undefined,
          });
          if (result.success) {
            // Extract meals from search results
            const meals = result.data?.meals || result.data?.results?.filter((r: any) => r.type === "meals").map((r: any) => r.result) || [];
            setFilteredMealsData({ success: true, data: { meals } });
            
            // Track if this filter resulted in empty state
            if (meals.length === 0) {
              emptyFiltersCacheRef.current.add(activeFilter);
            } else {
              // Remove from cache if we now have meals (in case data changed)
              emptyFiltersCacheRef.current.delete(activeFilter);
            }
          }
        } catch (error: any) {
          setIsErrorFilteredMeals(true);
          // Remove from cache on error
          emptyFiltersCacheRef.current.delete(activeFilter);
        } finally {
          setIsLoadingFilteredMeals(false);
        }
      };
      loadFilteredMeals();
    } else {
      // Clear data when filter is "all" or search query exists
      // Only update if needed to prevent unnecessary re-renders
      if (filteredMealsData !== null || isLoadingFilteredMeals || isErrorFilteredMeals) {
        setFilteredMealsData(null);
        setIsLoadingFilteredMeals(false);
        setIsErrorFilteredMeals(false);
      }
      // Don't clear the cache - keep it for when user switches back
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, isAuthenticated, dietaryFilters, userLocation, searchAction, searchQuery]);

  // Emotions search mutation for natural language queries
  const [isSearchingWithEmotions, setIsSearchingWithEmotions] = useState(false);
  
  // Chef search using useChefs hook
  const { searchChefs } = useChefs();
  const [chefSearchData, setChefSearchData] = useState<any>(null);
  const [isLoadingChefSearch, setIsLoadingChefSearch] = useState(false);
  const [isErrorChefSearch, setIsErrorChefSearch] = useState(false);
  const [chefSearchError, setChefSearchError] = useState<any>(null);

  // Load chef search results
  useEffect(() => {
    if (
      searchQuery.trim() &&
      isAuthenticated &&
      activeSearchFilter === "chefs"
    ) {
      const loadChefSearch = async () => {
        try {
          setIsLoadingChefSearch(true);
          setIsErrorChefSearch(false);
          setChefSearchError(null);
          const result = await searchChefs({
            query: searchQuery,
            limit: maxSuggestions,
            location: userLocation ? {
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            } : undefined,
          });
          if (result.success) {
            setChefSearchData({ success: true, data: result.data });
          }
        } catch (error: any) {
          setIsErrorChefSearch(true);
          setChefSearchError(error);
        } finally {
          setIsLoadingChefSearch(false);
        }
      };
      loadChefSearch();
    } else {
      setChefSearchData(null);
    }
  }, [searchQuery, isAuthenticated, activeSearchFilter, maxSuggestions, userLocation, searchChefs]);

  // Search suggestions hook
  const { getSearchSuggestions } = useSearch();
  const [suggestionsData, setSuggestionsData] = useState<any>(null);
  const [isLoadingSuggestionsQuery, setIsLoadingSuggestionsQuery] = useState(false);
  const [isErrorSuggestionsQuery, setIsErrorSuggestionsQuery] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<any>(null);
  
  useEffect(() => {
    if (searchQuery.trim() && isAuthenticated) {
      const loadSuggestions = async () => {
        try {
          setIsLoadingSuggestionsQuery(true);
          setIsErrorSuggestionsQuery(false);
          setSuggestionsError(null);
          const result = await getSearchSuggestions({ query: searchQuery, limit: maxSuggestions });
          if (result.success) {
            setSuggestionsData({ success: true, data: { suggestions: result.data.suggestions } });
          }
        } catch (error: any) {
          setIsErrorSuggestionsQuery(true);
          setSuggestionsError(error);
        } finally {
          setIsLoadingSuggestionsQuery(false);
        }
      };
      loadSuggestions();
    } else {
      setSuggestionsData(null);
    }
  }, [searchQuery, isAuthenticated, maxSuggestions, getSearchSuggestions]);

  // Trending search hook
  const { getTrendingSearches } = useSearch();
  const [trendingData, setTrendingData] = useState<any>(null);
  const [isLoadingTrendingQuery, setIsLoadingTrendingQuery] = useState(false);
  const [isErrorTrendingQuery, setIsErrorTrendingQuery] = useState(false);
  const [trendingError, setTrendingError] = useState<any>(null);
  
  useEffect(() => {
    if (isAuthenticated) {
      const loadTrending = async () => {
        try {
          setIsLoadingTrendingQuery(true);
          setIsErrorTrendingQuery(false);
          setTrendingError(null);
          const result = await getTrendingSearches({ limit: maxSuggestions });
          if (result.success) {
            setTrendingData({ success: true, data: { trending: result.data.trending } });
          }
        } catch (error: any) {
          setIsErrorTrendingQuery(true);
          setTrendingError(error);
        } finally {
          setIsLoadingTrendingQuery(false);
        }
      };
      loadTrending();
    } else {
      setTrendingData(null);
    }
  }, [isAuthenticated, maxSuggestions, getTrendingSearches]);

  // Active offers using useOffers hook
  const { getActiveOffers } = useOffers();
  const [offersData, setOffersData] = useState<any>(null);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState<any>(null);

  // Load offers for dynamic content
  useEffect(() => {
    if (isAuthenticated) {
      const loadOffers = async () => {
        try {
          setOffersLoading(true);
          setOffersError(null);
          const result = await getActiveOffers("all");
          if (result.success) {
            setOffersData({ success: true, data: result.data });
          }
        } catch (error: any) {
          setOffersError(error);
        } finally {
          setOffersLoading(false);
        }
      };
      loadOffers();
    }
  }, [isAuthenticated, getActiveOffers]);

  // Combined loading state for all search operations
  const isSearching = isLoading || isSearchingWithEmotions || isLoadingSearch || isLoadingChefSearch || isLoadingSuggestionsQuery || isLoadingTrendingQuery;

  // Removed unused bottomSheetRef
  const handleNavigate = (): void => {
    // Navigate to create group order screen
    // User will need to select a chef/restaurant if not already selected
    router.push("/orders/group/create");
  };

  // Custom order and link generation state
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);
  
  const handleInviteFriend = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) {
      showError("Authentication required", "Please sign in to invite friends");
      return;
    }

    try {
      // Step 1: Create a custom order with default budget
      showInfo("Creating order", "Setting up your invite...");
      setIsCreatingOrder(true);
      
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error("Not authenticated");
      }

      const customOrderResult = await (convex as any).action((api.actions as any).orders.customerCreateCustomOrder, {
        sessionToken,
        requirements: "Shared ordering - invite a friend",
        serving_size: 2,
        desired_delivery_time: new Date().toISOString(),
        budget: 2000, // £20 in pence
      });

      if (!customOrderResult.success || !customOrderResult.custom_order?._id) {
        throw new Error(customOrderResult.error || "Failed to create custom order");
      }

      const orderId = customOrderResult.custom_order._id;
      setIsCreatingOrder(false);

      // Step 2: Generate shareable link
      showInfo("Generating link", "Creating your share link...");
      setIsGeneratingLink(true);
      
      const linkResult = await (convex as any).action((api.actions as any).orders.customerGenerateSharedOrderLink, {
        sessionToken,
        order_id: orderId,
      });

      if (!linkResult.success || !linkResult.shareLink) {
        throw new Error(linkResult.error || "Failed to generate share link");
      }

      const shareLink = linkResult.shareLink;
      setIsGeneratingLink(false);
      const shareMessage = `I'm treating you to a meal! 🍽️\n\nUse this link to order: ${shareLink}`;

      // Step 3: Present share options
      try {
        const result = await Share.share({
          message: shareMessage,
          title: "Share your treat",
        });

        if (result.action === Share.sharedAction) {
          showInfo("Link shared", "Your treat link has been shared successfully!");
        } else {
          // User dismissed, copy to clipboard instead
          await Clipboard.setStringAsync(shareLink);
          showInfo("Link copied", "Share link has been copied to your clipboard");
        }
      } catch {
        // Fallback to clipboard if sharing fails
        try {
          await Clipboard.setStringAsync(shareLink);
          showInfo("Link copied", "Share link has been copied to your clipboard");
        } catch {
          showError("Failed to share link", "Please try again");
        }
      }
    } catch (error: unknown) {
      console.error("Error in invite friend flow:", error);
      
      // Handle network errors with deduplication
      const { isNetworkError, handleConvexError } = require("@/utils/networkErrorHandler");
      if (isNetworkError(error)) {
        handleConvexError(error);
      } else {
        const errorMessage = error instanceof Error ? error.message : "Failed to create invite link";
        showError("Invite failed", errorMessage);
      }
      
      setIsCreatingOrder(false);
      setIsGeneratingLink(false);
    }
  }, [isAuthenticated]);

  const handleSetupFamily = (): void => {
    router.push("/shared-ordering/setup");
  };

  // Dynamic search prompt state with error handling
  // Default to "Show me lunch options" to match design
  const [searchPrompt, setSearchPrompt] = useState<SearchPrompt>(() => {
    try {
      const prompt = getDynamicSearchPrompt();
      // Override with "Show me lunch options" to match design
      return {
        ...prompt,
        placeholder: "Show me lunch options",
      };
    } catch {
      return {
        placeholder: "Show me lunch options",
        prompt: "Find delicious meals",
      };
    }
  });

  // Dynamic header messages state
  const [headerMessage, setHeaderMessage] = useState<HeaderMessage>(() => {
    try {
      const message = getCompleteDynamicHeader(userName, true);
      // Ensure subtitle is always present
      return {
        ...message,
        subMessage: message.subMessage || "",
      };
    } catch {
      return {
        greeting: "Hello there",
        mainMessage: "Hungry?\nLet's Fix That",
        subMessage: "",
      };
    }
  });

  // Refs for cleanup
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Update search prompt every 30 minutes with error handling
  useEffect(() => {
    const updatePrompts = () => {
      try {
        setSearchPrompt(getDynamicSearchPrompt());
        setHeaderMessage(getCompleteDynamicHeader(userName, true));
      } catch {
        // Keep existing prompts if update fails
      }
    };

    try {
      intervalRef.current = setInterval(updatePrompts, 30 * 60 * 1000);
      updatePrompts(); // Initial update
    } catch {
      // Failed to set up prompt interval
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      const currentFocusTimeout = focusTimeoutRef.current;
      if (currentFocusTimeout) {
        clearTimeout(currentFocusTimeout);
      }
    };
  }, [userName]);

  // Ref for search input focusing
  const searchInputRef = useRef<any>(null);

  // Safe haptics function
  const triggerHaptic = useCallback(
    (
      style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light
    ) => {
      if (!enableHaptics) return;

      try {
        Haptics.impactAsync(style).catch(() => {
          // Haptic feedback failed
        });
      } catch {
        // Haptic feedback error
      }
    },
    [enableHaptics]
  );

  // Filter categories with error handling (main chips)
  const filterCategories = [
    {
      id: "all",
      label: "All",
      color: "#ff4444",
      icon: <RestaurantIcon size={14} color="#ff4444" />,
    },
    {
      id: "vegan",
      label: "Vegan",
      color: "#00cc88",
      icon: <VeganIcon size={14} color="#00cc88" />,
    },
    {
      id: "glutenfree",
      label: "Gluten Free",
      color: "#ffaa00",
      icon: <GlutenFreeIcon size={14} color="#ffaa00" />,
    },
    {
      id: "spicy",
      label: "Spicy",
      color: "#ff3366",
      icon: <SpicyIcon size={14} color="#ff3366" />,
    },
    {
      id: "healthy",
      label: "Healthy",
      color: "#00dd99",
      icon: <VeganIcon size={14} color="#00dd99" />,
    },
    {
      id: "fast",
      label: "Fast Delivery",
      color: "#4488ff",
      icon: <LinkIcon size={14} color="#4488ff" />,
    },
    {
      id: "budget",
      label: "Under £15",
      color: "#ff6688",
      icon: <RestaurantIcon size={14} color="#ff6688" />,
    },
    {
      id: "videos",
      label: "Videos",
      color: "#ef4444",
      icon: <VideoIcon size={14} color="#ef4444" />,
    },
    {
      id: "recipes",
      label: "Recipes",
      color: "#8b5cf6",
      icon: <RecipeIcon size={14} color="#8b5cf6" />,
    },
  ];

  // Extended filter options for dropdown (organized by category)
  const extendedFilterOptions = useMemo(() => {
    const options: FilterOption[] = [
      // Quick filters (same as main chips)
      ...filterCategories,
      
      // Dietary Restrictions
      {
        id: "vegetarian",
        label: "Vegetarian",
        color: "#00cc88",
        icon: <VeganIcon size={14} color="#00cc88" />,
      },
      {
        id: "halal",
        label: "Halal",
        color: "#4a90e2",
        icon: <RestaurantIcon size={14} color="#4a90e2" />,
      },
      {
        id: "kosher",
        label: "Kosher",
        color: "#8b5cf6",
        icon: <RestaurantIcon size={14} color="#8b5cf6" />,
      },
      {
        id: "dairyfree",
        label: "Dairy Free",
        color: "#f59e0b",
        icon: <GlutenFreeIcon size={14} color="#f59e0b" />,
      },
      {
        id: "nutfree",
        label: "Nut Free",
        color: "#ef4444",
        icon: <GlutenFreeIcon size={14} color="#ef4444" />,
      },
      {
        id: "lowcarb",
        label: "Low Carb",
        color: "#10b981",
        icon: <VeganIcon size={14} color="#10b981" />,
      },
      {
        id: "keto",
        label: "Keto",
        color: "#06b6d4",
        icon: <VeganIcon size={14} color="#06b6d4" />,
      },
      
      // Price Ranges
      {
        id: "under10",
        label: "Under £10",
        color: "#22c55e",
        icon: <RestaurantIcon size={14} color="#22c55e" />,
      },
      {
        id: "under15",
        label: "Under £15",
        color: "#ff6688",
        icon: <RestaurantIcon size={14} color="#ff6688" />,
      },
      {
        id: "under20",
        label: "Under £20",
        color: "#a855f7",
        icon: <RestaurantIcon size={14} color="#a855f7" />,
      },
      {
        id: "under25",
        label: "Under £25",
        color: "#3b82f6",
        icon: <RestaurantIcon size={14} color="#3b82f6" />,
      },
      {
        id: "premium",
        label: "Premium (£25+)",
        color: "#f59e0b",
        icon: <RestaurantIcon size={14} color="#f59e0b" />,
      },
      
      // Spice Levels
      {
        id: "mild",
        label: "Mild",
        color: "#fbbf24",
        icon: <SpicyIcon size={14} color="#fbbf24" />,
      },
      {
        id: "medium",
        label: "Medium Spice",
        color: "#f97316",
        icon: <SpicyIcon size={14} color="#f97316" />,
      },
      {
        id: "hot",
        label: "Hot",
        color: "#dc2626",
        icon: <SpicyIcon size={14} color="#dc2626" />,
      },
      {
        id: "extrahot",
        label: "Extra Hot",
        color: "#991b1b",
        icon: <SpicyIcon size={14} color="#991b1b" />,
      },
      
      // Cuisine Types
      {
        id: "italian",
        label: "Italian",
        color: "#ef4444",
        icon: <RestaurantIcon size={14} color="#ef4444" />,
      },
      {
        id: "mexican",
        label: "Mexican",
        color: "#f97316",
        icon: <RestaurantIcon size={14} color="#f97316" />,
      },
      {
        id: "chinese",
        label: "Chinese",
        color: "#dc2626",
        icon: <RestaurantIcon size={14} color="#dc2626" />,
      },
      {
        id: "indian",
        label: "Indian",
        color: "#f59e0b",
        icon: <RestaurantIcon size={14} color="#f59e0b" />,
      },
      {
        id: "turkish",
        label: "Turkish",
        color: "#eab308",
        icon: <RestaurantIcon size={14} color="#eab308" />,
      },
      {
        id: "japanese",
        label: "Japanese",
        color: "#8b5cf6",
        icon: <RestaurantIcon size={14} color="#8b5cf6" />,
      },
      {
        id: "thai",
        label: "Thai",
        color: "#ec4899",
        icon: <RestaurantIcon size={14} color="#ec4899" />,
      },
      {
        id: "mediterranean",
        label: "Mediterranean",
        color: "#06b6d4",
        icon: <RestaurantIcon size={14} color="#06b6d4" />,
      },
      {
        id: "american",
        label: "American",
        color: "#3b82f6",
        icon: <RestaurantIcon size={14} color="#3b82f6" />,
      },
      {
        id: "french",
        label: "French",
        color: "#6366f1",
        icon: <RestaurantIcon size={14} color="#6366f1" />,
      },
      
      // Rating Filters
      {
        id: "rating45",
        label: "4.5+ Stars",
        color: "#fbbf24",
        icon: <RestaurantIcon size={14} color="#fbbf24" />,
      },
      {
        id: "rating4",
        label: "4+ Stars",
        color: "#f59e0b",
        icon: <RestaurantIcon size={14} color="#f59e0b" />,
      },
      
      // Delivery Time
      {
        id: "delivery15",
        label: "Under 15 min",
        color: "#10b981",
        icon: <LinkIcon size={14} color="#10b981" />,
      },
      {
        id: "delivery30",
        label: "Under 30 min",
        color: "#059669",
        icon: <LinkIcon size={14} color="#059669" />,
      },
      {
        id: "delivery45",
        label: "Under 45 min",
        color: "#4488ff",
        icon: <LinkIcon size={14} color="#4488ff" />,
      },
    ];
    
    return options;
  }, []);

  // Search filter categories (more specific for search)
  const searchFilterCategories = [
    { id: "all", label: "All", color: "#ef4444" },
    { id: "meals", label: "Meals", color: "#ff6b35" },
    { id: "kitchens", label: "Kitchens", color: "#4f46e5" },
    { id: "cuisines", label: "Cuisines", color: "#059669" },
    { id: "ingredients", label: "Ingredients", color: "#dc2626" },
    { id: "dietary", label: "Dietary", color: "#7c3aed" },
  ];

  const handleFilterPress = useCallback(
    (filterId: string) => {
      if (!filterId) return;

      triggerHaptic();
      setActiveFilter(filterId);
    },
    [triggerHaptic]
  );

  const handleSearchFilterPress = useCallback(
    (filterId: string) => {
      if (!filterId) return;

      triggerHaptic();
      setActiveSearchFilter(filterId);
    },
    [triggerHaptic]
  );

  // Smooth spring animation to snap point
  const animateToSnapPoint = useCallback(
    (snapPoint: SnapPoint, velocity = 0) => {
      "worklet";

      gestureState.value = "settling";
      currentSnapPoint.value = snapPoint;
      lastSnapPoint.value = snapPoint;

      const springConfig = {
        ...SPRING_CONFIG,
        velocity: velocity * 0.3, // Dampen velocity for smoother animation
      };

      drawerHeight.value = withSpring(snapPoint, springConfig, (finished) => {
        if (finished) {
          gestureState.value = "idle";
        }
      });
    },
    [gestureState, currentSnapPoint, lastSnapPoint, drawerHeight]
  );

  // Intelligent snap point calculation
  const calculateSnapPoint = useCallback(
    (currentHeight: number, velocityY: number, gestureDistance: number) => {
      "worklet";

      const hasSignificantVelocity = Math.abs(velocityY) > VELOCITY_THRESHOLD;
      const hasSignificantDistance =
        Math.abs(gestureDistance) > GESTURE_THRESHOLD;

      // If gesture is too small, stay at current snap point
      if (!hasSignificantVelocity && !hasSignificantDistance) {
        return lastSnapPoint.value;
      }

      // Velocity-based snapping for quick gestures
      if (hasSignificantVelocity) {
        if (velocityY > 0) {
          // Swiping down (making drawer smaller) - can only go to collapsed
          return SNAP_POINTS.COLLAPSED;
        } else {
          // Swiping up (making drawer larger) - go to expanded
          return SNAP_POINTS.EXPANDED;
        }
      }

      // Position-based snapping for slow drags
      const midPoint = (SNAP_POINTS.COLLAPSED + SNAP_POINTS.EXPANDED) / 2;

      if (currentHeight < midPoint) {
        return SNAP_POINTS.COLLAPSED;
      } else {
        return SNAP_POINTS.EXPANDED;
      }
    },
    [lastSnapPoint.value]
  );

  // Gesture handler with proper state management
  const panGesture = Gesture.Pan()
    .minDistance(10)
    .activeOffsetY([-10, 10])
    .onStart((event) => {
      "worklet";
      gestureState.value = "dragging";
      startHeight.value = drawerHeight.value;
      startSnapPoint.value = currentSnapPoint.value;
      initialTouchY.value = event.absoluteY;
      startTime.value = Date.now();
      wasSwipeGesture.value = false;
    })
    .onUpdate((event) => {
      "worklet";
      // Check if this is a swipe gesture (significant movement)
      const gestureDistance = Math.abs(event.translationY);
      if (gestureDistance > 10) {
        wasSwipeGesture.value = true;
      }

      // Convert pan gesture to height change (inverted because dragging up increases height)
      let newHeight = startHeight.value - event.translationY;

      // Apply rubber band effect at boundaries
      if (newHeight < SNAP_POINTS.COLLAPSED) {
        // Strong resistance when trying to go below collapsed state
        const excess = SNAP_POINTS.COLLAPSED - newHeight;
        const resistance = Math.min(excess / 50, 0.9); // Stronger resistance
        newHeight = SNAP_POINTS.COLLAPSED - excess * (1 - resistance);
      } else if (newHeight > SNAP_POINTS.EXPANDED) {
        // Resistance when trying to expand beyond max
        const excess = newHeight - SNAP_POINTS.EXPANDED;
        const resistance = Math.min(excess / 100, 0.8);
        newHeight = SNAP_POINTS.EXPANDED + excess * (1 - resistance);
      }

      // Ensure minimum height is always collapsed height
      drawerHeight.value = Math.max(SNAP_POINTS.COLLAPSED, newHeight);

      // Update current snap point for smooth interpolations
      if (newHeight <= SNAP_POINTS.COLLAPSED + 50) {
        currentSnapPoint.value = SNAP_POINTS.COLLAPSED;
      } else {
        currentSnapPoint.value = SNAP_POINTS.EXPANDED;
      }
    })
    .onEnd((event) => {
      "worklet";
      const gestureDistance = Math.abs(event.absoluteY - initialTouchY.value);
      const targetSnapPoint = calculateSnapPoint(
        drawerHeight.value,
        event.velocityY,
        gestureDistance
      );

      // If expanding to full height via swipe, don't focus input
      if (
        targetSnapPoint === SNAP_POINTS.EXPANDED &&
        startSnapPoint.value === SNAP_POINTS.COLLAPSED &&
        wasSwipeGesture.value
      ) {
        // This was a swipe gesture - expand without focusing
        animateToSnapPoint(targetSnapPoint, -event.velocityY);
      } else {
        animateToSnapPoint(targetSnapPoint, -event.velocityY);
      }
    })
    .onFinalize(() => {
      "worklet";
      // Return to last known good state if gesture fails
      if (gestureState.value === "dragging") {
        animateToSnapPoint(startSnapPoint.value);
      }
    });

  // Main container style - positioned at bottom with dynamic height
  const containerStyle = useAnimatedStyle(() => {
    "worklet";
    const finalHeight = Math.max(SNAP_POINTS.COLLAPSED, drawerHeight.value);

    return {
      height: finalHeight,
    };
  });

  // Background color style - always white with red stain
  const backgroundColorStyle = useAnimatedStyle(() => {
    "worklet";
    const progress = interpolate(
      drawerHeight.value,
      [SNAP_POINTS.COLLAPSED, SNAP_POINTS.EXPANDED],
      [0, 1],
      Extrapolate.CLAMP
    );

    // More transparent white background for stronger blur effect
    const alpha = interpolate(progress, [0, 1], [0.7, 0.8], Extrapolate.CLAMP);

    return {
      backgroundColor: `rgba(255, 255, 255, ${alpha})`,
    };
  });

  // Derived values for conditions to avoid mixing shared values with regular state in worklets
  const isCollapsedCondition = useDerivedValue(() => {
    return drawerHeight.value <= SNAP_POINTS.COLLAPSED + 20;
  });

  const isExpandedCondition = useDerivedValue(() => {
    return drawerHeight.value > SNAP_POINTS.COLLAPSED + 50;
  });

  // State for JSX access
  const [isSearchFocusedState, setIsSearchFocusedState] = useState(false);
  const [blurIntensityState, setBlurIntensityState] = useState(80);
  const [scrollEnabledState, setScrollEnabledState] = useState(false);
  const [buttonDisabledState, setButtonDisabledState] = useState(false);
  const [snapPointState, setSnapPointState] = useState(SNAP_POINTS.COLLAPSED);
  const [isExpandedState, setIsExpandedState] = useState(false);

  // Derived values for safe access in JSX
  const currentGestureState = useDerivedValue(() => gestureState.value);
  const currentDrawerHeight = useDerivedValue(() => drawerHeight.value);
  const currentSnapPointValue = useDerivedValue(() => currentSnapPoint.value);

  // Update state from derived values
  useDerivedValue(() => {
    const intensity =
      currentGestureState.value === "dragging" ||
      currentGestureState.value === "settling"
        ? 120
        : 80;
    runOnJS(setBlurIntensityState)(intensity);
  });

  useDerivedValue(() => {
    const enabled = currentDrawerHeight.value >= SNAP_POINTS.EXPANDED - 50;
    runOnJS(setScrollEnabledState)(enabled);
  });

  useDerivedValue(() => {
    const disabled = currentSnapPointValue.value !== SNAP_POINTS.COLLAPSED;
    runOnJS(setButtonDisabledState)(disabled);
  });

  useDerivedValue(() => {
    runOnJS(setSnapPointState)(currentSnapPointValue.value);
  });

  useDerivedValue(() => {
    runOnJS(setIsSearchFocusedState)(isSearchFocused);
  }, [isSearchFocused]);

  useDerivedValue(() => {
    const isExpanded = isExpandedCondition.value;
    runOnJS(setIsExpandedState)(isExpanded);
    runOnJS(setSearchDrawerExpanded)(isExpanded);
  });

  // Backdrop with proper opacity and interaction blocking
  const backdropStyle = useAnimatedStyle(() => {
    "worklet";
    // Only show backdrop when drawer is significantly expanded or search is focused
    const isExpanded = drawerHeight.value > SNAP_POINTS.COLLAPSED + 50;
    const shouldShowBackdrop = isExpanded || isSearchFocusedState;

    const opacity = shouldShowBackdrop
      ? interpolate(
          drawerHeight.value,
          [SNAP_POINTS.COLLAPSED + 50, SNAP_POINTS.EXPANDED],
          [0.1, 0.3],
          Extrapolate.CLAMP
        )
      : 0;

    return {
      opacity,
      pointerEvents: shouldShowBackdrop ? "auto" : "none",
    };
  });

  // Content opacity for smooth reveal
  const contentOpacityStyle = useAnimatedStyle(() => {
    "worklet";
    const opacity = interpolate(
      drawerHeight.value,
      [SNAP_POINTS.COLLAPSED, SNAP_POINTS.COLLAPSED + 30, SNAP_POINTS.EXPANDED],
      [0, 0.3, 1],
      Extrapolate.CLAMP
    );

    return { opacity };
  });

  // Search input scale for micro-interaction
  const searchInputStyle = useAnimatedStyle(() => {
    "worklet";
    const scale = interpolate(
      drawerHeight.value,
      [SNAP_POINTS.COLLAPSED, SNAP_POINTS.EXPANDED],
      [0.98, 1],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ scale }],
    };
  });

  // Search area interaction style
  const searchInteractionStyle = useAnimatedStyle(() => {
    "worklet";
    const isCollapsed = drawerHeight.value <= SNAP_POINTS.COLLAPSED + 20;

    return {
      opacity: isCollapsed ? 0.8 : 1,
    };
  });

  // Collapsed search input style
  const collapsedSearchStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      // Only show when collapsed and not in search focus
      opacity: isCollapsedCondition.value ? 1 : 0,
      height: isCollapsedCondition.value ? "auto" : 0,
      overflow: "hidden",
    };
  });

  // Expanded search input pointer events style
  const expandedSearchPointerStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      // Disable pointer events on SearchArea when collapsed
      pointerEvents:
        currentSnapPointValue.value === SNAP_POINTS.COLLAPSED ? "none" : "auto",
    };
  });

  // Handle visual feedback
  const handleStyle = useAnimatedStyle(() => {
    "worklet";
    const isDragging = gestureState.value === "dragging";

    const width = interpolate(
      drawerHeight.value,
      [SNAP_POINTS.COLLAPSED, SNAP_POINTS.EXPANDED],
      [36, 48],
      Extrapolate.CLAMP
    );

    const opacity = isDragging ? 0.8 : 1;

    // Handle color transition from Cribnosh red stain to current color
    const progress = interpolate(
      drawerHeight.value,
      [SNAP_POINTS.COLLAPSED, SNAP_POINTS.EXPANDED],
      [0, 1],
      Extrapolate.CLAMP
    );

    const red = interpolate(progress, [0, 1], [239, 74], Extrapolate.CLAMP);
    const green = interpolate(progress, [0, 1], [68, 93], Extrapolate.CLAMP);
    const blue = interpolate(progress, [0, 1], [68, 79], Extrapolate.CLAMP);

    return {
      width,
      opacity,
      backgroundColor: `rgb(${red}, ${green}, ${blue})`,
    };
  });

  // Handle tap to expand/collapse (handle area - no focus)
  const handleTap = useCallback(() => {
    const current = snapPointState;

    if (current === SNAP_POINTS.COLLAPSED) {
      // Expand without focusing input (handle tap)
      animateToSnapPoint(SNAP_POINTS.EXPANDED);
    } else {
      animateToSnapPoint(SNAP_POINTS.COLLAPSED);
    }
  }, [animateToSnapPoint, snapPointState]);

  // Handle search area tap when collapsed - should focus input
  const handleSearchTap = useCallback(() => {
    if (snapPointState === SNAP_POINTS.COLLAPSED) {
      animateToSnapPoint(SNAP_POINTS.EXPANDED);
      // Focus the search input after expansion
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300); // Wait for animation to complete
    }
  }, [animateToSnapPoint, snapPointState]);

  // Handle search focus when in expanded state
  const handleSearchFocus = useCallback(() => {
    if (snapPointState === SNAP_POINTS.EXPANDED) {
      setIsSearchFocused(true);
      searchInputRef.current?.focus();
    }
  }, [snapPointState]);

  // Handle search blur/cancel
  const handleSearchBlur = useCallback(() => {
    setIsSearchFocused(false);
    setSearchQuery("");
  }, []);

  // Transform API search results to component format
  const transformSearchResults = useCallback((apiResults: SearchResult[]) => {
    return apiResults.map((result) => ({
      id: result.id,
      text: result.title,
      category:
        result.type === "chef"
          ? "Kitchen"
          : result.type === "dish"
            ? "Meal"
            : "Cuisine",
      kitchen: result.type === "chef" ? result.title : "Various Kitchens",
      time: result.delivery_time || "25 min",
      distance: result.distance || "1.0 mi",
      type:
        result.type === "chef"
          ? "kitchens"
          : result.type === "dish"
            ? "meals"
            : "cuisines",
      rating: result.rating ? result.rating.toString() : "4.5",
      relevance_score: result.relevance_score,
      originalResult: result, // Preserve original result data for navigation
    }));
  }, []);

  // Transform chef search results to component format
  const transformChefResults = useCallback((chefs: SearchChef[]) => {
    return chefs.map((chef) => ({
      id: chef._id,
      text: chef.name,
      category: chef.cuisines.join(", "),
      kitchen: chef.name,
      time: "25 min", // Default delivery time
      distance: chef.location || "Nearby",
      type: "kitchens",
      rating: chef.rating ? chef.rating.toString() : "4.5",
      bio: chef.bio,
      specialties: chef.specialties,
      is_verified: chef.is_verified,
      is_available: chef.is_available,
      experience_years: chef.experience_years,
      price_range: chef.price_range,
    }));
  }, []);

  // Transform search suggestions to component format
  const transformSuggestionResults = useCallback(
    (suggestions: SearchSuggestion[]) => {
      return suggestions.map((suggestion) => ({
        id: suggestion.text,
        text: suggestion.text,
        category: suggestion.category || "General",
        kitchen: suggestion.chef_name || "Various Kitchens",
        time: "25 min",
        distance: "Nearby",
        type:
          suggestion.type === "chef"
            ? "kitchens"
            : suggestion.type === "dish"
              ? "meals"
              : "cuisines",
        rating: suggestion.rating ? suggestion.rating.toString() : "4.5",
        confidence: suggestion.confidence,
        popularity_score: suggestion.popularity_score,
        is_trending: suggestion.is_trending,
      }));
    },
    []
  );

  // Transform trending results to component format
  const transformTrendingResults = useCallback((trending: TrendingItem[]) => {
    return trending.map((item) => ({
      id: item.id,
      text: item.name,
      category: item.cuisine || "Popular",
      kitchen: item.chef_name || "Various Kitchens",
      time: "25 min",
      distance: "Nearby",
      type:
        item.type === "chef"
          ? "kitchens"
          : item.type === "dish"
            ? "meals"
            : "cuisines",
      rating: item.rating ? item.rating.toString() : "4.5",
      popularity_score: item.popularity_score,
      trend_direction: item.trend_direction,
      search_count: item.search_count,
    }));
  }, []);

  // Determine which loading state to use based on active query
  const isLoadingSuggestions = searchQuery.trim() 
    ? (activeSearchFilter === "chefs" ? isLoadingChefSearch : isLoadingSuggestionsQuery || isLoadingSearch)
    : isLoadingTrendingQuery;

  // Determine which error state to use based on active query
  const isErrorSuggestions = searchQuery.trim()
    ? (activeSearchFilter === "chefs" ? isErrorChefSearch : isErrorSuggestionsQuery || isErrorSearch)
    : isErrorTrendingQuery;

  // Process search suggestions from multiple API sources - no fallback to mock data
  const searchSuggestions = useMemo(() => {
    // If not authenticated, return empty array (no mock data)
    if (!isAuthenticated) {
      return [];
    }

    let apiResults: any[] = [];

    // Priority 1: Use search suggestions API if available
    if (
      suggestionsData?.success &&
      suggestionsData.data?.suggestions &&
      searchQuery.trim()
    ) {
      apiResults = transformSuggestionResults(suggestionsData.data.suggestions);
    }
    // Priority 2: Use chef search API if searching for chefs specifically
    else if (
      chefSearchData?.success &&
      chefSearchData.data?.chefs &&
      activeSearchFilter === "chefs" &&
      searchQuery.trim()
    ) {
      apiResults = transformChefResults(chefSearchData.data.chefs);
    }
    // Priority 3: Use general search API if available
    else if (searchData?.success && searchData.data && searchQuery.trim()) {
      apiResults = transformSearchResults(searchData.data);
    }
    // Priority 4: Use trending search API if no query
    else if (
      trendingData?.success &&
      trendingData.data?.trending &&
      !searchQuery.trim()
    ) {
      apiResults = transformTrendingResults(trendingData.data.trending);
    }

    // Return API results (empty array if no results)
    return apiResults;
  }, [
    searchData,
    chefSearchData,
    suggestionsData,
    trendingData,
    isAuthenticated,
    searchQuery,
    activeSearchFilter,
    transformSearchResults,
    transformChefResults,
    transformSuggestionResults,
    transformTrendingResults,
  ]);

  // Filter suggestions based on active search filter with error handling
  const filteredSuggestions = useMemo(() => {
    try {
      const filtered = searchSuggestions.filter((suggestion) => {
        if (!suggestion || !suggestion.type) return false;
        if (activeSearchFilter === "all") return true;
        return suggestion.type === activeSearchFilter;
      });

      // Limit suggestions to prevent performance issues
      return filtered.slice(0, maxSuggestions);
    } catch {
      return [];
    }
  }, [searchSuggestions, activeSearchFilter, maxSuggestions]);

  // Safe search submission handler
  const handleSearchSubmit = useCallback(
    async (query: string) => {
      if (!query || !query.trim()) return;

      try {
        setIsLoading(true);
        setError(null);

        const trimmedQuery = query.trim();
        const isNaturalLanguage = isNaturalLanguageQuery(trimmedQuery);

        if (onSearchSubmit) {
          onSearchSubmit(trimmedQuery, activeSearchFilter);
        } else if (isNaturalLanguage && isAuthenticated) {
          // Use emotions engine for natural language queries
          try {
            const searchParams = {
              query: trimmedQuery,
              searchQuery: trimmedQuery,
              location: userLocation
                ? {
                    latitude: userLocation.latitude,
                    longitude: userLocation.longitude,
                  }
                : undefined,
              preferences: {
                dietaryRestrictions: dietaryFilters?.dietary_restrictions,
                spiceLevel: dietaryFilters?.spice_level,
              },
            };

            setIsSearchingWithEmotions(true);
            const convex = getConvexClient();
            const sessionToken = await getSessionToken();

            if (!sessionToken) {
              throw new Error("Not authenticated");
            }

            // Extract preferences from profile data
            const preferences = profileData?.data?.preferences;
            const emotions = preferences?.emotions || preferences?.mood || undefined;
            const cuisine = preferences?.cuisine?.[0] || preferences?.favorite_cuisines?.[0] || undefined;

            const result = await (convex as any).action((api.actions as any).search.customerSearchWithEmotions, {
              sessionToken,
              query: searchParams.query || '',
              emotions: emotions ? (Array.isArray(emotions) ? emotions : [emotions]) : undefined,
              location: searchParams.location ? `${searchParams.location.latitude},${searchParams.location.longitude}` : undefined,
              cuisine: cuisine,
              limit: 20,
            });

            if (result.success === false) {
              throw new Error(result.error || 'Search failed');
            }

            // Note: The search result is handled by the search hook/component
            // This just triggers the search action
            setIsSearchingWithEmotions(false);
          } catch (err: any) {
            console.error("Natural language search error:", err);
            setIsSearchingWithEmotions(false);
            
            // Handle network errors with deduplication
            const { isNetworkError, handleConvexError } = require("@/utils/networkErrorHandler");
            if (isNetworkError(err)) {
              handleConvexError(err);
            } else {
              showError("Search failed", err?.message || err?.data?.message || "Please try again");
            }
          }
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Search failed. Please try again.";
        setError(errorMessage);
        
        // Handle network errors with deduplication
        const { isNetworkError, handleConvexError } = require("@/utils/networkErrorHandler");
        if (isNetworkError(error)) {
          handleConvexError(error);
        } else {
          showError("Search failed", "Please try again");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [
      onSearchSubmit,
      activeSearchFilter,
      isNaturalLanguageQuery,
      isAuthenticated,
      userLocation,
      dietaryFilters,
    ]
  );

  // Handle search API errors
  useEffect(() => {
    if (searchError && isAuthenticated) {
      showError("Search failed", "Please try again");
    }
    if (chefSearchError && isAuthenticated) {
      showError("Chef search failed", "Please try again");
    }
    if (suggestionsError && isAuthenticated) {
      showError("Search suggestions failed", "Please try again");
    }
    if (trendingError && isAuthenticated) {
      showError("Trending search failed", "Please try again");
    }
  }, [
    searchError,
    chefSearchError,
    suggestionsError,
    trendingError,
    isAuthenticated,
  ]);

  // Feature discovery logic - analyzes search query and matches to relevant features
  const discoverFeaturesFromQuery = useCallback((query: string): string[] => {
    if (!query || !query.trim()) return [];

    const queryLower = query.toLowerCase().trim();
    const discoveredFeatures: string[] = [];

    // Match patterns for Invite Friend feature
    const inviteFriendPatterns = [
      /friend/i,
      /invite/i,
      /treat/i,
      /share/i,
      /gift/i,
      /send/i,
      /pay for/i,
      /buy for/i,
      /on me/i,
    ];
    if (inviteFriendPatterns.some((pattern) => pattern.test(queryLower))) {
      discoveredFeatures.push("inviteFriend");
    }

    // Match patterns for Setup Family feature
    const setupFamilyPatterns = [
      /family/i,
      /household/i,
      /family member/i,
      /relative/i,
      /setup family/i,
      /configure family/i,
    ];
    if (setupFamilyPatterns.some((pattern) => pattern.test(queryLower))) {
      discoveredFeatures.push("setupFamily");
    }

    // Match patterns for Group Order feature
    const groupOrderPatterns = [
      /group/i,
      /together/i,
      /order together/i,
      /group order/i,
      /collaborate/i,
      /team/i,
      /multiple/i,
      /split/i,
      /share order/i,
      /joint/i,
    ];
    if (groupOrderPatterns.some((pattern) => pattern.test(queryLower))) {
      discoveredFeatures.push("groupOrder");
    }

    // Match patterns for Nosh Heaven feature
    const noshHeavenPatterns = [
      /nosh heaven/i,
      /noshheaven/i,
      /video/i,
      /videos/i,
      /watch/i,
      /stream/i,
      /feed/i,
      /reels/i,
      /tiktok/i,
      /scroll/i,
      /browse/i,
      /discover/i,
      /explore/i,
      /doom scroll/i,
      /endless/i,
      /immersive/i,
    ];
    if (noshHeavenPatterns.some((pattern) => pattern.test(queryLower))) {
      discoveredFeatures.push("noshHeaven");
    }

    // If no specific matches, show all features when query is long enough
    if (queryLower.length >= 3 && discoveredFeatures.length === 0) {
      // For general queries, show all features to encourage discovery
      discoveredFeatures.push("inviteFriend", "setupFamily", "groupOrder", "noshHeaven");
    }

    return discoveredFeatures;
  }, []);

  // Get discovered features based on current search query
  const discoveredFeatures = useMemo(() => {
    return discoverFeaturesFromQuery(searchQuery);
  }, [searchQuery, discoverFeaturesFromQuery]);

  // Notices array for swipable display - filter-aware
  const notices = useMemo((): DynamicContent[] => {
    const baseNotices: DynamicContent[] = [
      {
        type: "notice",
        id: "tip-1",
        title: "Pro Tip",
        description: "Try searching for cuisines or ingredients to discover new meals",
        badgeText: "TIP",
        backgroundColor: "#4a5d4f",
      },
      {
        type: "notice",
        id: "tip-2",
        title: "Discover Nosh Heaven",
        description: "Discover Nosh Heaven - an immersive video browsing experience",
        badgeText: "NEW",
        backgroundColor: "#ef4444",
      },
    ];

    // Add filter-specific notices when a filter is active
    if (activeFilter !== "all") {
      const filterConfig = filterCategories.find(f => f.id === activeFilter);
      if (filterConfig) {
        const filterTips: Record<string, { title: string; description: string }> = {
          vegan: {
            title: "Vegan Tip",
            description: "Use the search bar to find specific vegan dishes or browse vegan-friendly kitchens",
          },
          glutenfree: {
            title: "Gluten-Free Tip",
            description: "Search for 'gluten free' to see all available options that meet your dietary needs",
          },
          spicy: {
            title: "Spicy Food Tip",
            description: "Try searching for specific spice levels or cuisines known for their heat",
          },
          healthy: {
            title: "Healthy Eating Tip",
            description: "Look for meals with balanced nutrition and fresh ingredients",
          },
          fast: {
            title: "Fast Delivery Tip",
            description: "Check delivery times when ordering to get your food as quickly as possible",
          },
          budget: {
            title: "Budget Tip",
            description: "Filter by price range to find meals that fit your budget",
          },
          videos: {
            title: "Video Content Tip",
            description: "Watch cooking videos and discover new recipes from our food creators",
          },
          recipes: {
            title: "Recipe Tip",
            description: "Browse recipes and learn to cook amazing dishes at home",
          },
        };

        const tip = filterTips[activeFilter];
        if (tip) {
          return [
            {
              type: "notice",
              id: `filter-tip-${activeFilter}`,
              title: tip.title,
              description: tip.description,
              badgeText: filterConfig.label.toUpperCase(),
              backgroundColor: filterConfig.color,
            },
            ...baseNotices,
          ];
        }
      }
    }

    return baseNotices;
  }, [activeFilter]);

  // Get filter-specific content based on active filter
  const getFilterSpecificContent = useCallback((filterId: string): DynamicContent | null => {
    if (filterId === "all") return null;

    const filterConfig = filterCategories.find(f => f.id === filterId);
    if (!filterConfig) return null;

    const filterMessages: Record<string, { title: string; description: string }> = {
      vegan: {
        title: "Vegan Options",
        description: "Discover delicious plant-based meals from our partner kitchens",
      },
      glutenfree: {
        title: "Gluten-Free Meals",
        description: "Find safe and tasty gluten-free options for your dietary needs",
      },
      spicy: {
        title: "Spicy Food",
        description: "Explore bold and flavorful spicy dishes from around the world",
      },
      healthy: {
        title: "Healthy Choices",
        description: "Nutritious and balanced meals to fuel your day",
      },
      fast: {
        title: "Fast Delivery",
        description: "Quick delivery options to satisfy your hunger fast",
      },
      budget: {
        title: "Under £15",
        description: "Great value meals that won't break the bank",
      },
      videos: {
        title: "Videos",
        description: "Watch cooking videos and discover new recipes from our food creators",
      },
      recipes: {
        title: "Recipes",
        description: "Browse recipes and learn to cook amazing dishes at home",
      },
    };

    const message = filterMessages[filterId];
    if (!message) return null;

    return {
      type: "feature_spotlight",
      id: `filter-${filterId}`,
      title: message.title,
      description: message.description,
      callToActionText: "Browse Options",
      badgeText: filterConfig.label.toUpperCase(),
      backgroundColor: filterConfig.color,
    };
  }, []);

  // Determine dynamic content to show (promo, notice, or feature spotlight)
  const dynamicContent = useMemo((): DynamicContent | null => {
    // Priority 1: Show filter-specific content when a filter is active (and not "all")
    if (activeFilter !== "all") {
      const filterContent = getFilterSpecificContent(activeFilter);
      if (filterContent) {
        // Still show promo if available, but prioritize filter content when filter is active
        const activeOffer = offersData?.data?.offers?.[0];
        if (activeOffer) {
          // Show both: filter content as primary, but we can show promo as secondary
          // For now, prioritize filter content when filter is active
          return filterContent;
        }
        return filterContent;
      }
    }

    // Priority 2: Show active promo if available (when no filter or filter is "all")
    const activeOffer = offersData?.data?.offers?.[0];
    if (activeOffer) {
      return {
        type: "promo",
        id: activeOffer.offer_id,
        title: activeOffer.title,
        description: activeOffer.description,
        callToActionText: activeOffer.call_to_action_text,
        badgeText: activeOffer.badge_text || (activeOffer.offer_type === "limited_time" ? "LIMITED TIME" : ""),
        backgroundColor: activeOffer.background_color || "#ef4444",
        backgroundImageUrl: activeOffer.background_image_url,
        offer: activeOffer,
      };
    }

    // Priority 3: Show feature discovery spotlight if features were discovered via search
    if (searchQuery.trim() && discoveredFeatures.length > 0) {
      const featureNames = discoveredFeatures.map((f) => {
        if (f === "inviteFriend") return "Invite Friend";
        if (f === "setupFamily") return "Setup Family";
        if (f === "groupOrder") return "Group Order";
        if (f === "noshHeaven") return "Nosh Heaven";
        return f;
      }).join(", ");

      return {
        type: "feature_spotlight",
        id: `feature-spotlight-${discoveredFeatures.join("-")}`,
        title: `Discover: ${featureNames}`,
        description: `We found ${discoveredFeatures.length} feature${discoveredFeatures.length > 1 ? "s" : ""} that match your search "${searchQuery}"`,
        callToActionText: "Explore Features",
        badgeText: "DISCOVERY",
        backgroundColor: "#ef4444",
      };
    }

    // Priority 4: Return null to indicate notices should be shown (handled separately)
    return null;
  }, [offersData, searchQuery, discoveredFeatures, activeFilter, getFilterSpecificContent]);

  // Safe suggestion selection handler
  const handleSuggestionSelect = useCallback(
    (suggestion: any) => {
      if (!suggestion || !suggestion.text) return;

      try {
        // If it's a meal item and onMealPress is provided, navigate to meal details
        if (suggestion.type === "meals" && onMealPress && suggestion.originalResult) {
          const result = suggestion.originalResult;
          onMealPress({
            id: result.id || result._id,
            name: result.title || suggestion.text,
            price: result.price || 0,
            kitchen: result.kitchen || suggestion.kitchen || "Various Kitchens",
            image: result.image_url ? { uri: result.image_url } : undefined,
            _id: result.id || result._id,
          });
          return;
        }

        setSearchQuery(suggestion.text);

        if (onSuggestionSelect) {
          onSuggestionSelect(suggestion);
        } else {
          // Suggestion selection would be implemented here
        }
      } catch {
        setError("Failed to select suggestion. Please try again.");
      }
    },
    [onSuggestionSelect, onMealPress]
  );

  // Update header message when drawer expands
  const updateHeaderMessage = useCallback(() => {
    try {
      const message = getCompleteDynamicHeader(userName, true);
      // Ensure subtitle is always present
      setHeaderMessage({
        ...message,
        subMessage: message.subMessage || "",
      });
    } catch {
      // Failed to update header message
    }
  }, [userName]);

  // Update header when drawer expands to show fresh content
  useEffect(() => {
    if (
      snapPointState === SNAP_POINTS.EXPANDED &&
      !isSearchFocused
    ) {
      // Small delay to ensure smooth animation
      const timer = setTimeout(updateHeaderMessage, 100);
      return () => clearTimeout(timer);
    }
  }, [snapPointState, isSearchFocused, updateHeaderMessage]);

  const handleBackdropPress = useCallback(() => {
    try {
      if (isSearchFocused) {
        handleSearchBlur();
      } else {
        animateToSnapPoint(SNAP_POINTS.COLLAPSED);
      }
    } catch {
      // Backdrop press error
    }
  }, [animateToSnapPoint, isSearchFocused, handleSearchBlur]);

  // Safe image loading component
  const SafeImage = ({ source, style, ...props }: any) => {
    const [imageError, setImageError] = useState(false);

    if (imageError) {
      return (
        <View
          style={[
            style,
            {
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              justifyContent: "center",
              alignItems: "center",
            },
          ]}
        >
          <Text style={{ color: "#8a9a8f", fontSize: 12 }}>
            Image unavailable
          </Text>
        </View>
      );
    }

    return (
      <Image
        source={source}
        style={style}
        onError={() => setImageError(true)}
        {...props}
      />
    );
  };

  // Accessibility improvements
  useEffect(() => {
    // Announce state changes for screen readers
    if (isSearchFocused) {
      AccessibilityInfo.announceForAccessibility("Search mode activated");
    }
    
    // Announce drawer state changes
    try {
      const isExpanded = snapPointState === SNAP_POINTS.EXPANDED;
      const announcement = isExpanded
        ? "Search drawer expanded"
        : "Search drawer collapsed";
      AccessibilityInfo.announceForAccessibility(announcement);
    } catch {
      // Accessibility announcement failed
    }
  }, [isSearchFocused, snapPointState]);

  // Error boundary for the entire component
  if (error) {
    return (
      <View
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          padding: 16,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          zIndex: 9999,
        }}
      >
        <Text
          style={{
            color: "#ef4444",
            fontSize: 14,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {error}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: "#ef4444",
            padding: 8,
            borderRadius: 8,
            alignItems: "center",
          }}
          onPress={() => setError(null)}
        >
          <Text style={{ color: "#ffffff", fontSize: 12 }}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      {/* Backdrop - Only show when expanded or search focused */}
      {isSearchFocused || isExpandedState ? (
        <Animated.View
          style={[
            backdropStyle,
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: "rgba(0, 0, 0, 1)",
              opacity: isSearchFocused ? 0.8 : undefined, // Stronger backdrop when searching
            },
          ]}
          pointerEvents={isSearchFocused ? "auto" : "none"}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={handleBackdropPress}
            activeOpacity={1}
          />
        </Animated.View>
      ) : null}

      {/* Main Drawer - Always positioned at bottom */}
      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            containerStyle,
            {
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 20,
              overflow: "hidden", // Ensure content doesn't spill out
              zIndex: 9999, // Lower than NoshHeavenPlayer (99999) but above other content
            },
          ]}
        >
          <Animated.View
            style={[
              {
                flex: 1,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.2)",
                borderBottomWidth: 0,
                position: "relative",
              },
              backgroundColorStyle,
            ]}
          >
            {/* Dynamic Blur Overlay */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  overflow: "hidden",
                },
              ]}
            >
              {Platform.OS === 'ios' ? (
                <BlurView
                  intensity={blurIntensityState}
                  tint="light"
                  style={{
                    flex: 1,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                  }}
                />
              ) : (
                <BlurEffect
                  intensity={blurIntensityState}
                  tint="light"
                  useGradient={true}
                  style={{
                    flex: 1,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                  }}
                />
              )}
            </Animated.View>
            {/* Red stain overlay - always present but varies in intensity */}
            <Animated.View
              style={[
                {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  backgroundColor: "rgba(239, 68, 68, 0.15)", // Cribnosh red stain
                  opacity: interpolate(
                    drawerHeight.value,
                    [SNAP_POINTS.COLLAPSED, SNAP_POINTS.EXPANDED],
                    [0.7, 0.4],
                    Extrapolate.CLAMP
                  ),
                },
              ]}
            />
            {/* Handle Area - Hide when search is focused */}
            {!isSearchFocused && (
              <TouchableOpacity
                onPress={handleTap}
                style={{
                  alignItems: "center",
                  paddingVertical: 16,
                  paddingHorizontal: 12,
                  minHeight: 48, // Better touch target
                }}
                activeOpacity={0.8}
              >
                <Animated.View
                  style={[
                    handleStyle,
                    {
                      height: 4,
                      borderRadius: 2,
                    },
                  ]}
                />
              </TouchableOpacity>
            )}

            {/* Content Area - Always visible when drawer has height */}
            <ScrollView
              style={{
                paddingHorizontal: 12,
                flex: 1,
              }}
              contentContainerStyle={{
                paddingBottom: 40, // Better spacing for home indicator
                justifyContent: "flex-start",
              }}
              showsVerticalScrollIndicator={false}
              scrollEnabled={scrollEnabledState}
            >
              {/* Search Focus Mode - Only show when search is focused */}
              {isSearchFocused ? (
                <View style={{ flex: 1 }}>
                  {/* Handle Bar - Visible in search focus state */}
                  <TouchableOpacity
                    onPress={handleTap}
                    style={{
                      alignItems: "center",
                      paddingVertical: 8,
                      paddingHorizontal: 0,
                      marginBottom: 12,
                    }}
                    activeOpacity={0.8}
                  >
                    <Animated.View
                      style={[
                        handleStyle,
                        {
                          height: 4,
                          borderRadius: 2,
                        },
                      ]}
                    />
                  </TouchableOpacity>

                  {/* Search Input */}
                  <View style={{ marginBottom: 16 }}>
                    <SearchArea
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={setSearchQuery}
                      returnKeyType="search"
                      placeholder={searchPrompt.placeholder}
                      onSubmitEditing={() => {
                        handleSearchSubmit(searchQuery);
                      }}
                      autoFocus={true}
                      editable={!isSearching}
                    />
                  </View>

                  {/* Search Filter Chips */}
                  <View style={{ marginBottom: 16 }}>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{
                        paddingHorizontal: 0,
                        gap: 10,
                      }}
                    >
                      {searchFilterCategories.map((filter) => {
                        const isActive = activeSearchFilter === filter.id;

                        return (
                          <TouchableOpacity
                            key={filter.id}
                            onPress={() => handleSearchFilterPress(filter.id)}
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              backgroundColor: isActive
                                ? filter.color
                                : "rgba(255, 255, 255, 0.15)",
                              borderRadius: 18,
                              borderWidth: 1,
                              borderColor: isActive
                                ? filter.color
                                : "rgba(255, 255, 255, 0.25)",
                              shadowColor: isActive
                                ? filter.color
                                : "rgba(255, 255, 255, 0.3)",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: isActive ? 0.4 : 0.2,
                              shadowRadius: 6,
                              elevation: isActive ? 4 : 2,
                              overflow: "hidden",
                            }}
                            activeOpacity={0.8}
                          >
                            <BlurView
                              intensity={isActive ? 40 : 60}
                              tint="light"
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderRadius: 18,
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                              }}
                            />
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: isActive ? "700" : "500",
                                color: isActive ? "#ffffff" : "#2a2a2a",
                                letterSpacing: 0.2,
                                textShadowColor: isActive
                                  ? "rgba(0, 0, 0, 0.3)"
                                  : "rgba(255, 255, 255, 0.8)",
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 2,
                              }}
                            >
                              {filter.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                      {/* More Filters Dropdown */}
                      <FilterDropdown
                        options={extendedFilterOptions}
                        selectedId={activeFilter}
                        onSelect={handleFilterPress}
                        position="right"
                        maxHeight={350}
                        enableHaptics={enableHaptics}
                        triggerButton={
                          <View
                            style={{
                              paddingHorizontal: 14,
                              paddingVertical: 8,
                              backgroundColor: "rgba(255, 255, 255, 0.15)",
                              borderRadius: 18,
                              borderWidth: 1,
                              borderColor: "rgba(255, 255, 255, 0.25)",
                              shadowColor: "rgba(255, 255, 255, 0.3)",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.2,
                              shadowRadius: 6,
                              elevation: 2,
                              overflow: "hidden",
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <BlurView
                              intensity={60}
                              tint="light"
                              style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                borderRadius: 18,
                                backgroundColor: "rgba(255, 255, 255, 0.1)",
                              }}
                            />
                            <Text
                              style={{
                                fontSize: 13,
                                fontWeight: "500",
                                color: "#2a2a2a",
                                letterSpacing: 0.2,
                                textShadowColor: "rgba(255, 255, 255, 0.8)",
                                textShadowOffset: { width: 0, height: 1 },
                                textShadowRadius: 2,
                              }}
                            >
                              More
                            </Text>
                            <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                              <Path
                                d="M6 9l6 6 6-6"
                                stroke="#2a2a2a"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </Svg>
                          </View>
                        }
                      />
                    </ScrollView>
                  </View>

                  {/* Search Results - Compact list */}
                  <View>
                    {isLoadingSuggestions ? (
                      <SearchSuggestionsSkeleton />
                    ) : isErrorSuggestions ? (
                      <View
                        style={{
                          alignItems: "center",
                          paddingVertical: 48,
                          paddingHorizontal: 24,
                        }}
                      >
                        <View
                          style={{
                            width: 64,
                            height: 64,
                            borderRadius: 32,
                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginBottom: 16,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.1,
                            shadowRadius: 4,
                            elevation: 2,
                          }}
                        >
                          <AlertCircle size={32} color="#6B7280" />
                        </View>
                        <Text
                          style={{
                            color: "#2a2a2a",
                            fontSize: 17,
                            fontWeight: "600",
                            marginBottom: 6,
                            textAlign: "center",
                            letterSpacing: -0.2,
                          }}
                        >
                          Failed to load results
                        </Text>
                        <Text
                          style={{
                            color: "#6a6a6a",
                            fontSize: 14,
                            textAlign: "center",
                            lineHeight: 20,
                            fontWeight: "400",
                          }}
                        >
                          Please try again later
                        </Text>
                      </View>
                    ) : (
                      <>
                        {searchQuery.trim() ? (
                          <Text
                            style={{
                              color: "#2a2a2a",
                              fontSize: 12,
                              fontWeight: "700",
                              marginBottom: 16,
                              textTransform: "uppercase",
                              letterSpacing: 1,
                              opacity: 0.8,
                            }}
                          >
                            {filteredSuggestions.length} RESULTS FOR &quot;
                            {searchQuery.toUpperCase()}&quot;
                          </Text>
                        ) : (
                          <Text
                            style={{
                              color: "#2a2a2a",
                              fontSize: 12,
                              fontWeight: "700",
                              marginBottom: 16,
                              textTransform: "uppercase",
                              letterSpacing: 1,
                              opacity: 0.8,
                            }}
                          >
                            POPULAR {activeSearchFilter.toUpperCase()}
                          </Text>
                        )}

                        {filteredSuggestions.length > 0 ? (
                          filteredSuggestions.map((suggestion, index) => (
                      <TouchableOpacity
                        key={suggestion.id}
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          paddingVertical: 14,
                          paddingHorizontal: 12,
                          backgroundColor: "rgba(255, 255, 255, 0.06)",
                          borderRadius: 14,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: "rgba(255, 255, 255, 0.12)",
                          shadowColor: "#000",
                          shadowOffset: { width: 0, height: 1 },
                          shadowOpacity: 0.05,
                          shadowRadius: 2,
                          elevation: 1,
                        }}
                        onPress={() => {
                          handleSuggestionSelect(suggestion);
                        }}
                        activeOpacity={0.85}
                        disabled={isSearching}
                      >
                        {/* Compact Icon */}
                        <View
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 18,
                            backgroundColor: "rgba(255, 255, 255, 0.12)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 12,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.1,
                            shadowRadius: 2,
                            elevation: 1,
                          }}
                        >
                          {suggestion.type === "kitchens" ? (
                            <RestaurantIcon size={16} color="#8a9a8f" />
                          ) : (
                            <Svg
                              width={16}
                              height={16}
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <Path
                                d="M12 2L13.09 8.26L16 7L14.5 12.5L19 10.5L16.5 16.5L22 15L18.5 20L12 22L5.5 20L2 15L7.5 16.5L5 10.5L9.5 12.5L8 7L10.91 8.26L12 2Z"
                                fill="#8a9a8f"
                              />
                            </Svg>
                          )}
                        </View>

                        {/* Compact Content */}
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{
                              color: "#1a1a1a",
                              fontSize: 15,
                              fontWeight: "600",
                              marginBottom: 3,
                              letterSpacing: -0.2,
                            }}
                          >
                            {suggestion.text}
                          </Text>
                          <Text
                            style={{
                              color: "#5a5a5a",
                              fontSize: 12,
                              fontWeight: "400",
                              lineHeight: 16,
                            }}
                          >
                            {suggestion.type === "kitchens"
                              ? `${suggestion.category} • ${suggestion.rating}★ • ${suggestion.time}`
                              : `${suggestion.category} • ${suggestion.kitchen} • ${suggestion.time}`}
                          </Text>
                        </View>

                        {/* Compact Action Icon */}
                        <View
                          style={{
                            width: 28,
                            height: 28,
                            borderRadius: 14,
                            backgroundColor: "rgba(255, 255, 255, 0.08)",
                            alignItems: "center",
                            justifyContent: "center",
                            marginLeft: 8,
                          }}
                        >
                          <Svg
                            width={12}
                            height={12}
                            viewBox="0 0 24 24"
                            fill="none"
                          >
                            <Path
                              d="M7 17L17 7M17 7H7M17 7V17"
                              stroke="#8a9a8f"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </Svg>
                        </View>
                      </TouchableOpacity>
                    ))
                        ) : (
                          <View
                            style={{
                              alignItems: "center",
                              paddingVertical: 48,
                              paddingHorizontal: 24,
                            }}
                          >
                            <View
                              style={{
                                width: 64,
                                height: 64,
                                borderRadius: 32,
                                backgroundColor: "rgba(255, 255, 255, 0.08)",
                                alignItems: "center",
                                justifyContent: "center",
                                marginBottom: 16,
                                shadowColor: "#000",
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 4,
                                elevation: 2,
                              }}
                            >
                              <Search size={32} color="#6B7280" />
                            </View>
                            <Text
                              style={{
                                color: "#2a2a2a",
                                fontSize: 17,
                                fontWeight: "600",
                                marginBottom: 6,
                                textAlign: "center",
                                letterSpacing: -0.2,
                              }}
                            >
                              {searchQuery.trim() ? "No results found" : "No trending items"}
                            </Text>
                            <Text
                              style={{
                                color: "#6a6a6a",
                                fontSize: 14,
                                textAlign: "center",
                                lineHeight: 20,
                                fontWeight: "400",
                              }}
                            >
                              {searchQuery.trim() 
                                ? "Try adjusting your search or\nbrowse different categories"
                                : "Check back later for trending items"}
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>

                  {/* Discovered Features Section - Show when search query is active */}
                  {searchQuery.trim() && discoveredFeatures.length > 0 && (
                    <View style={{ marginTop: 24 }}>
                      <Text
                        style={{
                          color: "#2a2a2a",
                          fontSize: 12,
                          fontWeight: "700",
                          marginBottom: 16,
                          textTransform: "uppercase",
                          letterSpacing: 1,
                          opacity: 0.8,
                        }}
                      >
                        DISCOVERED FEATURES
                      </Text>

                      <View style={{ gap: 12 }}>
                        {discoveredFeatures.includes("inviteFriend") && (
                          <TouchableOpacity
                            onPress={handleInviteFriend}
                            disabled={isCreatingOrder || isGeneratingLink}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              backgroundColor: "rgba(74, 93, 79, 0.08)",
                              borderRadius: 14,
                              borderWidth: 1,
                              borderColor: "rgba(74, 93, 79, 0.2)",
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.05,
                              shadowRadius: 2,
                              elevation: 1,
                            }}
                            activeOpacity={0.85}
                          >
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: "rgba(74, 93, 79, 0.15)",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 12,
                              }}
                            >
                              <ShareArrowIcon size={18} color="#4a5d4f" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  color: "#1a1a1a",
                                  fontSize: 15,
                                  fontWeight: "600",
                                  marginBottom: 3,
                                  letterSpacing: -0.2,
                                }}
                              >
                                Invite Friend
                              </Text>
                              <Text
                                style={{
                                  color: "#5a5a5a",
                                  fontSize: 12,
                                  fontWeight: "400",
                                  lineHeight: 16,
                                }}
                              >
                                Send a link to treat someone
                              </Text>
                            </View>
                            {(isCreatingOrder || isGeneratingLink) ? (
                              <ActivityIndicator size="small" color="#4a5d4f" />
                            ) : (
                              <Svg
                                width={16}
                                height={16}
                                viewBox="0 0 24 24"
                                fill="none"
                              >
                                <Path
                                  d="M7 17L17 7M17 7H7M17 7V17"
                                  stroke="#4a5d4f"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </Svg>
                            )}
                          </TouchableOpacity>
                        )}

                        {discoveredFeatures.includes("setupFamily") && (
                          <TouchableOpacity
                            onPress={handleSetupFamily}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              backgroundColor: "rgba(74, 93, 79, 0.08)",
                              borderRadius: 14,
                              borderWidth: 1,
                              borderColor: "rgba(74, 93, 79, 0.2)",
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.05,
                              shadowRadius: 2,
                              elevation: 1,
                            }}
                            activeOpacity={0.85}
                          >
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: "rgba(74, 93, 79, 0.15)",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 12,
                              }}
                            >
                              <FamilyIcon size={18} color="#4a5d4f" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  color: "#1a1a1a",
                                  fontSize: 15,
                                  fontWeight: "600",
                                  marginBottom: 3,
                                  letterSpacing: -0.2,
                                }}
                              >
                                Setup Family
                              </Text>
                              <Text
                                style={{
                                  color: "#5a5a5a",
                                  fontSize: 12,
                                  fontWeight: "400",
                                  lineHeight: 16,
                                }}
                              >
                                Configure family members for shared orders
                              </Text>
                            </View>
                            <Svg
                              width={16}
                              height={16}
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <Path
                                d="M7 17L17 7M17 7H7M17 7V17"
                                stroke="#4a5d4f"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </Svg>
                          </TouchableOpacity>
                        )}

                        {discoveredFeatures.includes("groupOrder") && (
                          <TouchableOpacity
                            onPress={handleNavigate}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              backgroundColor: "rgba(239, 68, 68, 0.08)",
                              borderRadius: 14,
                              borderWidth: 1,
                              borderColor: "rgba(239, 68, 68, 0.2)",
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.05,
                              shadowRadius: 2,
                              elevation: 1,
                            }}
                            activeOpacity={0.85}
                          >
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: "rgba(239, 68, 68, 0.15)",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 12,
                              }}
                            >
                              <GroupOrderIcon size={18} color="#ef4444" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  color: "#1a1a1a",
                                  fontSize: 15,
                                  fontWeight: "600",
                                  marginBottom: 3,
                                  letterSpacing: -0.2,
                                }}
                              >
                                Start Group Order
                              </Text>
                              <Text
                                style={{
                                  color: "#5a5a5a",
                                  fontSize: 12,
                                  fontWeight: "400",
                                  lineHeight: 16,
                                }}
                              >
                                Order together with friends and family
                              </Text>
                            </View>
                            <Svg
                              width={16}
                              height={16}
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <Path
                                d="M7 17L17 7M17 7H7M17 7V17"
                                stroke="#ef4444"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </Svg>
                          </TouchableOpacity>
                        )}

                        {discoveredFeatures.includes("noshHeaven") && (
                          <TouchableOpacity
                            onPress={() => {
                              console.log('[BottomSearchDrawer] Nosh Heaven button pressed');
                              triggerHaptic();
                              
                              // Blur search input if focused
                              if (searchInputRef.current) {
                                searchInputRef.current.blur();
                              }
                              
                              // Close search focus
                              handleSearchBlur();
                              
                              // Navigate to Nosh Heaven modal
                              console.log('[BottomSearchDrawer] Navigating to /nosh-heaven');
                              try {
                                router.push('/nosh-heaven' as any);
                              } catch (error) {
                                console.error("[BottomSearchDrawer] Navigation error:", error);
                                // Try alternative navigation method
                                try {
                                  router.navigate('/nosh-heaven' as any);
                                } catch (navError) {
                                  console.error("[BottomSearchDrawer] Alternative navigation also failed:", navError);
                                }
                              }
                            }}
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              paddingVertical: 14,
                              paddingHorizontal: 16,
                              backgroundColor: "rgba(239, 68, 68, 0.08)",
                              borderRadius: 14,
                              borderWidth: 1,
                              borderColor: "rgba(239, 68, 68, 0.2)",
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 1 },
                              shadowOpacity: 0.05,
                              shadowRadius: 2,
                              elevation: 1,
                            }}
                            activeOpacity={0.85}
                          >
                            <View
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 20,
                                backgroundColor: "rgba(239, 68, 68, 0.15)",
                                alignItems: "center",
                                justifyContent: "center",
                                marginRight: 12,
                              }}
                            >
                              <Play size={18} color="#ef4444" fill="#ef4444" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={{
                                  color: "#1a1a1a",
                                  fontSize: 15,
                                  fontWeight: "600",
                                  marginBottom: 3,
                                  letterSpacing: -0.2,
                                }}
                              >
                                Nosh Heaven
                              </Text>
                              <Text
                                style={{
                                  color: "#5a5a5a",
                                  fontSize: 12,
                                  fontWeight: "400",
                                  lineHeight: 16,
                                }}
                              >
                                Immersive video browsing experience
                              </Text>
                            </View>
                            <Svg
                              width={16}
                              height={16}
                              viewBox="0 0 24 24"
                              fill="none"
                            >
                              <Path
                                d="M7 17L17 7M17 7H7M17 7V17"
                                stroke="#ef4444"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </Svg>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  )}
                </View>
              ) : (
                <>
                  {/* Normal Content - Show when not in search focus mode */}

                  {/* Search Input - Visible when collapsed (above title) */}
                  <Animated.View
                    style={[
                      searchInputStyle,
                      { marginBottom: 16, marginTop: 0 },
                      collapsedSearchStyle,
                    ]}
                  >
                    <TouchableOpacity
                      onPress={() => {
                        if (
                          snapPointState === SNAP_POINTS.COLLAPSED
                        ) {
                          handleSearchTap();
                        }
                      }}
                      activeOpacity={1}
                      disabled={buttonDisabledState}
                      style={{ flex: 1 }}
                    >
                      <Animated.View
                        style={[
                          searchInteractionStyle,
                          expandedSearchPointerStyle,
                        ]}
                      >
                        <SearchArea
                          ref={searchInputRef}
                          onSparklesPress={onOpenAIChat}
                          placeholder={searchPrompt.placeholder}
                          editable={false}
                        />
                      </Animated.View>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Search Input - Visible when expanded */}
                  <Animated.View
                    style={[
                      searchInputStyle,
                      { marginBottom: 16 },
                      contentOpacityStyle,
                    ]}
                  >
                    <TouchableOpacity
                      onPress={handleSearchFocus}
                      activeOpacity={1}
                      style={{ flex: 1 }}
                    >
                      <Animated.View style={[searchInteractionStyle]}>
                        <SearchArea
                          ref={searchInputRef}
                          placeholder={searchPrompt.placeholder}
                          editable={false}
                          onSparklesPress={onOpenAIChat}
                        />
                      </Animated.View>
                    </TouchableOpacity>
                  </Animated.View>

                  {/* Filter Chips - Only show when expanded */}
                  <Animated.View
                    style={[contentOpacityStyle, { marginBottom: 20 }]}
                  >
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{
                        paddingHorizontal: 0,
                        gap: 6,
                      }}
                    >
                      {filterCategories.map((filter) => {
                        const isActive = activeFilter === filter.id;

                        return (
                          <TouchableOpacity
                            key={filter.id}
                            onPress={() => handleFilterPress(filter.id)}
                            style={{
                              borderRadius: 20,
                              overflow: "hidden",
                              minWidth: 60,
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: isActive ? 0.3 : 0.15,
                              shadowRadius: isActive ? 6 : 4,
                              elevation: isActive ? 5 : 3,
                            }}
                            activeOpacity={0.8}
                          >
                            <BlurView
                              intensity={isActive ? 50 : 70}
                              tint="light"
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                backgroundColor: isActive
                                  ? `${filter.color}90` // More transparent for glass effect
                                  : "rgba(255, 255, 255, 0.2)", // Enhanced glass effect
                                borderWidth: 1,
                                borderColor: isActive
                                  ? `${filter.color}80` // More transparent border
                                  : "rgba(255, 255, 255, 0.3)", // Enhanced glass border
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "row",
                                gap: 4,
                              }}
                            >
                              {filter.icon}
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: isActive ? "600" : "500",
                                  color: isActive ? filter.color : "#2a2a2a",
                                  textAlign: "center",
                                  textShadowColor: isActive
                                    ? "rgba(255, 255, 255, 0.8)"
                                    : "rgba(255, 255, 255, 0.9)",
                                  textShadowOffset: { width: 0, height: 1 },
                                  textShadowRadius: 2,
                                }}
                              >
                                {filter.label}
                              </Text>
                            </BlurView>
                          </TouchableOpacity>
                        );
                      })}
                      {/* More Filters Dropdown */}
                      <FilterDropdown
                        options={extendedFilterOptions}
                        selectedId={activeFilter}
                        onSelect={handleFilterPress}
                        position="right"
                        maxHeight={350}
                        enableHaptics={enableHaptics}
                        triggerButton={
                          <View
                            style={{
                              borderRadius: 20,
                              overflow: "hidden",
                              minWidth: 60,
                              shadowColor: "#000",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.15,
                              shadowRadius: 4,
                              elevation: 3,
                            }}
                          >
                            <BlurView
                              intensity={70}
                              tint="light"
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                backgroundColor: "rgba(255, 255, 255, 0.2)",
                                borderWidth: 1,
                                borderColor: "rgba(255, 255, 255, 0.3)",
                                alignItems: "center",
                                justifyContent: "center",
                                flexDirection: "row",
                                gap: 4,
                              }}
                            >
                              <Text
                                style={{
                                  fontSize: 14,
                                  fontWeight: "500",
                                  color: "#2a2a2a",
                                  textAlign: "center",
                                  textShadowColor: "rgba(255, 255, 255, 0.9)",
                                  textShadowOffset: { width: 0, height: 1 },
                                  textShadowRadius: 2,
                                }}
                              >
                                More
                              </Text>
                              <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                                <Path
                                  d="M6 9l6 6 6-6"
                                  stroke="#2a2a2a"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </Svg>
                            </BlurView>
                          </View>
                        }
                      />
                    </ScrollView>
                  </Animated.View>

                  {/* Filtered Meals Section - Show when a filter is active */}
                  {activeFilter !== "all" && !searchQuery.trim() && (
                    <Animated.View
                      style={[contentOpacityStyle, { marginBottom: 20 }]}
                    >
                      <Text
                        style={{
                          color: "#1a1a1a",
                          fontSize: 18,
                          fontWeight: "700",
                          marginBottom: 12,
                          letterSpacing: -0.2,
                        }}
                      >
                        {filterCategories.find(f => f.id === activeFilter)?.label || "Filtered"} Options
                      </Text>
                      
                      {(() => {
                        // Check if we already know this filter is empty (cached)
                        const isCachedEmpty = emptyFiltersCacheRef.current.has(activeFilter);
                        
                        // Show skeleton only when loading (not if we already know this filter is empty)
                        if ((isLoadingFilteredMeals || !filteredMealsData) && !isCachedEmpty) {
                          return (
                            <View style={{ flexDirection: "row", gap: 12 }}>
                              {[1, 2, 3].map((i) => (
                                <View
                                  key={i}
                                  style={{
                                    width: 140,
                                    height: 180,
                                    borderRadius: 16,
                                    backgroundColor: "rgba(0, 0, 0, 0.05)",
                                  }}
                                />
                              ))}
                            </View>
                          );
                        }
                        
                        // Show error state
                        if (isErrorFilteredMeals) {
                          return (
                            <View style={{ height: 180, justifyContent: "center", alignItems: "center" }}>
                              <Text style={{ color: "#6a6a6a", fontSize: 14 }}>
                                Failed to load meals
                              </Text>
                            </View>
                          );
                        }
                        
                        // Extract meals array safely
                        const meals = filteredMealsData?.data?.meals || [];
                        
                        // Show meals if we have any
                        if (Array.isArray(meals) && meals.length > 0) {
                          return (
                            <ScrollView
                              horizontal
                              showsHorizontalScrollIndicator={false}
                              contentContainerStyle={{ gap: 12 }}
                            >
                              {meals.slice(0, 6).map((meal: any, index: number) => {
                                const mealData = meal.meal || meal.result || meal;
                                const mealId = mealData._id || mealData.id || meal.id;
                                const mealName = mealData.name || mealData.title || "Meal";
                                const mealPrice = mealData.price ? `£${mealData.price.toFixed(2)}` : "£0.00";
                                const mealImage = mealData.image_url 
                                  ? { uri: mealData.image_url }
                                  : mealData.image
                                  ? mealData.image
                                  : require("../../assets/images/cribnoshpackaging.png");
                                const chefName = mealData.chef?.name || mealData.kitchen || "Various Kitchens";

                                return (
                                  <TouchableOpacity
                                    key={mealId || index}
                                    style={{
                                      width: 140,
                                      borderRadius: 16,
                                      overflow: "hidden",
                                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                                      borderWidth: 1,
                                      borderColor: "rgba(255, 255, 255, 0.15)",
                                    }}
                                    onPress={() => {
                                      if (onMealPress) {
                                        onMealPress({
                                          id: mealId,
                                          name: mealName,
                                          price: mealData.price || 0,
                                          kitchen: chefName,
                                          image: mealImage,
                                          _id: mealId,
                                        });
                                      }
                                    }}
                                    activeOpacity={0.8}
                                  >
                                    <View style={{ position: "relative", width: "100%", height: 120 }}>
                                      <Image
                                        source={mealImage}
                                        style={{ width: "100%", height: "100%", resizeMode: "cover" }}
                                      />
                                      {mealData.isPopular && (
                                        <View
                                          style={{
                                            position: "absolute",
                                            top: 8,
                                            left: 8,
                                            backgroundColor: "#ef4444",
                                            paddingHorizontal: 8,
                                            paddingVertical: 4,
                                            borderRadius: 12,
                                          }}
                                        >
                                          <Text
                                            style={{
                                              color: "#ffffff",
                                              fontSize: 10,
                                              fontWeight: "600",
                                            }}
                                          >
                                            POPULAR
                                          </Text>
                                        </View>
                                      )}
                                    </View>
                                    <View style={{ padding: 12 }}>
                                      <Text
                                        style={{
                                          color: "#1a1a1a",
                                          fontSize: 14,
                                          fontWeight: "600",
                                          marginBottom: 4,
                                        }}
                                        numberOfLines={2}
                                      >
                                        {mealName}
                                      </Text>
                                      <Text
                                        style={{
                                          color: "#4a4a4a",
                                          fontSize: 12,
                                          marginBottom: 4,
                                        }}
                                        numberOfLines={1}
                                      >
                                        {chefName}
                                      </Text>
                                      <Text
                                        style={{
                                          color: "#1a1a1a",
                                          fontSize: 15,
                                          fontWeight: "700",
                                        }}
                                      >
                                        {mealPrice}
                                      </Text>
                                    </View>
                                  </TouchableOpacity>
                                );
                              })}
                            </ScrollView>
                          );
                        }
                        
                        // Empty state with same height as skeleton to prevent flicker
                        return (
                          <View style={{ height: 180, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 }}>
                            <Text style={{ color: "#1a1a1a", fontSize: 16, fontWeight: "600", textAlign: "center", marginBottom: 8 }}>
                              No {filterCategories.find(f => f.id === activeFilter)?.label.toLowerCase() || "filtered"} options yet
                            </Text>
                            <Text style={{ color: "#6a6a6a", fontSize: 14, textAlign: "center", lineHeight: 20 }}>
                              As more food creators join us, there will be more options for everyone
                            </Text>
                          </View>
                        );
                      })()}
                    </Animated.View>
                  )}

                  {/* Discovered Features Banner - Show when searching and features are discovered */}
                  {searchQuery.trim() && discoveredFeatures.length > 0 && (
                    <Animated.View
                      style={[contentOpacityStyle, { marginBottom: 20 }]}
                    >
                      <View
                        style={{
                          backgroundColor: "rgba(239, 68, 68, 0.08)",
                          borderRadius: 16,
                          padding: 16,
                          borderWidth: 1,
                          borderColor: "rgba(239, 68, 68, 0.2)",
                          marginBottom: 16,
                        }}
                      >
                        <Text
                          style={{
                            color: "#1a1a1a",
                            fontSize: 14,
                            fontWeight: "700",
                            marginBottom: 8,
                            letterSpacing: -0.2,
                          }}
                        >
                          Discovered for: &quot;{searchQuery}&quot;
                        </Text>
                        <Text
                          style={{
                            color: "#4a4a4a",
                            fontSize: 12,
                            lineHeight: 16,
                            fontWeight: "400",
                          }}
                        >
                          {discoveredFeatures.length === 1
                            ? "We found a feature that matches your search"
                            : `We found ${discoveredFeatures.length} features that match your search`}
                        </Text>
                      </View>
                    </Animated.View>
                  )}

                  {/* Dynamic Content Section - Promo, Notice, or Feature Spotlight */}
                  <Animated.View
                    style={[contentOpacityStyle, { marginBottom: 16 }]}
                  >
                    {dynamicContent && (
                      <DynamicSearchContent
                        content={dynamicContent}
                        onFeatureDiscovery={() => {
                          // Scroll to discovered features section if visible
                          // The features are already shown below in search focus mode
                        }}
                        onFilterCardPress={(filterId) => {
                          // Filter card clicked - ensure filter is active and scroll to filtered meals
                          if (filterId !== activeFilter) {
                            handleFilterPress(filterId);
                          }
                          // Scroll to filtered meals section (already visible when filter is active)
                          triggerHaptic();
                        }}
                        onNoticePress={(noticeId, noticeType) => {
                          // Handle notice-specific actions
                          if (noticeId.includes("nosh-heaven") || noticeId.includes("Nosh Heaven")) {
                            router.push("/nosh-heaven" as any);
                          } else if (noticeId.includes("tip")) {
                            // Tips are informational, maybe expand search or show more
                            if (snapPointState === SNAP_POINTS.COLLAPSED) {
                              animateToSnapPoint(SNAP_POINTS.EXPANDED);
                            }
                          }
                          triggerHaptic();
                        }}
                        onInviteFriend={handleInviteFriend}
                        onSetupFamily={handleSetupFamily}
                        onGroupOrder={handleNavigate}
                        onNoshHeaven={() => {
                          triggerHaptic();
                          if (searchInputRef.current) {
                            searchInputRef.current.blur();
                          }
                          handleSearchBlur();
                          router.push("/nosh-heaven" as any);
                        }}
                      />
                    )}

                    {/* Show swipable notices when no dynamic content */}
                    {!dynamicContent && notices.length > 0 && (
                      <DynamicSearchContent
                        content={null}
                        notices={notices}
                        onFeatureDiscovery={() => {
                          // Scroll to discovered features section if visible
                        }}
                        onFilterCardPress={(filterId) => {
                          if (filterId !== activeFilter) {
                            handleFilterPress(filterId);
                          }
                          triggerHaptic();
                        }}
                        onNoticePress={(noticeId, noticeType) => {
                          if (noticeId.includes("nosh-heaven") || noticeId.includes("Nosh Heaven")) {
                            router.push("/nosh-heaven" as any);
                          } else if (noticeId.includes("tip")) {
                            if (snapPointState === SNAP_POINTS.COLLAPSED) {
                              animateToSnapPoint(SNAP_POINTS.EXPANDED);
                            }
                          }
                          triggerHaptic();
                        }}
                        onInviteFriend={handleInviteFriend}
                        onSetupFamily={handleSetupFamily}
                        onGroupOrder={handleNavigate}
                        onNoshHeaven={() => {
                          triggerHaptic();
                          if (searchInputRef.current) {
                            searchInputRef.current.blur();
                          }
                          handleSearchBlur();
                          router.push("/nosh-heaven" as any);
                        }}
                      />
                    )}

                    {/* Fallback: Try It's on me Section - Only show if no dynamic content and no notices */}
                    {!dynamicContent && notices.length === 0 && (
                      <>
                        {activeFilter !== "all" ? (
                          <>
                            <Text
                              style={{
                                color: "#1a1a1a",
                                fontSize: 18,
                                fontWeight: "700",
                                lineHeight: 22,
                                marginBottom: 6,
                              }}
                            >
                              {filterCategories.find(f => f.id === activeFilter)?.label || "Filtered"} Options
                            </Text>
                            <Text
                              style={{
                                color: "#4a4a4a",
                                fontSize: 13,
                                lineHeight: 17,
                                fontWeight: "400",
                                marginBottom: 16,
                              }}
                            >
                              {activeFilter === "vegan" && "Share plant-based meals with friends"}
                              {activeFilter === "glutenfree" && "Send gluten-free options to someone special"}
                              {activeFilter === "spicy" && "Treat a friend to some spicy food"}
                              {activeFilter === "healthy" && "Share healthy meal options"}
                              {activeFilter === "fast" && "Quick delivery options for friends"}
                              {activeFilter === "budget" && "Great value meals to share"}
                              {activeFilter === "videos" && "Share cooking videos with friends"}
                              {activeFilter === "recipes" && "Share recipes with friends"}
                              {!["vegan", "glutenfree", "spicy", "healthy", "fast", "budget", "videos", "recipes"].includes(activeFilter) && "Send a link to a friend so they can order food on you."}
                            </Text>
                          </>
                        ) : (
                          <>
                            <Text
                              style={{
                                color: "#1a1a1a",
                                fontSize: 18,
                                fontWeight: "700",
                                lineHeight: 22,
                                marginBottom: 6,
                              }}
                            >
                              Try It&apos;s on me
                            </Text>
                            <Text
                              style={{
                                color: "#4a4a4a",
                                fontSize: 13,
                                lineHeight: 17,
                                fontWeight: "400",
                                marginBottom: 16,
                              }}
                            >
                              Send a link to a friend so they can order{"\n"}food on
                              you.
                            </Text>
                          </>
                        )}
                      </>
                    )}
                  </Animated.View>

                  <Animated.View
                    style={[contentOpacityStyle, { marginBottom: 16 }]}
                  >
                    {/* Invite Buttons Row */}
                    <View
                      style={{
                        flexDirection: "row",
                        gap: 8,
                        marginBottom: 12,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Button
                          backgroundColor={
                            discoveredFeatures.includes("inviteFriend")
                              ? "#ef4444"
                              : "#4a5d4f"
                          }
                          textColor="#ffffff"
                          borderRadius={20}
                          paddingVertical={10}
                          paddingHorizontal={12}
                          onPress={handleInviteFriend}
                          disabled={isCreatingOrder || isGeneratingLink}
                          style={
                            discoveredFeatures.includes("inviteFriend")
                              ? {
                                  shadowColor: "#ef4444",
                                  shadowOffset: { width: 0, height: 2 },
                                  shadowOpacity: 0.3,
                                  shadowRadius: 4,
                                  elevation: 4,
                                }
                              : undefined
                          }
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            {(isCreatingOrder || isGeneratingLink) ? (
                              <ActivityIndicator size="small" color="#ffffff" />
                            ) : (
                              <>
                                <Text
                                  style={{
                                    color: "#ffffff",
                                    fontSize: 13,
                                    fontWeight: "600",
                                  }}
                                >
                                  Invite Friend
                                </Text>
                                <ShareArrowIcon size={12} />
                              </>
                            )}
                          </View>
                        </Button>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Button
                          backgroundColor={
                            discoveredFeatures.includes("setupFamily")
                              ? "#ef4444"
                              : "#4a5d4f"
                          }
                          textColor="#ffffff"
                          borderRadius={20}
                          paddingVertical={10}
                          paddingHorizontal={12}
                          onPress={handleSetupFamily}
                          style={
                            discoveredFeatures.includes("setupFamily")
                              ? {
                                  shadowColor: "#ef4444",
                                  shadowOffset: { width: 0, height: 2 },
                                  shadowOpacity: 0.3,
                                  shadowRadius: 4,
                                  elevation: 4,
                                }
                              : undefined
                          }
                        >
                          <View
                            style={{
                              flexDirection: "row",
                              alignItems: "center",
                              gap: 6,
                            }}
                          >
                            <Text
                              style={{
                                color: "#ffffff",
                                fontSize: 13,
                                fontWeight: "600",
                              }}
                            >
                              Setup Family
                            </Text>
                            <FamilyIcon size={12} />
                          </View>
                        </Button>
                      </View>
                    </View>

                    {/* Start Group Order Button */}

                    <Button
                      backgroundColor={
                        discoveredFeatures.includes("groupOrder")
                          ? "#ef4444"
                          : "#ef4444"
                      }
                      textColor="#ffffff"
                      borderRadius={20}
                      paddingVertical={12}
                      paddingHorizontal={16}
                      onPress={handleNavigate}
                      style={
                        discoveredFeatures.includes("groupOrder")
                          ? {
                              width: "100%",
                              shadowColor: "#ef4444",
                              shadowOffset: { width: 0, height: 2 },
                              shadowOpacity: 0.4,
                              shadowRadius: 6,
                              elevation: 5,
                            }
                          : { width: "100%" }
                      }
                    >
                      <View
                        style={{
                          flexDirection: "row",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <Text
                          style={{
                            color: "#ffffff",
                            fontSize: 15,
                            fontWeight: "600",
                          }}
                        >
                          Start Group Order
                        </Text>
                        <GroupOrderIcon size={14} />
                      </View>
                    </Button>
                  </Animated.View>

                  {/* Food Illustration - Only show when expanded */}
                  <Animated.View
                    style={[
                      contentOpacityStyle,
                      { alignItems: "center", marginBottom: 8 },
                    ]}
                  >
                    <SafeImage
                      source={require("../../assets/images/cribnoshpackaging.png")}
                      style={{
                        width: 180,
                        height: 135,
                        resizeMode: "contain",
                      }}
                    />
                  </Animated.View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </>
  );
}

// Removed unused styles object
