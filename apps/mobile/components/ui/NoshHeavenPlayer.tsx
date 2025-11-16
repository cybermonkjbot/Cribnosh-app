import { X } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, Pressable, StatusBar, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withTiming
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTopPosition } from '@/utils/positioning';
import { CribNoshLogo } from './CribNoshLogo';
import { MealVideoCard } from './MealVideoCard';
import { MealVideoCardSkeleton } from './MealVideoCardSkeleton';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface MealData {
  id: string;
  videoSource: string;
  title: string;
  description: string;
  kitchenName: string;
  price: string;
  chef?: string;
  likes: number;
  comments: number;
}

type PlayerMode = 'meals' | 'kitchenIntro';

interface NoshHeavenPlayerProps {
  isVisible: boolean;
  meals?: MealData[];
  mode?: PlayerMode;
  kitchenIntroVideo?: {
    id: string;
    videoSource: string;
    title: string;
    description?: string;
    kitchenName: string;
    chef?: string;
  };
  onClose: () => void;
  onLoadMore?: () => void;
  onMealLike?: (mealId: string) => void;
  onMealComment?: (mealId: string) => void;
  onMealShare?: (mealId: string) => void;
  onAddToCart?: (mealId: string) => void;
  onKitchenPress?: (kitchenName: string) => void;
}

