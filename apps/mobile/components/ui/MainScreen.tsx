import { useFeatureFlag } from "@/context/FeatureFlagContext";
import { api } from "@/convex/_generated/api";
import { useAppContext } from "@/utils/AppContext";
import Constants from 'expo-constants';
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import * as Updates from "expo-updates";
import { Filter, X } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, RefreshControl, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  runOnJS,
  runOnUI,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming
} from "react-native-reanimated";
import { useAuthContext } from "../../contexts/AuthContext";

import { FoodCreatorMarker } from "@/types/maps";
import { CONFIG } from "../../constants/config";
import { useUserLocation } from "../../hooks/useUserLocation";
import { getDirections } from "../../utils/appleMapsService";
import { UserBehavior } from "../../utils/hiddenSections";
import {
  OrderingContext,
  getCurrentTimeContext,
  getOrderedSectionsWithHidden,
} from "../../utils/sectionOrdering";
import { NotLoggedInNotice } from "../NotLoggedInNotice";
import { AIChatDrawer } from "./AIChatDrawer";
import { BottomSearchDrawer } from "./BottomSearchDrawer";
import { CameraModalScreen } from "./CameraModalScreen";
import { CategoryFilterChips } from "./CategoryFilterChips";
import { CategoryFullDrawer } from "./CategoryFullDrawer";
import { CuisineCategoriesSection } from "./CuisineCategoriesSection";
import { CuisinesSection } from "./CuisinesSection";
import { EventBanner } from "./EventBanner";
import { FeaturedFoodCreatorsDrawer } from "./FeaturedFoodCreatorsDrawer";
import { FeaturedFoodCreatorsSection } from "./FeaturedFoodCreatorsSection";
import { FilteredEmptyState } from "./FilteredEmptyState";
import { FloatingActionButton } from "./FloatingActionButton";
import { FoodCreatorScreen } from "./FoodCreatorScreen";
import { FoodCreatorsNearMe } from "./FoodCreatorsNearMe";
import { GeneratingSuggestionsLoader } from "./GeneratingSuggestionsLoader";
import { Header } from "./Header";
import { HiddenSections } from "./HiddenSections";
import LiveContent from "./LiveContent";
import { MapBottomSheet } from "./MapBottomSheet";
import { MealItemDetails } from "./MealItemDetails";
import { MultiStepLoader } from "./MultiStepLoader";
import { NoshHeavenCategory, NoshHeavenFilterChips } from "./NoshHeavenFilterChips";
import { NoshHeavenPostModal } from "./NoshHeavenPostModal";
import { NotificationsSheet } from "./NotificationsSheet";
import { OrderAgainSection } from "./OrderAgainSection";
import { usePerformanceOptimizations } from "./PerformanceMonitor";
import { PopularMealsDrawer } from "./PopularMealsDrawer";
import { PopularMealsSection } from "./PopularMealsSection";
import { RecommendedMealsSection } from "./RecommendedMealsSection";
import { SessionExpiredModal } from "./SessionExpiredModal";
import { UpdateAvailableModal } from "./UpdateAvailableModal";
// import { ShakeDebugger } from './ShakeDebugger';
import { CuisineCategoriesDrawer } from "./CuisineCategoriesDrawer";
import { CuisineCategoryDrawer } from "./CuisineCategoryDrawer";
import { CuisinesDrawer } from "./CuisinesDrawer";
import { NoticesSection } from "./NoticesSection";
import { ShakeToEatFlow } from "./ShakeToEatFlow";
import { SpecialOffersDrawer } from "./SpecialOffersDrawer";
import { SpecialOffersSection } from "./SpecialOffersSection";
import { SustainabilityDrawer } from "./SustainabilityDrawer";
import { TakeAways } from "./TakeAways";
import { TakeawayCategoryDrawer } from "./TakeawayCategoryDrawer";
import { TooFreshToWaste } from "./TooFreshToWaste";
import { TooFreshToWasteDrawer } from "./TooFreshToWasteDrawer";
import { TopKebabs } from "./TopKebabs";

// Customer API imports
import { useAnalytics } from "@/hooks/useAnalytics";
import { useCart } from "@/hooks/useCart";
import { useCuisines } from "@/hooks/useCuisines";
import { useFoodCreators } from "@/hooks/useFoodCreators";
import { useMeals } from "@/hooks/useMeals";
import { useOffers } from "@/hooks/useOffers";
import { getConvexClient } from "@/lib/convexClient";
import { Cuisine, FoodCreator } from "@/types/customer";

// Global toast imports
import {
  showError,
  showInfo,
  showSuccess,
  showWarning,
} from "../../lib/GlobalToastManager";
import { navigateToSignIn } from "../../utils/signInNavigationGuard";

