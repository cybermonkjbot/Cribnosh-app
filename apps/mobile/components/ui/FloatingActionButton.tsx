import { useGetCartQuery } from '@/store/customerApi';
import { useRouter } from 'expo-router';
import { Camera, ChefHat, Plus, ShoppingCart } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

interface FloatingActionButtonProps {
  bottomPosition?: number;
  rightPosition?: number;
  onCameraPress?: () => void;
  onRecipePress?: () => void;
  onCartPress?: () => void;
  showCartCounter?: boolean;
}

export function FloatingActionButton({
  bottomPosition = 120,
  rightPosition = 20,
  onCameraPress,
  onRecipePress,
  onCartPress,
  showCartCounter = true,
}: FloatingActionButtonProps) {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [lastUsedFunction, setLastUsedFunction] = useState<'camera' | 'recipe' | 'cart' | null>(null);
  const router = useRouter();
  
  // Fetch cart data
  const { data: cartData } = useGetCartQuery();
  
  // Calculate cart item count
  const cartItemCount = cartData?.data?.items
    ? cartData.data.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
    : 0;
  
  // Animation values for badge and icon
  const badgeScale = useSharedValue(cartItemCount > 0 ? 1 : 0);
  const iconOpacity = useSharedValue(1);
  const prevCartCountRef = useRef(cartItemCount);
  const prevLastFunctionRef = useRef<'camera' | 'recipe' | 'cart' | null>(null);
  const isInitialMount = useRef(true);
  
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
    // Context-aware: Show cart icon if cart has items
    if (cartItemCount > 0) {
      return <ShoppingCart size={20} color="#FFFFFF" />;
    }
    
    // Show icon based on last used function if cart is empty
    if (lastUsedFunction === 'camera') {
      return <Camera size={20} color="#FFFFFF" />;
    }
    if (lastUsedFunction === 'recipe') {
      return <ChefHat size={20} color="#FFFFFF" />;
    }
    if (lastUsedFunction === 'cart') {
      return <ShoppingCart size={20} color="#FFFFFF" />;
    }
    
    // Default plus icon
    return <Plus size={20} color="#FFFFFF" strokeWidth={3} />;
  };

  const handleCameraPress = () => {
    setLastUsedFunction('camera');
    if (onCameraPress) {
      onCameraPress();
    } else {
      router.push('/camera-modal' as any);
    }
    setIsActionMenuOpen(false);
  };

  const handleRecipePress = () => {
    setLastUsedFunction('recipe');
    if (onRecipePress) {
      onRecipePress();
    } else {
      console.log('Recipe Share pressed');
    }
    setIsActionMenuOpen(false);
  };

  const handleCartPress = () => {
    setLastUsedFunction('cart');
    if (onCartPress) {
      onCartPress();
    } else {
      router.push('/orders/cart' as any);
    }
    setIsActionMenuOpen(false);
  };

  // Main button press handler - context-aware
  const handleMainButtonPress = () => {
    // If cart has items, navigate directly to cart
    if (cartItemCount > 0) {
      handleCartPress();
    } else {
      // Otherwise, toggle menu
      setIsActionMenuOpen(!isActionMenuOpen);
    }
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

  return (
    <View style={[styles.floatingActionButton, { bottom: bottomPosition, right: rightPosition }]}>
      <TouchableOpacity
        style={[
          styles.mainActionButton,
          isActionMenuOpen && styles.mainActionButtonOpen
        ]}
        onPress={handleMainButtonPress}
        activeOpacity={0.8}
      >
        <Animated.View style={[styles.mainButtonIcon, iconAnimatedStyle]}>
          {getMainButtonIcon()}
        </Animated.View>
        
        {/* Cart Counter Badge - Always render for smooth animations */}
        {showCartCounter && (
          <Animated.View style={[styles.cartBadge, badgeAnimatedStyle]}>
            {cartItemCount > 0 && (
              <Text style={styles.cartBadgeText}>{displayCartCount}</Text>
            )}
          </Animated.View>
        )}
      </TouchableOpacity>

      {/* Expanded Action Menu */}
      {isActionMenuOpen && (
        <>
          {/* Camera Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.cameraActionButton]}
            onPress={handleCameraPress}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonIcon}>
              <Camera size={16} color="#FF3B30" />
            </View>
            <Text style={styles.actionButtonLabel}>Create Food Content</Text>
          </TouchableOpacity>

          {/* Recipe Share Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.recipeActionButton]}
            onPress={handleRecipePress}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonIcon}>
              <ChefHat size={16} color="#0B9E58" />
            </View>
            <Text style={styles.actionButtonLabel}>RecipeShare</Text>
          </TouchableOpacity>

          {/* Cart Button */}
          <TouchableOpacity
            style={[styles.actionButton, styles.cartActionButton]}
            onPress={handleCartPress}
            activeOpacity={0.8}
          >
            <View style={styles.actionButtonIcon}>
              <ShoppingCart size={16} color="#0B9E58" />
            </View>
            <Text style={styles.actionButtonLabel}>
              {cartItemCount > 0 ? `Cart (${cartItemCount})` : 'View Cart'}
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  floatingActionButton: {
    position: 'absolute',
    zIndex: 1000,
    alignItems: 'flex-end',
  },
  mainActionButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FF3B30', // Cribnosh red
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  mainActionButtonOpen: {
    transform: [{ translateY: -20 }], // Move button up by 20px when open
  },
  mainButtonIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#0B9E58', // Cribnosh green
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
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  cameraActionButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#FF3B30',
  },
  recipeActionButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#0B9E58', // Cribnosh green
  },
  cartActionButton: {
    borderLeftWidth: 4,
    borderLeftColor: '#0B9E58', // Cribnosh green for cart too
  },
  actionButtonIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
});