export function NoshHeavenPlayer({
  isVisible,
  meals = [],
  mode = 'meals',
  kitchenIntroVideo,
  onClose,
  onLoadMore,
  onMealLike,
  onMealComment,
  onMealShare,
  onAddToCart,
  onKitchenPress,
}: NoshHeavenPlayerProps) {
  const insets = useSafeAreaInsets();
  const topPosition = useTopPosition(16);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [preloadedVideos, setPreloadedVideos] = useState<Set<string>>(new Set());
  const flatListRef = useRef<FlatList>(null);
  const isMountedRef = useRef(true);

  // Convert kitchen intro video to MealData format
  const kitchenIntroMeal: MealData | null = useMemo(() => {
    if (mode === 'kitchenIntro' && kitchenIntroVideo) {
      return {
        id: kitchenIntroVideo.id,
        videoSource: kitchenIntroVideo.videoSource,
        title: kitchenIntroVideo.title,
        description: kitchenIntroVideo.description || '',
        kitchenName: kitchenIntroVideo.kitchenName,
        chef: kitchenIntroVideo.chef,
        price: '',
        likes: 0,
        comments: 0,
      };
    }
    return null;
  }, [mode, kitchenIntroVideo]);

  // Determine which meals array to use
  const displayMeals = useMemo(() => {
    if (mode === 'kitchenIntro' && kitchenIntroMeal) {
      return [kitchenIntroMeal];
    }
    return meals;
  }, [mode, kitchenIntroMeal, meals]);

  // Auto-hide animation for swipe down message
  const swipeMessageOpacity = useSharedValue(1);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Optimized getItemLayout for better FlatList performance
  const getItemLayout = useCallback((data: ArrayLike<MealData> | null | undefined, index: number) => ({
    length: SCREEN_HEIGHT,
    offset: SCREEN_HEIGHT * index,
    index,
  }), []);

  // Optimized keyExtractor - use item.id directly
  const keyExtractor = useCallback((item: MealData) => item.id, []);

  // Preload videos function with better error handling
  const preloadVideo = useCallback((videoUrl: string) => {
    if (!videoUrl || preloadedVideos.has(videoUrl) || !isMountedRef.current) return;
    
    try {
      // For React Native, we'll use a simple approach to track preloaded videos
      // In a real implementation, you might use expo-av's loadAsync or similar
      // For now, we'll simulate preloading by adding to the set after a short delay
      const timeoutId = setTimeout(() => {
        if (isMountedRef.current) {
          setPreloadedVideos(prev => new Set([...prev, videoUrl]));
        }
      }, 100);
      
      return () => clearTimeout(timeoutId);
    } catch (error) {
      console.warn('Preload error:', error);
    }
  }, [preloadedVideos]);

  // Preload next videos when current index changes
  useEffect(() => {
    if (!isVisible || displayMeals.length === 0 || !isMountedRef.current) return;

    const preloadTasks: (() => void)[] = [];

    // Preload current video
    if (displayMeals[currentIndex]) {
      const cleanup1 = preloadVideo(displayMeals[currentIndex].videoSource);
      if (cleanup1) preloadTasks.push(cleanup1);
    }

    // Preload next 2 videos (only if not in kitchen intro mode)
    if (mode === 'meals') {
      for (let i = 1; i <= 2; i++) {
        const nextIndex = currentIndex + i;
        if (nextIndex < displayMeals.length && displayMeals[nextIndex]) {
          const cleanup = preloadVideo(displayMeals[nextIndex].videoSource);
          if (cleanup) preloadTasks.push(cleanup);
        }
      }

      // Preload previous video for smooth back navigation
      const prevIndex = currentIndex - 1;
      if (prevIndex >= 0 && displayMeals[prevIndex]) {
        const cleanup = preloadVideo(displayMeals[prevIndex].videoSource);
        if (cleanup) preloadTasks.push(cleanup);
      }
    }

    // Cleanup function
    return () => {
      preloadTasks.forEach(cleanup => cleanup());
    };
  }, [currentIndex, displayMeals, isVisible, preloadVideo, mode]);

  // Preload initial videos when component mounts
  useEffect(() => {
    if (!isVisible || displayMeals.length === 0 || !isMountedRef.current) return;

    // Preload first 3 videos (or just the one video in kitchen intro mode)
    const initialVideos = displayMeals.slice(0, mode === 'kitchenIntro' ? 1 : 3);
    const cleanupTasks: (() => void)[] = [];
    
    initialVideos.forEach(meal => {
      const cleanup = preloadVideo(meal.videoSource);
      if (cleanup) cleanupTasks.push(cleanup);
    });

    return () => {
      cleanupTasks.forEach(cleanup => cleanup());
    };
  }, [displayMeals, isVisible, preloadVideo, mode]);

  // Auto-hide swipe message after 3 seconds
  useEffect(() => {
    if (isVisible && isMountedRef.current) {
      swipeMessageOpacity.value = 1; // Reset opacity when player becomes visible
      hideTimeoutRef.current = setTimeout(() => {
        if (isMountedRef.current) {
          swipeMessageOpacity.value = withTiming(0.3, { duration: 1000 });
        }
      }, 3000);
    } else {
      swipeMessageOpacity.value = 1; // Reset when player closes
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    }
    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [isVisible, swipeMessageOpacity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Derived value for safe access
  const currentSwipeMessageOpacity = useDerivedValue(() => swipeMessageOpacity.value);

  // Animated style for swipe message
  const swipeMessageStyle = useAnimatedStyle(() => {
    return {
      opacity: currentSwipeMessageOpacity.value,
    };
  });

  // Handle close button press
  const handleClosePress = useCallback(() => {
    try {
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (error) {
      console.warn('Close button error:', error);
    }
  }, [onClose]);

  // Handle scroll/swipe to next/previous video with optimized logic
  const onViewableItemsChanged = useCallback(({ viewableItems }: any) => {
    try {
      if (!isMountedRef.current || !viewableItems || viewableItems.length === 0) return;
      
      const newIndex = viewableItems[0].index;
      if (typeof newIndex === 'number' && newIndex >= 0 && newIndex !== currentIndex) {
        setCurrentIndex(newIndex);
        
        // Load more meals when approaching the end (only in meals mode)
        if (mode === 'meals' && newIndex >= displayMeals.length - 2 && typeof onLoadMore === 'function') {
          onLoadMore();
        }
      }
    } catch (error) {
      console.warn('Viewable items changed error:', error);
    }
  }, [currentIndex, displayMeals.length, onLoadMore, mode]);

  // Memoize viewability config for better performance
  const viewabilityConfig = useMemo(() => ({
    itemVisiblePercentThreshold: 50, // Item must be 50% visible to be considered viewable
    waitForInteraction: false,
    minimumViewTime: 300, // Minimum time item must be viewable
  }), []);

  // Optimized render function with minimal dependencies
  const renderMealItem = useCallback(({ item, index }: { item: MealData; index: number }) => {
    try {
      if (!item || typeof index !== 'number' || !isMountedRef.current) {
        return null;
      }
      
      const isPreloaded = preloadedVideos.has(item.videoSource);
      const isCurrentItem = index === currentIndex;
      
      return (
        <MealVideoCard
          key={item.id}
          videoSource={item.videoSource}
          title={item.title}
          description={item.description}
          kitchenName={item.kitchenName}
          price={item.price}
          chef={item.chef}
          likes={item.likes}
          comments={item.comments}
          isVisible={isCurrentItem}
          isPreloaded={isPreloaded}
          onLike={() => onMealLike?.(item.id)}
          onComment={() => onMealComment?.(item.id)}
          onShare={() => onMealShare?.(item.id)}
          onAddToCart={() => onAddToCart?.(item.id)}
          onKitchenPress={() => onKitchenPress?.(item.kitchenName)}
        />
      );
    } catch (error) {
      console.warn('Render meal item error:', error);
      return null;
    }
  }, [currentIndex, preloadedVideos, onMealLike, onMealComment, onMealShare, onAddToCart, onKitchenPress]);

  // Validate props - moved after all hooks
  if (!Array.isArray(displayMeals) || displayMeals.length === 0) {
    // Show skeleton loader when no meals are available
    return (
      <View style={{
        flex: 1,
        backgroundColor: '#000',
      }}>
        <StatusBar hidden />
        <MealVideoCardSkeleton isVisible={true} />
        
        {/* Close Button */}
        <Pressable
          onPress={handleClosePress}
          style={{
            position: 'absolute',
            top: topPosition,
            left: 20,
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <X size={24} color="#fff" />
        </Pressable>

        {/* CribNosh Logo */}
        <View style={{
          position: 'absolute',
          top: insets.top + 16,
          right: 20,
          zIndex: 10000,
        }}>
          <CribNoshLogo size={100} variant="white" />
        </View>
      </View>
    );
  }

  // Early return check moved after all hooks
  console.log('[NoshHeavenPlayer] Render check, isVisible:', isVisible, 'displayMeals.length:', displayMeals.length, 'mode:', mode);
  if (!isVisible) {
    console.log('[NoshHeavenPlayer] Not visible, returning null');
    return null;
  }

  console.log('[NoshHeavenPlayer] Rendering player component');
  return (
    <View style={{
      flex: 1,
      backgroundColor: '#000',
    }}>
      <StatusBar hidden />
      
      {/* Optimized FlatList with performance configurations */}
      <FlatList
        ref={flatListRef}
        data={displayMeals}
        renderItem={renderMealItem}
        keyExtractor={keyExtractor}
        getItemLayout={getItemLayout}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        pagingEnabled={mode === 'meals'}
        showsVerticalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={mode === 'meals' ? SCREEN_HEIGHT : undefined}
        snapToAlignment="start"
        disableIntervalMomentum={mode === 'meals'}
        scrollEnabled={mode === 'meals'}
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={2}
        windowSize={3}
        initialNumToRender={1}
        updateCellsBatchingPeriod={50}
        // Reduce re-renders
        extraData={currentIndex}
        style={{ flex: 1 }}
      />

      {/* Close Button */}
      <Pressable
        onPress={handleClosePress}
        style={{
          position: 'absolute',
          top: insets.top + 16,
          left: 20,
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000, // Above the video content
        }}
      >
        <X size={24} color="#fff" />
      </Pressable>

      {/* CribNosh Logo */}
      <View style={{
        position: 'absolute',
        top: insets.top + 16,
        right: 20,
        zIndex: 10000, // Above the video content
      }}>
        <CribNoshLogo size={100} variant="white" />
      </View>

      {/* Auto-hiding swipe down message (only in meals mode) */}
      {mode === 'meals' && (
        <Animated.View
          style={[
            {
              position: 'absolute',
              top: topPosition + 54,
              left: 0,
              right: 0,
              alignItems: 'center',
              zIndex: 10000, // Above the video content
            },
            swipeMessageStyle,
          ]}
        >
          <Text style={{
            color: '#fff',
            fontSize: 16,
            textAlign: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            paddingHorizontal: 16,
            paddingVertical: 8,
            borderRadius: 20,
            textShadowColor: 'rgba(0, 0, 0, 0.75)',
            textShadowOffset: { width: 0, height: 1 },
            textShadowRadius: 2,
          }}>
            Swipe down to exit
          </Text>
        </Animated.View>
      )}
    </View>
  );
} 