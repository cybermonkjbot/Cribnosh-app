import { useFoodCreators } from '@/hooks/useFoodCreators';
import { useUserLocation } from '@/hooks/useUserLocation';
import { showError } from '@/lib/GlobalToastManager';
import { sendChatMessage, transformDishToProductCard } from '@/utils/aiChatUtils';
import { BlurEffect } from '@/utils/blurEffects';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Dimensions, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import SearchArea from '../../SearchArea';
import { AIChatDrawer } from '../AIChatDrawer';
import { AISearchResponseOverlay, ProductCardProps } from '../AISearchResponseOverlay';
import { CartButton } from '../CartButton';
import { InlineAILoader } from '../InlineAILoader';
import { KitchenBottomSheetContent } from './KitchenBottomSheetContent';
import { KitchenBottomSheetHeader } from './KitchenBottomSheetHeader';

interface KitchenBottomSheetProps {
  deliveryTime: string;
  cartItems: number;
  kitchenName?: string;
  distance?: string;
  kitchenId?: string;
  onCartPress?: () => void;
  onHeartPress?: () => void;
  onSearchPress?: () => void;
  onSearchSubmit?: (query: string) => void;
  onMealPress?: (meal: any) => void;
  onCartCountChange?: (count: number) => void;
  onOpenAIChat?: () => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const COLLAPSED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.57); // 57% of screen
const EXPANDED_HEIGHT = Math.round(SCREEN_HEIGHT * 0.90); // 90% of screen

const SNAP_POINTS = {
  COLLAPSED: COLLAPSED_HEIGHT,
  EXPANDED: EXPANDED_HEIGHT,
};

type SnapPoint = number;

const SPRING_CONFIG = {
  damping: 50,
  stiffness: 400,
  mass: 0.8,
};

const VELOCITY_THRESHOLD = 500;
const GESTURE_THRESHOLD = 50;

