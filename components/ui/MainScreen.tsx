import { useAppContext } from '@/utils/AppContext';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AIChatDrawer } from './AIChatDrawer';
import { BottomSearchDrawer } from './BottomSearchDrawer';
import { CategoryFilterChips } from './CategoryFilterChips';
import { CuisineCategoriesSection } from './CuisineCategoriesSection';
import { CuisinesSection } from './CuisinesSection';
import { NoshHeavenErrorBoundary } from './ErrorBoundary';
import { EventBanner } from './EventBanner';
import { FeaturedKitchensSection } from './FeaturedKitchensSection';
import { Header } from './Header';
import { KitchensNearMe } from './KitchensNearMe';
import { LiveContent } from './LiveContent';
import { MultiStepLoader } from './MultiStepLoader';
import { MealData, NoshHeavenPlayer } from './NoshHeavenPlayer';
import { OrderAgainSection } from './OrderAgainSection';
import { usePerformanceOptimizations } from './PerformanceMonitor';
import { PopularMealsSection } from './PopularMealsSection';
import { PullToNoshHeavenTrigger } from './PullToNoshHeavenTrigger';
import { SpecialOffersSection } from './SpecialOffersSection';
import { TakeAways } from './TakeAways';
import { TooFreshToWaste } from './TooFreshToWaste';
import { TopKebabs } from './TopKebabs';

