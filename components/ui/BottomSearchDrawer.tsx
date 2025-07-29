import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Dimensions, Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  Extrapolate,
  interpolate,
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { getCompleteDynamicHeader, HeaderMessage } from '../../utils/dynamicHeaderMessages';
import { getDynamicSearchPrompt, SearchPrompt } from '../../utils/dynamicSearchPrompts';
import SearchArea from '../SearchArea';
import { Button } from './Button';

// Error boundary for icon components
const SafeIcon = ({ children, fallback }: { children: React.ReactNode; fallback?: React.ReactNode }) => {
  try {
    return <>{children}</>;
  } catch (error) {
    console.warn('Icon rendering error:', error);
    return <>{fallback || null}</>;
  }
};

// Link Icon Component
const LinkIcon = ({ size = 20, color = '#ffffff' }) => (
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
const VeganIcon = ({ size = 16, color = '#ffffff' }) => (
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
const GlutenFreeIcon = ({ size = 16, color = '#ffffff' }) => (
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
const SpicyIcon = ({ size = 16, color = '#ffffff' }) => (
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
const RestaurantIcon = ({ size = 18, color = '#a3b3a8' }) => (
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

// Sparkle Icon Component for search
const SparkleIcon = ({ size = 24, color = '#ffffff' }) => (
  <SafeIcon>
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"
        fill={color}
      />
      <Path
        d="M19 7L20.18 9.82L23 11L20.18 12.18L19 15L17.82 12.18L15 11L17.82 9.82L19 7Z"
        fill={color}
      />
    </Svg>
  </SafeIcon>
);

interface BottomSearchDrawerProps {
  onOpenAIChat?: () => void;
  onSearchSubmit?: (query: string, filter: string) => void;
  onSuggestionSelect?: (suggestion: any) => void;
  maxSuggestions?: number;
  enableHaptics?: boolean;
  accessibilityLabel?: string;
  userName?: string;
}

// Safe screen dimensions with fallback
const getScreenDimensions = () => {
  try {
    const { height } = Dimensions.get('window');
    return { height: Math.max(height, 400) }; // Minimum height fallback
  } catch (error) {
    console.warn('Failed to get screen dimensions:', error);
    return { height: 600 }; // Fallback height
  }
};

const { height: SCREEN_HEIGHT } = getScreenDimensions();
const DRAWER_HEIGHT = Math.min(SCREEN_HEIGHT * 0.85, 600); // Max 85% of screen or 600px
const COLLAPSED_HEIGHT = 100;

// Snap points represent the visible height of the drawer - no closed state
const SNAP_POINTS = {
  COLLAPSED: COLLAPSED_HEIGHT, 
  EXPANDED: DRAWER_HEIGHT
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
  maxSuggestions = 20,
  enableHaptics = true,
  accessibilityLabel = "Search drawer",
  userName = "there"
}: BottomSearchDrawerProps) {
  // Core animation values - using height instead of translateY
  const drawerHeight = useSharedValue(SNAP_POINTS.COLLAPSED);
  const currentSnapPoint = useSharedValue<SnapPoint>(SNAP_POINTS.COLLAPSED);
  const gestureState = useSharedValue<'idle' | 'dragging' | 'settling'>('idle');
  
  // Gesture tracking
  const initialTouchY = useSharedValue(0);
  const lastSnapPoint = useSharedValue<SnapPoint>(SNAP_POINTS.COLLAPSED);
  
  // Track if the gesture was a swipe (to avoid focusing input)
  const wasSwipeGesture = useSharedValue(false);
  
  // Search focus state
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filter chips state
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeSearchFilter, setActiveSearchFilter] = useState('all');
  
  // Dynamic search prompt state with error handling
  const [searchPrompt, setSearchPrompt] = useState<SearchPrompt>(() => {
    try {
      return getDynamicSearchPrompt();
    } catch (error) {
      console.warn('Failed to get dynamic search prompt:', error);
      return { placeholder: 'Search for food...', prompt: 'Find delicious meals' };
    }
  });

  // Dynamic header messages state
  const [headerMessage, setHeaderMessage] = useState<HeaderMessage>(() => {
    try {
      const message = getCompleteDynamicHeader(userName, true);
      // Ensure subtitle is always present
      return {
        ...message,
        subMessage: message.subMessage || "Find something different from your usual"
      };
    } catch (error) {
      console.warn('Failed to get dynamic header message:', error);
      return { 
        greeting: "Hello there",
        mainMessage: "Hungry?\nLet's Fix That",
        subMessage: "Find something different from your usual"
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
      } catch (error) {
        console.warn('Failed to update prompts:', error);
        // Keep existing prompts if update fails
      }
    };
    
    try {
      intervalRef.current = setInterval(updatePrompts, 30 * 60 * 1000);
      updatePrompts(); // Initial update
    } catch (error) {
      console.warn('Failed to set up prompt interval:', error);
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (focusTimeoutRef.current) {
        clearTimeout(focusTimeoutRef.current);
      }
    };
  }, [userName]);
  
  // Ref for search input focusing
  const searchInputRef = useRef<any>(null);

  // Safe haptics function
  const triggerHaptic = useCallback((style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (!enableHaptics) return;
    
    try {
      Haptics.impactAsync(style).catch(error => {
        console.warn('Haptic feedback failed:', error);
      });
    } catch (error) {
      console.warn('Haptic feedback error:', error);
    }
  }, [enableHaptics]);

  // Filter categories with error handling
  const filterCategories = [
    { id: 'all', label: 'All', color: '#ff4444', icon: <RestaurantIcon size={14} color="#ff4444" /> },
    { id: 'vegan', label: 'Vegan', color: '#00cc88', icon: <VeganIcon size={14} color="#00cc88" /> },
    { id: 'glutenfree', label: 'Gluten Free', color: '#ffaa00', icon: <GlutenFreeIcon size={14} color="#ffaa00" /> },
    { id: 'spicy', label: 'Spicy', color: '#ff3366', icon: <SpicyIcon size={14} color="#ff3366" /> },
    { id: 'healthy', label: 'Healthy', color: '#00dd99', icon: <VeganIcon size={14} color="#00dd99" /> },
    { id: 'fast', label: 'Fast Delivery', color: '#4488ff', icon: <LinkIcon size={14} color="#4488ff" /> },
    { id: 'budget', label: 'Under £15', color: '#ff6688', icon: <RestaurantIcon size={14} color="#ff6688" /> }
  ];

  // Search filter categories (more specific for search)
  const searchFilterCategories = [
    { id: 'all', label: 'All', color: '#ef4444' },
    { id: 'meals', label: 'Meals', color: '#ff6b35' },
    { id: 'kitchens', label: 'Kitchens', color: '#4f46e5' },
    { id: 'cuisines', label: 'Cuisines', color: '#059669' },
    { id: 'ingredients', label: 'Ingredients', color: '#dc2626' },
    { id: 'dietary', label: 'Dietary', color: '#7c3aed' }
  ];

  const handleFilterPress = useCallback((filterId: string) => {
    if (!filterId) return;
    
    triggerHaptic();
    setActiveFilter(filterId);
  }, [triggerHaptic]);

  const handleSearchFilterPress = useCallback((filterId: string) => {
    if (!filterId) return;
    
    triggerHaptic();
    setActiveSearchFilter(filterId);
  }, [triggerHaptic]);
  
  // Smooth spring animation to snap point
  const animateToSnapPoint = useCallback((snapPoint: SnapPoint, velocity = 0) => {
    'worklet';
    
    gestureState.value = 'settling';
    currentSnapPoint.value = snapPoint;
    lastSnapPoint.value = snapPoint;
    
    const springConfig = {
      ...SPRING_CONFIG,
      velocity: velocity * 0.3, // Dampen velocity for smoother animation
    };
    
    drawerHeight.value = withSpring(snapPoint, springConfig, (finished) => {
      if (finished) {
        gestureState.value = 'idle';
      }
    });
  }, []);

  // Intelligent snap point calculation
  const calculateSnapPoint = useCallback((currentHeight: number, velocityY: number, gestureDistance: number) => {
    'worklet';
    
    const hasSignificantVelocity = Math.abs(velocityY) > VELOCITY_THRESHOLD;
    const hasSignificantDistance = Math.abs(gestureDistance) > GESTURE_THRESHOLD;
    
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
  }, []);

  // Gesture handler with proper state management
  const gestureHandler = useAnimatedGestureHandler<
    PanGestureHandlerGestureEvent,
    { startHeight: number; startSnapPoint: SnapPoint; initialTouchY: number; startTime: number }
  >({
    onStart: (event, context) => {
      gestureState.value = 'dragging';
      context.startHeight = drawerHeight.value;
      context.startSnapPoint = currentSnapPoint.value;
      context.initialTouchY = event.absoluteY;
      context.startTime = Date.now();
      initialTouchY.value = event.absoluteY;
      wasSwipeGesture.value = false;
    },
    
    onActive: (event, context) => {
      // Check if this is a swipe gesture (significant movement)
      const gestureDistance = Math.abs(event.translationY);
      if (gestureDistance > 10) {
        wasSwipeGesture.value = true;
      }
      
      // Convert pan gesture to height change (inverted because dragging up increases height)
      let newHeight = context.startHeight - event.translationY;
      
      // Apply rubber band effect at boundaries
      if (newHeight < SNAP_POINTS.COLLAPSED) {
        // Strong resistance when trying to go below collapsed state
        const excess = SNAP_POINTS.COLLAPSED - newHeight;
        const resistance = Math.min(excess / 50, 0.9); // Stronger resistance
        newHeight = SNAP_POINTS.COLLAPSED - (excess * (1 - resistance));
      } else if (newHeight > SNAP_POINTS.EXPANDED) {
        // Resistance when trying to expand beyond max
        const excess = newHeight - SNAP_POINTS.EXPANDED;
        const resistance = Math.min(excess / 100, 0.8);
        newHeight = SNAP_POINTS.EXPANDED + (excess * (1 - resistance));
      }
      
      // Ensure minimum height is always collapsed height
      drawerHeight.value = Math.max(SNAP_POINTS.COLLAPSED, newHeight);
      
      // Update current snap point for smooth interpolations
      if (newHeight <= SNAP_POINTS.COLLAPSED + 50) {
        currentSnapPoint.value = SNAP_POINTS.COLLAPSED;
      } else {
        currentSnapPoint.value = SNAP_POINTS.EXPANDED;
      }
    },
    
    onEnd: (event, context) => {
      const gestureDistance = Math.abs(event.absoluteY - context.initialTouchY);
      const targetSnapPoint = calculateSnapPoint(drawerHeight.value, event.velocityY, gestureDistance);
      
      // If expanding to full height via swipe, don't focus input
      if (targetSnapPoint === SNAP_POINTS.EXPANDED && context.startSnapPoint === SNAP_POINTS.COLLAPSED && wasSwipeGesture.value) {
        // This was a swipe gesture - expand without focusing
        animateToSnapPoint(targetSnapPoint, -event.velocityY);
      } else {
        animateToSnapPoint(targetSnapPoint, -event.velocityY);
      }
    },
    
    onFail: (_, context) => {
      // Return to last known good state
      animateToSnapPoint(context.startSnapPoint);
    },
    
    onCancel: (_, context) => {
      // Return to last known good state
      animateToSnapPoint(context.startSnapPoint);
    },
  });



  // Main container style - positioned at bottom with dynamic height
  const containerStyle = useAnimatedStyle(() => {
    'worklet';
    const finalHeight = Math.max(SNAP_POINTS.COLLAPSED, drawerHeight.value);
    
    return {
      height: finalHeight,
    };
  });

  // Background color style - always white with red stain
  const backgroundColorStyle = useAnimatedStyle(() => {
    'worklet';
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

  // Derived values for safe access in JSX
  const currentGestureState = useDerivedValue(() => gestureState.value);
  const currentDrawerHeight = useDerivedValue(() => drawerHeight.value);
  const currentSnapPointValue = useDerivedValue(() => currentSnapPoint.value);

  // Update state from derived values
  useDerivedValue(() => {
    const intensity = currentGestureState.value === 'dragging' || currentGestureState.value === 'settling' ? 120 : 80;
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
    runOnJS(setIsSearchFocusedState)(isSearchFocused);
  }, [isSearchFocused]);

  // Backdrop with proper opacity and interaction blocking
  const backdropStyle = useAnimatedStyle(() => {
    'worklet';
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
      pointerEvents: shouldShowBackdrop ? 'auto' : 'none',
    };
  });

  // Content opacity for smooth reveal
  const contentOpacityStyle = useAnimatedStyle(() => {
    'worklet';
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
    'worklet';
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
    'worklet';
    const isCollapsed = drawerHeight.value <= SNAP_POINTS.COLLAPSED + 20;
    
    return {
      opacity: isCollapsed ? 0.8 : 1,
    };
  });

  // Collapsed search input style
  const collapsedSearchStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      // Only show when collapsed and not in search focus
      opacity: isCollapsedCondition.value ? 1 : 0,
      height: isCollapsedCondition.value ? 'auto' : 0,
      overflow: 'hidden',
    };
  });

  // Expanded search input pointer events style
  const expandedSearchPointerStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      // Disable pointer events on SearchArea when collapsed
      pointerEvents: currentSnapPointValue.value === SNAP_POINTS.COLLAPSED ? 'none' : 'auto',
    };
  });

  // Handle visual feedback
  const handleStyle = useAnimatedStyle(() => {
    'worklet';
    const isDragging = gestureState.value === 'dragging';
    
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
    const current = currentSnapPointValue.value;
    
    if (current === SNAP_POINTS.COLLAPSED) {
      // Expand without focusing input (handle tap)
      animateToSnapPoint(SNAP_POINTS.EXPANDED);
    } else {
      animateToSnapPoint(SNAP_POINTS.COLLAPSED);
    }
  }, [animateToSnapPoint]);

  // Handle search area tap when collapsed - should focus input
  const handleSearchTap = useCallback(() => {
    if (currentSnapPointValue.value === SNAP_POINTS.COLLAPSED) {
      animateToSnapPoint(SNAP_POINTS.EXPANDED);
      // Focus the search input after expansion
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300); // Wait for animation to complete
    }
  }, [animateToSnapPoint]);

  // Handle search focus when in expanded state
  const handleSearchFocus = useCallback(() => {
    if (currentSnapPointValue.value === SNAP_POINTS.EXPANDED) {
      setIsSearchFocused(true);
      searchInputRef.current?.focus();
    }
  }, []);

  // Handle search blur/cancel
  const handleSearchBlur = useCallback(() => {
    setIsSearchFocused(false);
    setSearchQuery('');
  }, []);

  // Mock search suggestions - replace with real data
  const searchSuggestions = [
    { id: 1, text: 'Pizza', category: 'Italian', kitchen: 'Mario\'s Kitchen', time: '25 min', distance: '0.8 mi', type: 'meals' },
    { id: 2, text: 'Sushi', category: 'Japanese', kitchen: 'Tokyo Express', time: '30 min', distance: '1.2 mi', type: 'meals' },
    { id: 3, text: 'Burger', category: 'American', kitchen: 'Street Grill', time: '20 min', distance: '0.5 mi', type: 'meals' },
    { id: 4, text: 'Tacos', category: 'Mexican', kitchen: 'Casa Miguel', time: '15 min', distance: '0.3 mi', type: 'meals' },
    { id: 5, text: 'Pad Thai', category: 'Thai', kitchen: 'Bangkok Bites', time: '35 min', distance: '1.5 mi', type: 'meals' },
    { id: 6, text: 'Mario\'s Kitchen', category: 'Italian', rating: '4.8', time: '25 min', distance: '0.8 mi', type: 'kitchens' },
    { id: 7, text: 'Tokyo Express', category: 'Japanese', rating: '4.6', time: '30 min', distance: '1.2 mi', type: 'kitchens' },
    { id: 8, text: 'Street Grill', category: 'American', rating: '4.4', time: '20 min', distance: '0.5 mi', type: 'kitchens' },
  ];

  // Filter suggestions based on active search filter with error handling
  const filteredSuggestions = useMemo(() => {
    try {
      const filtered = searchSuggestions.filter(suggestion => {
        if (!suggestion || !suggestion.type) return false;
        if (activeSearchFilter === 'all') return true;
        return suggestion.type === activeSearchFilter;
      });
      
      // Limit suggestions to prevent performance issues
      return filtered.slice(0, maxSuggestions);
    } catch (error) {
      console.warn('Error filtering suggestions:', error);
      return [];
    }
  }, [searchSuggestions, activeSearchFilter, maxSuggestions]);

  // Safe search submission handler
  const handleSearchSubmit = useCallback((query: string) => {
    if (!query || !query.trim()) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      if (onSearchSubmit) {
        onSearchSubmit(query.trim(), activeSearchFilter);
      } else {
        console.log('Searching for:', query.trim());
      }
    } catch (error) {
      console.error('Search submission error:', error);
      setError('Search failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [onSearchSubmit, activeSearchFilter]);

  // Safe suggestion selection handler
  const handleSuggestionSelect = useCallback((suggestion: any) => {
    if (!suggestion || !suggestion.text) return;
    
    try {
      setSearchQuery(suggestion.text);
      
      if (onSuggestionSelect) {
        onSuggestionSelect(suggestion);
      } else {
        console.log('Selected:', suggestion.text);
      }
    } catch (error) {
      console.error('Suggestion selection error:', error);
      setError('Failed to select suggestion. Please try again.');
    }
  }, [onSuggestionSelect]);

  // Update header message when drawer expands
  const updateHeaderMessage = useCallback(() => {
    try {
      const message = getCompleteDynamicHeader(userName, true);
      // Ensure subtitle is always present
      setHeaderMessage({
        ...message,
        subMessage: message.subMessage || "Find something different from your usual"
      });
    } catch (error) {
      console.warn('Failed to update header message:', error);
    }
  }, [userName]);

  // Update header when drawer expands to show fresh content
  useEffect(() => {
    if (currentSnapPointValue.value === SNAP_POINTS.EXPANDED && !isSearchFocused) {
      // Small delay to ensure smooth animation
      const timer = setTimeout(updateHeaderMessage, 100);
      return () => clearTimeout(timer);
    }
  }, [currentSnapPointValue.value, isSearchFocused, updateHeaderMessage]);

  const handleBackdropPress = useCallback(() => {
    try {
      if (isSearchFocused) {
        handleSearchBlur();
      } else {
        animateToSnapPoint(SNAP_POINTS.COLLAPSED);
      }
    } catch (error) {
      console.error('Backdrop press error:', error);
    }
  }, [animateToSnapPoint, isSearchFocused, handleSearchBlur]);

  // Safe image loading component
  const SafeImage = ({ source, style, ...props }: any) => {
    const [imageError, setImageError] = useState(false);
    
    if (imageError) {
      return (
        <View style={[style, { backgroundColor: 'rgba(255, 255, 255, 0.1)', justifyContent: 'center', alignItems: 'center' }]}>
          <Text style={{ color: '#8a9a8f', fontSize: 12 }}>Image unavailable</Text>
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
    const announceDrawerState = () => {
      try {
        const isExpanded = currentSnapPointValue.value === SNAP_POINTS.EXPANDED;
        const announcement = isExpanded ? 'Search drawer expanded' : 'Search drawer collapsed';
        AccessibilityInfo.announceForAccessibility(announcement);
      } catch (error) {
        console.warn('Accessibility announcement failed:', error);
      }
    };

    // Announce state changes for screen readers
    if (isSearchFocused) {
      AccessibilityInfo.announceForAccessibility('Search mode activated');
    }
  }, [isSearchFocused, currentSnapPointValue.value]);

  // Error boundary for the entire component
  if (error) {
    return (
      <View style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 16,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        zIndex: 9999,
      }}>
        <Text style={{ color: '#ef4444', fontSize: 14, textAlign: 'center', marginBottom: 8 }}>
          {error}
        </Text>
        <TouchableOpacity
          style={{
            backgroundColor: '#ef4444',
            padding: 8,
            borderRadius: 8,
            alignItems: 'center',
          }}
          onPress={() => setError(null)}
        >
          <Text style={{ color: '#ffffff', fontSize: 12 }}>Dismiss</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <>
      {/* Backdrop - Only show when expanded or search focused */}
      {isSearchFocused || isExpandedCondition.value ? (
        <Animated.View 
          style={[
            backdropStyle,
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 1)',
              opacity: isSearchFocused ? 0.8 : undefined, // Stronger backdrop when searching
            }
          ]}
          pointerEvents={isSearchFocused ? 'auto' : 'none'}
        >
          <TouchableOpacity 
            style={{ flex: 1 }}
            onPress={handleBackdropPress}
            activeOpacity={1}
          />
        </Animated.View>
      ) : null}

      {/* Main Drawer - Always positioned at bottom */}
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
          style={[
            containerStyle,
            {
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              borderTopLeftRadius: 20,
              borderTopRightRadius: 20,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.3,
              shadowRadius: 16,
              elevation: 20,
              overflow: 'hidden', // Ensure content doesn't spill out
              zIndex: 9999, // Lower than NoshHeavenPlayer (99999) but above other content
            }
          ]}
        >
          <Animated.View
            style={[
              {
                flex: 1,
                borderTopLeftRadius: 20,
                borderTopRightRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.2)',
                borderBottomWidth: 0,
                position: 'relative',
              },
              backgroundColorStyle
            ]}
          >
            {/* Dynamic Blur Overlay */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  overflow: 'hidden',
                }
              ]}
            >
              <BlurView
                intensity={blurIntensityState}
                tint="light"
                style={{
                  flex: 1,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                }}
              />
            </Animated.View>
            {/* Red stain overlay - always present but varies in intensity */}
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  borderTopLeftRadius: 20,
                  borderTopRightRadius: 20,
                  backgroundColor: 'rgba(239, 68, 68, 0.15)', // Cribnosh red stain
                  opacity: interpolate(
                    drawerHeight.value,
                    [SNAP_POINTS.COLLAPSED, SNAP_POINTS.EXPANDED],
                    [0.7, 0.4],
                    Extrapolate.CLAMP
                  ),
                }
              ]}
            />
          {/* Handle Area - Hide when search is focused */}
          {!isSearchFocused && (
                      <TouchableOpacity 
            onPress={handleTap}
            style={{ 
              alignItems: 'center',
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
                }
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
            justifyContent: 'flex-start'
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
                    alignItems: 'center',
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
                      }
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
                    editable={!isLoading}
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
                            backgroundColor: isActive ? filter.color : 'rgba(255, 255, 255, 0.15)',
                            borderRadius: 18,
                            borderWidth: 1,
                            borderColor: isActive ? filter.color : 'rgba(255, 255, 255, 0.25)',
                            shadowColor: isActive ? filter.color : 'rgba(255, 255, 255, 0.3)',
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: isActive ? 0.4 : 0.2,
                            shadowRadius: 6,
                            elevation: isActive ? 4 : 2,
                            overflow: 'hidden',
                          }}
                          activeOpacity={0.8}
                        >
                          <BlurView
                            intensity={isActive ? 40 : 60}
                            tint="light"
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              borderRadius: 18,
                              backgroundColor: 'rgba(255, 255, 255, 0.1)',
                            }}
                          />
                          <Text
                            style={{
                              fontSize: 13,
                              fontWeight: isActive ? '700' : '500',
                              color: isActive ? '#ffffff' : '#2a2a2a',
                              letterSpacing: 0.2,
                              textShadowColor: isActive ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.8)',
                              textShadowOffset: { width: 0, height: 1 },
                              textShadowRadius: 2,
                            }}
                          >
                            {filter.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* Search Results - Compact list */}
                <View>
                  {searchQuery.trim() ? (
                    <Text style={{ 
                      color: '#2a2a2a', 
                      fontSize: 12,
                      fontWeight: '700',
                      marginBottom: 16,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      opacity: 0.8,
                    }}>
                      {filteredSuggestions.length} RESULTS FOR "{searchQuery.toUpperCase()}"
                    </Text>
                  ) : (
                    <Text style={{ 
                      color: '#2a2a2a', 
                      fontSize: 12,
                      fontWeight: '700',
                      marginBottom: 16,
                      textTransform: 'uppercase',
                      letterSpacing: 1,
                      opacity: 0.8,
                    }}>
                      POPULAR {activeSearchFilter.toUpperCase()}
                    </Text>
                  )}
                  
                  {filteredSuggestions.map((suggestion, index) => (
                    <TouchableOpacity
                      key={suggestion.id}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        paddingVertical: 14,
                        paddingHorizontal: 12,
                        backgroundColor: 'rgba(255, 255, 255, 0.06)',
                        borderRadius: 14,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: 'rgba(255, 255, 255, 0.12)',
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.05,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                      onPress={() => {
                        handleSuggestionSelect(suggestion);
                      }}
                      activeOpacity={0.85}
                      disabled={isLoading}
                    >
                      {/* Compact Icon */}
                      <View style={{
                        width: 36,
                        height: 36,
                        borderRadius: 18,
                        backgroundColor: 'rgba(255, 255, 255, 0.12)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 12,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 1 },
                        shadowOpacity: 0.1,
                        shadowRadius: 2,
                        elevation: 1,
                      }}>
                        {suggestion.type === 'kitchens' ? (
                          <RestaurantIcon size={16} color="#8a9a8f" />
                        ) : (
                          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                            <Path
                              d="M12 2L13.09 8.26L16 7L14.5 12.5L19 10.5L16.5 16.5L22 15L18.5 20L12 22L5.5 20L2 15L7.5 16.5L5 10.5L9.5 12.5L8 7L10.91 8.26L12 2Z"
                              fill="#8a9a8f"
                            />
                          </Svg>
                        )}
                      </View>

                      {/* Compact Content */}
                      <View style={{ flex: 1 }}>
                        <Text style={{
                          color: '#1a1a1a',
                          fontSize: 15,
                          fontWeight: '600',
                          marginBottom: 3,
                          letterSpacing: -0.2,
                        }}>
                          {suggestion.text}
                        </Text>
                        <Text style={{
                          color: '#5a5a5a',
                          fontSize: 12,
                          fontWeight: '400',
                          lineHeight: 16,
                        }}>
                          {suggestion.type === 'kitchens' 
                            ? `${suggestion.category} • ${suggestion.rating}★ • ${suggestion.time}`
                            : `${suggestion.category} • ${suggestion.kitchen} • ${suggestion.time}`
                          }
                        </Text>
                      </View>

                      {/* Compact Action Icon */}
                      <View style={{
                        width: 28,
                        height: 28,
                        borderRadius: 14,
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginLeft: 8,
                      }}>
                        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
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
                  ))}

                  {/* No Results State */}
                  {searchQuery.trim() && filteredSuggestions.length === 0 && (
                    <View style={{
                      alignItems: 'center',
                      paddingVertical: 48,
                      paddingHorizontal: 24,
                    }}>
                      <View style={{
                        width: 64,
                        height: 64,
                        borderRadius: 32,
                        backgroundColor: 'rgba(255, 255, 255, 0.08)',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginBottom: 16,
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.1,
                        shadowRadius: 4,
                        elevation: 2,
                      }}>
                        <Svg width={28} height={28} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M21 21L16.514 16.506L21 21ZM19 10.5C19 15.194 15.194 19 10.5 19C5.806 19 2 15.194 2 10.5C2 5.806 5.806 2 10.5 2C15.194 2 19 5.806 19 10.5Z"
                            stroke="#8a9a8f"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </View>
                      <Text style={{
                        color: '#2a2a2a',
                        fontSize: 17,
                        fontWeight: '600',
                        marginBottom: 6,
                        textAlign: 'center',
                        letterSpacing: -0.2,
                      }}>
                        No results found
                      </Text>
                      <Text style={{
                        color: '#6a6a6a',
                        fontSize: 14,
                        textAlign: 'center',
                        lineHeight: 20,
                        fontWeight: '400',
                      }}>
                        Try adjusting your search or{'\n'}browse different categories
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            ) : (
              <>
                {/* Normal Content - Show when not in search focus mode */}
                
                {/* Search Input - Visible when collapsed (above title) */}
                <Animated.View 
                  style={[
                    searchInputStyle, 
                    { marginBottom: 16, marginTop: 0 },
                    collapsedSearchStyle
                  ]}
                >
                  <TouchableOpacity 
                    onPress={() => {
                      if (currentSnapPointValue.value === SNAP_POINTS.COLLAPSED) {
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
                        expandedSearchPointerStyle
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

                {/* Title Section - Only show when expanded */}
            <Animated.View style={[{ marginBottom: 20 }, contentOpacityStyle]}>
              <Text style={{ 
                color: '#1a1a1a', 
                fontSize: 32, 
                fontWeight: '700',
                letterSpacing: -0.5,
                lineHeight: 36,
              }}>
                {headerMessage.greeting}
              </Text>
              <Text style={{ 
                color: '#1a1a1a', 
                fontSize: 24, 
                fontWeight: '700',
                letterSpacing: -0.5,
                lineHeight: 28,
                marginBottom: 10,
              }}>
                {headerMessage.mainMessage}
              </Text>
              <Text style={{ 
                color: '#4a4a4a', 
                fontSize: 15,
                lineHeight: 19,
                fontWeight: '400',
              }}>
                {headerMessage.subMessage}
              </Text>
            </Animated.View>

                {/* Search Input - Visible when expanded (below title) */}
                <Animated.View style={[searchInputStyle, { marginBottom: 16 }, contentOpacityStyle]}>
              <TouchableOpacity 
                    onPress={handleSearchFocus}
                activeOpacity={1}
                style={{ flex: 1 }}
              >
                <Animated.View
                  style={[
                    searchInteractionStyle,
                      ]}
                    >
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
                <Animated.View style={[contentOpacityStyle, { marginBottom: 20 }]}>
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
                            overflow: 'hidden',
                            minWidth: 60,
                            shadowColor: '#000',
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
                                : 'rgba(255, 255, 255, 0.2)', // Enhanced glass effect
                              borderWidth: 1,
                              borderColor: isActive 
                                ? `${filter.color}80` // More transparent border
                                : 'rgba(255, 255, 255, 0.3)', // Enhanced glass border
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexDirection: 'row',
                              gap: 4,
                            }}
                          >
                            {filter.icon}
                            <Text
                              style={{
                                fontSize: 14,
                                fontWeight: isActive ? '600' : '500',
                                color: isActive ? filter.color : '#2a2a2a',
                                textAlign: 'center',
                                textShadowColor: isActive ? 'rgba(255, 255, 255, 0.8)' : 'rgba(255, 255, 255, 0.9)',
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
                  </ScrollView>
                </Animated.View>

                {/* Try It's on me Section - Only show when expanded */}
                <Animated.View style={[contentOpacityStyle, { marginBottom: 16 }]}>
                  <Text style={{ 
                    color: '#1a1a1a', 
                    fontSize: 18, 
                    fontWeight: '700',
                    lineHeight: 22,
                    marginBottom: 6,
                  }}>
                    Try It's on me
                  </Text>
                  <Text style={{ 
                    color: '#4a4a4a', 
                    fontSize: 13,
                    lineHeight: 17,
                    fontWeight: '400',
                    marginBottom: 16,
                  }}>
                    Send a link to a friend so they can order{'\n'}food on you.
                  </Text>

                  {/* Invite Buttons Row */}
                  <View style={{ 
                    flexDirection: 'row', 
                    gap: 8, 
                    marginBottom: 12 
                  }}>
                    <View style={{ flex: 1 }}>
                      <Button
                        backgroundColor="#4a5d4f"
                        textColor="#ffffff"
                        borderRadius={20}
                        paddingVertical={10}
                        paddingHorizontal={12}
                        onPress={() => {}}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>
                            Invite Friend
                          </Text>
                          <LinkIcon size={14} />
                        </View>
                      </Button>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Button
                        backgroundColor="#4a5d4f"
                        textColor="#ffffff"
                        borderRadius={20}
                        paddingVertical={10}
                        paddingHorizontal={12}
                        onPress={() => {}}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '600' }}>
                            Setup Family
                          </Text>
                          <LinkIcon size={14} />
                        </View>
                      </Button>
                    </View>
                  </View>

                  {/* Start Group Order Button */}
                  <Button
                    backgroundColor="#ef4444"
                    textColor="#ffffff"
                    borderRadius={20}
                    paddingVertical={12}
                    paddingHorizontal={16}
                    onPress={() => {}}
                    style={{ width: '100%' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600' }}>
                        Start Group Order
                      </Text>
                      <LinkIcon size={16} />
          </View>
                  </Button>
                </Animated.View>

                {/* Food Illustration - Only show when expanded */}
                <Animated.View style={[contentOpacityStyle, { alignItems: 'center', marginBottom: 20 }]}>
                  <SafeImage 
                    source={require('../../assets/images/cribnoshpackaging.png')}
                    style={{ 
                      width: 180, 
                      height: 135, 
                      resizeMode: 'contain' 
                    }}
                  />
                </Animated.View>

                {/* Bottom Text - Only show when expanded */}
                <Animated.View style={[contentOpacityStyle, { alignItems: 'center' }]}>
                  <Text style={{ 
                    color: '#4a4a4a', 
                    fontSize: 16,
                    lineHeight: 20,
                    fontWeight: '400',
                    textAlign: 'center',
                  }}>
                    Search is smart, Search gets{'\n'}you
                  </Text>
                </Animated.View>
              </>
            )}
          </ScrollView>
          </Animated.View>
        </Animated.View>
      </PanGestureHandler>
    </>
  );
}