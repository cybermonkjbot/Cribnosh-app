import { useAppContext } from '@/utils/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, NativeScrollEvent, NativeSyntheticEvent, RefreshControl, ScrollView, Text, View } from 'react-native';
import { Easing } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CONFIG } from '../../constants/config';
import { UserBehavior } from '../../utils/hiddenSections';
import {
  getCurrentTimeContext,
  getOrderedSectionsWithHidden,
  OrderingContext
} from '../../utils/sectionOrdering';
import { AIChatDrawer } from './AIChatDrawer';
import { BottomSearchDrawer } from './BottomSearchDrawer';
import { CategoryFilterChips } from './CategoryFilterChips';
import { CategoryFullDrawer } from './CategoryFullDrawer';
import { CuisineCategoriesSection } from './CuisineCategoriesSection';
import { CuisinesSection } from './CuisinesSection';
import { NoshHeavenErrorBoundary } from './ErrorBoundary';
import { EventBanner } from './EventBanner';
import { FeaturedKitchensDrawer } from './FeaturedKitchensDrawer';
import { FeaturedKitchensSection } from './FeaturedKitchensSection';
import { Header } from './Header';
import { HiddenSections } from './HiddenSections';
import { KitchenMainScreen } from './KitchenMainScreen';
import { KitchensNearMe } from './KitchensNearMe';
import { LiveContent } from './LiveContent';
import { MealItemDetails } from './MealItemDetails';
import { MultiStepLoader } from './MultiStepLoader';
import { MealData, NoshHeavenPlayer } from './NoshHeavenPlayer';
import { OrderAgainSection } from './OrderAgainSection';
import { usePerformanceOptimizations } from './PerformanceMonitor';
import { PopularMealsDrawer } from './PopularMealsDrawer';
import { PopularMealsSection } from './PopularMealsSection';
import { PullToNoshHeavenTrigger } from './PullToNoshHeavenTrigger';
import { ShakeDebugger } from './ShakeDebugger';
import { ShakeToEatFlow } from './ShakeToEatFlow';
import { SpecialOffersSection } from './SpecialOffersSection';
import { SustainabilityDrawer } from './SustainabilityDrawer';
import { TakeawayCategoryDrawer } from './TakeawayCategoryDrawer';
import { TakeAways } from './TakeAways';
import { TooFreshToWaste } from './TooFreshToWaste';
import { TooFreshToWasteDrawer } from './TooFreshToWasteDrawer';
import { TopKebabs } from './TopKebabs';

// Mock data for Nosh Heaven meals
const mockMealData: MealData[] = [
  {
    id: '1',
    videoSource: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: 'Nigerian Jollof Rice',
    description: 'Authentic Nigerian Jollof Rice with perfectly seasoned long grain rice, tender chicken, and a blend of West African spices. Made with love by Chef Amara.',
    kitchenName: 'Amara\'s Kitchen',
    price: '£16',
    chef: 'Chef Amara Okonkwo',
    likes: 342,
    comments: 58,
  },
  {
    id: '2',
    videoSource: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    title: 'Spicy Thai Green Curry',
    description: 'Fresh and aromatic green curry with coconut milk, Thai basil, bamboo shoots, and your choice of protein. A true taste of Thailand.',
    kitchenName: 'Bangkok Bites',
    price: '£14',
    chef: 'Chef Siriporn Thanakit',
    likes: 567,
    comments: 89,
  },
  {
    id: '3',
    videoSource: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: 'Mediterranean Lamb Tagine',
    description: 'Slow-cooked lamb tagine with apricots, almonds, and warming Moroccan spices. Served with fluffy couscous and fresh herbs.',
    kitchenName: 'Marrakech Delights',
    price: '£22',
    chef: 'Chef Hassan El Mansouri',
    likes: 289,
    comments: 34,
  },
  {
    id: '4',
    videoSource: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: 'Korean BBQ Bulgogi',
    description: 'Marinated Korean beef bulgogi with jasmine rice, kimchi, and banchan sides. Grilled to perfection with a sweet and savory glaze.',
    kitchenName: 'Seoul Street',
    price: '£18',
    chef: 'Chef Min-jun Park',
    likes: 445,
    comments: 72,
  },
  {
    id: '5',
    videoSource: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    title: 'Italian Truffle Risotto',
    description: 'Creamy Arborio rice risotto with black truffle shavings, wild mushrooms, and aged Parmesan. A luxurious comfort food experience.',
    kitchenName: 'Nonna\'s Table',
    price: '£25',
    chef: 'Chef Giuseppe Rossi',
    likes: 378,
    comments: 91,
  },
];

