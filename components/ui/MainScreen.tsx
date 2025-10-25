import { useAppContext } from "@/utils/AppContext";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Modal, RefreshControl, Text, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useAuthContext } from "../../contexts/AuthContext";

import { ChefMarker } from "../../app/types/maps";
import { CONFIG } from "../../constants/config";
import { useUserLocation } from "../../hooks/useUserLocation";
import { getDirections, getNearbyChefs } from "../../utils/appleMapsService";
import { UserBehavior } from "../../utils/hiddenSections";
import {
  getCurrentTimeContext,
  getOrderedSectionsWithHidden,
  OrderingContext,
} from "../../utils/sectionOrdering";
import { NotLoggedInNotice } from "../NotLoggedInNotice";
import { AIChatDrawer } from "./AIChatDrawer";
import { BottomSearchDrawer } from "./BottomSearchDrawer";
import { CameraModalScreen } from "./CameraModalScreen";
import { CategoryFilterChips } from "./CategoryFilterChips";
import { CategoryFullDrawer } from "./CategoryFullDrawer";
import { CuisineCategoriesSection } from "./CuisineCategoriesSection";
import { CuisinesSection } from "./CuisinesSection";
import { NoshHeavenErrorBoundary } from "./ErrorBoundary";
import { EventBanner } from "./EventBanner";
import { FeaturedKitchensDrawer } from "./FeaturedKitchensDrawer";
import { FeaturedKitchensSection } from "./FeaturedKitchensSection";
import { FloatingActionButton } from "./FloatingActionButton";
import { GeneratingSuggestionsLoader } from "./GeneratingSuggestionsLoader";
import { Header } from "./Header";
import { HiddenSections } from "./HiddenSections";
import { KitchenMainScreen } from "./KitchenMainScreen";
import { KitchensNearMe } from "./KitchensNearMe";
import LiveContent from "./LiveContent";
import { MapBottomSheet } from "./MapBottomSheet";
import { MealItemDetails } from "./MealItemDetails";
import { MultiStepLoader } from "./MultiStepLoader";
import { MealData, NoshHeavenPlayer } from "./NoshHeavenPlayer";
import { OrderAgainSection } from "./OrderAgainSection";
import { usePerformanceOptimizations } from "./PerformanceMonitor";
import { PopularMealsDrawer } from "./PopularMealsDrawer";
import { PopularMealsSection } from "./PopularMealsSection";
import { PullToNoshHeavenTrigger } from "./PullToNoshHeavenTrigger";
import { SessionExpiredModal } from "./SessionExpiredModal";
// import { ShakeDebugger } from './ShakeDebugger';
import { ShakeToEatFlow } from "./ShakeToEatFlow";
import { SpecialOffersSection } from "./SpecialOffersSection";
import { SustainabilityDrawer } from "./SustainabilityDrawer";
import { TakeawayCategoryDrawer } from "./TakeawayCategoryDrawer";
import { TakeAways } from "./TakeAways";
import { TooFreshToWaste } from "./TooFreshToWaste";
import { TooFreshToWasteDrawer } from "./TooFreshToWasteDrawer";
import { TopKebabs } from "./TopKebabs";

// Customer API imports
import {
  useAddToCartMutation,
  useGetCartQuery,
  useGetCuisinesQuery,
  useGetPopularChefsQuery,
} from "../../app/store/customerApi";
import { Chef, Cuisine } from "../../app/types/customer";

// Global toast imports
import {
  showError,
  showInfo,
  showSuccess,
  showWarning,
} from "../../lib/GlobalToastManager";

// Mock data for Nosh Heaven meals
const mockMealData: MealData[] = [
  {
    id: "1",
    videoSource:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    title: "Nigerian Jollof Rice",
    description:
      "Authentic Nigerian Jollof Rice with perfectly seasoned long grain rice, tender chicken, and a blend of West African spices. Made with love by Chef Amara.",
    kitchenName: "Amara's Kitchen",
    price: "£16",
    chef: "Chef Amara Okonkwo",
    likes: 342,
    comments: 58,
  },
  {
    id: "2",
    videoSource:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    title: "Spicy Thai Green Curry",
    description:
      "Fresh and aromatic green curry with coconut milk, Thai basil, bamboo shoots, and your choice of protein. A true taste of Thailand.",
    kitchenName: "Bangkok Bites",
    price: "£14",
    chef: "Chef Siriporn Thanakit",
    likes: 567,
    comments: 89,
  },
  {
    id: "3",
    videoSource:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    title: "Mediterranean Lamb Tagine",
    description:
      "Slow-cooked lamb tagine with apricots, almonds, and warming Moroccan spices. Served with fluffy couscous and fresh herbs.",
    kitchenName: "Marrakech Delights",
    price: "£22",
    chef: "Chef Hassan El Mansouri",
    likes: 289,
    comments: 34,
  },
  {
    id: "4",
    videoSource:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    title: "Korean BBQ Bulgogi",
    description:
      "Marinated Korean beef bulgogi with jasmine rice, kimchi, and banchan sides. Grilled to perfection with a sweet and savory glaze.",
    kitchenName: "Seoul Street",
    price: "£18",
    chef: "Chef Min-jun Park",
    likes: 445,
    comments: 72,
  },
  {
    id: "5",
    videoSource:
      "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    title: "Italian Truffle Risotto",
    description:
      "Creamy Arborio rice risotto with black truffle shavings, wild mushrooms, and aged Parmesan. A luxurious comfort food experience.",
    kitchenName: "Nonna's Table",
    price: "£25",
    chef: "Chef Giuseppe Rossi",
    likes: 378,
    comments: 91,
  },
];

