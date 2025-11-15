import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import { useCart } from '@/hooks/useCart';
import { useSearch } from '@/hooks/useSearch';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useOffersAndTreats } from '@/hooks/useOffersAndTreats';
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
import { X } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import {
  showError,
  showSuccess,
  showWarning,
} from '../../lib/GlobalToastManager';
import { navigateToSignIn } from '../../utils/signInNavigationGuard';
import { getAbsoluteImageUrl } from '@/utils/imageUrl';

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
      // Use total_price if available, otherwise calculate from price * quantity
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
    return 0; // free_delivery doesn't have a monetary discount
  }, [cartTotal, offer]);

  // Calculate minimum order amount needed
  const minOrderAmount = offer.min_order_amount || 0;
  const amountNeeded = Math.max(0, minOrderAmount - cartTotal);

  // Check if offer is activated
  const isOfferActivated = cartTotal >= minOrderAmount;

  // Claim the offer when modal opens
  useEffect(() => {
    const claimTheOffer = async () => {
      if (!isAuthenticated) return;
      
      try {
        const result = await claimOffer(offer.offer_id);
        if (result.success) {
          setIsClaimed(true);
        }
      } catch (error) {
        console.error('Error claiming offer:', error);
      }
    };

    claimTheOffer();
  }, [isAuthenticated, offer.offer_id, claimOffer]);

  // Load meals for browsing
  useEffect(() => {
    const loadMeals = async () => {
      if (!isAuthenticated) return;
      
      try {
        setIsLoadingMeals(true);
        const result = await search({
          query: '',
          limit: 30,
        });
        
        if (result.success) {
          // Search API returns dishes in result.data.results.dishes
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
    return 'Free Delivery';
  };

  const meals = useMemo(() => {
    if (!mealsData?.data) return [];
    // Handle different data structures
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

  // Shimmer animation for discount card
  const shimmerTranslate = useSharedValue(-200);
  
  useEffect(() => {
    shimmerTranslate.value = withRepeat(
      withTiming(200, {
        duration: 2000,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, []);

  const shimmerStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: shimmerTranslate.value }],
    };
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Claim Your Offer</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color="#1a1a1a" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Discount Display Section */}
        <View style={styles.discountSection}>
          <View style={styles.discountCardContainer}>
            <LinearGradient
              colors={['#ef4444', '#dc2626', '#b91c1c']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.discountCardGradient}
            >
              {/* Shimmer overlay */}
              <Animated.View style={[styles.shimmerOverlay, shimmerStyle]}>
                <LinearGradient
                  colors={['transparent', 'rgba(255,255,255,0.4)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.shimmerGradient}
                />
              </Animated.View>
              
              {/* Glow effect */}
              <View style={styles.glowEffect} />
              
              <View style={styles.discountCardContent}>
                <Text style={styles.discountLabel}>You're Saving</Text>
                <Text style={styles.discountAmount}>
                  {offer.discount_type === 'free_delivery' 
                    ? 'Free Delivery' 
                    : formatPrice(discountAmount)}
                </Text>
                <Text style={styles.discountSubtext}>
                  {formatDiscount()} on your order
                </Text>
              </View>
            </LinearGradient>
          </View>

          {/* Progress Section */}
          <View style={styles.progressSectionContainer}>
            <BlurView intensity={20} tint="light" style={styles.progressSectionBlur}>
              {!isOfferActivated ? (
                <>
                  <Text style={styles.progressTitle}>
                    Add {formatPrice(amountNeeded)} more to activate this offer
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <View style={styles.progressBar}>
                      <LinearGradient
                        colors={['#ef4444', '#f97316', '#ef4444']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[
                          styles.progressFill,
                          {
                            width: `${Math.min(100, (cartTotal / minOrderAmount) * 100)}%`,
                          },
                        ]}
                      />
                    </View>
                  </View>
                  <View style={styles.progressTextRow}>
                    <Text style={styles.progressText}>
                      Current: {formatPrice(cartTotal)}
                    </Text>
                    <Text style={styles.progressText}>
                      Target: {formatPrice(minOrderAmount)}
                    </Text>
                  </View>
                </>
              ) : (
                <LinearGradient
                  colors={['#10b981', '#059669', '#047857']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.activatedBadge}
                >
                  <View style={styles.activatedGlow} />
                  <Text style={styles.activatedText}>
                    Offer Activated! You're saving {formatPrice(discountAmount)}
                  </Text>
                </LinearGradient>
              )}
            </BlurView>
          </View>
        </View>

        {/* Browse Meals Section */}
        <View style={styles.mealsSection}>
          <Text style={styles.sectionTitle}>Browse & Add Items</Text>
          
          {isLoadingMeals ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#ef4444" />
            </View>
          ) : meals.length > 0 ? (
            <View style={styles.mealsGrid}>
              {meals.map((meal: any) => {
                // Handle different meal data structures
                const mealData = meal.dish || meal.meal || meal;
                const mealId = mealData._id || mealData.id || meal._id || meal.id;
                const mealPrice = mealData.price || meal.price || 0;
                const mealName = mealData.name || meal.name || 'Unknown Meal';
                // Extract image URL from various possible locations
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
                
                // Get absolute image URL
                const imageUrl = mealImage ? getAbsoluteImageUrl(mealImage) : undefined;
                
                return (
                  <TouchableOpacity
                    key={mealId}
                    style={styles.mealCardContainer}
                    onPress={() => handleAddToCart(mealId)}
                    disabled={isAdding}
                    activeOpacity={0.8}
                  >
                    <BlurView intensity={15} tint="light" style={styles.mealCard}>
                      <View style={styles.mealImageContainer}>
                        {imageUrl ? (
                          <Image
                            source={{ uri: imageUrl }}
                            style={styles.mealImage}
                            contentFit="cover"
                            placeholder={require('@/assets/images/cribnoshpackaging.png')}
                            transition={200}
                            cachePolicy="memory-disk"
                          />
                        ) : (
                          <Image
                            source={require('@/assets/images/cribnoshpackaging.png')}
                            style={styles.mealImage}
                            contentFit="cover"
                          />
                        )}
                        <LinearGradient
                          colors={['transparent', 'rgba(0,0,0,0.3)']}
                          style={styles.mealImageOverlay}
                        />
                      </View>
                      <View style={styles.mealInfo}>
                        <Text style={styles.mealName} numberOfLines={2}>
                          {mealName}
                        </Text>
                        <Text style={styles.mealPrice}>
                          {formatPrice(mealPrice)}
                        </Text>
                        {kitchenName && (
                          <Text style={styles.mealKitchen} numberOfLines={1}>
                            {kitchenName}
                          </Text>
                        )}
                      </View>
                      {isAdding ? (
                        <LinearGradient
                          colors={['#ef4444', '#dc2626']}
                          style={styles.addingIndicator}
                        >
                          <ActivityIndicator size="small" color="#ffffff" />
                        </LinearGradient>
                      ) : (
                        <LinearGradient
                          colors={['#ef4444', '#dc2626', '#b91c1c']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={styles.addButton}
                        >
                          <Text style={styles.addButtonText}>Add</Text>
                        </LinearGradient>
                      )}
                    </BlurView>
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
      <BlurView intensity={30} tint="light" style={[styles.bottomBar, { paddingBottom: insets.bottom }]}>
        <View style={styles.bottomBarContent}>
          <View style={styles.cartTotalContainer}>
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
            {cartTotal === 0 ? (
              <View style={styles.viewCartButtonDisabled}>
                <Text style={styles.viewCartButtonText}>View Cart</Text>
              </View>
            ) : (
              <LinearGradient
                colors={['#ef4444', '#dc2626', '#b91c1c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.viewCartButton}
              >
                <View style={styles.buttonGlow} />
                <Text style={styles.viewCartButtonText}>View Cart</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  discountSection: {
    padding: 16,
    backgroundColor: '#fafafa',
  },
  discountCardContainer: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: {
        elevation: 12,
      },
    }),
  },
  discountCardGradient: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '300%',
    zIndex: 1,
  },
  shimmerGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  glowEffect: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 100,
    opacity: 0.6,
  },
  discountCardContent: {
    position: 'relative',
    zIndex: 2,
    alignItems: 'center',
  },
  discountLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
    opacity: 0.9,
    marginBottom: 8,
  },
  discountAmount: {
    fontSize: 48,
    fontWeight: '700',
    color: '#ffffff',
    marginBottom: 4,
  },
  discountSubtext: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    opacity: 0.9,
  },
  progressSectionContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  progressSectionBlur: {
    borderRadius: 16,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
    textAlign: 'center',
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    ...Platform.select({
      ios: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.6,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
  },
  activatedBadge: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  activatedGlow: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 50,
    opacity: 0.5,
  },
  activatedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  mealsSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 16,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  mealsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  mealCardContainer: {
    width: '48%',
    marginBottom: 16,
    borderRadius: 16,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  mealCard: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  mealImageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
    overflow: 'hidden',
  },
  mealImageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 40,
  },
  mealImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  mealImagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealInfo: {
    padding: 12,
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  mealPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ef4444',
    marginBottom: 4,
  },
  mealKitchen: {
    fontSize: 12,
    fontWeight: '400',
    color: '#666666',
  },
  addButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignSelf: 'flex-end',
    marginTop: 8,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  addButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
  addingIndicator: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderTopLeftRadius: 12,
    borderBottomRightRadius: 12,
    alignSelf: 'flex-end',
    marginTop: 8,
    minWidth: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  bottomBar: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  cartTotalContainer: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
    }),
  },
  bottomBarContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartTotalLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 4,
  },
  cartTotalAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  viewCartButton: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    position: 'relative',
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#ef4444',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonGlow: {
    position: 'absolute',
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 30,
    opacity: 0.6,
  },
  viewCartButtonDisabled: {
    backgroundColor: '#d1d5db',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    ...Platform.select({
      android: {
        elevation: 2,
      },
    }),
  },
  viewCartButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});