export const KitchenBottomSheet: React.FC<KitchenBottomSheetProps> = ({
  deliveryTime,
  cartItems,
  kitchenName: propKitchenName,
  distance = "0.8 km",
  kitchenId,
  onCartPress,
  onHeartPress,
  onSearchPress,
  onSearchSubmit,
  onMealPress,
  onCartCountChange,
  onOpenAIChat,
}) => {
  const router = useRouter();
  const contentScrollRef = useRef<ScrollView>(null);
  const searchInputRef = useRef<TextInput>(null);
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { getKitchenDetails } = useFoodCreators();
  const [kitchenDetails, setKitchenDetails] = useState<any>(null);

  // AI response state
  const [isAIModeActive, setIsAIModeActive] = useState(false);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiResponse, setAiResponse] = useState<{
    message: string;
    products: ProductCardProps[];
    dishIds: string[];
  } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiConversationId, setAiConversationId] = useState<string | undefined>();
  const [isAIChatDrawerVisible, setIsAIChatDrawerVisible] = useState(false);

  // Location hook
  const locationState = useUserLocation();

  // Track search query when AI mode is activated
  const searchQueryWhenAIActivatedRef = useRef<string>('');

  // Core animation values
  const drawerHeight = useSharedValue(SNAP_POINTS.COLLAPSED);
  const currentSnapPoint = useSharedValue<SnapPoint>(SNAP_POINTS.COLLAPSED);
  const gestureState = useSharedValue<"idle" | "dragging" | "settling">("idle");
  const initialTouchY = useSharedValue(0);
  const lastSnapPoint = useSharedValue<SnapPoint>(SNAP_POINTS.COLLAPSED);
  const startHeight = useSharedValue(0);
  const startSnapPoint = useSharedValue<SnapPoint>(SNAP_POINTS.COLLAPSED);

  // Load kitchen details
  useEffect(() => {
    if (kitchenId) {
      const loadKitchenDetails = async () => {
        try {
          const details = await getKitchenDetails(kitchenId);
          if (details) {
            setKitchenDetails({ data: details });
          }
        } catch (error) {
          // Error already handled in hook
        }
      };
      loadKitchenDetails();
    }
  }, [kitchenId, getKitchenDetails]);

  // Extract kitchen name from API response
  const apiKitchenName = kitchenDetails?.data?.kitchenName;

  // Use fetched kitchen name from API
  const isDemoName = propKitchenName === "Amara's Kitchen";
  const kitchenName = kitchenId
    ? (apiKitchenName || (!isDemoName && propKitchenName) || "Amara's Kitchen")
    : (propKitchenName || "Amara's Kitchen");

  // Initialize drawer to collapsed state
  useEffect(() => {
    drawerHeight.value = SNAP_POINTS.COLLAPSED;
    currentSnapPoint.value = SNAP_POINTS.COLLAPSED;
    lastSnapPoint.value = SNAP_POINTS.COLLAPSED;
  }, []);

  // State for JSX access
  const [currentSnapPointState, setCurrentSnapPointState] = useState(0);
  const [isExpandedState, setIsExpandedState] = useState(false);

  // Update state from derived values
  useDerivedValue(() => {
    const isExpanded = drawerHeight.value > SNAP_POINTS.COLLAPSED + 50;
    runOnJS(setIsExpandedState)(isExpanded);
    const snapIndex = isExpanded ? 1 : 0;
    runOnJS(setCurrentSnapPointState)(snapIndex);
  });

  const handleSheetChanges = useCallback((index: number) => {
    if (index === 0 && contentScrollRef.current) {
      contentScrollRef.current.scrollTo({ y: 0, animated: true });
    }
  }, []);

  const handleSearchPress = useCallback(() => {
    setIsSearchMode(true);
    setSearchQuery('');
    animateToSnapPoint(SNAP_POINTS.EXPANDED);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  }, []);

  const handleSearchSubmit = useCallback((query: string) => {
    const trimmed = query.trim();
    if (trimmed) {
      onSearchSubmit?.(trimmed);
      setIsSearchMode(false);
      setSearchQuery('');
    }
  }, [onSearchSubmit]);

  const handleSearchCancel = useCallback(() => {
    setIsSearchMode(false);
    setSearchQuery('');
    setIsAIModeActive(false);
    setAiResponse(null);
    setAiError(null);
    searchInputRef.current?.blur();
  }, []);

  // Handle AI sparkles button press
  const handleAISparklesPress = useCallback(async () => {
    // Capture current search query before activating AI mode
    searchQueryWhenAIActivatedRef.current = searchQuery;
    setIsAIModeActive(true);
    setIsGeneratingAI(true);
    setAiError(null);
    setAiResponse(null);

    try {
      // Use search query or default prompt
      const message = searchQuery.trim() || "What are some great meal recommendations for me?";

      // Prepare location data
      const location = locationState.location ? {
        latitude: locationState.location.latitude,
        longitude: locationState.location.longitude,
      } : undefined;

      // Send chat message
      const response = await sendChatMessage({
        message,
        conversation_id: aiConversationId,
        location,
      });

      // Transform recommendations to product cards
      const products: ProductCardProps[] = response.data.recommendations
        ? response.data.recommendations.map(transformDishToProductCard)
        : [];

      // Store dish IDs for cart operations
      const dishIds = response.data.recommendations?.map((r: any) => r.dish_id) || [];

      setAiResponse({
        message: response.data.message,
        products,
        dishIds,
      });
      setAiConversationId(response.data.conversation_id);
    } catch (err: any) {
      // Use the error message from the server (which is user-friendly)
      const errorMessage = err?.message || 'Failed to get AI response';
      setAiError(errorMessage);
      // Show toast notification for better visibility
      showError('AI Unavailable', errorMessage);
    } finally {
      setIsGeneratingAI(false);
    }
  }, [searchQuery, locationState.location, aiConversationId]);

  // Handle continue conversation - open full chat drawer
  const handleContinueConversation = useCallback(() => {
    setIsAIChatDrawerVisible(true);
    setIsAIModeActive(false);
  }, []);

  // Handle close AI chat drawer
  const handleCloseAIChatDrawer = useCallback(() => {
    setIsAIChatDrawerVisible(false);
  }, []);

  // Handle retry AI request
  const handleRetryAI = useCallback(() => {
    handleAISparklesPress();
  }, [handleAISparklesPress]);

  // Dismiss AI mode when user starts typing (search query changes from when AI was activated)
  useEffect(() => {
    if (isAIModeActive && searchQuery !== searchQueryWhenAIActivatedRef.current) {
      setIsAIModeActive(false);
      setAiResponse(null);
      setAiError(null);
    }
  }, [searchQuery, isAIModeActive]);

  // Reset AI state when search mode is cancelled or drawer goes back to resting state
  useEffect(() => {
    if (!isSearchMode && !isExpandedState) {
      setIsAIModeActive(false);
      setAiResponse(null);
      setAiError(null);
      setIsGeneratingAI(false);
      searchQueryWhenAIActivatedRef.current = '';
    }
  }, [isSearchMode, isExpandedState]);

  const handleBackdropPress = useCallback(() => {
    if (isExpandedState) {
      animateToSnapPoint(SNAP_POINTS.COLLAPSED);
    }
  }, [isExpandedState]);


  // Haptic feedback helper
  const triggerHaptic = useCallback(() => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => { });
    } catch {
      // Ignore haptic errors
    }
  }, []);

  // Smooth spring animation to snap point
  const animateToSnapPoint = useCallback(
    (snapPoint: SnapPoint, velocity = 0) => {
      "worklet";

      gestureState.value = "settling";
      currentSnapPoint.value = snapPoint;
      lastSnapPoint.value = snapPoint;

      const springConfig = {
        ...SPRING_CONFIG,
        velocity: velocity * 0.3,
      };

      drawerHeight.value = withSpring(snapPoint, springConfig, (finished) => {
        if (finished) {
          gestureState.value = "idle";
        }
      });
    },
    [] // Shared values don't need to be in dependencies
  );

  // Intelligent snap point calculation
  const calculateSnapPoint = useCallback(
    (currentHeight: number, velocityY: number, gestureDistance: number) => {
      "worklet";

      const hasSignificantVelocity = Math.abs(velocityY) > VELOCITY_THRESHOLD;
      const hasSignificantDistance = Math.abs(gestureDistance) > GESTURE_THRESHOLD;

      if (!hasSignificantVelocity && !hasSignificantDistance) {
        return lastSnapPoint.value;
      }

      if (hasSignificantVelocity) {
        if (velocityY > 0) {
          return SNAP_POINTS.COLLAPSED;
        } else {
          return SNAP_POINTS.EXPANDED;
        }
      }

      const midPoint = (SNAP_POINTS.COLLAPSED + SNAP_POINTS.EXPANDED) / 2;
      if (currentHeight < midPoint) {
        return SNAP_POINTS.COLLAPSED;
      } else {
        return SNAP_POINTS.EXPANDED;
      }
    },
    [] // Shared values don't need to be in dependencies
  );

  // Gesture handler
  const panGesture = Gesture.Pan()
    .minDistance(10)
    .activeOffsetY([-10, 10])
    .onStart((event) => {
      "worklet";
      gestureState.value = "dragging";
      startHeight.value = drawerHeight.value;
      startSnapPoint.value = currentSnapPoint.value;
      initialTouchY.value = event.absoluteY;
      runOnJS(triggerHaptic)();
    })
    .onUpdate((event) => {
      "worklet";
      let newHeight = startHeight.value - event.translationY;

      // Apply rubber band effect at boundaries
      if (newHeight < SNAP_POINTS.COLLAPSED) {
        const excess = SNAP_POINTS.COLLAPSED - newHeight;
        const resistance = Math.min(excess / 50, 0.9);
        newHeight = SNAP_POINTS.COLLAPSED - excess * (1 - resistance);
      } else if (newHeight > SNAP_POINTS.EXPANDED) {
        const excess = newHeight - SNAP_POINTS.EXPANDED;
        const resistance = Math.min(excess / 100, 0.8);
        newHeight = SNAP_POINTS.EXPANDED + excess * (1 - resistance);
      }

      drawerHeight.value = Math.max(SNAP_POINTS.COLLAPSED, newHeight);

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
      animateToSnapPoint(targetSnapPoint, -event.velocityY);
    })
    .onFinalize(() => {
      "worklet";
      if (gestureState.value === "dragging") {
        animateToSnapPoint(startSnapPoint.value);
      }
    });

  // Main container style
  const containerStyle = useAnimatedStyle(() => {
    "worklet";
    const finalHeight = Math.max(SNAP_POINTS.COLLAPSED, drawerHeight.value);
    return {
      height: finalHeight,
    };
  });

  // Background color style
  const backgroundColorStyle = useAnimatedStyle(() => {
    "worklet";
    return {
      backgroundColor: '#02120A',
    };
  });

  // Backdrop style
  const backdropStyle = useAnimatedStyle(() => {
    "worklet";
    const isExpanded = drawerHeight.value > SNAP_POINTS.COLLAPSED + 50;
    const opacity = isExpanded
      ? interpolate(
        drawerHeight.value,
        [SNAP_POINTS.COLLAPSED + 50, SNAP_POINTS.EXPANDED],
        [0.1, 0.3],
        Extrapolate.CLAMP
      )
      : 0;

    return {
      opacity,
      pointerEvents: isExpanded ? "auto" : "none",
    };
  });

  const isExpanded = isExpandedState;
  const currentSnapPointIndex = currentSnapPointState;

  return (
    <>
      {/* Backdrop */}
      {isExpanded ? (
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
              zIndex: 9997, // Below play button (9998) but above other content
            },
          ]}
        >
          <TouchableOpacity
            style={{ flex: 1 }}
            onPress={handleBackdropPress}
            activeOpacity={1}
          />
        </Animated.View>
      ) : null}

      {/* Main Drawer */}
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
              overflow: "hidden",
              zIndex: 9999,
            },
          ]}
        >
          <Animated.View
            style={[
              {
                flex: 1,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                position: "relative",
              },
              backgroundColorStyle,
            ]}
          >
            {/* Blur Overlay */}
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
                  intensity={80}
                  tint="dark"
                  style={{
                    flex: 1,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                  }}
                />
              ) : (
                <BlurEffect
                  intensity={80}
                  tint="dark"
                  useGradient={true}
                  style={{
                    flex: 1,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                  }}
                />
              )}
            </Animated.View>

            {/* Drag Indicator */}
            <View style={styles.dragIndicator} />

            {/* Content */}
            <View style={styles.content}>
              {isSearchMode ? (
                // Search Mode Interface
                <View style={styles.searchContainer}>
                  {/* Search Header */}
                  <View style={styles.searchHeader}>
                    <TouchableOpacity onPress={handleSearchCancel} style={styles.cancelButton}>
                      <Text style={styles.cancelText}>Cancel</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Search Input */}
                  <View style={styles.searchInputContainer}>
                    <SearchArea
                      ref={searchInputRef}
                      value={searchQuery}
                      onChange={setSearchQuery}
                      returnKeyType="search"
                      placeholder="Search for dishes, ingredients..."
                      onSubmitEditing={() => handleSearchSubmit(searchQuery)}
                      autoFocus={true}
                      editable={true}
                      onSparklesPress={handleAISparklesPress}
                      isAIModeActive={isAIModeActive}
                    />
                  </View>

                  {/* AI Response Overlay */}
                  {isAIModeActive && (
                    <>
                      {isGeneratingAI && <InlineAILoader isVisible={true} />}
                      {aiResponse && !isGeneratingAI && (
                        <AISearchResponseOverlay
                          message={aiResponse.message}
                          products={aiResponse.products}
                          dishIds={aiResponse.dishIds}
                          isLoading={false}
                          error={null}
                          onContinueConversation={handleContinueConversation}
                          conversationId={aiConversationId}
                        />
                      )}
                      {aiError && !isGeneratingAI && (
                        <AISearchResponseOverlay
                          message=""
                          products={[]}
                          dishIds={[]}
                          isLoading={false}
                          error={aiError}
                          onRetry={handleRetryAI}
                          onContinueConversation={handleContinueConversation}
                          conversationId={aiConversationId}
                        />
                      )}
                    </>
                  )}

                  {/* Search Results */}
                  <KitchenBottomSheetContent
                    ref={contentScrollRef}
                    isExpanded={true}
                    deliveryTime={deliveryTime}
                    kitchenId={kitchenId}
                    kitchenName={kitchenName}
                    searchQuery={searchQuery}
                    onMealPress={onMealPress}
                    onCartCountChange={onCartCountChange}
                  />
                </View>
              ) : (
                // Normal Content Interface
                <>
                  {/* Header */}
                  <KitchenBottomSheetHeader
                    deliveryTime={deliveryTime}
                    kitchenName={kitchenName}
                    currentSnapPoint={currentSnapPointIndex}
                    distance={distance}
                    kitchenId={kitchenId}
                    onHeartPress={onHeartPress}
                    onSearchPress={handleSearchPress}
                  />

                  {/* Content */}
                  <KitchenBottomSheetContent
                    ref={contentScrollRef}
                    isExpanded={isExpanded}
                    onScrollAttempt={() => !isExpanded && animateToSnapPoint(SNAP_POINTS.EXPANDED)}
                    deliveryTime={deliveryTime}
                    kitchenId={kitchenId}
                    kitchenName={kitchenName}
                    searchQuery={isSearchMode ? searchQuery : undefined}
                    onMealPress={onMealPress}
                    onCartCountChange={onCartCountChange}
                  />
                </>
              )}

              {/* Action Buttons */}
              <View style={styles.actionButtonsContainer}>
                {/* Cart Button */}
                <CartButton
                  quantity={cartItems}
                  onPress={onCartPress ?? (() => router.push('/orders/cart' as any))}
                  variant="view"
                  position="relative"
                  bottom={0}
                  left={0}
                  right={0}
                  showIcon={true}
                />
              </View>
            </View>
          </Animated.View>
        </Animated.View>
      </GestureDetector>

      {/* AI Chat Drawer */}
      <AIChatDrawer
        isVisible={isAIChatDrawerVisible}
        onClose={handleCloseAIChatDrawer}
      />
    </>
  );
};

const styles = StyleSheet.create({
  dragIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#EDEDED',
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cancelButton: {
    padding: 5,
  },
  cancelText: {
    color: '#EDEDED',
    fontSize: 16,
  },
  searchInputContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  actionButtonsContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
});
