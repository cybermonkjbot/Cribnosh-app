import { useChefAuth } from '@/contexts/ChefAuthContext';
import { BlurEffect } from '@/utils/blurEffects';
import { useRouter } from 'expo-router';
import { Camera, ChefHat, Plus, UtensilsCrossed, Video } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface FloatingActionButtonProps {
  bottomPosition?: number;
  rightPosition?: number;
  onCameraPress?: () => void;
  onRecipePress?: () => void;
  onLiveStreamPress?: () => void;
  onOrdersPress?: () => void;
  showCartCounter?: boolean;
  cartItemCount?: number;
  isSearchDrawerExpanded?: boolean;
  isAnySheetOpen?: boolean;
  isAnyModalOpen?: boolean;
}

export function FloatingActionButton({
  bottomPosition,
  rightPosition = 20,
  onCameraPress,
  onRecipePress,
  onLiveStreamPress,
  onOrdersPress,
  showCartCounter = false,
  cartItemCount = 0,
  isSearchDrawerExpanded = false,
  isAnySheetOpen = false,
  isAnyModalOpen = false,
}: FloatingActionButtonProps) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [lastUsedFunction, setLastUsedFunction] = useState<'camera' | 'recipe' | 'live' | 'orders' | 'cart' | null>(null);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useChefAuth();
  
  // Tab bar height is 95px
  const TAB_BAR_HEIGHT = 95;
  // Default gap above tab bar (smaller gap for closer positioning)
  const DEFAULT_GAP = 5;
  // If bottomPosition is provided, use it as the gap above the tab bar
  // If not provided, use the default gap
  const gapAboveTabBar = bottomPosition !== undefined ? bottomPosition : DEFAULT_GAP;
  // Calculate position: tab bar height + gap above tab bar + safe area bottom
  const calculatedBottomPosition = TAB_BAR_HEIGHT + gapAboveTabBar + insets.bottom;
  
  // Animated bottom position that adjusts when modals/sheets are open
  // Initialize with calculated position
  const animatedBottomPosition = useSharedValue(calculatedBottomPosition);
  
  // Update position when calculated position changes (e.g., safe area insets change)
  useEffect(() => {
    if (!isSearchDrawerExpanded && !isAnySheetOpen && !isAnyModalOpen) {
      animatedBottomPosition.value = withSpring(calculatedBottomPosition, {
        damping: 20,
        stiffness: 300,
      });
    }
  }, [calculatedBottomPosition, isSearchDrawerExpanded, isAnySheetOpen, isAnyModalOpen, animatedBottomPosition]);
  
  // Adjust position when search drawer is expanded or any sheet/modal is open
  useEffect(() => {
    const shouldMoveDown = isSearchDrawerExpanded || isAnySheetOpen || isAnyModalOpen;
    // When sheets are open, move closer to bottom but still respect safe area
    const targetPosition = shouldMoveDown ? insets.bottom + 10 : calculatedBottomPosition;
    
    animatedBottomPosition.value = withSpring(targetPosition, {
      damping: 20,
      stiffness: 300,
    });
  }, [isSearchDrawerExpanded, isAnySheetOpen, isAnyModalOpen, calculatedBottomPosition, insets.bottom, animatedBottomPosition]);
  
  // Animation values for badge and icon
  const badgeScale = useSharedValue(cartItemCount > 0 ? 1 : 0);
  const iconOpacity = useSharedValue(1);
  const prevCartCountRef = useRef(cartItemCount);
  const prevLastFunctionRef = useRef<'camera' | 'recipe' | 'live' | 'orders' | 'cart' | null>(null);
  const isInitialMount = useRef(true);

  // Circular menu configuration
  const menuRadius = 120; // Radius in pixels for circular arrangement

  // Animation values for each menu item (scale, opacity, position)
  const cameraScale = useSharedValue(0);
  const cameraOpacity = useSharedValue(0);
  const cameraTranslateX = useSharedValue(0);
  const cameraTranslateY = useSharedValue(0);

  const recipeScale = useSharedValue(0);
  const recipeOpacity = useSharedValue(0);
  const recipeTranslateX = useSharedValue(0);
  const recipeTranslateY = useSharedValue(0);

  const liveScale = useSharedValue(0);
  const liveOpacity = useSharedValue(0);
  const liveTranslateX = useSharedValue(0);
  const liveTranslateY = useSharedValue(0);

  const ordersScale = useSharedValue(0);
  const ordersOpacity = useSharedValue(0);
  const ordersTranslateX = useSharedValue(0);
  const ordersTranslateY = useSharedValue(0);
  
  // Animate badge when cart count changes
  useEffect(() => {
    if (cartItemCount > 0) {
      badgeScale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
    } else {
      badgeScale.value = withTiming(0, {
        duration: 100,
      });
    }
    prevCartCountRef.current = cartItemCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartItemCount]);
  
  // Animate icon opacity when switching (only if values actually changed)
  useEffect(() => {
    // Skip animation on initial mount
    if (isInitialMount.current) {
      isInitialMount.current = false;
      prevLastFunctionRef.current = lastUsedFunction;
      prevCartCountRef.current = cartItemCount;
      return;
    }
    
    const shouldAnimate = 
      prevLastFunctionRef.current !== lastUsedFunction || 
      prevCartCountRef.current !== cartItemCount;
    
    if (shouldAnimate) {
      iconOpacity.value = withTiming(0, { duration: 100 }, () => {
        iconOpacity.value = withTiming(1, { duration: 200 });
      });
    }
    prevLastFunctionRef.current = lastUsedFunction;
    prevCartCountRef.current = cartItemCount;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastUsedFunction, cartItemCount]);

  // Get main button icon based on context
  const getMainButtonIcon = () => {
    // Show icon based on last used function
    if (lastUsedFunction === 'camera') {
      return <Camera size={20} color="#FFFFFF" />;
    }
    if (lastUsedFunction === 'recipe') {
      return <ChefHat size={20} color="#FFFFFF" />;
    }
    if (lastUsedFunction === 'live') {
      return <Video size={20} color="#FFFFFF" />;
    }
    if (lastUsedFunction === 'orders') {
      return <UtensilsCrossed size={20} color="#FFFFFF" />;
    }
    
    // Default plus icon
    return <Plus size={20} color="#FFFFFF" strokeWidth={3} />;
  };

  const requireAuth = () => {
    if (!isAuthenticated) {
      router.push({
        pathname: '/sign-in',
        params: { notDismissable: 'true' }
      });
      setIsActionMenuOpen(false);
      return false;
    }
    return true;
  };

  const handleCameraPress = () => {
    if (!requireAuth()) return;
    setLastUsedFunction('camera');
    if (onCameraPress) {
      onCameraPress();
    } else {
      router.push('/camera-modal' as any);
    }
    setIsActionMenuOpen(false);
  };

  const handleRecipePress = () => {
    if (!requireAuth()) return;
    setLastUsedFunction('recipe');
    if (onRecipePress) {
      onRecipePress();
    } else {
      console.log('Recipe Share pressed');
    }
    setIsActionMenuOpen(false);
  };


  const handleLiveStreamPress = () => {
    if (!requireAuth()) return;
    setLastUsedFunction('live');
    if (onLiveStreamPress) {
      onLiveStreamPress();
    } else {
      router.push('/(tabs)/chef/live' as any);
    }
    setIsActionMenuOpen(false);
  };

  const handleOrdersPress = () => {
    // Orders can be viewed without auth, but we'll still check
    setLastUsedFunction('orders');
    if (onOrdersPress) {
      onOrdersPress();
    } else {
      router.push('/(tabs)/orders' as any);
    }
    setIsActionMenuOpen(false);
  };

  // Main button press handler
  const handleMainButtonPress = () => {
    // Toggle menu
      setIsActionMenuOpen(!isActionMenuOpen);
  };

  // Main button long press handler - always opens menu
  const handleMainButtonLongPress = () => {
    setIsActionMenuOpen(true);
  };

  // Badge animation style
  const badgeAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: badgeScale.value }],
      opacity: badgeScale.value > 0 ? 1 : 0,
    };
  });

  // Icon animation style for smooth transitions
  const iconAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: iconOpacity.value,
    };
  });

  // Format cart count for display (show "9+" if more than 9)
  const displayCartCount = cartItemCount > 99 ? '99+' : cartItemCount.toString();

  // Calculate circular positions using trigonometry
  const calculatePosition = (angle: number, radius: number) => {
    const angleInRadians = (angle * Math.PI) / 180;
    return {
      x: radius * Math.cos(angleInRadians),
      y: radius * Math.sin(angleInRadians),
    };
  };

  // Animate menu items when menu opens/closes
  useEffect(() => {
    const springConfig = {
      damping: 15,
      stiffness: 150,
    };

    const timingConfig = {
      duration: 200,
    };

    if (isActionMenuOpen) {
      // Opening animation - stagger each item slightly
      // Angles: All positioned towards top and top-left (270°, 240°, 210°, 180°)
      const cameraPos = calculatePosition(270, menuRadius); // Top
      const recipePos = calculatePosition(240, menuRadius); // Top-left
      const livePos = calculatePosition(210, menuRadius); // More towards left
      const ordersPos = calculatePosition(180, menuRadius); // Left

      cameraTranslateX.value = withDelay(0, withSpring(cameraPos.x, springConfig));
      cameraTranslateY.value = withDelay(0, withSpring(cameraPos.y, springConfig));
      cameraScale.value = withDelay(0, withSpring(1, springConfig));
      cameraOpacity.value = withDelay(0, withTiming(1, timingConfig));

      recipeTranslateX.value = withDelay(50, withSpring(recipePos.x, springConfig));
      recipeTranslateY.value = withDelay(50, withSpring(recipePos.y, springConfig));
      recipeScale.value = withDelay(50, withSpring(1, springConfig));
      recipeOpacity.value = withDelay(50, withTiming(1, timingConfig));

      liveTranslateX.value = withDelay(100, withSpring(livePos.x, springConfig));
      liveTranslateY.value = withDelay(100, withSpring(livePos.y, springConfig));
      liveScale.value = withDelay(100, withSpring(1, springConfig));
      liveOpacity.value = withDelay(100, withTiming(1, timingConfig));

      ordersTranslateX.value = withDelay(150, withSpring(ordersPos.x, springConfig));
      ordersTranslateY.value = withDelay(150, withSpring(ordersPos.y, springConfig));
      ordersScale.value = withDelay(150, withSpring(1, springConfig));
      ordersOpacity.value = withDelay(150, withTiming(1, timingConfig));
    } else {
      // Closing animation - animate back to center
      cameraTranslateX.value = withTiming(0, timingConfig);
      cameraTranslateY.value = withTiming(0, timingConfig);
      cameraScale.value = withTiming(0, timingConfig);
      cameraOpacity.value = withTiming(0, timingConfig);

      recipeTranslateX.value = withTiming(0, timingConfig);
      recipeTranslateY.value = withTiming(0, timingConfig);
      recipeScale.value = withTiming(0, timingConfig);
      recipeOpacity.value = withTiming(0, timingConfig);

      liveTranslateX.value = withTiming(0, timingConfig);
      liveTranslateY.value = withTiming(0, timingConfig);
      liveScale.value = withTiming(0, timingConfig);
      liveOpacity.value = withTiming(0, timingConfig);

      ordersTranslateX.value = withTiming(0, timingConfig);
      ordersTranslateY.value = withTiming(0, timingConfig);
      ordersScale.value = withTiming(0, timingConfig);
      ordersOpacity.value = withTiming(0, timingConfig);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActionMenuOpen]);

  // Animated styles for menu items
  const cameraAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: cameraTranslateX.value },
      { translateY: cameraTranslateY.value },
      { scale: cameraScale.value },
    ],
    opacity: cameraOpacity.value,
  }));

  const recipeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: recipeTranslateX.value },
      { translateY: recipeTranslateY.value },
      { scale: recipeScale.value },
    ],
    opacity: recipeOpacity.value,
  }));

  const liveAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: liveTranslateX.value },
      { translateY: liveTranslateY.value },
      { scale: liveScale.value },
    ],
    opacity: liveOpacity.value,
  }));

  const ordersAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: ordersTranslateX.value },
      { translateY: ordersTranslateY.value },
      { scale: ordersScale.value },
    ],
    opacity: ordersOpacity.value,
  }));

  // Animated style for bottom position
  const animatedContainerStyle = useAnimatedStyle(() => {
    return {
      bottom: animatedBottomPosition.value,
      right: rightPosition,
    };
  });

  return (
    <Animated.View style={[styles.floatingActionButton, animatedContainerStyle]}>
      {/* Cart Counter Badge - Positioned on the right side of the pill */}
      {showCartCounter && cartItemCount > 0 && (
        <Animated.View style={[styles.cartBadge, badgeAnimatedStyle]}>
          <Text style={styles.cartBadgeText}>{displayCartCount}</Text>
        </Animated.View>
      )}
      
      <TouchableOpacity
        style={[
          styles.mainActionButton,
          isActionMenuOpen && styles.mainActionButtonOpen
        ]}
        onPress={handleMainButtonPress}
        onLongPress={handleMainButtonLongPress}
        activeOpacity={0.8}
      >
        {/* Glassy/Frosted Blur Effect */}
        <BlurEffect
          intensity={20}
          tint="light"
          useGradient={true}
          backgroundColor="rgba(255, 59, 48, 0.75)"
          style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }, { zIndex: 0 }]}
        />
        
        {/* Content container - positioned above blur */}
        <View style={styles.buttonContent}>
          <Animated.View style={[styles.mainButtonIcon, iconAnimatedStyle]}>
            {getMainButtonIcon()}
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Circular Icon Menu Items */}
      {/* Camera Button - Top */}
      <Animated.View
        style={[
          styles.circularMenuItem,
          cameraAnimatedStyle,
          { position: 'absolute', top: 0, right: 0 },
        ]}
        pointerEvents={isActionMenuOpen ? 'auto' : 'none'}
      >
          <TouchableOpacity
          style={[styles.circularIconButton, { backgroundColor: '#FFFFFF', borderColor: '#FF3B30' }]}
            onPress={handleCameraPress}
            activeOpacity={0.8}
          accessibilityLabel="Create Food Content"
          accessibilityRole="button"
          >
          <Camera size={24} color="#FF3B30" />
          </TouchableOpacity>
      </Animated.View>

      {/* Recipe Share Button - Top Right */}
      <Animated.View
        style={[
          styles.circularMenuItem,
          recipeAnimatedStyle,
          { position: 'absolute', top: 0, right: 0 },
        ]}
        pointerEvents={isActionMenuOpen ? 'auto' : 'none'}
      >
          <TouchableOpacity
          style={[styles.circularIconButton, { backgroundColor: '#FFFFFF', borderColor: '#0B9E58' }]}
            onPress={handleRecipePress}
            activeOpacity={0.8}
          accessibilityLabel="Recipe Share"
          accessibilityRole="button"
          >
          <ChefHat size={24} color="#0B9E58" />
          </TouchableOpacity>
      </Animated.View>

      {/* Live Stream Button */}
      <Animated.View
        style={[
          styles.circularMenuItem,
          liveAnimatedStyle,
          { position: 'absolute', top: 0, right: 0 },
        ]}
        pointerEvents={isActionMenuOpen ? 'auto' : 'none'}
      >
          <TouchableOpacity
          style={[styles.circularIconButton, { backgroundColor: '#FFFFFF', borderColor: '#8B5CF6' }]}
            onPress={handleLiveStreamPress}
            activeOpacity={0.8}
          accessibilityLabel="Start Live Stream"
          accessibilityRole="button"
          >
          <Video size={24} color="#8B5CF6" />
          </TouchableOpacity>
      </Animated.View>

      {/* Orders Button */}
      <Animated.View
        style={[
          styles.circularMenuItem,
          ordersAnimatedStyle,
          { position: 'absolute', top: 0, right: 0 },
        ]}
        pointerEvents={isActionMenuOpen ? 'auto' : 'none'}
      >
          <TouchableOpacity
          style={[styles.circularIconButton, { backgroundColor: '#FFFFFF', borderColor: '#10B981' }]}
            onPress={handleOrdersPress}
            activeOpacity={0.8}
          accessibilityLabel="View Orders"
          accessibilityRole="button"
        >
          <UtensilsCrossed size={24} color="#10B981" />
          </TouchableOpacity>
      </Animated.View>

      {/* Backdrop - closes menu when tapped - rendered last so it's behind menu items */}
      {isActionMenuOpen && (
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setIsActionMenuOpen(false)}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  floatingActionButton: {
    position: 'absolute',
    zIndex: 999999,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    // bottom and right are now controlled by animated style
  },
  mainActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 59, 48, 0.75)', // Semi-transparent Cribnosh red for glassy effect
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden', // Ensure blur effect is contained
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative', // Needed for absolute positioned blur
  },
  mainActionButtonPill: {
    width: 60,
    height: 40,
    borderRadius: 20, // Pill shape with rounded ends
  },
  mainActionButtonOpen: {
    transform: [{ translateY: -20 }], // Move button up by 20px when open
  },
  buttonContent: {
    position: 'relative',
    zIndex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainButtonIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    position: 'relative',
    elevation: 1,
  },
  cartBadge: {
    position: 'absolute',
    top: 10, // Vertically center on the pill (pill height is 40px, badge height is 20px, so center at 10px from top)
    right: -10, // Position to the right of the pill (negative value extends beyond the right edge)
    backgroundColor: '#064e3b', // Dark green
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 2,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  backdrop: {
    position: 'absolute',
    top: -Dimensions.get('window').height,
    left: -Dimensions.get('window').width,
    right: -Dimensions.get('window').width,
    bottom: -Dimensions.get('window').height,
    width: Dimensions.get('window').width * 3,
    height: Dimensions.get('window').height * 3,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999998,
  },
  circularMenuItem: {
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999999,
  },
  circularIconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    position: 'relative',
  },
  cartBadgeSmall: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#0B9E58',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 4,
  },
  cartBadgeTextSmall: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
    textAlign: 'center',
  },
});
