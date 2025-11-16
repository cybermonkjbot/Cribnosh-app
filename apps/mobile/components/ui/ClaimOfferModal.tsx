import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { useSearch } from '@/hooks/useSearch';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useOffersAndTreats } from '@/hooks/useOffersAndTreats';
import * as Haptics from 'expo-haptics';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring,
  withSequence,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import {
  showError,
  showSuccess,
  showWarning,
} from '../../lib/GlobalToastManager';
import { navigateToSignIn } from '../../utils/signInNavigationGuard';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';

// Brand colors
const BRAND_COLORS = {
  primary: '#094327',      // Dark green
  secondary: '#0B9E58',    // Green
  accent: '#FF3B30',       // Cribnosh orange-red
  background: '#FAFFFA',   // Light green background
  lightGreen: '#E6FFE8',   // Lighter green
  white: '#FFFFFF',
  darkGray: '#111827',
  gray: '#6B7280',
};

interface ClaimOfferModalProps {
  onClose: () => void;
  offer: {
    offer_id: string;
    title: string;
    description: string;
    discount_type: 'percentage' | 'fixed_amount' | 'free_delivery';
    discount_value: number;
    min_order_amount?: number;
    max_discount?: number;
    background_image_url?: string;
  };
}

export function ClaimOfferModal({ onClose, offer }: ClaimOfferModalProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isAuthenticated, token, checkTokenExpiration, refreshAuthState } = useAuthContext();
  const { addToCart } = useCart();
  const { search } = useSearch();
  const { claimOffer } = useOffersAndTreats();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [mealsData, setMealsData] = useState<any>(null);
  const [isLoadingMeals, setIsLoadingMeals] = useState(false);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [isClaimed, setIsClaimed] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Load session token for reactive queries
  useEffect(() => {
    const loadToken = async () => {
      if (isAuthenticated) {
        const token = await getSessionToken();
        setSessionToken(token);
      } else {
        setSessionToken(null);
      }
    };
    loadToken();
  }, [isAuthenticated]);

  // Get cart data reactively
  const cartData = useQuery(
    api.queries.orders.getEnrichedCartBySessionToken,
    sessionToken ? { sessionToken } : 'skip'
  );

  // Calculate cart total
  const cartTotal = useMemo(() => {
    if (!cartData?.items) return 0;
    return cartData.items.reduce((total: number, item: any) => {
      if (item.total_price !== undefined) {
        return total + item.total_price;
      }
      const price = item.price || item.meal?.price || 0;
      const quantity = item.quantity || 1;
      return total + price * quantity;
    }, 0);
  }, [cartData]);

  // Calculate discount amount
  const discountAmount = useMemo(() => {
    if (offer.discount_type === 'percentage') {
      const discount = (cartTotal * offer.discount_value) / 100;
      return offer.max_discount ? Math.min(discount, offer.max_discount) : discount;
    } else if (offer.discount_type === 'fixed_amount') {
      return offer.discount_value;
    }
    return 0;
  }, [cartTotal, offer]);

  // Calculate minimum order amount needed
  const minOrderAmount = offer.min_order_amount || 0;
  const amountNeeded = Math.max(0, minOrderAmount - cartTotal);
  const progressPercentage = Math.min(100, (cartTotal / minOrderAmount) * 100);
  const isOfferActivated = cartTotal >= minOrderAmount;

  // Claim the offer when modal opens
  useEffect(() => {
    const claimTheOffer = async () => {
      if (!isAuthenticated || isClaimed) return;
      
      try {
        const result = await claimOffer(offer.offer_id);
        if (result.success) {
          setIsClaimed(true);
          setShowCelebration(true);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          // Hide celebration after animation
          setTimeout(() => {
            setShowCelebration(false);
          }, 2000);
        }
      } catch (error) {
        console.error('Error claiming offer:', error);
      }
    };

    claimTheOffer();
  }, [isAuthenticated, offer.offer_id, claimOffer, isClaimed]);

  // Load meals for browsing
  useEffect(() => {
    const loadMeals = async () => {
      if (!isAuthenticated) return;
      
      try {
        setIsLoadingMeals(true);
        const result = await search({
          query: '',
          limit: 20,
        });
        
        if (result.success) {
          const dishes = result.data?.results?.dishes || result.data?.dishes || result.data || [];
          setMealsData({
            success: true,
            data: { dishes: Array.isArray(dishes) ? dishes : [] },
          });
        }
      } catch (error) {
        console.error('Error loading meals:', error);
      } finally {
        setIsLoadingMeals(false);
      }
    };

    loadMeals();
  }, [isAuthenticated, search]);

  const handleAddToCart = useCallback(async (dishId: string) => {
    if (!isAuthenticated || !token) {
      showWarning(
        'Authentication Required',
        'Please sign in to add items to cart'
      );
      navigateToSignIn();
      return;
    }

    const isExpired = checkTokenExpiration();
    if (isExpired) {
      await refreshAuthState();
      showWarning(
        'Session Expired',
        'Please sign in again to add items to cart'
      );
      navigateToSignIn();
      return;
    }

    setAddingToCart(dishId);
    try {
      const result = await addToCart(dishId, 1);
      if (result.success) {
        showSuccess('Added to Cart!', result.data?.item?.name || 'Item');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to add item to cart';
      showError('Failed to add item to cart', errorMessage);
    } finally {
      setAddingToCart(null);
    }
  }, [isAuthenticated, token, checkTokenExpiration, refreshAuthState, addToCart]);

  const formatPrice = (priceInPence: number) => {
    return `£${(priceInPence / 100).toFixed(2)}`;
  };

  const formatDiscount = () => {
    if (offer.discount_type === 'percentage') {
      return `${offer.discount_value}% OFF`;
    } else if (offer.discount_type === 'fixed_amount') {
      return `${formatPrice(offer.discount_value)} OFF`;
    }
    return 'FREE DELIVERY';
  };

  const meals = useMemo(() => {
    if (!mealsData?.data) return [];
    if (Array.isArray(mealsData.data)) {
      return mealsData.data;
    }
    if (mealsData.data.dishes && Array.isArray(mealsData.data.dishes)) {
      return mealsData.data.dishes;
    }
    if (mealsData.data.results?.dishes && Array.isArray(mealsData.data.results.dishes)) {
      return mealsData.data.results.dishes;
    }
    return [];
  }, [mealsData]);

  // Celebration animations
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);

  useEffect(() => {
    if (showCelebration) {
      scale.value = withSequence(
        withSpring(1.2, { damping: 8, stiffness: 200 }),
        withSpring(1, { damping: 10, stiffness: 150 })
      );
      rotate.value = withSequence(
        withTiming(-10, { duration: 100 }),
        withTiming(10, { duration: 100 }),
        withTiming(0, { duration: 100 })
      );
      sparkleOpacity.value = withSequence(
        withTiming(1, { duration: 300 }),
        withTiming(0, { duration: 700 })
      );
    }
  }, [showCelebration]);

  const celebrationStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    opacity: sparkleOpacity.value,
  }));

  // Progress bar animation
  const progressWidth = useSharedValue(0);
  useEffect(() => {
    progressWidth.value = withTiming(progressPercentage, {
      duration: 500,
      easing: Easing.out(Easing.cubic),
    });
  }, [progressPercentage]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Special Offer</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={BRAND_COLORS.darkGray} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero Offer Card */}
        <View style={styles.heroSection}>
          <Animated.View style={[styles.offerCard, celebrationStyle]}>
            <LinearGradient
              colors={[BRAND_COLORS.accent, '#FF6B35']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.offerCardGradient}
            >
              {showCelebration && (
                <Animated.View style={[styles.sparkles, sparkleStyle]}>
                  <Sparkles size={24} color={BRAND_COLORS.white} />
                </Animated.View>
              )}
              
              <View style={styles.offerCardContent}>
                <Text style={styles.offerBadge}>OFFER CLAIMED</Text>
                <Text style={styles.offerDiscount}>{formatDiscount()}</Text>
                {offer.discount_type !== 'free_delivery' && (
                  <Text style={styles.offerSavings}>
                    Save up to {formatPrice(discountAmount)}
                  </Text>
                )}
                {offer.description && (
                  <Text style={styles.offerDescription}>{offer.description}</Text>
                )}
              </View>
            </LinearGradient>
          </Animated.View>

          {/* Progress Section - Only show if min order required */}
          {minOrderAmount > 0 && (
            <View style={styles.progressCard}>
              {isOfferActivated ? (
                <View style={styles.activatedState}>
                  <LinearGradient
                    colors={[BRAND_COLORS.secondary, '#059669']}
                    style={styles.activatedBadge}
                  >
                    <Text style={styles.activatedText}>
                      ✓ Offer Active! You're saving {formatPrice(discountAmount)}
                    </Text>
                  </LinearGradient>
                </View>
              ) : (
                <View style={styles.progressState}>
                  <Text style={styles.progressLabel}>
                    Add {formatPrice(amountNeeded)} more to unlock
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBarBackground}>
                      <Animated.View style={[styles.progressBarFill, progressStyle]}>
                        <LinearGradient
                          colors={[BRAND_COLORS.secondary, BRAND_COLORS.primary]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={styles.progressGradient}
                        />
                      </Animated.View>
                    </View>
                  </View>
                  <View style={styles.progressTextRow}>
                    <Text style={styles.progressText}>
                      {formatPrice(cartTotal)} / {formatPrice(minOrderAmount)}
                    </Text>
                    <Text style={styles.progressPercent}>
                      {Math.round(progressPercentage)}%
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Browse Meals Section */}
        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>Add Items to Your Order</Text>
          
          {isLoadingMeals ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={BRAND_COLORS.primary} />
            </View>
          ) : meals.length > 0 ? (
            <View style={styles.mealsGrid}>
              {meals.map((meal: any) => {
                const mealData = meal.dish || meal.meal || meal;
                const mealId = mealData._id || mealData.id || meal._id || meal.id;
                const mealPrice = mealData.price || meal.price || 0;
                const mealName = mealData.name || meal.name || 'Unknown Meal';
                const mealImage = 
                  mealData.image_url || 
                  mealData.image || 
                  mealData.images?.[0] ||
                  meal.image_url || 
                  meal.image ||
                  meal.images?.[0] ||
                  mealData.chef?.image_url ||
                  undefined;
                const kitchenName = mealData.chef?.kitchen_name || mealData.kitchen_name || meal.chef?.kitchen_name || meal.kitchen_name;
                const isAdding = addingToCart === mealId;
                const imageUrl = mealImage ? getAbsoluteImageUrl(mealImage) : undefined;
                
                return (
                  <TouchableOpacity
                    key={mealId}
                    style={styles.mealCard}
                    onPress={() => handleAddToCart(mealId)}
                    disabled={isAdding}
                    activeOpacity={0.8}
                  >
                    <View style={styles.mealImageContainer}>
                      {imageUrl ? (
                        <Image
                          source={{ uri: imageUrl }}
                          style={styles.mealImage}
                          contentFit="cover"
                          placeholder={require('@/assets/images/cribnoshpackaging.png')}
                          transition={200}
                        />
                      ) : (
                        <Image
                          source={require('@/assets/images/cribnoshpackaging.png')}
                          style={styles.mealImage}
                          contentFit="cover"
                        />
                      )}
                    </View>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealName} numberOfLines={2}>
                        {mealName}
                      </Text>
                      {kitchenName && (
                        <Text style={styles.mealKitchen} numberOfLines={1}>
                          {kitchenName}
                        </Text>
                      )}
                      <View style={styles.mealFooter}>
                        <Text style={styles.mealPrice}>
                          {formatPrice(mealPrice)}
                        </Text>
                        {isAdding ? (
                          <ActivityIndicator size="small" color={BRAND_COLORS.accent} />
                        ) : (
                          <TouchableOpacity
                            style={styles.addButton}
                            onPress={() => handleAddToCart(mealId)}
                          >
                            <Text style={styles.addButtonText}>+</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No meals available</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        <View style={styles.bottomBarContent}>
          <View>
            <Text style={styles.cartTotalLabel}>Cart Total</Text>
            <Text style={styles.cartTotalAmount}>
              {formatPrice(cartTotal)}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              onClose();
              router.push('/(tabs)/orders/cart' as any);
            }}
            disabled={cartTotal === 0}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={cartTotal === 0 
                ? ['#D1D5DB', '#9CA3AF']
                : [BRAND_COLORS.primary, BRAND_COLORS.secondary]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.viewCartButton}
            >
              <Text style={styles.viewCartButtonText}>View Cart</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND_COLORS.background,
  },
  header: {
    backgroundColor: BRAND_COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_COLORS.primary,
    fontFamily: 'Archivo',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  heroSection: {
    padding: 20,
  },
  offerCard: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: BRAND_COLORS.accent,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  offerCardGradient: {
    padding: 24,
    alignItems: 'center',
    position: 'relative',
  },
  sparkles: {
    position: 'absolute',
    top: 16,
    right: 16,
  },
  offerCardContent: {
    alignItems: 'center',
  },
  offerBadge: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND_COLORS.white,
    letterSpacing: 1.2,
    marginBottom: 12,
    opacity: 0.95,
  },
  offerDiscount: {
    fontSize: 48,
    fontWeight: '800',
    color: BRAND_COLORS.white,
    marginBottom: 8,
    fontFamily: 'Archivo',
  },
  offerSavings: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND_COLORS.white,
    marginBottom: 8,
    opacity: 0.95,
  },
  offerDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: BRAND_COLORS.white,
    textAlign: 'center',
    opacity: 0.9,
    marginTop: 4,
  },
  progressCard: {
    backgroundColor: BRAND_COLORS.white,
    borderRadius: 16,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  progressState: {
    gap: 12,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.darkGray,
    textAlign: 'center',
  },
  progressBarContainer: {
    marginVertical: 8,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: BRAND_COLORS.lightGreen,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressGradient: {
    flex: 1,
    borderRadius: 5,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: BRAND_COLORS.gray,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '700',
    color: BRAND_COLORS.primary,
  },
  activatedState: {
    alignItems: 'center',
  },
  activatedBadge: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  activatedText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.white,
  },
  mealsSection: {
    padding: 20,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND_COLORS.primary,
    marginBottom: 16,
    fontFamily: 'Archivo',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  mealCard: {
    width: '48%',
    backgroundColor: BRAND_COLORS.white,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  mealImageContainer: {
    width: '100%',
    height: 120,
    overflow: 'hidden',
  },
  mealImage: {
    width: '100%',
    height: 120,
    backgroundColor: BRAND_COLORS.lightGreen,
  },
  mealInfo: {
    padding: 12,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.darkGray,
    marginBottom: 4,
  },
  mealKitchen: {
    fontSize: 12,
    fontWeight: '400',
    color: BRAND_COLORS.gray,
    marginBottom: 8,
  },
  mealFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mealPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND_COLORS.accent,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: BRAND_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: BRAND_COLORS.white,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: BRAND_COLORS.gray,
  },
  bottomBar: {
    backgroundColor: BRAND_COLORS.white,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  bottomBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartTotalLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: BRAND_COLORS.gray,
    marginBottom: 4,
  },
  cartTotalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND_COLORS.primary,
  },
  viewCartButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    ...Platform.select({
      ios: {
        shadowColor: BRAND_COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  viewCartButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: BRAND_COLORS.white,
  },
});