// Mock data for Nosh Heaven meals
const mockMealData: MealData[] = [
  {
    id: '1',
    videoSource: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
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
    videoSource: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
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
    videoSource: 'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4',
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
    image: { uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop' },
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

const mockKitchens = [
  {
    id: '1',
    name: 'Amara\'s Kitchen',
    cuisine: 'Nigerian',
    rating: 4.8,
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
    rating: 4.6,
    deliveryTime: '30 min',
    distance: '1.2 mi',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    isLive: false,
  },
  {
    id: '3',
    name: 'Marrakech Delights',
    cuisine: 'Moroccan',
    rating: 4.7,
    deliveryTime: '35 min',
    distance: '1.5 mi',
    image: { uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop' },
    isLive: true,
    liveViewers: 89,
  },
  {
    id: '4',
    name: 'Seoul Street',
    cuisine: 'Korean',
    rating: 4.5,
    deliveryTime: '28 min',
    distance: '1.0 mi',
    image: { uri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop' },
    isLive: false,
  },
  {
    id: '5',
    name: 'Nonna\'s Table',
    cuisine: 'Italian',
    rating: 4.9,
    deliveryTime: '32 min',
    distance: '1.3 mi',
    image: { uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop' },
    isLive: false,
  },
  {
    id: '6',
    name: 'Tokyo Dreams',
    cuisine: 'Japanese',
    rating: 4.4,
    deliveryTime: '22 min',
    distance: '0.6 mi',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    isLive: true,
    liveViewers: 234,
  },
];

const mockMeals = [
  {
    id: '1',
    name: 'Jollof Rice',
    kitchen: 'Amara\'s Kitchen',
    price: '£12',
    originalPrice: '£15',
    image: { uri: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop' },
    isPopular: true,
    rating: 4.8,
    deliveryTime: '25 min',
  },
  {
    id: '2',
    name: 'Green Curry',
    kitchen: 'Bangkok Bites',
    price: '£14',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    isNew: true,
    rating: 4.6,
    deliveryTime: '30 min',
  },
  {
    id: '3',
    name: 'Lamb Tagine',
    kitchen: 'Marrakech Delights',
    price: '£18',
    image: { uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop' },
    isPopular: true,
    rating: 4.7,
    deliveryTime: '35 min',
  },
  {
    id: '4',
    name: 'Bulgogi Bowl',
    kitchen: 'Seoul Street',
    price: '£16',
    image: { uri: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop' },
    rating: 4.5,
    deliveryTime: '28 min',
  },
  {
    id: '5',
    name: 'Truffle Risotto',
    kitchen: 'Nonna\'s Table',
    price: '£22',
    image: { uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop' },
    isPopular: true,
    rating: 4.9,
    deliveryTime: '32 min',
  },
  {
    id: '6',
    name: 'Sushi Platter',
    kitchen: 'Tokyo Dreams',
    price: '£25',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    isNew: true,
    rating: 4.4,
    deliveryTime: '22 min',
  },
  {
    id: '7',
    name: 'Pounded Yam',
    kitchen: 'Amara\'s Kitchen',
    price: '£10',
    image: { uri: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop' },
    rating: 4.8,
    deliveryTime: '25 min',
  },
  {
    id: '8',
    name: 'Pad Thai',
    kitchen: 'Bangkok Bites',
    price: '£13',
    image: { uri: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop' },
    rating: 4.6,
    deliveryTime: '30 min',
  },
];

const mockOffers = [
  {
    id: '1',
    title: 'First Order Discount',
    description: 'Get 20% off your first order from any kitchen',
    discount: '20%',
    image: { uri: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=300&fit=crop' },
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
  const { activeHeaderTab, activeCategoryFilter, getFilteredContent } = useAppContext();
  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const [isNoshHeavenVisible, setIsNoshHeavenVisible] = useState(false);
  const [noshHeavenMeals, setNoshHeavenMeals] = useState<MealData[]>(mockMealData);
  
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
    
    // Simulate the loading process
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
    }, 3000); // 3 seconds for the full loading experience
    
  }, [contentFadeAnim]);

  const handleOpenAIChat = () => {
    setIsChatVisible(true);
  };

  const handleCloseAIChat = () => {
    setIsChatVisible(false);
  };

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
        
        // Animate header transitions
        if (shouldBeSticky) {
          // Transitioning to sticky
          Animated.parallel([
            Animated.timing(stickyHeaderOpacity, {
              toValue: 1,
              duration: 200, // Faster transition
              useNativeDriver: true,
            }),
            Animated.timing(normalHeaderOpacity, {
              toValue: 0,
              duration: 150, // Faster transition
              useNativeDriver: true,
            }),
            Animated.timing(categoryChipsOpacity, {
              toValue: 1,
              duration: 250, // Faster transition
              useNativeDriver: true,
            }),
          ]).start();
        } else {
          // Transitioning to normal
          Animated.parallel([
            Animated.timing(stickyHeaderOpacity, {
              toValue: 0,
              duration: 150, // Faster transition
              useNativeDriver: true,
            }),
            Animated.timing(normalHeaderOpacity, {
              toValue: 1,
              duration: 200, // Faster transition
              useNativeDriver: true,
            }),
            Animated.timing(categoryChipsOpacity, {
              toValue: 0,
              duration: 150, // Faster transition
              useNativeDriver: true,
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
    // In a real app, this would navigate to cuisine category
  }, []);

  const handleFeaturedKitchenPress = useCallback((kitchen: any) => {
    console.log('View featured kitchen:', kitchen.name);
    // In a real app, this would navigate to kitchen profile
  }, []);

  const handleMealPress = useCallback((meal: any) => {
    console.log('View meal:', meal.name);
    // In a real app, this would navigate to meal details
  }, []);

  const handleOfferPress = useCallback((offer: any) => {
    console.log('View offer:', offer.title);
    // In a real app, this would navigate to offer details
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
              paddingBottom: 100, // Reduced padding to allow overscroll detection
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
              <OrderAgainSection />
              <CuisinesSection />
              <CuisineCategoriesSection cuisines={mockCuisines} onCuisinePress={handleCuisinePress} />
              <FeaturedKitchensSection kitchens={mockKitchens} onKitchenPress={handleFeaturedKitchenPress} />
              <PopularMealsSection meals={mockMeals} onMealPress={handleMealPress} />
              <SpecialOffersSection offers={mockOffers} onOfferPress={handleOfferPress} />
              <KitchensNearMe />
              <TopKebabs />
              <TakeAways />
              <TooFreshToWaste />
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

      </LinearGradient>

      {/* Nosh Heaven Player - rendered at root level for true full-screen above everything except tabs */}
      {noshHeavenPlayerComponent && (
        <NoshHeavenErrorBoundary>
          {noshHeavenPlayerComponent}
        </NoshHeavenErrorBoundary>
      )}

      {/* Bottom Search Drawer */}
      <BottomSearchDrawer />
    </View>
  );
} 