// Mock data for new sections
const mockCuisines = [
  {
    id: "1",
    name: "Nigerian",
    image: {
      uri: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=400&fit=crop",
    },
    restaurantCount: 24,
    isActive: true,
  },
  {
    id: "2",
    name: "Italian",
    image: {
      uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
    },
    restaurantCount: 18,
    isActive: false,
  },
  {
    id: "3",
    name: "Chinese",
    image: {
      uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop",
    },
    restaurantCount: 15,
    isActive: false,
  },
  {
    id: "4",
    name: "Indian",
    image: {
      uri: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop",
    },
    restaurantCount: 12,
    isActive: false,
  },
];

const mockKitchens: {
  id: string;
  name: string;
  cuisine: string;
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
  deliveryTime: string;
  distance: string;
  image: any;
  isLive?: boolean;
  liveViewers?: number;
}[] = [
  {
    id: "1",
    name: "Amara's Kitchen",
    cuisine: "Nigerian",
    sentiment: "elite",
    deliveryTime: "25 min",
    distance: "0.8 mi",
    image: {
      uri: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop",
    },
    isLive: true,
    liveViewers: 156,
  },
  {
    id: "2",
    name: "Bangkok Bites",
    cuisine: "Thai",
    sentiment: "fire",
    deliveryTime: "30 min",
    distance: "1.2 mi",
    image: {
      uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    isLive: false,
  },
  {
    id: "3",
    name: "Marrakech Delights",
    cuisine: "Moroccan",
    sentiment: "slaps",
    deliveryTime: "35 min",
    distance: "1.5 mi",
    image: {
      uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    isLive: true,
    liveViewers: 89,
  },
  {
    id: "4",
    name: "Seoul Street",
    cuisine: "Korean",
    sentiment: "solid",
    deliveryTime: "28 min",
    distance: "1.0 mi",
    image: {
      uri: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
    },
    isLive: false,
  },
  {
    id: "5",
    name: "Nonna's Table",
    cuisine: "Italian",
    sentiment: "bussing",
    deliveryTime: "32 min",
    distance: "1.3 mi",
    image: {
      uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    isLive: false,
  },
  {
    id: "6",
    name: "Tokyo Dreams",
    cuisine: "Japanese",
    sentiment: "decent",
    deliveryTime: "22 min",
    distance: "0.6 mi",
    image: {
      uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    isLive: true,
    liveViewers: 234,
  },
  {
    id: "7",
    name: "Mumbai Spice",
    cuisine: "Indian",
    sentiment: "average",
    deliveryTime: "40 min",
    distance: "1.8 mi",
    image: {
      uri: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
    },
    isLive: false,
  },
  {
    id: "8",
    name: "Parisian Bistro",
    cuisine: "French",
    sentiment: "mid",
    deliveryTime: "45 min",
    distance: "2.1 mi",
    image: {
      uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    isLive: true,
    liveViewers: 67,
  },
];

const mockMeals: {
  id: string;
  name: string;
  kitchen: string;
  price: string;
  originalPrice?: string;
  image: any;
  isPopular?: boolean;
  isNew?: boolean;
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
  deliveryTime: string;
}[] = [
  {
    id: "1",
    name: "Jollof Rice",
    kitchen: "Amara's Kitchen",
    price: "£12",
    originalPrice: "£15",
    image: {
      uri: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop",
    },
    isPopular: true,
    sentiment: "elite",
    deliveryTime: "25 min",
  },
  {
    id: "2",
    name: "Green Curry",
    kitchen: "Bangkok Bites",
    price: "£14",
    image: {
      uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    isNew: true,
    sentiment: "fire",
    deliveryTime: "30 min",
  },
  {
    id: "3",
    name: "Lamb Tagine",
    kitchen: "Marrakech Delights",
    price: "£18",
    image: {
      uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    isPopular: true,
    sentiment: "slaps",
    deliveryTime: "35 min",
  },
  {
    id: "4",
    name: "Bulgogi Bowl",
    kitchen: "Seoul Street",
    price: "£16",
    image: {
      uri: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
    },
    sentiment: "solid",
    deliveryTime: "28 min",
  },
  {
    id: "5",
    name: "Truffle Risotto",
    kitchen: "Nonna's Table",
    price: "£22",
    image: {
      uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    isPopular: true,
    sentiment: "bussing",
    deliveryTime: "32 min",
  },
  {
    id: "6",
    name: "Sushi Platter",
    kitchen: "Tokyo Dreams",
    price: "£25",
    image: {
      uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    isNew: true,
    sentiment: "decent",
    deliveryTime: "22 min",
  },
  {
    id: "7",
    name: "Pounded Yam",
    kitchen: "Amara's Kitchen",
    price: "£10",
    image: {
      uri: "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop",
    },
    sentiment: "average",
    deliveryTime: "25 min",
  },
  {
    id: "8",
    name: "Pad Thai",
    kitchen: "Bangkok Bites",
    price: "£13",
    image: {
      uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    sentiment: "mid",
    deliveryTime: "30 min",
  },
  {
    id: "9",
    name: "Butter Chicken",
    kitchen: "Mumbai Spice",
    price: "£15",
    image: {
      uri: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
    },
    isPopular: true,
    sentiment: "meh",
    deliveryTime: "40 min",
  },
  {
    id: "10",
    name: "Coq au Vin",
    kitchen: "Parisian Bistro",
    price: "£20",
    image: {
      uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    sentiment: "notIt",
    deliveryTime: "45 min",
  },
];

const mockOffers = [
  {
    id: "1",
    title: "First Order Discount",
    description: "Get 20% off your first order from any kitchen",
    discount: "20%",
    image: {
      uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    validUntil: "Dec 31, 2024",
    isLimited: true,
    remainingTime: "2 days left",
  },
  {
    id: "2",
    title: "Weekend Special",
    description: "Free delivery on orders over £25 this weekend",
    discount: "Free Delivery",
    image: {
      uri: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop",
    },
    validUntil: "Dec 15, 2024",
    remainingTime: "5 days left",
  },
  {
    id: "3",
    title: "Lunch Rush",
    description: "15% off all lunch orders between 12-2 PM",
    discount: "15%",
    image: {
      uri: "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop",
    },
    validUntil: "Dec 20, 2024",
    isLimited: true,
    remainingTime: "1 day left",
  },
];

export function MainScreen() {
  const { activeHeaderTab, registerScrollToTopCallback } = useAppContext();
  const router = useRouter();
  const {
    isAuthenticated,
    isLoading: authLoading,
    user,
    isSessionExpired,
    clearSessionExpired,
    checkTokenExpiration,
  } = useAuthContext();

  // Customer API hooks
  const {
    data: cuisinesData,
    isLoading: cuisinesLoading,
    error: cuisinesError,
    refetch: refetchCuisines,
  } = useGetCuisinesQuery(
    { page: 1, limit: 20 },
    {
      skip: !isAuthenticated, // Only fetch when authenticated
    }
  );

  const {
    data: chefsData,
    isLoading: chefsLoading,
    error: chefsError,
    refetch: refetchChefs,
  } = useGetPopularChefsQuery(
    { page: 1, limit: 20 },
    {
      skip: !isAuthenticated, // Only fetch when authenticated
    }
  );

  const { error: cartError, refetch: refetchCart } = useGetCartQuery(
    undefined,
    {
      skip: !isAuthenticated, // Only fetch when authenticated
    }
  );

  const [addToCart] = useAddToCartMutation();

  // Location hook for map functionality
  const locationState = useUserLocation();

  // Data transformation functions
  const transformCuisinesData = useCallback((apiCuisines: Cuisine[]) => {
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

  const transformChefsData = useCallback((apiChefs: Chef[]) => {
    return apiChefs.map((chef) => ({
      id: chef.id,
      name: chef.kitchen_name,
      cuisine: chef.cuisine,
      sentiment: chef.sentiment,
      deliveryTime: chef.delivery_time,
      distance: chef.distance,
      image: {
        uri:
          chef.image_url ||
          "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop",
      },
      isLive: chef.is_live,
      liveViewers: chef.live_viewers,
    }));
  }, []);

  // Process API data
  const cuisines = useMemo(() => {
    if (cuisinesData?.success && cuisinesData.data) {
      const transformedData = transformCuisinesData(cuisinesData.data);
      // Show success toast when cuisines are loaded
      if (transformedData.length > 0) {
        showInfo(
          `Loaded ${transformedData.length} cuisines`,
          "Cuisines Updated"
        );
      }
      return transformedData;
    }
    return mockCuisines; // Fallback to mock data
  }, [cuisinesData, transformCuisinesData]);

  const kitchens = useMemo(() => {
    if (chefsData?.success && chefsData.data) {
      const transformedData = transformChefsData(chefsData.data);
      // Show success toast when chefs are loaded
      if (transformedData.length > 0) {
        showInfo(`Loaded ${transformedData.length} chefs`, "Chefs Updated");
      }
      return transformedData;
    }
    return mockKitchens; // Fallback to mock data
  }, [chefsData, transformChefsData]);

  // Cart data processing - removed unused variables

  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isGeneratingSuggestions, setIsGeneratingSuggestions] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showLoader, setShowLoader] = useState(false);

  // Handle API errors with toast notifications
  useEffect(() => {
    if (cuisinesError && isAuthenticated) {
      showError("Failed to load cuisines", "Please try again");
    }
  }, [cuisinesError, isAuthenticated]);

  useEffect(() => {
    if (chefsError && isAuthenticated) {
      showError("Failed to load chefs", "Please try again");
    }
  }, [chefsError, isAuthenticated]);

  useEffect(() => {
    if (cartError && isAuthenticated) {
      showError("Failed to load cart", "Please try again");
    }
  }, [cartError, isAuthenticated]);

  const [isNoshHeavenVisible, setIsNoshHeavenVisible] = useState(false);
  const [noshHeavenMeals, setNoshHeavenMeals] =
    useState<MealData[]>(mockMealData);

  // Category drawer state management
  const [activeDrawer, setActiveDrawer] = useState<
    | "takeaway"
    | "tooFresh"
    | "topKebabs"
    | "featuredKitchens"
    | "popularMeals"
    | "sustainability"
    | null
  >(null);

  // Shake to Eat state management
  // ShakeToEatFlow now handles its own visibility with sustained shake detection

  // Meal Details state management
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [isMealDetailsVisible, setIsMealDetailsVisible] = useState(false);

  // Kitchen Main Screen state management
  const [selectedKitchen, setSelectedKitchen] = useState<any>(null);
  const [isKitchenMainScreenVisible, setIsKitchenMainScreenVisible] =
    useState(false);

  // Sign-in modal state management

  // Camera modal state management
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  
  // Map state management
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [mapChefs, setMapChefs] = useState<ChefMarker[]>([]);

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
  const [userBehavior] = useState<UserBehavior>({
    totalOrders: 5,
    daysActive: 14,
    usualDinnerItems: [
      "Pizza Margherita",
      "Chicken Curry",
      "Pasta Carbonara",
      "Sushi Roll",
    ],
    favoriteSections: [
      "featured_kitchens",
      "popular_meals",
      "cuisine_categories",
    ],
    clickedSections: [
      "featured_kitchens",
      "popular_meals",
      "cuisine_categories",
    ],
    colleagueConnections: 3,
    playToWinHistory: {
      gamesPlayed: 2,
      gamesWon: 1,
      lastPlayed: new Date("2024-01-10T12:00:00"),
    },
    freeFoodPreferences: ["Pizza", "Burger", "Sushi"],
  });

  const scrollY = useSharedValue(0);
  const stickyHeaderOpacity = useSharedValue(0);
  const normalHeaderOpacity = useSharedValue(1);
  const categoryChipsOpacity = useSharedValue(0);
  const contentFadeAnim = useSharedValue(1);
  const isHeaderStickyShared = useSharedValue(false);
  const scrollViewRef = useRef<Animated.ScrollView>(null);

  // Enhanced pull-to-refresh state management
  const [showPullTrigger, setShowPullTrigger] = useState(false);

  const isScrolling = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollPosition = useRef(0);

  // Register scroll-to-top callback
  useEffect(() => {
    const scrollToTop = () => {
      if (scrollViewRef.current) {
        // Scroll to top with smooth animation
        scrollViewRef.current.scrollTo({ y: 0, animated: true });

        // Reset header to normal state with smooth animation
        setIsHeaderSticky(false);
        isHeaderStickyShared.value = false;

        // Use consistent animation timing for smooth transitions
        const animationDuration = 300;

        // Add a small delay to ensure scroll animation starts first
        setTimeout(() => {
          stickyHeaderOpacity.value = withTiming(0, {
            duration: animationDuration,
          });
          normalHeaderOpacity.value = withTiming(1, {
            duration: animationDuration,
          });
          categoryChipsOpacity.value = withTiming(0, {
            duration: animationDuration,
          });
        }, 50); // Small delay to ensure scroll starts first
      }
    };

    registerScrollToTopCallback(scrollToTop);
  }, [
    registerScrollToTopCallback,
    isHeaderStickyShared,
    stickyHeaderOpacity,
    normalHeaderOpacity,
    categoryChipsOpacity,
  ]);

  // Cleanup effect to reset states and prevent crashes
  useEffect(() => {
    return () => {
      // Comprehensive cleanup on unmount
      try {
        // Clear any pending timeouts
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
          scrollTimeoutRef.current = null;
        }

        // Reset states
        setShowPullTrigger(false);
        setIsNoshHeavenVisible(false);
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
  ]);

  // Reset states when Nosh Heaven closes
  useEffect(() => {
    if (!isNoshHeavenVisible) {
      // Use requestAnimationFrame to batch updates and prevent conflicts
      requestAnimationFrame(() => {
        setShowPullTrigger(false);
        lastScrollPosition.current = 0;
      });
    }
  }, [isNoshHeavenVisible]);

  // Enhanced cleanup for scroll timeout
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
        scrollTimeoutRef.current = null;
      }
    };
  }, []);

  const loadingStates = [
    {
      text: "Finding the best meals for you...",
      emotion: "excited" as const,
    },
    {
      text: "Preparing your fresh experience...",
      emotion: "hungry" as const,
    },
    {
      text: "Ready to serve!",
      emotion: "satisfied" as const,
    },
  ];

  const onRefresh = useCallback(async () => {
    // Show loader immediately without any delays
    setShowLoader(true);
    setRefreshing(true);

    // Fade out current content immediately
    contentFadeAnim.value = withTiming(0.3, { duration: 100 });

    try {
      // Refetch API data when authenticated
      if (isAuthenticated) {
        await Promise.all([refetchCuisines(), refetchChefs(), refetchCart()]);
      }

      // Simulate the loading process with artificial delay
      setTimeout(() => {
        setShowLoader(false);
        setRefreshing(false);

        // Fade in the content
        contentFadeAnim.value = withTiming(1, { duration: 300 });
      }, 2000); // Reduced to 2 seconds for better UX
    } catch {
      showError("Failed to refresh data", "Please try again");
      setShowLoader(false);
      setRefreshing(false);
      contentFadeAnim.value = withTiming(1, { duration: 300 });
    }
  }, [
    contentFadeAnim,
    isAuthenticated,
    refetchCuisines,
    refetchChefs,
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
          scrollY.value = event.contentOffset.y;

          // Simplified header sticky logic
          const shouldBeSticky = event.contentOffset.y > 30;

          if (shouldBeSticky !== isHeaderStickyShared.value) {
            isHeaderStickyShared.value = shouldBeSticky;
            runOnJS(setIsHeaderSticky)(shouldBeSticky);

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
    ]
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

  // Handle Nosh Heaven trigger - immediate execution
  const handleNoshHeavenTrigger = useCallback(() => {
    try {
      // Validate state before making changes
      if (isNoshHeavenVisible) {
        return; // Already visible, don't trigger again
      }

      // Immediate state updates for faster response
      setIsNoshHeavenVisible(true);
      setShowPullTrigger(false);
    } catch {
      // Reset to safe state immediately
      setIsNoshHeavenVisible(false);
      setShowPullTrigger(false);
    }
  }, [isNoshHeavenVisible]);

  // Handle Nosh Heaven close
  const handleNoshHeavenClose = useCallback(() => {
    try {
      // Batch all state updates together
      requestAnimationFrame(() => {
        setIsNoshHeavenVisible(false);

        // Safely scroll back to top
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      });
    } catch {
      // Reset to safe state
      requestAnimationFrame(() => {
        setIsNoshHeavenVisible(false);
      });
    }
  }, []);

  // Load more meals for Nosh Heaven
  const handleLoadMoreMeals = useCallback(() => {
    // In a real app, this would load from an API
    const moreMeals: MealData[] = [
      {
        id: `new-${Date.now()}`,
        videoSource:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
        title: "Fresh Sushi Platter",
        description:
          "Premium sushi selection with fresh salmon, tuna, and sea bream. Crafted by our master sushi chef.",
        kitchenName: "Tokyo Dreams",
        price: "£28",
        chef: "Chef Takeshi Yamamoto",
        likes: 234,
        comments: 67,
      },
    ];
    setNoshHeavenMeals((prev) => [...prev, ...moreMeals]);
  }, []);

  // Handle meal interactions
  const handleMealLike = useCallback((mealId: string) => {
    // In a real app, this would update the backend
  }, []);

  const handleMealComment = useCallback((mealId: string) => {
    // In a real app, this would open a comment modal
  }, []);

  const handleMealShare = useCallback((mealId: string) => {
    // In a real app, this would open share sheet
  }, []);

  const handleAddToCart = useCallback(
    async (mealId: string) => {
      if (!isAuthenticated) {
        showWarning(
          "Authentication Required",
          "Please sign in to add items to cart"
        );
        router.push("/sign-in");
        return;
      }

      try {
        const result = await addToCart({
          dish_id: mealId,
          quantity: 1,
          special_instructions: undefined,
        }).unwrap();

        if (result.success) {
          showSuccess("Added to Cart!", result.data.dish_name);
        }
      } catch {
        showError("Failed to add item to cart", "Please try again");
      }
    },
    [isAuthenticated, addToCart, router]
  );

  const handleKitchenPress = useCallback((kitchenName: string) => {
    // Create a mock kitchen based on the kitchen name
    const mockKitchen = {
      id: `kitchen-${kitchenName.toLowerCase().replace(/\s+/g, "-")}`,
      name: kitchenName,
      cuisine: "Authentic Cuisine",
      deliveryTime: "25-40 Mins",
      distance: "1.5km away",
      image: "https://avatar.iran.liara.run/public/44", // Default kitchen image
      sentiment: "fire" as const,
    };
    setSelectedKitchen(mockKitchen);
    setIsKitchenMainScreenVisible(true);
  }, []);

  // Handlers for new sections
  const handleCuisinePress = useCallback((cuisine: any) => {
    // Create a mock kitchen based on the cuisine
    const mockKitchen = {
      id: `cuisine-${cuisine.id}`,
      name: `${cuisine.name} Kitchen`,
      cuisine: `${cuisine.name} cuisine`,
      deliveryTime: "25-40 Mins",
      distance: "1.5km away",
      image: cuisine.image,
      sentiment: "fire" as const,
    };
    setSelectedKitchen(mockKitchen);
    setIsKitchenMainScreenVisible(true);
  }, []);

  const handleFeaturedKitchenPress = useCallback((kitchen: any) => {
    setSelectedKitchen(kitchen);
    setIsKitchenMainScreenVisible(true);
  }, []);

  // Map handlers
  const handleMapToggle = useCallback(() => {
    setIsMapVisible(!isMapVisible);
  }, [isMapVisible]);

  const handleMapChefSelect = useCallback((chef: ChefMarker) => {
    // Convert ChefMarker to kitchen format for existing handler
    const kitchenData = {
      id: chef.id,
      name: chef.kitchen_name,
      cuisine: chef.cuisine,
      deliveryTime: chef.delivery_time,
      distance: chef.distance,
      image: chef.image_url || "https://avatar.iran.liara.run/public/44",
      sentiment: chef.sentiment,
    };
    setSelectedKitchen(kitchenData);
    setIsKitchenMainScreenVisible(true);
    setIsMapVisible(false); // Close map when selecting a chef
  }, []);

  const handleMapDirections = useCallback(async (chef: ChefMarker) => {
    if (!locationState.location || !chef.location) {
      showError('Location Required', 'Please enable location services to get directions.');
      return;
    }

    try {
      const directions = await getDirections(locationState.location, chef.location, 'driving');
      
      if (directions.success) {
        const route = directions.data.routes[0];
        showInfo(
          `Distance: ${route.distance.text}\nDuration: ${route.duration.text}`,
          `Directions to ${chef.kitchen_name}`
        );
      }
    } catch (error) {
      console.error('Directions error:', error);
      showError('Directions Error', 'Failed to get directions. Please try again.');
    }
  }, [locationState.location]);

  // Initialize map chefs with real data from API
  useEffect(() => {
    const loadNearbyChefs = async () => {
      try {
        // Default to San Francisco coordinates if no user location
        const defaultLocation = { latitude: 37.7749, longitude: -122.4194 };
        
        // Try to get user location first
        let userLocation = defaultLocation;
        if (locationState.location) {
          userLocation = locationState.location;
        }
        
        const result = await getNearbyChefs(
          userLocation.latitude,
          userLocation.longitude,
          5, // 5km radius
          20, // limit to 20 chefs
          1 // first page
        );
        
        setMapChefs(result.chefs);
        showSuccess(`Loaded ${result.chefs.length} nearby chefs`, "Map Updated");
      } catch (error) {
        console.error('Failed to load nearby chefs:', error);
        showError('Failed to load chefs', 'Unable to load nearby chefs. Please try again.');
        // Fallback to empty array on error
        setMapChefs([]);
      }
    };

    if (isAuthenticated) {
      loadNearbyChefs();
    }
  }, [isAuthenticated, locationState.location]);

  const handleMealPress = useCallback((meal: any) => {
    // Convert meal data to MealItemDetails format
    const mealData = {
      title: meal.name,
      description: `Delicious ${meal.name} from ${meal.kitchen}. Experience authentic flavors crafted with the finest ingredients and traditional cooking methods.`,
      price: parseInt(meal.price.replace("£", "")) * 100, // Convert to cents
      imageUrl: meal.image?.uri,
      kitchenName: meal.kitchen,
      kitchenAvatar: undefined,
      calories: Math.floor(Math.random() * 500) + 300, // Random calories between 300-800
      fat: `${Math.floor(Math.random() * 20) + 5}g`,
      protein: `${Math.floor(Math.random() * 30) + 10}g`,
      carbs: `${Math.floor(Math.random() * 50) + 20}g`,
      dietCompatibility: Math.floor(Math.random() * 40) + 60, // Random percentage 60-100
      dietMessage: "Great choice for your current diet goals",
      ingredients: [
        { name: "Chicken breasts", quantity: "250 g" },
        {
          name: "Unsalted butter",
          quantity: "1 tbsp",
          isAllergen: true,
          allergenType: "dairy",
        },
        {
          name: "Sesame oil",
          quantity: "2 tsp",
          isAllergen: true,
          allergenType: "nuts",
        },
        { name: "Fresh ginger", quantity: "2 tsp" },
        {
          name: "Wheat flour",
          quantity: "100 g",
          isAllergen: true,
          allergenType: "gluten",
        },
      ],
      chefName: "Chef Stan",
      chefStory:
        "This Shawarma recipe has been perfected over 20 years of cooking. It combines traditional Middle Eastern spices with modern cooking techniques to create a dish that's both authentic and accessible.",
      chefTips: [
        "Best enjoyed hot and fresh - reheat for 2 minutes if needed",
        "Add extra garlic sauce for an authentic Middle Eastern taste",
        "Pair with our fresh mint tea for the complete experience",
        "Perfect for sharing - order extra pita bread on the side",
      ],
      similarMeals: [
        {
          id: "kebab-001",
          name: "Chicken Kebab",
          price: "£12.99",
          sentiment: "bussing",
          isVegetarian: false,
        },
        {
          id: "falafel-001",
          name: "Falafel Wrap",
          price: "£9.99",
          sentiment: "mid",
          isVegetarian: true,
        },
        {
          id: "hummus-001",
          name: "Hummus Plate",
          price: "£8.99",
          sentiment: "bussing",
          isVegetarian: true,
        },
      ],
    };

    setSelectedMeal({ id: meal.id, data: mealData });
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

  const handleOpenFeaturedKitchensDrawer = useCallback(() => {
    setActiveDrawer("featuredKitchens");
  }, []);

  const handleOpenPopularMealsDrawer = useCallback(() => {
    setActiveDrawer("popularMeals");
  }, []);

  const handleOpenSustainabilityDrawer = useCallback(() => {
    setActiveDrawer("sustainability");
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setActiveDrawer(null);
  }, []);

  // Sign-in handlers
  const handleSignInPress = useCallback(() => {
    router.push("/sign-in");
  }, [router]);

  const handleSessionExpiredRelogin = useCallback(() => {
    clearSessionExpired();
    router.push("/sign-in");
  }, [clearSessionExpired, router]);

  // Kitchen Main Screen handlers
  const handleCloseKitchenMainScreen = useCallback(() => {
    setIsKitchenMainScreenVisible(false);
    setSelectedKitchen(null);
  }, []);

  const handleKitchenCartPress = useCallback(() => {
    // In a real app, this would navigate to cart
  }, []);

  const handleKitchenHeartPress = useCallback(() => {
    // In a real app, this would toggle favorite
  }, []);

  const handleKitchenSearchPress = useCallback(() => {
    // In a real app, this would open search
  }, []);

  const handleDrawerAddToCart = useCallback(
    async (id: string) => {
      if (!isAuthenticated) {
        showWarning(
          "Authentication Required",
          "Please sign in to add items to cart"
        );
        router.push("/sign-in");
        return;
      }

      try {
        const result = await addToCart({
          dish_id: id,
          quantity: 1,
          special_instructions: undefined,
        }).unwrap();

        if (result.success) {
          showSuccess("Added to Cart!", result.data.dish_name);
        }
      } catch {
        showError("Failed to add item to cart", "Please try again");
      }
    },
    [isAuthenticated, addToCart, router]
  );

  const handleDrawerItemPress = useCallback((id: string) => {
    // In a real app, this would navigate to item details
  }, []);

  // Simplified pull trigger component - render immediately
  const pullTriggerComponent = showPullTrigger ? (
    <PullToNoshHeavenTrigger
      isVisible={true}
      onTrigger={handleNoshHeavenTrigger}
    />
  ) : null;

  // Performance monitoring integration
  const { PerformanceMonitor, getPerformanceConfig } =
    usePerformanceOptimizations();
  const performanceConfigRef = useRef(getPerformanceConfig());

  // Update ordered sections with hidden sections
  useEffect(() => {
    const updateOrderedSections = () => {
      const timeContext = getCurrentTimeContext();
      const context: OrderingContext = {
        timeContext,
        userBehavior,
        currentLocation: { latitude: 51.5074, longitude: -0.1278 }, // Mock location
        weather: { condition: "sunny", temperature: 22 }, // Mock weather
        appState: "active",
      };

      const sections = getOrderedSectionsWithHidden(context);
      setOrderedSections(sections);
    };

    updateOrderedSections();
    const interval = setInterval(updateOrderedSections, 5 * 60 * 1000); // Update every 5 minutes

    return () => clearInterval(interval);
  }, [userBehavior]);

  // Update performance config periodically
  useEffect(() => {
    const updateConfig = () => {
      performanceConfigRef.current = getPerformanceConfig();
    };

    const interval = setInterval(updateConfig, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [getPerformanceConfig]);

  // Performance-aware Nosh Heaven player with adaptive settings
  const noshHeavenPlayerComponent = useMemo(() => {
    if (!isNoshHeavenVisible || noshHeavenMeals.length === 0) return null;

    return (
      <NoshHeavenPlayer
        isVisible={isNoshHeavenVisible}
        meals={noshHeavenMeals}
        onClose={handleNoshHeavenClose}
        onLoadMore={handleLoadMoreMeals}
        onMealLike={handleMealLike}
        onMealComment={handleMealComment}
        onMealShare={handleMealShare}
        onAddToCart={handleAddToCart}
        onKitchenPress={handleKitchenPress}
      />
    );
  }, [
    isNoshHeavenVisible,
    noshHeavenMeals, // Use full array for proper memoization
    handleNoshHeavenClose,
    handleLoadMoreMeals,
    handleMealLike,
    handleMealComment,
    handleMealShare,
    handleAddToCart,
    handleKitchenPress,
  ]);

  return (
    <View style={{ flex: 1 }}>
      {/* Performance Monitor - tracks FPS and optimizes accordingly */}
      <PerformanceMonitor
        isActive={isNoshHeavenVisible} // Only monitor during Nosh Heaven experience
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
            },
            stickyHeaderStyle,
          ]}
        >
          <Header isSticky={true} userName={user?.name} />
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
            },
            normalHeaderStyle,
          ]}
        >
          <Header isSticky={false} userName={user?.name} />
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
          <CategoryFilterChips />
        </Animated.View>

        {activeHeaderTab === "for-you" ? (
          <Animated.ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            bounces={true}
            alwaysBounceVertical={true}
            contentContainerStyle={{
              paddingBottom: 300, // Increased padding for better bottom spacing
              paddingTop: isHeaderSticky ? 0 : 282, // When header is sticky (positioned absolutely), no padding needed. When not sticky (at rest), add padding for header height
            }}
            refreshControl={
              // Only show RefreshControl when not at bottom to avoid conflict with pull-to-nosh-heaven
              !showPullTrigger ? (
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
              ) : undefined
            }
            onScroll={scrollHandler}
            scrollEventThrottle={8}
          >
            {/* Main Content with fade animation */}
            <Animated.View style={contentFadeStyle}>
              {!isAuthenticated && !authLoading && (
                <NotLoggedInNotice onSignInPress={handleSignInPress} />
              )}

              {/* Loading indicators for API data */}
              {(cuisinesLoading || chefsLoading) && isAuthenticated && (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text style={{ color: "#666", fontSize: 16 }}>
                    Loading fresh content...
                  </Text>
                </View>
              )}

              {/* Error handling for API data */}
              {(cuisinesError || chefsError) && isAuthenticated && (
                <View style={{ padding: 20, alignItems: "center" }}>
                  <Text style={{ color: "#FF3B30", fontSize: 16 }}>
                    Failed to load content. Pull to refresh.
                  </Text>
                </View>
              )}

              {/* <SharedOrderingButton /> */}
              <OrderAgainSection
                isHeaderSticky={isHeaderSticky}
                isAuthenticated={isAuthenticated}
              />
              <CuisinesSection onCuisinePress={handleCuisinePress} />
              <CuisineCategoriesSection
                cuisines={cuisines}
                onCuisinePress={handleCuisinePress}
              />
              <FeaturedKitchensSection
                kitchens={kitchens}
                onKitchenPress={handleFeaturedKitchenPress}
                onSeeAllPress={handleOpenFeaturedKitchensDrawer}
              />
              <PopularMealsSection
                meals={mockMeals}
                onMealPress={handleMealPress}
                onSeeAllPress={handleOpenPopularMealsDrawer}
              />

              {/* Hidden Sections - dynamically shown based on conditions */}
              {orderedSections.some((section) => section.isHidden) && (
                <HiddenSections userBehavior={userBehavior} />
              )}

              <SpecialOffersSection
                offers={mockOffers}
                onOfferPress={handleOfferPress}
              />
              <KitchensNearMe 
                onKitchenPress={handleFeaturedKitchenPress}
                onMapPress={handleMapToggle}
              />
              <TopKebabs onOpenDrawer={handleOpenTopKebabsDrawer} />
              <TakeAways onOpenDrawer={handleOpenTakeawayDrawer} />
              <TooFreshToWaste
                onOpenDrawer={handleOpenTooFreshDrawer}
                onOpenSustainability={handleOpenSustainabilityDrawer}
              />
              <EventBanner />
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
            isAuthenticated={isAuthenticated}
          />
        )}

        {/* Pull to Nosh Heaven Trigger - positioned to avoid overlap */}
        {pullTriggerComponent && (
          <NoshHeavenErrorBoundary>
            <View
              style={{
                position: "absolute",
                bottom: 140, // Increased spacing to avoid overlap with bottom tabs and search drawer
                left: 0,
                right: 0,
                alignItems: "center",
                zIndex: 1000,
                paddingHorizontal: 16,
              }}
            >
              {pullTriggerComponent}
            </View>
          </NoshHeavenErrorBoundary>
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

      {/* Nosh Heaven Player - rendered at root level for true full-screen above everything except tabs */}
      {noshHeavenPlayerComponent && (
        <NoshHeavenErrorBoundary>
          {noshHeavenPlayerComponent}
        </NoshHeavenErrorBoundary>
      )}

      {/* Floating Action Button */}
      <FloatingActionButton onCameraPress={() => setIsCameraVisible(true)} />

      {/* Bottom Search Drawer */}
      <BottomSearchDrawer
        onOpenAIChat={handleOpenAIChat}
        isAuthenticated={isAuthenticated}
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
            categoryName="All Available Takeaway's"
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
            categoryDescription="Discover the best kebabs from top-rated kitchens in your area"
            onBack={handleCloseDrawer}
            filterChips={[
              { id: "italian", label: "Italian" },
              { id: "mexican", label: "Mexican" },
              { id: "french", label: "French" },
              { id: "turkish", label: "Turkish" },
            ]}
            activeFilters={[]}
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
        {activeDrawer === "featuredKitchens" && (
          <FeaturedKitchensDrawer
            onBack={handleCloseDrawer}
            kitchens={kitchens}
            onKitchenPress={handleFeaturedKitchenPress}
          />
        )}
        {activeDrawer === "popularMeals" && (
          <PopularMealsDrawer
            onBack={handleCloseDrawer}
            meals={mockMeals}
            onMealPress={handleMealPress}
          />
        )}
        {activeDrawer === "sustainability" && (
          <SustainabilityDrawer onBack={handleCloseDrawer} />
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
            mealId={selectedMeal.id}
            mealData={selectedMeal.data}
            onBack={() => setIsMealDetailsVisible(false)}
            onAddToCart={(mealId, quantity) => {
              // Handle add to cart logic here
              setIsMealDetailsVisible(false);
            }}
          />
        )}
      </Modal>

      {/* Add SignIn Modal */}

      {/* Session Expired Modal */}
      <SessionExpiredModal
        isVisible={isSessionExpired}
        onRelogin={handleSessionExpiredRelogin}
      />

      {/* Add KitchenMainScreen Modal */}
      <Modal
        visible={isKitchenMainScreenVisible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={handleCloseKitchenMainScreen}
        statusBarTranslucent={true}
        hardwareAccelerated={true}
      >
        {selectedKitchen && (
          <KitchenMainScreen
            kitchenName={selectedKitchen.name}
            cuisine={selectedKitchen.cuisine}
            deliveryTime={selectedKitchen.deliveryTime}
            distance={selectedKitchen.distance}
            cartItems={2}
            onCartPress={handleKitchenCartPress}
            onHeartPress={handleKitchenHeartPress}
            onSearchPress={handleKitchenSearchPress}
            onClose={handleCloseKitchenMainScreen}
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
        chefs={mapChefs}
        onChefSelect={handleMapChefSelect}
        onGetDirections={handleMapDirections}
      />
    </View>
  );
}