export function MainScreen() {
  const {
    activeHeaderTab,
    registerScrollToTopCallback,
    activeCategoryFilter,
    setActiveCategoryFilter,
  } = useAppContext();
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    isSessionExpired,
    clearSessionExpired,
    checkTokenExpiration,
    token,
    refreshAuthState,
  } = useAuthContext();


  // Feature Flags
  const { isEnabled: isFeatureEnabled } = useFeatureFlag();

  // Cuisines using useCuisines hook
  const { getCuisines } = useCuisines();
  const [cuisinesData, setCuisinesData] = useState<any>(null);
  const [cuisinesLoading, setCuisinesLoading] = useState(false);
  const [cuisinesError, setCuisinesError] = useState<any>(null);

  // Load cuisines function
  const loadCuisines = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setCuisinesLoading(true);
      setCuisinesError(null);
      const result = await getCuisines();
      if (result.success) {
        // Transform to match expected format
        setCuisinesData({
          success: true,
          data: {
            cuisines: result.data.cuisines.map((cuisine: string, index: number) => ({
              id: `cuisine-${index}`,
              name: cuisine,
              image_url: null,
            })),
          },
        });
        // Clear error on successful load
        setCuisinesError(null);
      } else {
        // If result is not successful, set error
        setCuisinesError(new Error('Failed to load cuisines'));
      }
    } catch (error: any) {
      setCuisinesError(error);
    } finally {
      setCuisinesLoading(false);
    }
  }, [isAuthenticated, getCuisines]);

  // Refetch function for compatibility
  const refetchCuisines = loadCuisines;

  // Popular food creators using useFoodCreators hook
  const { getPopularFoodCreators } = useFoodCreators();
  const [foodCreatorsData, setFoodCreatorsData] = useState<any>(null);
  const [foodCreatorsLoading, setFoodCreatorsLoading] = useState(false);
  const [foodCreatorsError, setFoodCreatorsError] = useState<any>(null);

  // Load popular food creators function
  const loadPopularFoodCreators = useCallback(async () => {
    try {
      setFoodCreatorsLoading(true);
      setFoodCreatorsError(null);
      const result = await getPopularFoodCreators();
      if (result.success) {
        setFoodCreatorsData({ success: true, data: result.data });
        // Clear error on successful load
        setFoodCreatorsError(null);
      }
    } catch (error: any) {
      setFoodCreatorsError(error);
    } finally {
      setFoodCreatorsLoading(false);
    }
  }, [getPopularFoodCreators]);

  // Refetch function for compatibility
  const refetchFoodCreators = loadPopularFoodCreators;

  // Popular meals using useMeals hook
  const { getRandomMeals } = useMeals();
  const [popularMealsData, setPopularMealsData] = useState<any>(null);
  const [mealsLoading, setMealsLoading] = useState(false);
  const [mealsError, setMealsError] = useState<any>(null);

  // Load popular meals function
  const loadPopularMeals = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setMealsLoading(true);
      setMealsError(null);
      const result = await getRandomMeals(50, locationState.location || null);
      if (result.success) {
        // Transform to match expected format
        setPopularMealsData({
          success: true,
          data: {
            popular: result.data.meals.map((meal: any) => ({
              meal,
              foodCreator: meal.foodCreator || meal.foodCreator || null,
            }))
          }
        });
        // Clear error on successful load
        setMealsError(null);
      }
    } catch (error: any) {
      setMealsError(error);
    } finally {
      setMealsLoading(false);
    }
  }, [isAuthenticated, getRandomMeals]);

  // Refetch function for compatibility
  const refetchMeals = loadPopularMeals;

  // Offers using useOffers hook
  const { getActiveOffers } = useOffers();
  const [offersData, setOffersData] = useState<any>(null);
  const [offersLoading, setOffersLoading] = useState(false);
  const [offersError, setOffersError] = useState<any>(null);

  // Load offers function
  const loadOffers = useCallback(async () => {
    if (!isAuthenticated) return;
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
  }, [isAuthenticated, getActiveOffers]);

  // Cart using useCart hook
  const { getCart, addToCart: addToCartAction, addOrderToCart } = useCart();
  const [cartData, setCartData] = useState<any>(null);
  const [cartError, setCartError] = useState<any>(null);
  const [cartLoading, setCartLoading] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Load cart function
  const loadCart = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setCartLoading(true);
      setCartError(null);
      const result = await getCart();
      if (result.success) {
        setCartData(result.data);
      }
    } catch (error: any) {
      setCartError(error);
    } finally {
      setCartLoading(false);
    }
  }, [isAuthenticated, getCart]);

  // Refetch function for compatibility
  const refetchCart = loadCart;

  // Parallelize data loading on mount/authentication change
  useEffect(() => {
    if (isAuthenticated) {
      // Load all data in parallel instead of sequentially
      Promise.all([
        loadCuisines(),
        loadPopularFoodCreators(),
        loadPopularMeals(),
        loadOffers(),
        loadCart()
      ]).catch((error) => {
        console.error('Error loading initial data:', error);
      });
    }
  }, [isAuthenticated, loadCuisines, loadPopularFoodCreators, loadPopularMeals, loadOffers, loadCart]);

  // Location hook for map functionality
  const locationState = useUserLocation();

  // Weather state
  const [weatherData, setWeatherData] = useState<any>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Fetch weather data from Convex when location is available
  useEffect(() => {
    if (locationState.location) {
      const fetchWeather = async () => {
        try {
          setWeatherLoading(true);
          const convex = getConvexClient();
          const result = await convex.action(api.actions.weather.getWeather, {
            latitude: locationState.location!.latitude,
            longitude: locationState.location!.longitude,
          });

          // Transform to match expected format
          setWeatherData({
            data: result,
          });
        } catch (error: any) {
          console.error('Error fetching weather:', error);
          // Set default weather on error
          setWeatherData({
            data: {
              condition: 'clear',
              temperature: 20,
              description: 'Weather data unavailable',
            },
          });
        } finally {
          setWeatherLoading(false);
        }
      };

      fetchWeather();
    }
  }, [locationState.location]);

  // Data transformation functions
  const transformCuisinesData = useCallback((apiCuisines: Cuisine[] | undefined) => {
    if (!apiCuisines || !Array.isArray(apiCuisines)) {
      return [];
    }
    return apiCuisines.map((cuisine) => ({
      id: cuisine.id,
      name: cuisine.name,
      image: {
        uri:
          cuisine.image_url ||
          "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=400&fit=crop",
      },
      restaurantCount: cuisine.restaurant_count,
      isActive: cuisine.is_active,
    }));
  }, []);

  const transformFoodCreatorsData = useCallback((apiFoodCreators: FoodCreator[] | undefined) => {
    if (!apiFoodCreators || !Array.isArray(apiFoodCreators)) {
      return [];
    }
    return apiFoodCreators.map((foodCreator) => ({
      id: foodCreator.id,
      name: foodCreator.foodCreator_name,
      cuisine: foodCreator.cuisine,
      sentiment: foodCreator.sentiment,
      deliveryTime: foodCreator.delivery_time,
      distance: foodCreator.distance,
      image: {
        uri:
          foodCreator.image_url ||
          "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop",
      },
      isLive: foodCreator.is_live,
      liveViewers: foodCreator.live_viewers,
    }));
  }, []);


  // Transform API meal data to component format
  const transformMealData = useCallback((apiMeal: any) => {
    if (!apiMeal?.meal) return null;

    const meal = apiMeal.meal;
    const foodCreator = apiMeal.foodCreator || apiMeal.foodCreator;

    return {
      id: meal._id || meal.id || '',
      name: meal.name || 'Unknown Meal',
      foodCreator: foodCreator?.foodCreator_name || foodCreator?.name || 'Unknown FoodCreator',
      cuisine: foodCreator?.cuisine || '', // Store cuisine for filtering
      price: meal.price ? `£${(meal.price / 100).toFixed(2)}` : '£0.00',
      originalPrice: meal.original_price ? `£${(meal.original_price / 100).toFixed(2)}` : undefined,
      image: {
        uri: meal.image_url || meal.image || 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
      },
      isPopular: true,
      isNew: meal.is_new || false,
      sentiment: meal.sentiment || 'solid',
      deliveryTime: meal.deliveryTime || meal.delivery_time || null, // Use backend-calculated delivery time
    };
  }, []);

  // Process meals from API
  const meals = useMemo(() => {
    if (popularMealsData?.success && popularMealsData.data?.popular) {
      const transformedMeals = popularMealsData.data.popular
        .map(transformMealData)
        .filter((meal: ReturnType<typeof transformMealData>): meal is NonNullable<ReturnType<typeof transformMealData>> => meal !== null);
      return transformedMeals;
    }
    return []; // Return empty array instead of mockMeals
  }, [popularMealsData, transformMealData]);

  // Process API data
  const cuisines = useMemo(() => {
    if (cuisinesData?.success && cuisinesData.data && Array.isArray(cuisinesData.data)) {
      const transformedData = transformCuisinesData(cuisinesData.data);
      return transformedData;
    }
    return []; // Return empty array instead of mock data
  }, [cuisinesData, transformCuisinesData]);

  const foodCreators = useMemo(() => {
    if (foodCreatorsData?.success && foodCreatorsData.data && Array.isArray(foodCreatorsData.data)) {
      const transformedData = transformFoodCreatorsData(foodCreatorsData.data);
      return transformedData;
    }
    return []; // Return empty array instead of mock data
  }, [foodCreatorsData, transformFoodCreatorsData]);

  // Transform API offer data to component format
  const transformOfferData = useCallback((apiOffer: any) => {
    if (!apiOffer) return null;

    // Format discount value
    let discountText = "";
    if (apiOffer.discount_type === "percentage") {
      discountText = `${apiOffer.discount_value}%`;
    } else if (apiOffer.discount_type === "fixed_amount") {
      discountText = `£${(apiOffer.discount_value / 100).toFixed(2)}`;
    } else if (apiOffer.discount_type === "free_delivery") {
      discountText = "Free Delivery";
    }

    // Format valid until date
    const formatDateWithoutYear = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    };

    const calculateRemainingTime = (dateString: string) => {
      const now = new Date();
      const end = new Date(dateString);
      const diff = end.getTime() - now.getTime();
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      if (days > 0) return `${days} day${days > 1 ? 's' : ''} left`;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} left`;
      return 'Expiring soon';
    };

    const validUntil = formatDateWithoutYear(apiOffer.ends_at);
    const remainingTime = calculateRemainingTime(apiOffer.ends_at);

    return {
      id: apiOffer.offer_id || apiOffer._id || "",
      title: apiOffer.title || "Special Offer",
      description: apiOffer.description || "",
      discount: discountText,
      image: {
        uri: apiOffer.background_image_url || "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
      },
      validUntil,
      isLimited: apiOffer.offer_type === "limited_time",
      remainingTime,
    };
  }, []);

  // Process offers from API
  const offers = useMemo(() => {
    // Check if offersData has the expected structure
    if (offersData?.success && offersData.data) {
      // Handle both array and object with offers property
      const offersArray = Array.isArray(offersData.data)
        ? offersData.data
        : offersData.data.offers || [];

      if (Array.isArray(offersArray)) {
        const transformedOffers = offersArray
          .map(transformOfferData)
          .filter((offer): offer is NonNullable<ReturnType<typeof transformOfferData>> => offer !== null);
        return transformedOffers;
      }
    }
    return []; // Return empty array instead of mockOffers
  }, [offersData, transformOfferData]);

  // Helper function to normalize cuisine names for filtering
  const normalizeCuisineForFilter = useCallback((cuisineName: string): string => {
    // Normalize cuisine name to match filter category format
    // Handles variations like "Italian" -> "italian", "Thai Food" -> "thai"
    const normalized = cuisineName.toLowerCase().trim();

    // Map common variations
    const variations: Record<string, string> = {
      'italian': 'italian',
      'japanese': 'japanese',
      'chinese': 'chinese',
      'indian': 'indian',
      'mexican': 'mexican',
      'thai': 'thai',
      'sushi': 'sushi',
      'pizza': 'pizza',
      'burgers': 'burgers',
      'burger': 'burgers',
      'french': 'italian', // Can map to closest match or leave unfiltered
      'nigerian': 'all', // Not in filter list
      'moroccan': 'all',
      'korean': 'all',
    };

    // Check if normalized name matches any variation key
    for (const [key, value] of Object.entries(variations)) {
      if (normalized.includes(key)) {
        return value;
      }
    }

    return normalized;
  }, []);

  // Filtered foodCreators based on activeCategoryFilter
  const filteredFoodCreators = useMemo(() => {
    if (activeCategoryFilter === 'all') {
      return foodCreators;
    }

    return foodCreators.filter((foodCreator) => {
      const cuisineNormalized = normalizeCuisineForFilter(foodCreator.cuisine || '');
      return cuisineNormalized === activeCategoryFilter || cuisineNormalized === 'all';
    });
  }, [foodCreators, activeCategoryFilter, normalizeCuisineForFilter]);

  // Filtered meals based on activeCategoryFilter
  const filteredMeals = useMemo(() => {
    if (activeCategoryFilter === 'all') {
      return meals;
    }

    // Filter meals by matching cuisine to the active category filter
    return meals.filter((meal: any) => {
      // First try to match by meal's cuisine if available
      if (meal.cuisine) {
        const cuisineNormalized = normalizeCuisineForFilter(meal.cuisine);
        if (cuisineNormalized === activeCategoryFilter) {
          return true;
        }
      }

      // Fallback: match by foodCreator name to filtered foodCreators
      const filteredFoodCreatorNames = new Set(filteredFoodCreators.map(k => k.name.toLowerCase()));
      return filteredFoodCreatorNames.has(meal.foodCreator.toLowerCase());
    });
  }, [meals, filteredFoodCreators, activeCategoryFilter, normalizeCuisineForFilter]);

  // Filtered cuisines based on activeCategoryFilter
  const filteredCuisines = useMemo(() => {
    if (activeCategoryFilter === 'all') {
      return cuisines;
    }

    return cuisines.filter((cuisine) => {
      const cuisineNormalized = normalizeCuisineForFilter(cuisine.name || '');
      return cuisineNormalized === activeCategoryFilter || cuisineNormalized === 'all';
    });
  }, [cuisines, activeCategoryFilter, normalizeCuisineForFilter]);

  // Check if all filtered sections are empty
  const isAllSectionsEmpty = useMemo(() => {
    if (activeCategoryFilter === 'all') {
      return false;
    }
    return (
      filteredFoodCreators.length === 0 &&
      filteredMeals.length === 0 &&
      filteredCuisines.length === 0
    );
  }, [activeCategoryFilter, filteredFoodCreators, filteredMeals, filteredCuisines]);

  // Determine which section should be marked as first
  // This helps add top padding to the first visible section
  // Since sections return null when they have no data, we check sections in render order
  // and mark the first one that might have data as first
  const firstSectionId = useMemo(():
    | 'cuisines'
    | 'cuisineCategories'
    | 'featuredFoodCreators'
    | 'popularMeals'
    | 'recommendedMeals'
    | 'hiddenSections'
    | 'specialOffers'
    | 'foodCreatorsNearMe'
    | 'topKebabs'
    | 'takeAways'
    | 'tooFreshToWaste'
    | 'eventBanner'
    | 'filteredEmptyState'
    | 'filteredCuisineCategories'
    | 'filteredFeaturedFoodCreators'
    | 'filteredPopularMeals'
    | null => {
    // Skip NotLoggedInNotice, loading, error views, and OrderAgainSection per plan notes

    if (activeCategoryFilter === 'all') {
      // Normal view - check sections in render order
      // Check if CuisinesSection has data (it uses cuisinesData or fetches internally)
      if (cuisinesData?.success && cuisinesData.data?.cuisines?.length > 0) {
        return 'cuisines';
      }
      // If CuisinesSection has no data, it will return null, so next section is effectively first
      // We mark CuisineCategoriesSection as first (it fetches its own data and will return null if empty)
      // This way, whichever section actually renders first will get the padding
      return 'cuisineCategories';
    } else {
      // Filtered view - check in render order
      if (isAllSectionsEmpty) {
        return 'filteredEmptyState';
      }
      // Check filtered sections in order - first one with data is first
      if (filteredCuisines.length > 0) {
        return 'filteredCuisineCategories';
      }
      if (filteredFoodCreators.length > 0) {
        return 'filteredFeaturedFoodCreators';
      }
      if (filteredMeals.length > 0) {
        return 'filteredPopularMeals';
      }
      return null;
    }
  }, [
    activeCategoryFilter,
    cuisinesData,
    isAllSectionsEmpty,
    filteredCuisines,
    filteredFoodCreators,
    filteredMeals,
  ]);

  // Cart data processing - removed unused variables

  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [isNotificationsSheetVisible, setIsNotificationsSheetVisible] = useState(false);
  const isFirstMapLoad = useRef(true);

  // Handle API errors with toast notifications
  // Error states are handled by UI components - no toasts needed


  // Category drawer state management
  const [activeDrawer, setActiveDrawer] = useState<
    | "takeaway"
    | "tooFresh"
    | "topKebabs"
    | "featuredFoodCreators"
    | "popularMeals"
    | "sustainability"
    | "specialOffers"
    | "cuisineCategories"
    | "cuisines"
    | "cuisineCategory"
    | null
  >(null);

  // Filter state for Top Kebabs drawer
  const [topKebabsFilters, setTopKebabsFilters] = useState<string[]>([]);

  // Selected cuisine category for category drawer
  const [selectedCuisineCategory, setSelectedCuisineCategory] = useState<any>(null);

  // Handle filter changes for Top Kebabs
  const handleTopKebabsFilterChange = useCallback((filterId: string) => {
    setTopKebabsFilters(prev => {
      if (prev.includes(filterId)) {
        // Remove filter if already active
        return prev.filter(id => id !== filterId);
      } else {
        // Add filter if not active
        return [...prev, filterId];
      }
    });
  }, []);

  // Shake to Eat state management
  // ShakeToEatFlow now handles its own visibility with sustained shake detection

  // Meal Details state management
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [isMealDetailsVisible, setIsMealDetailsVisible] = useState(false);

  // FoodCreator Main Screen state management
  const [selectedFoodCreator, setSelectedFoodCreator] = useState<any>(null);
  const [isFoodCreatorScreenVisible, setIsFoodCreatorScreenVisible] =
    useState(false);

  // Sign-in modal state management

  // Camera modal state management
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [isNoshHeavenPostModalVisible, setIsNoshHeavenPostModalVisible] = useState(false);
  const [noshHeavenCategory, setNoshHeavenCategory] = useState<NoshHeavenCategory>('all');

  // Map state management
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [mapFoodCreators, setMapFoodCreators] = useState<FoodCreatorMarker[]>([]);

  // EAS Update state management
  const [showUpdateModal, setShowUpdateModal] = useState(false);

  // Periodic token expiration check
  useEffect(() => {
    if (isAuthenticated) {
      const checkInterval = setInterval(() => {
        checkTokenExpiration();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(checkInterval);
    }
  }, [isAuthenticated, checkTokenExpiration]);

  // Hidden sections state
  const [orderedSections, setOrderedSections] = useState<any[]>([]);

  // Fetch user behavior data from API
  // User behavior using useAnalytics hook
  const { getUserBehavior } = useAnalytics();
  const [userBehaviorData, setUserBehaviorData] = useState<any>(null);
  const [userBehaviorLoading, setUserBehaviorLoading] = useState(false);
  const [userBehaviorError, setUserBehaviorError] = useState<any>(null);

  // Load user behavior function
  const loadUserBehavior = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setUserBehaviorLoading(true);
      setUserBehaviorError(null);
      const result = await getUserBehavior();
      if (result.success) {
        setUserBehaviorData({ success: true, data: result.data });
      }
    } catch (error: any) {
      setUserBehaviorError(error);
    } finally {
      setUserBehaviorLoading(false);
    }
  }, [isAuthenticated, getUserBehavior]);

  // Load user behavior on mount/authentication change
  useEffect(() => {
    if (isAuthenticated) {
      loadUserBehavior();
    }
  }, [isAuthenticated, loadUserBehavior]);

  // Transform API response to UserBehavior format
  const userBehavior: UserBehavior = useMemo(() => {
    if (userBehaviorData?.success && userBehaviorData.data) {
      const data = userBehaviorData.data;
      return {
        totalOrders: data.totalOrders || 0,
        daysActive: data.daysActive || 0,
        usualDinnerItems: data.usualDinnerItems?.map((item: { dish_name: string }) => item.dish_name) || [],
        favoriteSections: [], // Will be populated from other analytics if needed
        clickedSections: [], // Will be populated from other analytics if needed
        colleagueConnections: data.colleagueConnections || 0,
        playToWinHistory: {
          gamesPlayed: data.playToWinHistory?.gamesPlayed || 0,
          gamesWon: data.playToWinHistory?.gamesWon || 0,
          lastPlayed: data.playToWinHistory?.lastPlayed
            ? new Date(data.playToWinHistory.lastPlayed)
            : undefined,
        },
        freeFoodPreferences: [], // Will be populated from preferences if needed
      };
    }

    // Fallback to empty/default values when not authenticated or no data
    return {
      totalOrders: 0,
      daysActive: 0,
      usualDinnerItems: [],
      favoriteSections: [],
      clickedSections: [],
      colleagueConnections: 0,
      playToWinHistory: {
        gamesPlayed: 0,
        gamesWon: 0,
      },
      freeFoodPreferences: [],
    };
  }, [userBehaviorData]);

  const scrollY = useSharedValue(0);
  const stickyHeaderOpacity = useSharedValue(0);
  const normalHeaderOpacity = useSharedValue(1);
  const categoryChipsOpacity = useSharedValue(0);
  const contentFadeAnim = useSharedValue(1);
  const isHeaderStickyShared = useSharedValue(false);
  const isRestoringScrollPositionShared = useSharedValue(false);
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  const isNavigatingShared = useSharedValue(false);

  const isScrolling = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollPosition = useRef(0);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const [hasInitialLoadCompleted, setHasInitialLoadCompleted] = useState(false);
  const hasInitialLoadCompletedRef = useRef(false);
  const savedScrollPositionRef = useRef<number | null>(null);

  // Mark initial load as complete once any data has been loaded
  // Use a ref to ensure this only happens once and doesn't reset
  // This ref persists across re-renders and navigation
  useEffect(() => {
    if (isAuthenticated && (cuisinesData || foodCreatorsData || popularMealsData)) {
      // Once set, never reset - this prevents skeletons from showing again
      if (!hasInitialLoadCompletedRef.current) {
        hasInitialLoadCompletedRef.current = true;
        setHasInitialLoadCompleted(true);
      }
    }
  }, [isAuthenticated, cuisinesData, foodCreatorsData, popularMealsData]);

  // Ensure hasInitialLoadCompleted stays true once set, even if component re-renders
  useEffect(() => {
    if (hasInitialLoadCompletedRef.current && !hasInitialLoadCompleted) {
      setHasInitialLoadCompleted(true);
    }
  }, [hasInitialLoadCompleted]);

  // Refs to track all setTimeout calls for proper cleanup
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const layoutTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flag to track when scroll position is being restored (prevents scroll handler conflicts)
  const isRestoringScrollPositionRef = useRef(false);

  // Debounce ref for scroll-to-top to prevent rapid successive calls
  const scrollToTopDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollToTopCallRef = useRef<number>(0);

  // Callback to update state - ensures consistent state updates
  // MUST be defined before any useEffect hooks or scrollHandler that use it
  const updateHeaderStickyState = useCallback((isSticky: boolean) => {
    setIsHeaderSticky(isSticky);
  }, []);

  // Haptic feedback helper - MUST be defined before scrollHandler that uses it
  const triggerHapticFeedback = useCallback((intensity: 'light' | 'medium' | 'heavy') => {
    try {
      if (intensity === 'light') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } else if (intensity === 'medium') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      }
    } catch {
      // Silently fail haptics
    }
  }, []);

  // Helper to set scrolling state (called from worklet via runOnJS)
  const setScrollingState = useCallback((isScrollingValue: boolean) => {
    isScrolling.current = isScrollingValue;
    setIsUserScrolling(isScrollingValue);
  }, []);

  // Helper to reset scrolling state after scroll ends
  const resetScrollingState = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    scrollTimeoutRef.current = setTimeout(() => {
      isScrolling.current = false;
      setIsUserScrolling(false);
    }, 150);
  }, []);

  // Register scroll-to-top callback
  // Use a ref to track if we're navigating to prevent scroll reset during navigation
  const isNavigatingRef = useRef(false);
  useEffect(() => {
    const scrollToTop = () => {
      // Don't scroll to top if we're currently navigating (e.g., to nosh-heaven)
      // Use ref for JS thread check to avoid reading shared value during render
      if (isNavigatingRef.current) {
        return;
      }

      // Don't scroll to top if we're restoring scroll position
      // Use ref for JS thread check to avoid reading shared value during render
      if (isRestoringScrollPositionRef.current) {
        return;
      }

      // Debounce scroll-to-top calls (prevent rapid successive calls)
      const now = Date.now();
      const timeSinceLastCall = now - lastScrollToTopCallRef.current;
      const DEBOUNCE_DELAY = 300; // 300ms debounce

      // Clear any existing debounce timeout
      if (scrollToTopDebounceRef.current) {
        clearTimeout(scrollToTopDebounceRef.current);
      }

      // If called too soon after last call, debounce it
      if (timeSinceLastCall < DEBOUNCE_DELAY) {
        scrollToTopDebounceRef.current = setTimeout(() => {
          scrollToTop();
        }, DEBOUNCE_DELAY - timeSinceLastCall);
        return;
      }

      lastScrollToTopCallRef.current = now;

      if (scrollViewRef.current) {
        // Set shared value first to prevent race conditions with scroll handler
        isHeaderStickyShared.value = false;

        // Update ref and state immediately for responsive pointerEvents
        updateHeaderStickyState(false);

        // Scroll to top with smooth animation
        // The scroll handler will detect the position change and update accordingly
        scrollViewRef.current.scrollTo({ y: 0, animated: true });

        // Use consistent animation timing for smooth transitions
        const animationDuration = 200; // Match scroll handler duration

        // Animate header opacity changes to match scroll handler behavior
        stickyHeaderOpacity.value = withTiming(0, {
          duration: animationDuration,
        });
        normalHeaderOpacity.value = withTiming(1, {
          duration: animationDuration,
        });
        categoryChipsOpacity.value = withTiming(0, {
          duration: animationDuration,
        });
      }
    };

    registerScrollToTopCallback(scrollToTop);

    // Cleanup debounce timeout on unmount
    return () => {
      if (scrollToTopDebounceRef.current) {
        clearTimeout(scrollToTopDebounceRef.current);
        scrollToTopDebounceRef.current = null;
      }
    };
  }, [
    registerScrollToTopCallback,
    isHeaderStickyShared,
    stickyHeaderOpacity,
    normalHeaderOpacity,
    categoryChipsOpacity,
    updateHeaderStickyState,
    isNavigatingShared,
    isRestoringScrollPositionShared,
  ]);

  // Ensure initial state is correct - start with normal header (not sticky)
  // This prevents both headers from being non-interactive on initial render
  useEffect(() => {
    // Initialize to non-sticky state if not already set
    // Use runOnUI to safely access shared value
    runOnUI(() => {
      'worklet';
      if (isHeaderStickyShared.value !== false) {
        isHeaderStickyShared.value = false;
        runOnJS(updateHeaderStickyState)(false);
      }
    })();
  }, [updateHeaderStickyState]);

  // Cleanup effect to reset states and prevent crashes
  useEffect(() => {
    return () => {
      // Comprehensive cleanup on unmount
      try {
        // Clear all pending timeouts
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = null;
        }
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
          refreshTimeoutRef.current = null;
        }
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
          navigationTimeoutRef.current = null;
        }
        if (layoutTimeoutRef.current) {
          clearTimeout(layoutTimeoutRef.current);
          layoutTimeoutRef.current = null;
        }
        if (focusTimeoutRef.current) {
          clearTimeout(focusTimeoutRef.current);
          focusTimeoutRef.current = null;
        }
        if (scrollToTopDebounceRef.current) {
          clearTimeout(scrollToTopDebounceRef.current);
          scrollToTopDebounceRef.current = null;
        }

        // Reset states
        setIsChatVisible(false);
        setShowLoader(false);
        setRefreshing(false);

        // Reset animation values
        scrollY.value = 0;
        stickyHeaderOpacity.value = 0;
        normalHeaderOpacity.value = 1;
        categoryChipsOpacity.value = 0;
        contentFadeAnim.value = 1;

        // Reset refs
        isScrolling.current = false;
        lastScrollPosition.current = 0;
        isNavigatingRef.current = false;
        isNavigatingShared.value = false;
        isRestoringScrollPositionRef.current = false;
        isRestoringScrollPositionShared.value = false;
        savedScrollPositionRef.current = null;
      } catch {
        // Silently handle cleanup errors
      }
    };
  }, [
    scrollY,
    stickyHeaderOpacity,
    normalHeaderOpacity,
    categoryChipsOpacity,
    contentFadeAnim,
    isHeaderStickyShared,
    isNavigatingShared,
  ]);


  // Enhanced cleanup for scroll timeout
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    };
  }, []);

  // Consolidated scroll position restoration function
  const restoreScrollPosition = useCallback(() => {
    // Don't restore if navigating, already restoring, or no saved position
    // Use refs for JS thread checks to avoid reading shared values during render
    if (
      isNavigatingRef.current ||
      isRestoringScrollPositionRef.current ||
      savedScrollPositionRef.current === null ||
      savedScrollPositionRef.current === Number.MAX_SAFE_INTEGER ||
      !scrollViewRef.current
    ) {
      return;
    }

    const savedPos = savedScrollPositionRef.current;

    // Only restore if position is valid
    if (savedPos <= 0) {
      savedScrollPositionRef.current = null;
      return;
    }

    // Mark that we're restoring to prevent conflicts (both ref and shared value)
    isRestoringScrollPositionRef.current = true;
    isRestoringScrollPositionShared.value = true;

    // Clear any existing layout timeout
    if (layoutTimeoutRef.current) {
      clearTimeout(layoutTimeoutRef.current);
    }

    // Small delay to ensure layout is complete
    layoutTimeoutRef.current = setTimeout(() => {
      if (
        scrollViewRef.current &&
        !isNavigatingRef.current &&
        !isRestoringScrollPositionRef.current &&
        savedScrollPositionRef.current === savedPos
      ) {
        scrollViewRef.current.scrollTo({ y: savedPos, animated: false });
        savedScrollPositionRef.current = null;
      }
      isRestoringScrollPositionRef.current = false;
      isRestoringScrollPositionShared.value = false;
      layoutTimeoutRef.current = null;
    }, 150);
  }, [isNavigatingShared, isRestoringScrollPositionShared]);

  // Restore scroll position when screen comes back into focus (e.g., after closing nosh-heaven modal)
  useFocusEffect(
    useCallback(() => {
      // CRITICAL: Ensure hasInitialLoadCompleted stays true when screen comes into focus
      // This prevents skeletons from showing when returning from modal
      if (hasInitialLoadCompletedRef.current) {
        setHasInitialLoadCompleted(true);
      }

      // Reset navigation flags when screen comes into focus
      // This ensures flags are cleared even if navigation timeout didn't fire
      // Use ref for JS thread check to avoid reading shared value during render
      if (isNavigatingRef.current) {
        isNavigatingRef.current = false;
        isNavigatingShared.value = false;

        // Clear navigation timeout if it exists
        if (navigationTimeoutRef.current) {
          clearTimeout(navigationTimeoutRef.current);
          navigationTimeoutRef.current = null;
        }
      }

      // Clear any existing focus timeout
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }

      // Small delay to ensure screen is fully focused before restoring
      focusTimeoutRef.current = setTimeout(() => {
        restoreScrollPosition();
        focusTimeoutRef.current = null;
      }, 100);

      return () => {
        if (focusTimeoutRef.current) {
          clearTimeout(focusTimeoutRef.current);
          focusTimeoutRef.current = null;
        }
      };
    }, [restoreScrollPosition])
  );

  const loadingStates = [
    {
      text: "Finding the best meals for you...",
      emotion: "excited" as const,
    },
    {
      text: "Preparing experience...",
      emotion: "hungry" as const,
    },
    {
      text: "Ready to serve!",
      emotion: "satisfied" as const,
    },
  ];

  const onRefresh = useCallback(async () => {
    // Clear any existing refresh timeout
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    // Show loader immediately without any delays
    setShowLoader(true);
    setRefreshing(true);

    // Fade out current content immediately
    contentFadeAnim.value = withTiming(0.3, { duration: 100 });

    try {
      // Refetch API data when authenticated
      if (isAuthenticated) {
        await Promise.all([refetchCuisines(), refetchFoodCreators(), refetchMeals(), refetchCart()]);
      }

      // Sometimes check for EAS updates (25% chance)
      // Only check in production builds, not in development
      const shouldCheckForUpdates = Math.random() < 0.25;
      if (shouldCheckForUpdates && !__DEV__) {
        try {
          // Check if Updates is available (not available in Expo Go)
          if (Updates.isEnabled && Updates.checkForUpdateAsync) {
            const update = await Updates.checkForUpdateAsync();

            if (update.isAvailable) {
              // Fetch the update in the background
              await Updates.fetchUpdateAsync();

              // Show modal to user asking if they want to update
              setShowUpdateModal(true);
            }
          }
        } catch (updateError) {
          // Silently handle update errors - app should continue to work
          // This is expected in Expo Go where Updates is not available
          if (Constants.executionEnvironment !== 'storeClient') {
            console.warn('Error checking for updates:', updateError);
          }
        }
      }

      // Simulate the loading process with artificial delay
      refreshTimeoutRef.current = setTimeout(() => {
        // Only update state if component is still mounted
        setShowLoader(false);
        setRefreshing(false);

        // Fade in the content
        contentFadeAnim.value = withTiming(1, { duration: 300 });

        refreshTimeoutRef.current = null;
      }, 2000); // Reduced to 2 seconds for better UX
    } catch {
      showError("Failed to refresh data", "Please try again");
      setShowLoader(false);
      setRefreshing(false);
      contentFadeAnim.value = withTiming(1, { duration: 300 });
      refreshTimeoutRef.current = null;
    }
  }, [
    contentFadeAnim,
    isAuthenticated,
    refetchCuisines,
    refetchFoodCreators,
    refetchMeals,
    refetchCart,
  ]);

  const handleOpenAIChat = () => {
    setIsGeneratingSuggestions(true);
  };

  const handleCloseAIChat = () => {
    setIsChatVisible(false);
  };

  const handleGeneratingSuggestionsComplete = () => {
    // Show the chat screen immediately when loader starts completing
    // This ensures the chat is ready before the loader's fadeout animation finishes
    setIsChatVisible(true);
    setIsGeneratingSuggestions(false);
  };

  // Shake to Eat handlers
  const handleShakeToEatLaunch = (prompt: string) => {
    // Open generating suggestions loader first, then AI chat
    setIsGeneratingSuggestions(true);
    // You can pass the prompt to your AI chat component here
  };

  const handleShakeToEatClose = () => {
    // Component handles its own visibility now
  };

  // Shake to Eat flow started (triggered by sustained shake)
  const handleShakeToEatStart = () => {
    // Component handles its own visibility now
  };

  // Simplified Reanimated scroll handler to prevent crashes
  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        "worklet";
        try {
          // Don't process scroll events if we're navigating (prevents scroll reset)
          if (isNavigatingShared.value) {
            return;
          }

          // Don't process scroll events if we're restoring scroll position
          // This prevents the handler from interfering with programmatic scrolls
          if (isRestoringScrollPositionShared.value) {
            return;
          }

          const scrollPosition = event.contentOffset.y;
          scrollY.value = scrollPosition;

          // Track if user is scrolling - use runOnJS to update ref from JS thread
          // We need to check and set this on the JS thread to avoid ref access in worklet
          runOnJS(setScrollingState)(true);

          // Reset scrolling state after scroll ends
          runOnJS(resetScrollingState)();

          // Improved header sticky logic with better threshold and edge case handling
          // Use 10px threshold for more sensitive detection
          const threshold = 10;
          const shouldBeSticky = scrollPosition > threshold;
          // Only check for truly at-top positions (<= 2px) for reset, not threshold range
          const isAtTop = scrollPosition <= 2;

          // Prioritize sticky transition when scrolling down past threshold
          // Expo 54: Update shared value and sync to React state
          if (shouldBeSticky !== isHeaderStickyShared.value) {
            // Only update if state actually changed
            isHeaderStickyShared.value = shouldBeSticky;
            // Sync to React state immediately using the callback to also update ref
            runOnJS(updateHeaderStickyState)(shouldBeSticky);

            // Simplified animations
            if (shouldBeSticky) {
              stickyHeaderOpacity.value = withTiming(1, { duration: 200 });
              normalHeaderOpacity.value = withTiming(0, { duration: 200 });
              categoryChipsOpacity.value = withTiming(1, { duration: 200 });
            } else {
              stickyHeaderOpacity.value = withTiming(0, { duration: 200 });
              normalHeaderOpacity.value = withTiming(1, { duration: 200 });
              categoryChipsOpacity.value = withTiming(0, { duration: 200 });
            }
          } else if (isAtTop && isHeaderStickyShared.value) {
            // Force reset to normal state when truly at top and currently sticky
            isHeaderStickyShared.value = false;
            runOnJS(updateHeaderStickyState)(false);
            stickyHeaderOpacity.value = withTiming(0, { duration: 200 });
            normalHeaderOpacity.value = withTiming(1, { duration: 200 });
            categoryChipsOpacity.value = withTiming(0, { duration: 200 });
          }

        } catch {
          // Silently handle any worklet errors to prevent crashes
        }
      },
    },
    [
      scrollY,
      isHeaderStickyShared,
      stickyHeaderOpacity,
      normalHeaderOpacity,
      categoryChipsOpacity,
      isNavigatingShared,
      updateHeaderStickyState,
      triggerHapticFeedback,
      resetScrollingState,
      setScrollingState,
    ]
  );

  // Expo 54: Keep useAnimatedReaction as backup to ensure state stays in sync
  // This ensures state updates happen even if scroll handler misses an update
  useAnimatedReaction(
    () => isHeaderStickyShared.value,
    (isSticky, previous) => {
      'worklet';
      // Only update if value actually changed to avoid unnecessary calls
      if (previous !== undefined && previous !== isSticky) {
        // Update state for pointerEvents
        runOnJS(updateHeaderStickyState)(isSticky);
      }
    },
    [isHeaderStickyShared, updateHeaderStickyState]
  );

  // Animated styles for headers with safety checks
  const stickyHeaderStyle = useAnimatedStyle(() => {
    try {
      return {
        opacity: stickyHeaderOpacity.value,
      };
    } catch {
      return { opacity: 0 };
    }
  });

  const normalHeaderStyle = useAnimatedStyle(() => {
    try {
      return {
        opacity: normalHeaderOpacity.value,
      };
    } catch {
      return { opacity: 1 };
    }
  });

  const categoryChipsStyle = useAnimatedStyle(() => {
    try {
      return {
        opacity: categoryChipsOpacity.value,
      };
    } catch {
      return { opacity: 0 };
    }
  });

  const contentFadeStyle = useAnimatedStyle(() => {
    return {
      opacity: contentFadeAnim.value,
    };
  });


  // Handlers for new sections
  const handleCuisinePress = useCallback((cuisine: any) => {
    // Open category drawer for this cuisine instead of foodCreator sheet
    setSelectedCuisineCategory(cuisine);
    setActiveDrawer("cuisineCategory");
  }, []);

  const handleFeaturedFoodCreatorPress = useCallback((foodCreator: any) => {
    setSelectedFoodCreator(foodCreator);
    setIsFoodCreatorScreenVisible(true);
  }, []);

  // Map handlers
  const handleMapToggle = useCallback(() => {
    setIsMapVisible(!isMapVisible);
  }, [isMapVisible]);

  const handleMapFoodCreatorSelect = useCallback((foodCreator: FoodCreatorMarker) => {
    // Convert FoodCreatorMarker to foodCreator format for existing handler
    const foodCreatorData = {
      id: foodCreator.id,
      name: foodCreator.foodCreator_name,
      cuisine: foodCreator.cuisine,
      deliveryTime: foodCreator.delivery_time,
      distance: foodCreator.distance,
      image: foodCreator.image_url || "https://avatar.iran.liara.run/public/44",
      sentiment: foodCreator.sentiment,
    };
    setSelectedFoodCreator(foodCreatorData);
    setIsFoodCreatorScreenVisible(true);
    setIsMapVisible(false); // Close map when selecting a foodCreator
  }, []);

  const handleMapDirections = useCallback(async (foodCreator: FoodCreatorMarker) => {
    if (!locationState.location || !foodCreator.location) {
      showError('Location Required', 'Please enable location services to get directions.');
      return;
    }

    try {
      const directions = await getDirections(locationState.location, foodCreator.location, 'driving');

      if (directions.success) {
        const route = directions.data.routes[0];
        showInfo(
          `Distance: ${route.distance.text}\nDuration: ${route.duration.text}`,
          `Directions to ${foodCreator.foodCreator_name}`
        );
      }
    } catch (error) {
      console.error('Directions error:', error);
      showError('Directions Error', 'Failed to get directions. Please try again.');
    }
  }, [locationState.location]);

  // Initialize map food creators with real data from API
  const { getNearbyFoodCreators: getNearbyFoodCreatorsFromHook } = useFoodCreators();
  useEffect(() => {
    const loadNearbyFoodCreators = async () => {
      // Don't load if no user location available
      if (!locationState.location) {
        setMapFoodCreators([]);
        isFirstMapLoad.current = false;
        return;
      }

      try {
        const result = await getNearbyFoodCreatorsFromHook({
          latitude: locationState.location.latitude,
          longitude: locationState.location.longitude,
          radius: 5,
          limit: 20,
          page: 1,
        });

        if (result.success && result.data) {
          setMapFoodCreators(result.data.foodCreators || []);

          // Map updated silently - no toast needed
        }

        // Mark that initial load is complete
        isFirstMapLoad.current = false;
      } catch (error) {
        console.error('Failed to load nearby food creators:', error);
        // Fallback to empty array on error - no toast needed, UI will show empty state
        setMapFoodCreators([]);
        // Mark initial load as complete even on error
        isFirstMapLoad.current = false;
      }
    };

    if (isAuthenticated) {
      loadNearbyFoodCreators();
    }
  }, [isAuthenticated, locationState.location, isMapVisible, getNearbyFoodCreatorsFromHook]);

  const handleMealPress = useCallback((meal: any) => {
    // Ensure we have a valid meal ID - use _id if id is missing
    const mealId = meal.id || meal._id || meal.mealId || `meal-${Date.now()}`;

    // MealItemDetails will fetch the data itself using the mealId
    // Only pass minimal data if available for initial render
    const mealData = meal.name || meal.foodCreator ? {
      title: meal.name || 'Unknown Meal',
      description: meal.description || `Delicious ${meal.name || 'meal'} from ${meal.foodCreator || 'Unknown FoodCreator'}.`,
      imageUrl: meal.image?.uri || meal.image_url || meal.image,
      foodCreatorName: meal.foodCreator || meal.foodCreatorName || 'Unknown FoodCreator',
    } : undefined;

    // Always open meal details modal - MealItemDetails will fetch full data
    setSelectedMeal({ id: mealId, data: mealData });
    setIsMealDetailsVisible(true);
  }, []);

  // Handler for adding a single item from OrderAgainSection
  const handleAddItemFromOrderAgain = useCallback(async (itemId: string) => {
    try {
      await addToCartAction(itemId, 1);
    } catch (error) {
      // Error handling is done in the hook
    }
  }, [addToCartAction]);

  // Handler for adding entire order from OrderAgainSection
  const handleAddEntireOrderFromOrderAgain = useCallback(async (orderId: string) => {
    try {
      await addOrderToCart(orderId);
    } catch (error) {
      // Error handling is done in the hook
    }
  }, [addOrderToCart]);


  const handleSimilarMealPress = useCallback((mealId: string) => {
    // Update selected meal with new mealId - MealItemDetails will automatically fetch the data
    setSelectedMeal({ id: mealId, data: undefined });
    // Ensure modal is visible (in case it was closed)
    setIsMealDetailsVisible(true);
  }, []);

  const handleOfferPress = useCallback((offer: any) => {
    // In a real app, this would navigate to offer details
  }, []);

  // Category drawer handlers
  const handleOpenTakeawayDrawer = useCallback(() => {
    setActiveDrawer("takeaway");
  }, []);

  const handleOpenTooFreshDrawer = useCallback(() => {
    setActiveDrawer("tooFresh");
  }, []);

  const handleOpenTopKebabsDrawer = useCallback(() => {
    setActiveDrawer("topKebabs");
  }, []);

  const handleOpenFeaturedFoodCreatorsDrawer = useCallback(() => {
    setActiveDrawer("featuredFoodCreators");
  }, []);

  const handleOpenPopularMealsDrawer = useCallback(() => {
    setActiveDrawer("popularMeals");
  }, []);

  const handleOpenSustainabilityDrawer = useCallback(() => {
    setActiveDrawer("sustainability");
  }, []);

  const handleOpenSpecialOffersDrawer = useCallback(() => {
    setActiveDrawer("specialOffers");
  }, []);

  const handleOpenCuisineCategoriesDrawer = useCallback(() => {
    setActiveDrawer("cuisineCategories");
  }, []);

  const handleOpenCuisinesDrawer = useCallback(() => {
    setActiveDrawer("cuisines");
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setActiveDrawer(null);
    setSelectedCuisineCategory(null);
  }, []);

  // Sign-in handlers
  const handleSignInPress = useCallback(() => {
    navigateToSignIn();
  }, []);

  const handleSessionExpiredRelogin = useCallback(() => {
    clearSessionExpired();
    navigateToSignIn();
  }, [clearSessionExpired]);

  // FoodCreator Main Screen handlers
  const handleCloseFoodCreatorScreen = useCallback(() => {
    setIsFoodCreatorScreenVisible(false);
    setSelectedFoodCreator(null);
  }, []);

  const handleFoodCreatorCartPress = useCallback(() => {
    // In a real app, this would navigate to cart
  }, []);

  const handleFoodCreatorHeartPress = useCallback(() => {
    // In a real app, this would toggle favorite
  }, []);

  const handleFoodCreatorSearchPress = useCallback(() => {
    // In a real app, this would open search
  }, []);

  // Handle foodCreator name press from meal details
  const handleFoodCreatorNamePressFromMeal = useCallback((foodCreatorName: string, foodCreatorId?: string, foodcreatorId?: string) => {
    // Try to find foodCreator in foodCreators data by name or ID
    const foundFoodCreator = foodCreators.find(k =>
      k.name === foodCreatorName ||
      k.name === `${foodCreatorName}'s FoodCreator` ||
      k.id === foodCreatorId
    );

    // Create foodCreator object with all necessary properties
    const foodCreator: any = foundFoodCreator
      ? {
        ...foundFoodCreator,
        foodCreatorId: foodCreatorId || foundFoodCreator.id,
        foodcreatorId: foodcreatorId,
        ownerId: foodcreatorId,
        userId: foodcreatorId,
      }
      : {
        id: foodCreatorId || `foodCreator-${foodCreatorName.toLowerCase().replace(/\s+/g, '-')}`,
        name: foodCreatorName,
        cuisine: "Nigerian",
        deliveryTime: "30-45 Mins",
        distance: "0.8 km",
        image: undefined,
        sentiment: "elite" as const,
        foodCreatorId: foodCreatorId,
        foodcreatorId: foodcreatorId,
        ownerId: foodcreatorId,
        userId: foodcreatorId,
      };

    setSelectedFoodCreator(foodCreator);
    setIsFoodCreatorScreenVisible(true);
    // Close meal details modal
    setIsMealDetailsVisible(false);
  }, [foodCreators]);

  const handleDrawerAddToCart = useCallback(
    async (id: string) => {
      // Prevent rapid clicks
      if (isAddingToCart) return;

      // Check authentication and token validity
      if (!isAuthenticated || !token) {
        showWarning(
          "Authentication Required",
          "Please sign in to add items to cart"
        );
        navigateToSignIn();
        return;
      }

      // Check if token is expired and refresh auth state if needed
      const isExpired = checkTokenExpiration();
      if (isExpired) {
        // Refresh auth state to update isAuthenticated
        await refreshAuthState();
        showWarning(
          "Session Expired",
          "Please sign in again to add items to cart"
        );
        navigateToSignIn();
        return;
      }

      try {
        setIsAddingToCart(true);
        const result = await addToCartAction(id, 1);

        if (result.success) {
          showSuccess("Added to Cart!", result.data.item?.name || "Item");
          // Refetch cart to update UI
          await refetchCart();
        }
      } catch {
        showError("Failed to add item to cart", "Please try again");
      } finally {
        setIsAddingToCart(false);
      }
    },
    [isAuthenticated, token, checkTokenExpiration, refreshAuthState, addToCartAction, refetchCart, isAddingToCart]
  );

  const handleDrawerItemPress = useCallback((id: string) => {
    // Navigate to meal details when a meal item is clicked
    if (id) {
      handleMealPress({ id, name: '', price: 0, foodCreator: '', image: undefined });
    }
  }, [handleMealPress]);

  // Pull trigger visibility is now handled inline in the ScrollView content

  // Performance monitoring integration
  const { PerformanceMonitor, getPerformanceConfig } =
    usePerformanceOptimizations();
  const performanceConfigRef = useRef(getPerformanceConfig());

  // Update ordered sections with hidden sections (memoized computation)
  const orderedSectionsMemoized = useMemo(() => {
    const timeContext = getCurrentTimeContext();
    const context: OrderingContext = {
      timeContext,
      userBehavior,
      currentLocation: locationState.location ? {
        latitude: locationState.location.latitude,
        longitude: locationState.location.longitude,
      } : undefined, // Use real location from locationState
      weather: weatherData?.success && weatherData.data
        ? {
          condition: weatherData.data.condition,
          temperature: weatherData.data.temperature,
        }
        : undefined, // Use real weather data from API
      appState: "active",
    };
    return getOrderedSectionsWithHidden(context);
  }, [userBehavior, locationState.location, weatherData?.success, weatherData?.data]);

  // Update ordered sections state only when memoized value changes
  useEffect(() => {
    setOrderedSections(orderedSectionsMemoized);
    // Update periodically but less frequently (every 10 minutes instead of 5)
    const interval = setInterval(() => {
      const timeContext = getCurrentTimeContext();
      const context: OrderingContext = {
        timeContext,
        userBehavior,
        currentLocation: locationState.location ? {
          latitude: locationState.location.latitude,
          longitude: locationState.location.longitude,
        } : undefined, // Use real location from locationState
        weather: weatherData?.success && weatherData.data
          ? {
            condition: weatherData.data.condition,
            temperature: weatherData.data.temperature,
          }
          : undefined, // Use real weather data from API
        appState: "active",
      };
      const sections = getOrderedSectionsWithHidden(context);
      setOrderedSections(sections);
    }, 10 * 60 * 1000); // Update every 10 minutes

    return () => clearInterval(interval);
  }, [orderedSectionsMemoized, userBehavior, locationState.location, weatherData?.success, weatherData?.data]);

  // Update performance config periodically (reduced frequency for better performance)
  useEffect(() => {
    const updateConfig = () => {
      performanceConfigRef.current = getPerformanceConfig();
    };

    // Update every 30 seconds instead of 2 seconds to reduce overhead
    const interval = setInterval(updateConfig, 30000);

    return () => clearInterval(interval);
  }, [getPerformanceConfig]);


  return (
    <View style={{ flex: 1 }}>
      {/* Performance Monitor - tracks FPS and optimizes accordingly */}
      <PerformanceMonitor
        isActive={false} // Monitor performance as needed
        sampleInterval={1000}
      />

      {/* Multi-Step Loader - positioned at root level to appear above everything */}
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={showLoader}
        duration={2000}
        loop={false}
      />

      <LinearGradient
        colors={["#f8e6f0", "#faf2e8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Sticky Header - positioned above normal header */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 1000,
              // Ensure sticky header is interactive when sticky, with safety fallback
              pointerEvents: isHeaderSticky ? "auto" : "none",
            },
            stickyHeaderStyle,
          ]}
        >
          <Header isSticky={true} userName={user?.name} onNotificationsPress={() => setIsNotificationsSheetVisible(true)} />
        </Animated.View>

        {/* Normal Header - positioned below sticky header */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              zIndex: 999,
              // Ensure normal header is interactive when not sticky
              // Safety: if sticky state is undefined/null, default to interactive
              pointerEvents: !isHeaderSticky ? "auto" : "none",
            },
            normalHeaderStyle,
          ]}
        >
          <Header isSticky={false} userName={user?.name} onNotificationsPress={() => setIsNotificationsSheetVisible(true)} />
        </Animated.View>

        {/* Category Filter Chips - positioned right under sticky header */}
        <Animated.View
          style={[
            {
              position: "absolute",
              top: 89,
              left: 0,
              right: 0,
              zIndex: 999,
            },
            categoryChipsStyle,
          ]}
        >
          {activeHeaderTab === "for-you" ? (
            <CategoryFilterChips />
          ) : (
            <NoshHeavenFilterChips
              activeCategory={noshHeavenCategory}
              onCategoryChange={setNoshHeavenCategory}
            />
          )}
        </Animated.View>

        {activeHeaderTab === "for-you" ? (
          <Animated.ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            bounces={true}
            alwaysBounceVertical={true}
            maintainVisibleContentPosition={{
              minIndexForVisible: 0,
            }}
            contentContainerStyle={{
              paddingBottom: 300, // Increased padding for better bottom spacing
              paddingTop: 282, // Fixed padding for header height (header is absolutely positioned)
            }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FF3B30"
                colors={["#FF3B30"]}
                progressBackgroundColor="rgba(255, 255, 255, 0.8)"
                progressViewOffset={0}
                title="Pull to refresh"
                titleColor="#FF3B30"
              />
            }
            onScroll={scrollHandler}
            scrollEventThrottle={8}
            onLayout={() => {
              // CRITICAL: Ensure hasInitialLoadCompleted stays true on layout
              // This prevents skeletons from showing when layout changes
              if (hasInitialLoadCompletedRef.current) {
                setHasInitialLoadCompleted(true);
              }

              // Use consolidated restore function instead of duplicate logic
              // Only restore if not already restoring and conditions are met
              if (
                !isRestoringScrollPositionRef.current &&
                savedScrollPositionRef.current !== null &&
                savedScrollPositionRef.current !== Number.MAX_SAFE_INTEGER &&
                !isNavigatingRef.current
              ) {
                restoreScrollPosition();
              }
            }}
          >
            {/* Main Content with fade animation */}
            <Animated.View style={contentFadeStyle}>
              {/* Notices Section */}
              <NoticesSection />
              {!isAuthenticated && !authLoading && (
                <NotLoggedInNotice onSignInPress={handleSignInPress} />
              )}

              {/* Loading indicators for API data */}
              {(cuisinesLoading || foodCreatorsLoading || mealsLoading) && isAuthenticated && (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text style={{ color: "#666", fontSize: 16 }}>
                    Loading fresh content...
                  </Text>
                </View>
              )}

              {/* Error handling for API data - only show if there's an error AND no data */}
              {(cuisinesError || foodCreatorsError || mealsError) &&
                isAuthenticated &&
                !cuisinesLoading &&
                !foodCreatorsLoading &&
                !mealsLoading &&
                !cuisinesData &&
                !foodCreatorsData &&
                !popularMealsData && (
                  <View style={{ padding: 20, alignItems: "center" }}>
                    <Text style={{ color: "#FF3B30", fontSize: 16 }}>
                      Failed to load content. Pull to refresh.
                    </Text>
                  </View>
                )}

              {/* <SharedOrderingButton /> */}

              {/* OrderAgainSection - Always render to maintain hook consistency */}
              {/* The component itself handles visibility based on activeCategoryFilter */}
              {/* OrderAgainSection - Always render to maintain hook consistency */}
              {/* The component itself handles visibility based on activeCategoryFilter */}
              {isFeatureEnabled('mobile_order_again_section') && (
                <OrderAgainSection
                  isHeaderSticky={isHeaderSticky}
                  isAuthenticated={isAuthenticated}
                  shouldShow={activeCategoryFilter === 'all'}
                  hasInitialLoadCompleted={hasInitialLoadCompleted}
                  onAddItem={handleAddItemFromOrderAgain}
                  onAddEntireOrder={handleAddEntireOrderFromOrderAgain}
                />
              )}

              {/* Conditional Rendering: Normal View vs Filtered View */}
              {activeCategoryFilter === 'all' ? (
                // Normal View - Show all sections when filter is 'all'
                <>
                  {isFeatureEnabled('mobile_cuisines_section') && (
                    <CuisinesSection
                      onCuisinePress={handleCuisinePress}
                      onSeeAllPress={handleOpenCuisinesDrawer}
                      hasInitialLoadCompleted={hasInitialLoadCompleted}
                      isFirstSection={firstSectionId === 'cuisines'}
                    />
                  )}
                  {isFeatureEnabled('mobile_cuisine_categories_section') && (
                    <CuisineCategoriesSection
                      onCuisinePress={handleCuisinePress}
                      onSeeAllPress={handleOpenCuisineCategoriesDrawer}
                      useBackend={true}
                      hasInitialLoadCompleted={hasInitialLoadCompleted}
                      isFirstSection={firstSectionId === 'cuisineCategories'}
                    />
                  )}
                  {isFeatureEnabled('mobile_featured_foodCreators_section') && (
                    <FeaturedFoodCreatorsSection
                      onFoodCreatorPress={handleFeaturedFoodCreatorPress}
                      onSeeAllPress={handleOpenFeaturedFoodCreatorsDrawer}
                      useBackend={true}
                      hasInitialLoadCompleted={hasInitialLoadCompleted}
                      isFirstSection={firstSectionId === 'featuredFoodCreators'}
                    />
                  )}
                  {isFeatureEnabled('mobile_popular_meals_section') && (
                    <PopularMealsSection
                      onMealPress={handleMealPress}
                      onSeeAllPress={handleOpenPopularMealsDrawer}
                      hasInitialLoadCompleted={hasInitialLoadCompleted}
                      isFirstSection={firstSectionId === 'popularMeals'}
                    />
                  )}

                  {/* Recommended For You Section */}
                  <RecommendedMealsSection
                    onMealPress={handleMealPress}
                    limit={8}
                    hasInitialLoadCompleted={hasInitialLoadCompleted}
                    isFirstSection={firstSectionId === 'recommendedMeals'}
                  />

                  {/* Hidden Sections - dynamically shown based on conditions */}
                  {orderedSections.some((section) => section.isHidden) && (
                    <HiddenSections
                      userBehavior={userBehavior}
                      hasInitialLoadCompleted={hasInitialLoadCompleted}
                      isFirstSection={firstSectionId === 'hiddenSections'}
                    />
                  )}

                  {isFeatureEnabled('mobile_special_offers_section') && (
                    <SpecialOffersSection
                      onOfferPress={handleOfferPress}
                      onSeeAllPress={handleOpenSpecialOffersDrawer}
                      hasInitialLoadCompleted={hasInitialLoadCompleted}
                      isFirstSection={firstSectionId === 'specialOffers'}
                    />
                  )}
                  {isFeatureEnabled('mobile_foodCreators_near_me') && (
                    <FoodCreatorsNearMe
                      onFoodCreatorPress={handleFeaturedFoodCreatorPress}
                      onMapPress={handleMapToggle}
                      hasInitialLoadCompleted={hasInitialLoadCompleted}
                      isFirstSection={firstSectionId === 'foodCreatorsNearMe'}
                    />
                  )}
                  {isFeatureEnabled('mobile_top_kebabs') && (
                    <TopKebabs
                      onOpenDrawer={handleOpenTopKebabsDrawer}
                      hasInitialLoadCompleted={hasInitialLoadCompleted}
                      isFirstSection={firstSectionId === 'topKebabs'}
                      onKebabPress={(kebab) => {
                        // Filter by kebab cuisine
                        handleCuisinePress({ id: kebab.id, name: kebab.name, image: kebab.image });
                      }}
                    />
                  )}
                  {isFeatureEnabled('mobile_takeaways') && (
                    <TakeAways
                      onOpenDrawer={handleOpenTakeawayDrawer}
                      hasInitialLoadCompleted={hasInitialLoadCompleted}
                      isFirstSection={firstSectionId === 'takeAways'}
                    />
                  )}
                  {isFeatureEnabled('mobile_too_fresh_to_waste') && (
                    <TooFreshToWaste
                      onOpenDrawer={handleOpenTooFreshDrawer}
                      onOpenSustainability={handleOpenSustainabilityDrawer}
                      hasInitialLoadCompleted={hasInitialLoadCompleted}
                      isFirstSection={firstSectionId === 'tooFreshToWaste'}
                      onItemPress={(item) => {
                        // Navigate to meal details from sustainability item
                        handleMealPress({ id: item.id, name: item.name, foodCreator: item.cuisine, price: '£0.00', image: { uri: item.image } });
                      }}
                    />
                  )}
                  {isFeatureEnabled('mobile_event_banner') && (
                    <EventBanner
                      onPress={() => router.push('/event-foodCreator-request')}
                      isFirstSection={firstSectionId === 'eventBanner'}
                    />
                  )}
                </>
              ) : (
                // Filtered View - Show only filtered sections when filter is active
                <>
                  {/* Filtered State Indicator */}
                  <View style={{
                    marginHorizontal: 16,
                    marginBottom: 16,
                    marginTop: 8,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 12,
                    padding: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderWidth: 1,
                    borderColor: '#FF3B30',
                  }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
                      <Filter size={16} color="#FF3B30" style={{ marginRight: 8 }} />
                      <Text style={{
                        fontSize: 14,
                        fontWeight: '600',
                        color: '#1a1a1a',
                        textTransform: 'capitalize',
                      }}>
                        Showing {activeCategoryFilter} cuisine
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => setActiveCategoryFilter('all')}
                      style={{
                        padding: 4,
                        marginLeft: 8,
                      }}
                      activeOpacity={0.7}
                    >
                      <X size={18} color="#666666" />
                    </TouchableOpacity>
                  </View>

                  {/* Filtered Content - Continuous Section */}
                  {isAllSectionsEmpty ? (
                    <FilteredEmptyState
                      filterName={activeCategoryFilter}
                      onClearFilter={() => setActiveCategoryFilter('all')}
                      isFirstSection={firstSectionId === 'filteredEmptyState'}
                    />
                  ) : (
                    <View style={{ marginHorizontal: 12 }}>
                      {/* Continuous filtered content without section headers */}
                      {filteredCuisines.length > 0 && isFeatureEnabled('mobile_cuisine_categories_section') && (
                        <CuisineCategoriesSection
                          cuisines={filteredCuisines}
                          onCuisinePress={handleCuisinePress}
                          showTitle={false}
                          isLoading={cuisinesLoading}
                          hasInitialLoadCompleted={hasInitialLoadCompleted}
                          isFirstSection={firstSectionId === 'filteredCuisineCategories'}
                        />
                      )}
                      {filteredFoodCreators.length > 0 && isFeatureEnabled('mobile_featured_foodCreators_section') && (
                        <FeaturedFoodCreatorsSection
                          foodCreators={filteredFoodCreators}
                          onFoodCreatorPress={handleFeaturedFoodCreatorPress}
                          showTitle={false}
                          isLoading={foodCreatorsLoading}
                          hasInitialLoadCompleted={hasInitialLoadCompleted}
                          isFirstSection={firstSectionId === 'filteredFeaturedFoodCreators'}
                        />
                      )}
                      {filteredMeals.length > 0 && isFeatureEnabled('mobile_popular_meals_section') && (
                        <PopularMealsSection
                          meals={filteredMeals}
                          onMealPress={handleMealPress}
                          showTitle={false}
                          useBackend={false}
                          isLoading={mealsLoading}
                          hasInitialLoadCompleted={hasInitialLoadCompleted}
                          isFirstSection={firstSectionId === 'filteredPopularMeals'}
                        />
                      )}
                    </View>
                  )}
                </>
              )}

            </Animated.View>
          </Animated.ScrollView>
        ) : (
          <LiveContent
            scrollViewRef={scrollViewRef}
            scrollY={scrollY}
            isHeaderSticky={isHeaderSticky}
            contentFadeAnim={contentFadeAnim}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onScroll={scrollHandler}
            activeCategory={noshHeavenCategory}
            onCategoryChange={setNoshHeavenCategory}
          />
        )}

        {/* Generating Suggestions Loader */}
        <GeneratingSuggestionsLoader
          isVisible={isGeneratingSuggestions}
          onComplete={handleGeneratingSuggestionsComplete}
        />

        {/* AI Chat Drawer */}
        <AIChatDrawer isVisible={isChatVisible} onClose={handleCloseAIChat} />

        {/* Debug Shake Indicator removed */}

        {/* Shake to Eat Flow - Always mounted to detect sustained shakes */}
        {CONFIG.SHAKE_TO_EAT_ENABLED && (
          <ShakeToEatFlow
            isVisible={false} // Not used anymore - component auto-shows on sustained shake
            onClose={handleShakeToEatClose}
            onAIChatLaunch={handleShakeToEatLaunch}
            onStart={handleShakeToEatStart}
          />
        )}
      </LinearGradient>

      {/* Floating Action Button - Only show when authenticated */}
      {isAuthenticated && (
        <FloatingActionButton
          onCameraPress={() => setIsCameraVisible(true)}
          onRecipePress={() => setIsNoshHeavenPostModalVisible(true)}
        />
      )}

      {/* Bottom Search Drawer */}
      <BottomSearchDrawer
        onOpenAIChat={handleOpenAIChat}
        isAuthenticated={isAuthenticated}
        onMealPress={handleMealPress}
      />

      {/* Category Drawers */}
      <Modal
        visible={activeDrawer !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseDrawer}
        statusBarTranslucent={true}
        hardwareAccelerated={true}
      >
        {activeDrawer === "takeaway" && (
          <TakeawayCategoryDrawer
            categoryName="All Takeaway's"
            onBack={handleCloseDrawer}
            onAddToCart={handleDrawerAddToCart}
            onItemPress={handleDrawerItemPress}
          />
        )}
        {activeDrawer === "tooFresh" && (
          <TooFreshToWasteDrawer
            onBack={handleCloseDrawer}
            onAddToCart={handleDrawerAddToCart}
            onItemPress={handleDrawerItemPress}
          />
        )}
        {activeDrawer === "topKebabs" && (
          <CategoryFullDrawer
            categoryName="From Top Kebabs"
            categoryDescription="Discover the best kebabs from top-rated foodCreators in your area"
            onBack={handleCloseDrawer}
            filterChips={[
              { id: "italian", label: "Italian" },
              { id: "mexican", label: "Mexican" },
              { id: "french", label: "French" },
              { id: "turkish", label: "Turkish" },
            ]}
            activeFilters={topKebabsFilters}
            onFilterChange={handleTopKebabsFilterChange}
            showTabs={false}
          >
            <View
              style={{
                flex: 1,
                padding: 20,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{ fontSize: 18, color: "#094327", textAlign: "center" }}
              >
                Top Kebabs content will be displayed here with filtering options
              </Text>
            </View>
          </CategoryFullDrawer>
        )}
        {activeDrawer === "featuredFoodCreators" && (
          <FeaturedFoodCreatorsDrawer
            onBack={handleCloseDrawer}
            foodCreators={foodCreators}
            onFoodCreatorPress={handleFeaturedFoodCreatorPress}
            isLoading={foodCreatorsLoading}
            error={foodCreatorsError}
          />
        )}
        {activeDrawer === "popularMeals" && (
          <PopularMealsDrawer
            onBack={handleCloseDrawer}
            meals={meals}
            onMealPress={handleMealPress}
          />
        )}
        {activeDrawer === "sustainability" && (
          <SustainabilityDrawer onBack={handleCloseDrawer} />
        )}
        {activeDrawer === "specialOffers" && (
          <SpecialOffersDrawer
            onBack={handleCloseDrawer}
            offers={offers}
            onOfferPress={handleOfferPress}
          />
        )}
        {activeDrawer === "cuisineCategories" && (
          <CuisineCategoriesDrawer
            onBack={handleCloseDrawer}
            cuisines={cuisines}
            onCuisinePress={handleCuisinePress}
          />
        )}
        {activeDrawer === "cuisines" && (
          <CuisinesDrawer
            onBack={handleCloseDrawer}
            onCuisinePress={handleCuisinePress}
          />
        )}
        {activeDrawer === "cuisineCategory" && selectedCuisineCategory && (
          <CuisineCategoryDrawer
            cuisine={selectedCuisineCategory}
            onBack={handleCloseDrawer}
            onAddToCart={handleDrawerAddToCart}
            onItemPress={handleDrawerItemPress}
          />
        )}
      </Modal>

      {/* Add MealItemDetails Modal */}
      <Modal
        visible={isMealDetailsVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsMealDetailsVisible(false)}
        statusBarTranslucent={true}
        hardwareAccelerated={true}
      >
        {selectedMeal && (
          <MealItemDetails
            key={selectedMeal.id}
            mealId={selectedMeal.id}
            mealData={selectedMeal.data}
            onBack={() => setIsMealDetailsVisible(false)}
            onAddToCart={(mealId, quantity) => {
              // Handle add to cart logic here
              setIsMealDetailsVisible(false);
            }}
            onFoodCreatorNamePress={handleFoodCreatorNamePressFromMeal}
            onSimilarMealPress={handleSimilarMealPress}
          />
        )}
      </Modal>

      {/* Add SignIn Modal */}

      {/* Session Expired Modal */}
      <SessionExpiredModal
        isVisible={isSessionExpired}
        onRelogin={handleSessionExpiredRelogin}
      />

      {/* EAS Update Available Modal */}
      <UpdateAvailableModal
        isVisible={showUpdateModal}
        onUpdate={async () => {
          try {
            setShowUpdateModal(false);
            await Updates.reloadAsync();
          } catch (reloadError) {
            // If reload fails, the update will be applied on next app launch
            console.warn('Update reload failed, will apply on next launch:', reloadError);
            setShowUpdateModal(false);
          }
        }}
        onLater={() => {
          setShowUpdateModal(false);
          // Update will be applied on next app launch
        }}
      />

      {/* Add FoodCreatorScreen Modal */}
      <Modal
        visible={isFoodCreatorScreenVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseFoodCreatorScreen}
        statusBarTranslucent={true}
        hardwareAccelerated={true}
      >
        {selectedFoodCreator && (
          <FoodCreatorScreen
            foodCreatorName={selectedFoodCreator.name && selectedFoodCreator.name !== "Amara's FoodCreator" ? selectedFoodCreator.name : undefined}
            cuisine={selectedFoodCreator.cuisine}
            deliveryTime={selectedFoodCreator.deliveryTime}
            distance={selectedFoodCreator.distance}
            cartItems={cartData?.items?.length || 0}
            foodCreatorId={selectedFoodCreator.id || selectedFoodCreator.foodCreatorId}
            foodcreatorId={selectedFoodCreator.ownerId || selectedFoodCreator.foodcreatorId || selectedFoodCreator.userId}
            onCartPress={handleFoodCreatorCartPress}
            onHeartPress={handleFoodCreatorHeartPress}
            onSearchPress={handleFoodCreatorSearchPress}
            onClose={handleCloseFoodCreatorScreen}
            onMealPress={handleMealPress}
          />
        )}
      </Modal>

      {/* Camera Modal */}
      <Modal
        visible={isCameraVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={() => setIsCameraVisible(false)}
        statusBarTranslucent={true}
        hardwareAccelerated={true}
      >
        <CameraModalScreen onClose={() => setIsCameraVisible(false)} />
      </Modal>

      {/* Map Bottom Sheet */}
      <MapBottomSheet
        isVisible={isMapVisible}
        onToggleVisibility={handleMapToggle}
        foodCreators={mapFoodCreators}
        onFoodCreatorSelect={handleMapFoodCreatorSelect}
        onGetDirections={handleMapDirections}
      />

      {/* Notifications Sheet */}
      <NotificationsSheet
        isVisible={isNotificationsSheetVisible}
        onClose={() => setIsNotificationsSheetVisible(false)}
      />

      {/* Nosh Heaven Post Modal */}
      <NoshHeavenPostModal
        isVisible={isNoshHeavenPostModalVisible}
        onClose={() => setIsNoshHeavenPostModalVisible(false)}
      />
    </View>
  );
}
