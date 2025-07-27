import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent, RefreshControl, ScrollView, View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AIChatDrawer } from './AIChatDrawer';
import { BottomSearchDrawer } from './BottomSearchDrawer';
import { CategoryFilterChips } from './CategoryFilterChips';
import { CuisinesSection } from './CuisinesSection';
import { NoshHeavenErrorBoundary } from './ErrorBoundary';
import { EventBanner } from './EventBanner';
import { Header } from './Header';
import { KitchensNearMe } from './KitchensNearMe';
import { MultiStepLoader } from './MultiStepLoader';
import { MealData, NoshHeavenPlayer } from './NoshHeavenPlayer';
import { OrderAgainSection } from './OrderAgainSection';
import { PullToNoshHeavenTrigger } from './PullToNoshHeavenTrigger';
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

export function MainScreen() {
  const insets = useSafeAreaInsets();
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
  
  // Shared values for pull-to-Nosh-Heaven - simplified stable approach
  const pullProgress = useSharedValue(0);
  const [showPullTrigger, setShowPullTrigger] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const isScrolling = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        
        // Reset shared values safely
        if (pullProgress && typeof pullProgress.value === 'number') {
          pullProgress.value = 0;
        }
        
        // Stop any running animations
        scrollY.stopAnimation();
        stickyHeaderOpacity.stopAnimation();
        normalHeaderOpacity.stopAnimation();
        categoryChipsOpacity.stopAnimation();
        contentFadeAnim.stopAnimation();
        
        // Reset refs
        isScrolling.current = false;
      } catch (error) {
        console.warn('Cleanup error:', error);
      }
    };
  }, [pullProgress, scrollY, stickyHeaderOpacity, normalHeaderOpacity, categoryChipsOpacity, contentFadeAnim]);

  // Reset states when Nosh Heaven closes
  useEffect(() => {
    if (!isNoshHeavenVisible) {
      // Use requestAnimationFrame to batch updates and prevent conflicts
      requestAnimationFrame(() => {
      setShowPullTrigger(false);
      setHasTriggered(false);
        
        // Reset scroll-related shared values
        if (pullProgress && typeof pullProgress.value === 'number') {
          pullProgress.value = 0;
        }
      });
    }
  }, [isNoshHeavenVisible, pullProgress]);

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
    setRefreshing(true);
    
    // Fade out current content
    Animated.timing(contentFadeAnim, {
      toValue: 0.3,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    // Start the loading process
    await simulateLoadingSteps();
    setRefreshing(false);
  }, [contentFadeAnim]);

  const handleOpenAIChat = () => {
    setIsChatVisible(true);
  };

  const handleCloseAIChat = () => {
    setIsChatVisible(false);
  };

  // Simplified scroll handler with throttling (no worklets to avoid crashes)
  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    try {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      
      // Validate all values are numbers and positive
      if (!Number.isFinite(contentOffset.y) || 
          !Number.isFinite(contentSize.height) || 
          !Number.isFinite(layoutMeasurement.height)) {
        return;
      }
      
      if (contentSize.height <= 0 || layoutMeasurement.height <= 0) {
        return;
      }
      
      // Throttle scroll state management
      isScrolling.current = true;
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        isScrolling.current = false;
      }, 150);
    
      // Pull-to-Nosh-Heaven calculation
      const maxScrollPosition = Math.max(0, contentSize.height - layoutMeasurement.height);
      const overscroll = Math.max(0, contentOffset.y - maxScrollPosition);
      const overscrollProgress = Math.min(1, overscroll / 200);
      
      // Update pull progress safely
      if (Number.isFinite(overscrollProgress) && overscrollProgress >= 0) {
        pullProgress.value = overscrollProgress;
        
        // Show trigger when at bottom
        const shouldShowTrigger = contentOffset.y >= maxScrollPosition && !hasTriggered;
        if (shouldShowTrigger !== showPullTrigger) {
          setShowPullTrigger(shouldShowTrigger);
        }
        
        // Reset trigger when away from bottom
        if (overscrollProgress < 0.05 && showPullTrigger) {
          setShowPullTrigger(false);
          setHasTriggered(false);
        }
        
        // Trigger Nosh Heaven with deliberate pull
        if (overscrollProgress >= 0.9 && !hasTriggered) {
          setHasTriggered(true);
          setTimeout(() => {
            handleNoshHeavenTrigger();
          }, 0);
        }
      }
      
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
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(normalHeaderOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(categoryChipsOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        // Transitioning to normal
        Animated.parallel([
          Animated.timing(stickyHeaderOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(normalHeaderOpacity, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(categoryChipsOpacity, {
            toValue: 0,
            duration: 200,
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
      pullProgress.value = 0;
    }
  }, [isHeaderSticky, stickyHeaderOpacity, normalHeaderOpacity, categoryChipsOpacity, pullProgress, showPullTrigger, hasTriggered]);

  // Handle Nosh Heaven trigger
  const handleNoshHeavenTrigger = useCallback(() => {
    try {
      // Validate state before making changes
      if (isNoshHeavenVisible) {
        return; // Already visible, don't trigger again
      }
      
      // Batch all state updates together
      requestAnimationFrame(() => {
      setIsNoshHeavenVisible(true);
      setShowPullTrigger(false);
      setHasTriggered(false);
      
      // Safely update shared value
      if (pullProgress && typeof pullProgress.value === 'number') {
        pullProgress.value = 0;
      }
      });
    } catch (error) {
      console.warn('Nosh Heaven trigger error:', error);
      // Reset to safe state with batched updates
      requestAnimationFrame(() => {
      setIsNoshHeavenVisible(false);
      setShowPullTrigger(false);
      setHasTriggered(false);
      });
    }
  }, [isNoshHeavenVisible, pullProgress]);

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

  // Optimized pull trigger component with stable dependencies
  const pullTriggerComponent = useMemo(() => {
    if (!showPullTrigger) return null;
    
    return (
      <PullToNoshHeavenTrigger
        pullProgress={pullProgress}
        onTrigger={handleNoshHeavenTrigger}
        isVisible={true} // Always true when component is rendered
      />
    );
  }, [showPullTrigger, pullProgress, handleNoshHeavenTrigger]);

  // Simplified Nosh Heaven player without performance config
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

        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingBottom: 280, // Increased padding to account for bottom tabs, search drawer, and pull trigger
            paddingTop: isHeaderSticky ? 142 : 0,
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FF3B30"
              colors={['#FF3B30']}
              progressBackgroundColor="rgba(255, 255, 255, 0.8)"
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { 
              useNativeDriver: false,
              listener: handleScroll,
            }
          )}
          scrollEventThrottle={16}
        >
          {/* Normal Header - animated opacity */}
          <Animated.View style={{ opacity: normalHeaderOpacity }}>
            <Header isSticky={false} />
          </Animated.View>

          {/* Main Content with fade animation */}
          <Animated.View style={{ opacity: contentFadeAnim }}>
            <OrderAgainSection />
            <CuisinesSection />
            <KitchensNearMe />
            <TopKebabs />
            <TakeAways />
            <TooFreshToWaste />
            <EventBanner />
          </Animated.View>
        </ScrollView>

          {/* Pull to Nosh Heaven Trigger - positioned with extra spacing */}
        {pullTriggerComponent && (
          <NoshHeavenErrorBoundary>
          <View style={{ 
              position: 'absolute',
              bottom: 120, // Position above tab bar with extra spacing
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

        {/* Nosh Heaven Player - rendered at root level for true full-screen */}
        {noshHeavenPlayerComponent && (
          <NoshHeavenErrorBoundary>
            {noshHeavenPlayerComponent}
          </NoshHeavenErrorBoundary>
        )}

        {/* Multi-Step Loader */}
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={showLoader}
        duration={2000}
        loop={false}
      />
      </LinearGradient>

      {/* Bottom Search Drawer */}
      <BottomSearchDrawer />
    </View>
  );
} 