// Mock data for new sections
const mockCuisines = [
  {
    id: '1',
    name: 'Nigerian',
    image: { uri: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=400&fit=crop' },
    restaurantCount: 24,
    isActive: true,
  },
  {
    id: '2',
    name: 'Italian',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop' },
    restaurantCount: 18,
    isActive: false,
  },
  {
    id: '3',
    name: 'Chinese',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop' },
    restaurantCount: 15,
    isActive: false,
  },
  {
    id: '4',
    name: 'Indian',
    image: { uri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=400&fit=crop' },
    restaurantCount: 12,
    isActive: false,
  },
];

const mockKitchens: Array<{
  id: string;
  name: string;
  cuisine: string;
  sentiment: 'bussing' | 'mid' | 'notIt' | 'fire' | 'slaps' | 'decent' | 'meh' | 'trash' | 'elite' | 'solid' | 'average' | 'skip';
  deliveryTime: string;
  distance: string;
  image: any;
  isLive?: boolean;
  liveViewers?: number;
}> = [
  {
    id: '1',
    name: 'Amara\'s Kitchen',
    cuisine: 'Nigerian',
    sentiment: 'elite',
    deliveryTime: '25 min',
    distance: '0.8 mi',
    image: { uri: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop' },
    isLive: true,
    liveViewers: 156,
  },
  {
    id: '2',
    name: 'Bangkok Bites',
    cuisine: 'Thai',
    sentiment: 'fire',
    deliveryTime: '30 min',
    distance: '1.2 mi',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    isLive: false,
  },
  {
    id: '3',
    name: 'Marrakech Delights',
    cuisine: 'Moroccan',
    sentiment: 'slaps',
    deliveryTime: '35 min',
    distance: '1.5 mi',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    isLive: true,
    liveViewers: 89,
  },
  {
    id: '4',
    name: 'Seoul Street',
    cuisine: 'Korean',
    sentiment: 'solid',
    deliveryTime: '28 min',
    distance: '1.0 mi',
    image: { uri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop' },
    isLive: false,
  },
  {
    id: '5',
    name: 'Nonna\'s Table',
    cuisine: 'Italian',
    sentiment: 'bussing',
    deliveryTime: '32 min',
    distance: '1.3 mi',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    isLive: false,
  },
  {
    id: '6',
    name: 'Tokyo Dreams',
    cuisine: 'Japanese',
    sentiment: 'decent',
    deliveryTime: '22 min',
    distance: '0.6 mi',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    isLive: true,
    liveViewers: 234,
  },
  {
    id: '7',
    name: 'Mumbai Spice',
    cuisine: 'Indian',
    sentiment: 'average',
    deliveryTime: '40 min',
    distance: '1.8 mi',
    image: { uri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop' },
    isLive: false,
  },
  {
    id: '8',
    name: 'Parisian Bistro',
    cuisine: 'French',
    sentiment: 'mid',
    deliveryTime: '45 min',
    distance: '2.1 mi',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    isLive: true,
    liveViewers: 67,
  },
];

const mockMeals: Array<{
  id: string;
  name: string;
  kitchen: string;
  price: string;
  originalPrice?: string;
  image: any;
  isPopular?: boolean;
  isNew?: boolean;
  sentiment: 'bussing' | 'mid' | 'notIt' | 'fire' | 'slaps' | 'decent' | 'meh' | 'trash' | 'elite' | 'solid' | 'average' | 'skip';
  deliveryTime: string;
}> = [
  {
    id: '1',
    name: 'Jollof Rice',
    kitchen: 'Amara\'s Kitchen',
    price: '£12',
    originalPrice: '£15',
    image: { uri: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop' },
    isPopular: true,
    sentiment: 'elite',
    deliveryTime: '25 min',
  },
  {
    id: '2',
    name: 'Green Curry',
    kitchen: 'Bangkok Bites',
    price: '£14',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    isNew: true,
    sentiment: 'fire',
    deliveryTime: '30 min',
  },
  {
    id: '3',
    name: 'Lamb Tagine',
    kitchen: 'Marrakech Delights',
    price: '£18',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    isPopular: true,
    sentiment: 'slaps',
    deliveryTime: '35 min',
  },
  {
    id: '4',
    name: 'Bulgogi Bowl',
    kitchen: 'Seoul Street',
    price: '£16',
    image: { uri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop' },
    sentiment: 'solid',
    deliveryTime: '28 min',
  },
  {
    id: '5',
    name: 'Truffle Risotto',
    kitchen: 'Nonna\'s Table',
    price: '£22',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    isPopular: true,
    sentiment: 'bussing',
    deliveryTime: '32 min',
  },
  {
    id: '6',
    name: 'Sushi Platter',
    kitchen: 'Tokyo Dreams',
    price: '£25',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    isNew: true,
    sentiment: 'decent',
    deliveryTime: '22 min',
  },
  {
    id: '7',
    name: 'Pounded Yam',
    kitchen: 'Amara\'s Kitchen',
    price: '£10',
    image: { uri: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop' },
    sentiment: 'average',
    deliveryTime: '25 min',
  },
  {
    id: '8',
    name: 'Pad Thai',
    kitchen: 'Bangkok Bites',
    price: '£13',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    sentiment: 'mid',
    deliveryTime: '30 min',
  },
  {
    id: '9',
    name: 'Butter Chicken',
    kitchen: 'Mumbai Spice',
    price: '£15',
    image: { uri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop' },
    isPopular: true,
    sentiment: 'meh',
    deliveryTime: '40 min',
  },
  {
    id: '10',
    name: 'Coq au Vin',
    kitchen: 'Parisian Bistro',
    price: '£20',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    sentiment: 'notIt',
    deliveryTime: '45 min',
  },
];

const mockOffers = [
  {
    id: '1',
    title: 'First Order Discount',
    description: 'Get 20% off your first order from any kitchen',
    discount: '20%',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    validUntil: 'Dec 31, 2024',
    isLimited: true,
    remainingTime: '2 days left',
  },
  {
    id: '2',
    title: 'Weekend Special',
    description: 'Free delivery on orders over £25 this weekend',
    discount: 'Free Delivery',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    validUntil: 'Dec 15, 2024',
    remainingTime: '5 days left',
  },
  {
    id: '3',
    title: 'Lunch Rush',
    description: '15% off all lunch orders between 12-2 PM',
    discount: '15%',
    image: { uri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop' },
    validUntil: 'Dec 20, 2024',
    isLimited: true,
    remainingTime: '1 day left',
  },
];

export function MainScreen() {
  const insets = useSafeAreaInsets();
  const { activeHeaderTab, activeCategoryFilter, getFilteredContent, registerScrollToTopCallback } = useAppContext();
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isNoshHeavenVisible, setIsNoshHeavenVisible] = useState(false);
  const [noshHeavenMeals, setNoshHeavenMeals] = useState<MealData[]>(mockMealData);
  
  // Category drawer state management
  const [activeDrawer, setActiveDrawer] = useState<'takeaway' | 'tooFresh' | 'topKebabs' | 'featuredKitchens' | 'popularMeals' | 'sustainability' | null>(null);
  
  // Shake to Eat state management
  // ShakeToEatFlow now handles its own visibility with sustained shake detection
  
  // Meal Details state management
  const [selectedMeal, setSelectedMeal] = useState<any>(null);
  const [isMealDetailsVisible, setIsMealDetailsVisible] = useState(false);
  
  // Kitchen Main Screen state management
  const [selectedKitchen, setSelectedKitchen] = useState<any>(null);
  const [isKitchenMainScreenVisible, setIsKitchenMainScreenVisible] = useState(false);
  
  // Hidden sections state
  const [orderedSections, setOrderedSections] = useState<any[]>([]);
  const [userBehavior, setUserBehavior] = useState<UserBehavior>({
    totalOrders: 5,
    daysActive: 14,
    usualDinnerItems: ['Pizza Margherita', 'Chicken Curry', 'Pasta Carbonara', 'Sushi Roll'],
    favoriteSections: ['featured_kitchens', 'popular_meals', 'cuisine_categories'],
    clickedSections: ['featured_kitchens', 'popular_meals', 'cuisine_categories'],
    colleagueConnections: 3,
    playToWinHistory: {
      gamesPlayed: 2,
      gamesWon: 1,
      lastPlayed: new Date('2024-01-10T12:00:00')
    },
    freeFoodPreferences: ['Pizza', 'Burger', 'Sushi']
  });
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const stickyHeaderOpacity = useRef(new Animated.Value(0)).current;
  const normalHeaderOpacity = useRef(new Animated.Value(1)).current;
  const categoryChipsOpacity = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(1)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Enhanced pull-to-refresh state management
  const [showPullTrigger, setShowPullTrigger] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isPulling, setIsPulling] = useState(false);
  const isScrolling = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScrollPosition = useRef(0);
  const pullStartY = useRef(0);
  const pullThreshold = 60; // Further reduced threshold for immediate activation
  const velocityThreshold = 300; // Further reduced velocity threshold for faster response

  // Register scroll-to-top callback
  useEffect(() => {
    const scrollToTop = () => {
      if (scrollViewRef.current) {
        // Scroll to top with smooth animation
        scrollViewRef.current.scrollTo({ y: 0, animated: true });
        
        // Reset header to normal state with smooth animation
        setIsHeaderSticky(false);
        
        // Use consistent animation timing for smooth transitions
        const animationDuration = 300;
        
        // Add a small delay to ensure scroll animation starts first
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(stickyHeaderOpacity, {
              toValue: 0,
              duration: animationDuration,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
            Animated.timing(normalHeaderOpacity, {
              toValue: 1,
              duration: animationDuration,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
            Animated.timing(categoryChipsOpacity, {
              toValue: 0,
              duration: animationDuration,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
          ]).start();
        }, 50); // Small delay to ensure scroll starts first
      }
    };

    registerScrollToTopCallback(scrollToTop);
  }, [registerScrollToTopCallback]);

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
        setHasTriggered(false);
        setIsNoshHeavenVisible(false);
        setIsChatVisible(false);
        setShowLoader(false);
        setRefreshing(false);
        
        // Stop any running animations
        scrollY.stopAnimation();
        stickyHeaderOpacity.stopAnimation();
        normalHeaderOpacity.stopAnimation();
        categoryChipsOpacity.stopAnimation();
        contentFadeAnim.stopAnimation();
        
        // Reset refs
        isScrolling.current = false;
        lastScrollPosition.current = 0;
      } catch (error) {
      }
    };
  }, [scrollY, stickyHeaderOpacity, normalHeaderOpacity, categoryChipsOpacity, contentFadeAnim]);

  // Reset states when Nosh Heaven closes
  useEffect(() => {
    if (!isNoshHeavenVisible) {
      // Use requestAnimationFrame to batch updates and prevent conflicts
      requestAnimationFrame(() => {
        setShowPullTrigger(false);
        setHasTriggered(false);
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
      text: 'Finding the best meals for you...',
      emotion: 'excited' as const
    },
    { 
      text: 'Preparing your fresh experience...',
      emotion: 'hungry' as const
    },
    { 
      text: 'Ready to serve!',
      emotion: 'satisfied' as const
    },
  ];

  const totalSteps = loadingStates.length;

  const getStepMessage = (step: number) => {
    switch (step) {
      case 1:
        return "Finding the best meals for you...";
      case 2:
        return "Preparing your fresh experience...";
      case 3:
        return "Ready to serve!";
      default:
        return "Loading...";
    }
  };

  const getMascotEmotion = (step: number) => {
    switch (step) {
      case 1:
        return "excited";
      case 2:
        return "hungry";
      case 3:
        return "satisfied";
      default:
        return "default";
    }
  };

  const simulateLoadingSteps = async () => {
    setShowLoader(true);
    
    // Simulate the time it takes for the loader to complete all 3 steps
    // 3 steps × 2 seconds each = 6 seconds total
    setTimeout(() => {
      setShowLoader(false);
      // Increment refresh count to show new content
      setRefreshCount(prev => prev + 1);
      
      // Fade in the content
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 6000);
  };

  const onRefresh = useCallback(async () => {
    console.log('Refresh triggered!');
    
    // Show loader immediately without any delays
    setShowLoader(true);
    setRefreshing(true);
    
    // Fade out current content immediately
    Animated.timing(contentFadeAnim, {
      toValue: 0.3,
      duration: 100, // Faster fade out
      useNativeDriver: true,
    }).start();
    
    // Simulate the loading process with artificial delay
    setTimeout(() => {
      setShowLoader(false);
      setRefreshing(false);
      
      // Increment refresh count to show new content
      setRefreshCount(prev => prev + 1);
      
      // Fade in the content
      Animated.timing(contentFadeAnim, {
        toValue: 1,
        duration: 300, // Faster fade in
        useNativeDriver: true,
      }).start();
    }, 5000); // 5 seconds for a more natural loading experience
    
  }, [contentFadeAnim]);

  const handleOpenAIChat = () => {
    setIsChatVisible(true);
  };

  const handleCloseAIChat = () => {
    setIsChatVisible(false);
  };

  // Shake to Eat handlers
  const handleShakeToEatLaunch = (prompt: string) => {
    console.log('🎯 Shake to Eat: AI Chat launching with prompt:', prompt);
    // Open AI chat with the generated prompt from sustained shake
    setIsChatVisible(true);
    // You can pass the prompt to your AI chat component here
  };

  const handleShakeToEatClose = () => {
    console.log('🎯 Shake to Eat: Flow closed');
    // Component handles its own visibility now
  };

  // Shake to Eat flow started (triggered by sustained shake)
  const handleShakeToEatStart = () => {
    console.log('🎯 Shake to Eat: Sustained shake completed, flow starting');
    // Component handles its own visibility now
  };

  // Debug: Add a simple shake indicator
  const [debugShakeCount, setDebugShakeCount] = useState(0);
  const [debugIsShaking, setDebugIsShaking] = useState(false);

  // Enhanced scroll handler with intentional pull detection
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    try {
      const { contentOffset, contentSize, layoutMeasurement, velocity } = event.nativeEvent;
      
      // Improved bottom detection with tolerance
      const maxScrollPosition = Math.max(0, contentSize.height - layoutMeasurement.height);
      const bottomTolerance = 10; // Allow 10px tolerance for bottom detection
      const isAtBottom = contentOffset.y >= (maxScrollPosition - bottomTolerance);
      const currentScrollPosition = contentOffset.y;
      
      // Detect intentional pull gesture with immediate feedback
      const overscroll = Math.max(0, currentScrollPosition - maxScrollPosition);
      const isSignificantPull = overscroll > pullThreshold;
      const hasSignificantVelocity = Math.abs(velocity?.y || 0) > velocityThreshold;
      const isIntentionalPull = isSignificantPull && hasSignificantVelocity;
      
      // Debug logging for scroll events (only when at bottom or overscrolling)
      if (isAtBottom || overscroll > 0) {
        console.log('Scroll event at bottom/overscroll:', { 
          contentOffset: contentOffset.y, 
          maxScrollPosition, 
          isAtBottom, 
          overscroll, 
          showPullTrigger,
          hasTriggered 
        });
      }
      
      // Simplified pull detection logic
      if (isAtBottom) {
        // We're at the bottom, check for pull gesture
      if (overscroll > 0) {
        setPullDistance(overscroll);
        setIsPulling(true);
        
          // Show trigger immediately when any pull is detected
          if (overscroll > 5 && !hasTriggered) {
            console.log('Showing pull trigger - at bottom with overscroll', { overscroll });
          setShowPullTrigger(true);
        }
          
          // Trigger Nosh Heaven when pull is significant (with or without velocity)
          if (overscroll > pullThreshold && !hasTriggered) {
            console.log('Triggering Nosh Heaven!', { overscroll, pullThreshold });
            setHasTriggered(true);
            setShowPullTrigger(false);
            handleNoshHeavenTrigger();
          }
      } else {
          // No overscroll, reset states
        setPullDistance(0);
        setIsPulling(false);
          if (showPullTrigger) {
            console.log('Hiding pull trigger - no overscroll');
        setShowPullTrigger(false);
      }
        }
      } else {
        // Not at bottom, reset all pull states
        setPullDistance(0);
        setIsPulling(false);
        setShowPullTrigger(false);
        setHasTriggered(false);
      }
      
      // Throttle scroll state management
      isScrolling.current = true;
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        isScrolling.current = false;
      }, 50); // Much faster debounce for immediate feedback
      
      // Header sticky logic - lightweight calculation
      const shouldBeSticky = contentOffset.y > 100;
      
      if (shouldBeSticky !== isHeaderSticky) {
        setIsHeaderSticky(shouldBeSticky);
        
        // Use consistent animation timing for smooth transitions
        const animationDuration = 300;
        
        // Animate header transitions
        if (shouldBeSticky) {
          // Transitioning to sticky
          Animated.parallel([
            Animated.timing(stickyHeaderOpacity, {
              toValue: 1,
              duration: animationDuration,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
            Animated.timing(normalHeaderOpacity, {
              toValue: 0,
              duration: animationDuration,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
            Animated.timing(categoryChipsOpacity, {
              toValue: 1,
              duration: animationDuration,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
          ]).start();
        } else {
          // Transitioning to normal
          Animated.parallel([
            Animated.timing(stickyHeaderOpacity, {
              toValue: 0,
              duration: animationDuration,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
            Animated.timing(normalHeaderOpacity, {
              toValue: 1,
              duration: animationDuration,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
            Animated.timing(categoryChipsOpacity, {
              toValue: 0,
              duration: animationDuration,
              useNativeDriver: true,
              easing: Easing.inOut(Easing.ease),
            }),
          ]).start();
        }
      }
    } catch (error) {
      // Complete fallback: reset everything to safe state
      console.warn('Scroll handler error:', error);
      setShowPullTrigger(false);
      setHasTriggered(false);
      setPullDistance(0);
      setIsPulling(false);
    }
  }, [isHeaderSticky, stickyHeaderOpacity, normalHeaderOpacity, categoryChipsOpacity, hasTriggered, pullThreshold, velocityThreshold]);

  // Handle Nosh Heaven trigger - immediate execution
  const handleNoshHeavenTrigger = useCallback(() => {
    console.log('handleNoshHeavenTrigger called', { isNoshHeavenVisible });
    try {
      // Validate state before making changes
      if (isNoshHeavenVisible) {
        console.log('Nosh Heaven already visible, not triggering again');
        return; // Already visible, don't trigger again
      }
      
      console.log('Setting Nosh Heaven visible');
      // Immediate state updates for faster response
        setIsNoshHeavenVisible(true);
        setShowPullTrigger(false);
        setHasTriggered(false);
    } catch (error) {
      console.warn('Nosh Heaven trigger error:', error);
      // Reset to safe state immediately
        setIsNoshHeavenVisible(false);
        setShowPullTrigger(false);
        setHasTriggered(false);
    }
  }, [isNoshHeavenVisible]);

  // Handle Nosh Heaven close
  const handleNoshHeavenClose = useCallback(() => {
    try {
      // Batch all state updates together
      requestAnimationFrame(() => {
        setIsNoshHeavenVisible(false);
        setHasTriggered(false);
        
        // Safely scroll back to top
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollTo({ y: 0, animated: true });
        }
      });
    } catch (error) {
      console.warn('Nosh Heaven close error:', error);
      // Reset to safe state
      requestAnimationFrame(() => {
        setIsNoshHeavenVisible(false);
        setHasTriggered(false);
      });
    }
  }, []);

  // Load more meals for Nosh Heaven
  const handleLoadMoreMeals = useCallback(() => {
    // In a real app, this would load from an API
    const moreMeals: MealData[] = [
      {
        id: `new-${Date.now()}`,
        videoSource: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
        title: 'Fresh Sushi Platter',
        description: 'Premium sushi selection with fresh salmon, tuna, and sea bream. Crafted by our master sushi chef.',
        kitchenName: 'Tokyo Dreams',
        price: '£28',
        chef: 'Chef Takeshi Yamamoto',
        likes: 234,
        comments: 67,
      },
    ];
    setNoshHeavenMeals(prev => [...prev, ...moreMeals]);
  }, []);

  // Handle meal interactions
  const handleMealLike = useCallback((mealId: string) => {
    console.log('Liked meal:', mealId);
    // In a real app, this would update the backend
  }, []);

  const handleMealComment = useCallback((mealId: string) => {
    console.log('Comment on meal:', mealId);
    // In a real app, this would open a comment modal
  }, []);

  const handleMealShare = useCallback((mealId: string) => {
    console.log('Share meal:', mealId);
    // In a real app, this would open share sheet
  }, []);

  const handleAddToCart = useCallback((mealId: string) => {
    console.log('Add to cart:', mealId);
    // In a real app, this would add the meal to cart
  }, []);

  const handleKitchenPress = useCallback((kitchenName: string) => {
    console.log('View kitchen:', kitchenName);
    // In a real app, this would navigate to kitchen profile
  }, []);

  // Handlers for new sections
  const handleCuisinePress = useCallback((cuisine: any) => {
    console.log('View cuisine:', cuisine.name);
    // Create a mock kitchen based on the cuisine
    const mockKitchen = {
      id: `cuisine-${cuisine.id}`,
      name: `${cuisine.name} Kitchen`,
      cuisine: `${cuisine.name} cuisine`,
      deliveryTime: '25-40 Mins',
      distance: '1.5km away',
      image: cuisine.image,
      sentiment: 'fire' as const,
    };
    setSelectedKitchen(mockKitchen);
    setIsKitchenMainScreenVisible(true);
  }, []);

  const handleFeaturedKitchenPress = useCallback((kitchen: any) => {
    console.log('View featured kitchen:', kitchen.name);
    setSelectedKitchen(kitchen);
    setIsKitchenMainScreenVisible(true);
  }, []);

  const handleMealPress = useCallback((meal: any) => {
    console.log('View meal:', meal.name);
    // Convert meal data to MealItemDetails format
    const mealData = {
      title: meal.name,
      description: `Delicious ${meal.name} from ${meal.kitchen}. Experience authentic flavors crafted with the finest ingredients and traditional cooking methods.`,
      price: parseInt(meal.price.replace('£', '')) * 100, // Convert to cents
      imageUrl: meal.image?.uri,
      kitchenName: meal.kitchen,
      kitchenAvatar: undefined,
      calories: Math.floor(Math.random() * 500) + 300, // Random calories between 300-800
      fat: `${Math.floor(Math.random() * 20) + 5}g`,
      protein: `${Math.floor(Math.random() * 30) + 10}g`,
      carbs: `${Math.floor(Math.random() * 50) + 20}g`,
      dietCompatibility: Math.floor(Math.random() * 40) + 60, // Random percentage 60-100
      dietMessage: 'Great choice for your current diet goals',
      ingredients: [
        { name: 'Chicken breasts', quantity: '250 g' },
        { name: 'Unsalted butter', quantity: '1 tbsp', isAllergen: true, allergenType: 'dairy' },
        { name: 'Sesame oil', quantity: '2 tsp', isAllergen: true, allergenType: 'nuts' },
        { name: 'Fresh ginger', quantity: '2 tsp' },
        { name: 'Wheat flour', quantity: '100 g', isAllergen: true, allergenType: 'gluten' }
      ],
      chefName: 'Chef Stan',
      chefStory: 'This Shawarma recipe has been perfected over 20 years of cooking. It combines traditional Middle Eastern spices with modern cooking techniques to create a dish that\'s both authentic and accessible.',
      chefTips: [
        'Best enjoyed hot and fresh - reheat for 2 minutes if needed',
        'Add extra garlic sauce for an authentic Middle Eastern taste',
        'Pair with our fresh mint tea for the complete experience',
        'Perfect for sharing - order extra pita bread on the side'
      ],
      similarMeals: [
        {
          id: 'kebab-001',
          name: 'Chicken Kebab',
          price: '£12.99',
          sentiment: 'bussing',
          isVegetarian: false
        },
        {
          id: 'falafel-001',
          name: 'Falafel Wrap',
          price: '£9.99',
          sentiment: 'mid',
          isVegetarian: true
        },
        {
          id: 'hummus-001',
          name: 'Hummus Plate',
          price: '£8.99',
          sentiment: 'bussing',
          isVegetarian: true
        }
      ]
    };
    
    setSelectedMeal({ id: meal.id, data: mealData });
    setIsMealDetailsVisible(true);
  }, []);

  const handleOfferPress = useCallback((offer: any) => {
    console.log('View offer:', offer.title);
    // In a real app, this would navigate to offer details
  }, []);

  // Category drawer handlers
  const handleOpenTakeawayDrawer = useCallback(() => {
    setActiveDrawer('takeaway');
  }, []);

  const handleOpenTooFreshDrawer = useCallback(() => {
    setActiveDrawer('tooFresh');
  }, []);

  const handleOpenTopKebabsDrawer = useCallback(() => {
    setActiveDrawer('topKebabs');
  }, []);

  const handleOpenFeaturedKitchensDrawer = useCallback(() => {
    setActiveDrawer('featuredKitchens');
  }, []);

  const handleOpenPopularMealsDrawer = useCallback(() => {
    setActiveDrawer('popularMeals');
  }, []);

  const handleOpenSustainabilityDrawer = useCallback(() => {
    setActiveDrawer('sustainability');
  }, []);

  const handleCloseDrawer = useCallback(() => {
    setActiveDrawer(null);
  }, []);

  // Kitchen Main Screen handlers
  const handleCloseKitchenMainScreen = useCallback(() => {
    setIsKitchenMainScreenVisible(false);
    setSelectedKitchen(null);
  }, []);

  const handleKitchenCartPress = useCallback(() => {
    console.log('Kitchen cart pressed');
    // In a real app, this would navigate to cart
  }, []);

  const handleKitchenHeartPress = useCallback(() => {
    console.log('Kitchen heart pressed');
    // In a real app, this would toggle favorite
  }, []);

  const handleKitchenSearchPress = useCallback(() => {
    console.log('Kitchen search pressed');
    // In a real app, this would open search
  }, []);

  const handleDrawerAddToCart = useCallback((id: string) => {
    console.log('Added to cart from drawer:', id);
    // In a real app, this would add the item to cart
  }, []);

  const handleDrawerItemPress = useCallback((id: string) => {
    console.log('Item pressed in drawer:', id);
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
  const { PerformanceMonitor, getPerformanceConfig } = usePerformanceOptimizations();
  const performanceConfigRef = useRef(getPerformanceConfig());
  
  // Update ordered sections with hidden sections
  useEffect(() => {
    const updateOrderedSections = () => {
      const timeContext = getCurrentTimeContext();
      const context: OrderingContext = {
        timeContext,
        userBehavior,
        currentLocation: { latitude: 51.5074, longitude: -0.1278 }, // Mock location
        weather: { condition: 'sunny', temperature: 22 }, // Mock weather
        appState: 'active',
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
    
    const config = performanceConfigRef.current;
    
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
    noshHeavenMeals.length, // Use length instead of full array for better memoization
    handleNoshHeavenClose, 
    handleLoadMoreMeals, 
    handleMealLike, 
    handleMealComment, 
    handleMealShare, 
    handleAddToCart, 
    handleKitchenPress
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
        colors={['#f8e6f0', '#faf2e8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        {/* Sticky Header - always present but animated opacity */}
        <Animated.View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 1000,
          opacity: stickyHeaderOpacity,
        }}>
          <Header isSticky={true} />
        </Animated.View>

        {/* Normal Header - positioned below sticky header */}
        <Animated.View style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          zIndex: 999,
          opacity: normalHeaderOpacity,
        }}>
          <Header isSticky={false} />
        </Animated.View>

        {/* Category Filter Chips - positioned right under sticky header */}
        <Animated.View style={{ 
          position: 'absolute', 
          top: 89, 
          left: 0, 
          right: 0, 
          zIndex: 999,
          opacity: categoryChipsOpacity,
        }}>
          <CategoryFilterChips />
        </Animated.View>



        {activeHeaderTab === 'for-you' ? (
          <ScrollView
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
                colors={['#FF3B30']}
                progressBackgroundColor="rgba(255, 255, 255, 0.8)"
                progressViewOffset={0}
                title="Pull to refresh"
                titleColor="#FF3B30"
                />
              ) : undefined
            }
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { 
                useNativeDriver: false,
                listener: handleScroll,
              }
            )}
            scrollEventThrottle={8}
          >
            {/* Main Content with fade animation */}
            <Animated.View style={{ opacity: contentFadeAnim }}>
              <OrderAgainSection isHeaderSticky={isHeaderSticky} />
              <CuisinesSection onCuisinePress={handleCuisinePress} />
              <CuisineCategoriesSection cuisines={mockCuisines} onCuisinePress={handleCuisinePress} />
              <FeaturedKitchensSection kitchens={mockKitchens} onKitchenPress={handleFeaturedKitchenPress} onSeeAllPress={handleOpenFeaturedKitchensDrawer} />
              <PopularMealsSection meals={mockMeals} onMealPress={handleMealPress} onSeeAllPress={handleOpenPopularMealsDrawer} />
              
              {/* Hidden Sections - dynamically shown based on conditions */}
              {orderedSections.some(section => section.isHidden) && (
                <HiddenSections userBehavior={userBehavior} />
              )}
              
              <SpecialOffersSection offers={mockOffers} onOfferPress={handleOfferPress} />
              <KitchensNearMe onKitchenPress={handleFeaturedKitchenPress} />
              <TopKebabs onOpenDrawer={handleOpenTopKebabsDrawer} />
              <TakeAways onOpenDrawer={handleOpenTakeawayDrawer} />
              <TooFreshToWaste onOpenDrawer={handleOpenTooFreshDrawer} onOpenSustainability={handleOpenSustainabilityDrawer} />
              <EventBanner />
            </Animated.View>
          </ScrollView>
        ) : (
          <LiveContent
            scrollViewRef={scrollViewRef}
            scrollY={scrollY}
            isHeaderSticky={isHeaderSticky}
            contentFadeAnim={contentFadeAnim}
            refreshing={refreshing}
            onRefresh={onRefresh}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { 
                useNativeDriver: false,
                listener: handleScroll,
              }
            )}
          />
        )}

        {/* Pull to Nosh Heaven Trigger - positioned to avoid overlap */}
        {pullTriggerComponent && (
          <NoshHeavenErrorBoundary>
            <View style={{
              position: 'absolute',
              bottom: 140, // Increased spacing to avoid overlap with bottom tabs and search drawer
              left: 0,
              right: 0,
              alignItems: 'center',
              zIndex: 1000,
              paddingHorizontal: 20,
            }}>
              {pullTriggerComponent}
            </View>
          </NoshHeavenErrorBoundary>
        )}
        


        {/* AI Chat Drawer */}
        <AIChatDrawer
          isVisible={isChatVisible}
          onClose={handleCloseAIChat}
        />

        {/* Debug Shake Indicator */}
        {CONFIG.DEBUG_MODE && (
          <ShakeDebugger />
        )}

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

      {/* Bottom Search Drawer */}
      <BottomSearchDrawer onOpenAIChat={handleOpenAIChat} />

      {/* Category Drawers */}
      <Modal
        visible={activeDrawer !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCloseDrawer}
        statusBarTranslucent={true}
        hardwareAccelerated={true}
      >
        {activeDrawer === 'takeaway' && (
          <TakeawayCategoryDrawer
            categoryName="All Available Takeaway's"
            onBack={handleCloseDrawer}
            onAddToCart={handleDrawerAddToCart}
            onItemPress={handleDrawerItemPress}
          />
        )}
        {activeDrawer === 'tooFresh' && (
          <TooFreshToWasteDrawer
            onBack={handleCloseDrawer}
            onAddToCart={handleDrawerAddToCart}
            onItemPress={handleDrawerItemPress}
          />
        )}
        {activeDrawer === 'topKebabs' && (
          <CategoryFullDrawer
            categoryName="From Top Kebabs"
            categoryDescription="Discover the best kebabs from top-rated kitchens in your area"
            onBack={handleCloseDrawer}
            filterChips={[
              { id: 'italian', label: 'Italian' },
              { id: 'mexican', label: 'Mexican' },
              { id: 'french', label: 'French' },
              { id: 'turkish', label: 'Turkish' },
            ]}
            activeFilters={[]}
          >
            <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, color: '#094327', textAlign: 'center' }}>
                Top Kebabs content will be displayed here with filtering options
              </Text>
            </View>
          </CategoryFullDrawer>
        )}
        {activeDrawer === 'featuredKitchens' && (
          <FeaturedKitchensDrawer
            onBack={handleCloseDrawer}
            kitchens={mockKitchens}
            onKitchenPress={handleFeaturedKitchenPress}
          />
        )}
        {activeDrawer === 'popularMeals' && (
          <PopularMealsDrawer
            onBack={handleCloseDrawer}
            meals={mockMeals}
            onMealPress={handleMealPress}
          />
        )}
        {activeDrawer === 'sustainability' && (
          <SustainabilityDrawer
            onBack={handleCloseDrawer}
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
            mealId={selectedMeal.id}
            mealData={selectedMeal.data}
            onBack={() => setIsMealDetailsVisible(false)}
            onAddToCart={(mealId, quantity) => {
              console.log(`Added ${quantity} of ${mealId} to cart`);
              // Handle add to cart logic here
              setIsMealDetailsVisible(false);
            }}
          />
        )}
      </Modal>

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
            cartItems={2}
            onCartPress={handleKitchenCartPress}
            onHeartPress={handleKitchenHeartPress}
            onSearchPress={handleKitchenSearchPress}
            onClose={handleCloseKitchenMainScreen}
          />
        )}
      </Modal>
    </View>
  );
} 