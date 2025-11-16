import { EmptyState } from "@/components/ui/EmptyState";
import { useAddressSelection } from "@/contexts/AddressSelectionContext";
import { useAuthContext } from "@/contexts/AuthContext";
import { api } from '@/convex/_generated/api';
import { useCart } from "@/hooks/useCart";
import { useToast } from "@/lib/ToastContext";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { CustomerAddress } from "@/types/customer";
import { getAbsoluteImageUrl } from "@/utils/imageUrl";
import Entypo from "@expo/vector-icons/Entypo";
import Feather from "@expo/vector-icons/Feather";
import { useQuery } from "convex/react";
import { Link, router, usePathname } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { CarFront, MessageSquare, Utensils } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import IncrementalOrderAmount from "../IncrementalOrderAmount";
import { SkeletonBox } from "./MealItemDetails/Skeletons/ShimmerBox";
import { NoshPassModal } from "./NoshPassModal";
import { SkeletonWithTimeout } from "./SkeletonWithTimeout";

type CouponType = 'nosh_pass' | 'discount';

export default function CartScreen() {
  const [cutleryIncluded, setCutleryIncluded] = useState(false);
  const [isNoshPassModalVisible, setIsNoshPassModalVisible] = useState(false);
  const [appliedCouponCode, setAppliedCouponCode] = useState<string | null>(null);
  const [appliedCouponType, setAppliedCouponType] = useState<CouponType | null>(null);
  const [appliedCouponId, setAppliedCouponId] = useState<string | null>(null);
  const [appliedPoints, setAppliedPoints] = useState<number | null>(null);
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [freeDelivery, setFreeDelivery] = useState<boolean>(false);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [orderNote, setOrderNote] = useState<string>("");

  // Refs for keyboard handling
  const scrollViewRef = useRef<ScrollView>(null);

  // Use cart hook for Convex mutations (update, remove)
  const { updateCartItem, removeFromCart } = useCart();
  const { isAuthenticated } = useAuthContext();
  const { showToast } = useToast();

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

  // Load saved order note from storage
  useEffect(() => {
    const loadOrderNote = async () => {
      try {
        const savedNote = await SecureStore.getItemAsync('cart_order_note');
        if (savedNote) {
          setOrderNote(savedNote);
        }
      } catch (error) {
        console.warn('Failed to load order note:', error);
      }
    };
    loadOrderNote();
  }, []);

  // Save order note to storage when it changes
  useEffect(() => {
    const saveOrderNote = async () => {
      try {
        if (orderNote.trim()) {
          await SecureStore.setItemAsync('cart_order_note', orderNote);
        } else {
          await SecureStore.deleteItemAsync('cart_order_note');
        }
      } catch (error) {
        console.warn('Failed to save order note:', error);
      }
    };
    // Debounce saving to avoid too many writes
    const timeoutId = setTimeout(saveOrderNote, 500);
    return () => clearTimeout(timeoutId);
  }, [orderNote]);

  // Handle order note input focus - scroll to input when keyboard appears
  const handleNoteInputFocus = () => {
    // Use setTimeout to ensure the keyboard animation has started
    setTimeout(() => {
      // Scroll to end of content where the input is located
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 150);
  };

  // Use reactive Convex query for cart data - this will automatically update when cart changes
  const cartData = useQuery(
    api.queries.orders.getEnrichedCartBySessionToken,
    sessionToken ? { sessionToken } : "skip"
  );

  // Get user by session token (reactive query)
  const user = useQuery(
    api.queries.users.getUserBySessionToken,
    sessionToken ? { sessionToken } : "skip"
  );

  // Get user profile (reactive query)
  const profileDataRaw = useQuery(
    api.queries.users.getUserProfile,
    user?._id && sessionToken ? { userId: user._id, sessionToken } : "skip"
  );

  // Transform profile data to match expected format
  const profileData = useMemo(() => {
    if (!profileDataRaw) return null;
    return {
      data: {
        ...profileDataRaw,
      },
    };
  }, [profileDataRaw]);

  const isLoadingProfile = user === undefined || (user && profileDataRaw === undefined);

  // Address selection context
  const { setOnSelectAddress, selectedAddress, setSelectedAddress } = useAddressSelection();

  const userAddress = profileData?.data?.address;
  const hasAddress = userAddress && userAddress.street && userAddress.street.trim().length > 0;

  // Get cart items from reactive query data or fallback to empty array
  const cartItems = cartData?.items || [];
  const hasItems = cartItems.length > 0;
  const isLoading = cartData === undefined; // undefined means query is loading
  const isEmpty = cartData !== undefined && cartItems.length === 0;

  const pathname = usePathname();
  const navigationTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousPathnameRef = useRef<string>(pathname);
  
  // Track pathname changes to detect navigation
  useEffect(() => {
    previousPathnameRef.current = pathname;
  }, [pathname]);
  
  const handleBack = () => {
    // Clear any existing timeout
    if (navigationTimeoutRef.current) {
      clearTimeout(navigationTimeoutRef.current);
    }
    
    if (router.canGoBack()) {
      // Go back once
      router.back();
      
      // After navigation completes, check if we landed on the orders screen
      // If so, navigate to home to skip it
      navigationTimeoutRef.current = setTimeout(() => {
        // Check current pathname - if we're on /orders (but not /orders/cart), navigate to home
        // Use the ref which should be updated by the useEffect when pathname changes
        const currentPath = previousPathnameRef.current;
        // Check if we're on the orders list screen (not cart or other order screens)
        const isOnOrdersListScreen = currentPath === '/(tabs)/orders' || 
          (currentPath?.includes('/orders') && !currentPath?.includes('/cart') && !currentPath?.includes('/group'));
        
        if (isOnOrdersListScreen) {
          // We're on the orders list screen, navigate to home to skip it
          router.replace("/(tabs)");
        } else if (!router.canGoBack()) {
          // Can't go back further - navigate to home as fallback
          router.replace("/(tabs)");
        }
        // If we're not on orders list and can go back, we're at the right place - do nothing
        navigationTimeoutRef.current = null;
      }, 200);
    } else {
      // Can't go back, navigate to home
      router.replace("/(tabs)");
    }
  };
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (navigationTimeoutRef.current) {
        clearTimeout(navigationTimeoutRef.current);
      }
    };
  }, []);

  const handleQuantityChange = useCallback(async (index: number, newQuantity: number) => {
    const item = cartItems[index];
    if (!item || !item._id) return;

    if (newQuantity <= 0) {
      // Remove item if quantity is 0
      try {
        await removeFromCart(item._id);
        // Cart will automatically update via reactive query, no need to manually refresh
      } catch (error) {
        console.error('Error removing item:', error);
      }
    } else {
      // Update quantity
      try {
        await updateCartItem(item._id, newQuantity);
        // Cart will automatically update via reactive query, no need to manually refresh
      } catch (error) {
        console.error('Error updating quantity:', error);
      }
    }
  }, [cartItems, removeFromCart, updateCartItem]);

  const handleRemoveRequest = useCallback((index: number) => {
    const item = cartItems[index];
    if (!item || !item._id) return;

    // Show confirmation before removing
    Alert.alert(
      "Remove Item",
      `Are you sure you want to remove "${item.dish_name || item.name || 'this item'}" from your cart?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeFromCart(item._id);
              // Cart will automatically update via reactive query, no need to manually refresh
            } catch (error) {
              console.error('Error removing item:', error);
            }
          },
        },
      ]
    );
  }, [cartItems, removeFromCart]);

  const handleCutleryToggle = () => {
    setCutleryIncluded(!cutleryIncluded);
  };

  const handleBrowseMeals = () => {
    router.replace("/(tabs)");
  };

  // Set up address selection callback
  // Only save addresses when explicitly selected by user, not on mount
  useEffect(() => {
    const handleAddressSelect = async (address: CustomerAddress | null) => {
      // Early return if address is null or invalid - don't save on mount
      if (!address || !address.street || typeof address.street !== 'string' || address.street.trim().length === 0) {
        // Silently ignore invalid addresses - don't log errors for null addresses
        // as this might be called during initialization
        return;
      }

      try {
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          console.error('Error saving address: Not authenticated');
          return;
        }

        const result = await convex.action(api.actions.users.customerUpdateProfile, {
          sessionToken,
          address: {
            street: address.street,
            city: address.city || '',
            state: address.state || '',
            postal_code: address.postal_code || '',
            country: address.country || 'UK',
          },
        });

        if (result.success === false) {
          console.error('Error saving address:', result.error);
          return;
        }

        // Profile will automatically update via reactive query, no need to manually refetch
        setSelectedAddress(null); // Clear after handling
      } catch (error) {
        console.error('Error saving address:', error);
      }
    };
    setOnSelectAddress(handleAddressSelect);
    return () => {
      setOnSelectAddress(null);
    };
  }, [setOnSelectAddress, setSelectedAddress]);

  // Note: Address selection is now handled via the onSelectAddress callback
  // set in the useEffect above. The useFocusEffect approach was removed to
  // prevent duplicate handling and navigation issues.

  const handleOpenAddressModal = () => {
    router.push({
      pathname: '/select-address',
      params: {
        returnPath: '/orders/cart',
        ...(userAddress && {
          selectedStreet: userAddress.street,
          selectedCity: userAddress.city,
        }),
      },
    });
  };

  const handleNoshPassApply = async (code: string, type: CouponType, couponId?: string, pointsAmount?: number) => {
    if (type === 'nosh_pass' && pointsAmount && pointsAmount > 0) {
      // Apply Nosh Points
      setAppliedCouponCode(code);
      setAppliedCouponType(type);
      setAppliedCouponId(null);
      setAppliedPoints(pointsAmount);
      
      // Calculate discount from points (1 point = £0.01)
      const pointsDiscount = pointsAmount * 0.01;
      setDiscountAmount(pointsDiscount);
      setFreeDelivery(false);
      
      // Store discount info for order creation
      await SecureStore.setItemAsync('cart_discount_info', JSON.stringify({
        type: 'nosh_pass',
        pointsAmount,
        discountAmount: pointsDiscount,
      }));
    } else if (code && couponId) {
      // Apply discount code
      setAppliedCouponCode(code);
      setAppliedCouponType(type);
      setAppliedCouponId(couponId);
      setAppliedPoints(null);
      
      // Calculate discount (will store discount info automatically)
      await calculateDiscount(couponId, code);
    } else {
      // Remove discount
      setAppliedCouponCode(null);
      setAppliedCouponType(null);
      setAppliedCouponId(null);
      setAppliedPoints(null);
      setDiscountAmount(0);
      setFreeDelivery(false);
      
      // Clear stored discount info
      await SecureStore.deleteItemAsync('cart_discount_info');
    }
  };

  const calculateDiscount = useCallback(async (couponId: string, couponCode?: string) => {
    try {
      const convex = getConvexClient();
      const subtotal = cartItems.reduce((sum: number, item: any) => {
        const itemPrice = item.price || 0;
        const itemQuantity = item.quantity || 1;
        const priceInBaseUnit = itemPrice >= 100 ? itemPrice / 100 : itemPrice;
        return sum + (priceInBaseUnit * itemQuantity);
      }, 0);
      const deliveryFee = 9.00;

      const result = await convex.action(api.actions.coupons.calculateCartDiscount, {
        couponId: couponId as any,
        cartSubtotal: subtotal,
        deliveryFee,
      });

      if (result.success) {
        setDiscountAmount(result.discountAmount || 0);
        setFreeDelivery(result.freeDelivery || false);
        
        // Store discount info for order creation
        await SecureStore.setItemAsync('cart_discount_info', JSON.stringify({
          type: 'discount',
          couponId,
          couponCode: couponCode || appliedCouponCode,
        }));
      }
    } catch (error) {
      console.error('Error calculating discount:', error);
      setDiscountAmount(0);
      setFreeDelivery(false);
    }
  }, [cartItems, appliedCouponCode]);

  // Recalculate discount when cart items change
  useEffect(() => {
    if (appliedCouponId) {
      calculateDiscount(appliedCouponId);
    }
  }, [appliedCouponId, calculateDiscount]);

  // Format address for display
  const formatAddress = (address: CustomerAddress | undefined): string => {
    if (!address) return '';
    const parts = [address.street, address.city, address.postal_code].filter(Boolean);
    return parts.join(', ');
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) {
      return;
    }

    Alert.alert(
      "Clear Cart",
      "Are you sure you want to remove all items from your cart?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              // Remove all items from cart (suppress individual toasts)
              await Promise.all(
                cartItems.map((item: any) => removeFromCart(item._id, true))
              );
              
              // Show single toast after all items are removed
              showToast({
                type: "success",
                title: "Cart Cleared",
                message: "All items removed from cart",
                duration: 2000,
              });
              
              // Cart will automatically update via reactive query, no need to manually refresh
            } catch (error) {
              console.error('Error clearing cart:', error);
            }
          },
        },
      ]
    );
  };

  // Cart Skeleton Loader Component
  const CartSkeleton = () => (
    <View style={styles.skeletonContainer}>
      <View style={styles.header}>
        <SkeletonBox width={18} height={18} borderRadius={4} />
        <SkeletonBox width={80} height={18} borderRadius={4} />
        <SkeletonBox width={18} height={18} borderRadius={4} />
      </View>
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={index} style={styles.skeletonItemRow}>
          <View style={styles.skeletonItemLeft}>
            <SkeletonBox width={80} height={80} borderRadius={12} />
            <View style={styles.skeletonItemText}>
              <SkeletonBox width={120} height={18} borderRadius={4} style={{ marginBottom: 8 }} />
              <SkeletonBox width={60} height={16} borderRadius={4} />
            </View>
          </View>
          <SkeletonBox width={79} height={36} borderRadius={10} />
        </View>
      ))}
      {/* Delivery Address Section */}
      <View style={styles.skeletonSection}>
        <View style={styles.skeletonSectionRow}>
          <SkeletonBox width={32} height={32} borderRadius={16} />
          <View style={styles.skeletonSectionText}>
            <SkeletonBox width={150} height={18} borderRadius={4} style={{ marginBottom: 4 }} />
            <SkeletonBox width={200} height={16} borderRadius={4} />
          </View>
          <SkeletonBox width={24} height={24} borderRadius={4} />
        </View>
      </View>
      {/* Nosh Pass Section */}
      <View style={[styles.skeletonSection, styles.skeletonSectionSpacing]}>
        <View style={styles.skeletonSectionRow}>
          <SkeletonBox width={32} height={32} borderRadius={4} />
          <SkeletonBox width={100} height={18} borderRadius={4} />
          <SkeletonBox width={80} height={18} borderRadius={4} />
          <SkeletonBox width={24} height={24} borderRadius={4} />
        </View>
      </View>
      {/* Cutlery Section */}
      <View style={[styles.skeletonSection, styles.skeletonSectionSpacing]}>
        <View style={styles.skeletonSectionRow}>
          <SkeletonBox width={32} height={32} borderRadius={4} />
          <View style={styles.skeletonSectionText}>
            <SkeletonBox width={100} height={18} borderRadius={4} style={{ marginBottom: 4 }} />
            <SkeletonBox width={250} height={14} borderRadius={4} />
          </View>
          <SkeletonBox width={80} height={36} borderRadius={16} />
        </View>
      </View>
      {/* Ask a friend to pay Section */}
      <View style={[styles.skeletonSection, styles.skeletonSectionSpacing]}>
        <View style={styles.skeletonSectionRow}>
          <SkeletonBox width={32} height={32} borderRadius={4} />
          <View style={styles.skeletonSectionText}>
            <SkeletonBox width={150} height={18} borderRadius={4} style={{ marginBottom: 4 }} />
            <SkeletonBox width={220} height={14} borderRadius={4} />
          </View>
          <SkeletonBox width={80} height={36} borderRadius={16} />
        </View>
      </View>
      {/* Summary Section */}
      <View style={styles.skeletonSummary}>
        <View style={styles.skeletonSummaryRow}>
          <SkeletonBox width={100} height={18} borderRadius={4} />
          <SkeletonBox width={60} height={18} borderRadius={4} />
        </View>
        <View style={styles.skeletonSummaryRow}>
          <SkeletonBox width={100} height={18} borderRadius={4} />
          <SkeletonBox width={60} height={18} borderRadius={4} />
        </View>
        <View style={styles.skeletonSummaryRow}>
          <SkeletonBox width={60} height={18} borderRadius={4} />
          <SkeletonBox width={80} height={18} borderRadius={4} />
        </View>
      </View>
    </View>
  );

  // Show loading state with skeleton
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          ref={scrollViewRef}
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={{ paddingBottom: 120 }}
          keyboardShouldPersistTaps="handled"
        >
          <SkeletonWithTimeout isLoading={isLoading}>
            <CartSkeleton />
          </SkeletonWithTimeout>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show empty state
  if (isEmpty) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleBack}>
            <Entypo name="chevron-down" size={18} color="#094327" />
          </Pressable>
          <Text style={styles.headerTitle}>
            My Cart
          </Text>
          <View style={styles.headerSpacer} />
        </View>
        <View style={styles.emptyStateContainer}>
          <EmptyState
            title="Your cart is empty"
            subtitle="Start adding delicious meals to your cart"
            icon="cart-outline"
            actionButton={{
              label: "Browse Meals",
              onPress: handleBrowseMeals,
            }}
            titleColor="#11181C"
            subtitleColor="#687076"
            iconColor="#9CA3AF"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Calculate totals from cart
  // Note: Prices from Convex are in the base unit (not cents), so no division needed
  const subtotal = cartItems.reduce((sum: number, item: any) => {
    const itemPrice = item.price || 0;
    const itemQuantity = item.quantity || 1;
    // Check if price is in cents (>= 100) or already in base unit
    const priceInBaseUnit = itemPrice >= 100 ? itemPrice / 100 : itemPrice;
    return sum + (priceInBaseUnit * itemQuantity);
  }, 0);
  const deliveryFee = freeDelivery ? 0 : 9.00; // Free delivery if coupon applies
  const total = Math.max(0, subtotal - discountAmount + deliveryFee);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        showsVerticalScrollIndicator={false}
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: 120 }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <View style={styles.mainContent}>
            <View style={styles.header}>
              <Pressable onPress={handleBack}>
                <Entypo name="chevron-down" size={18} color="#094327" />
              </Pressable>
              <Text style={styles.headerTitle}>
                My Cart
              </Text>
              {hasItems && (
                <Pressable onPress={handleClearCart}>
                  <Feather name="trash-2" size={18} color="#094327" />
                </Pressable>
              )}
              {!hasItems && <View style={styles.headerSpacer} />}
            </View>
            <View style={styles.itemsContainer}>
              {cartItems.map((item: any, index: number) => (
                <View
                  style={styles.itemRow}
                  key={index}
                >
                  <View style={styles.itemLeft}>
                    {(() => {
                      const absoluteImageUrl = getAbsoluteImageUrl(item.image_url);
                      return absoluteImageUrl ? (
                        <View style={styles.imageContainer}>
                          <Image
                            source={{ uri: absoluteImageUrl }}
                            style={styles.itemImage}
                            defaultSource={require("@/assets/images/sample.png")}
                          />
                        </View>
                      ) : (
                        <View style={[styles.imageContainer, styles.iconContainer]}>
                          <Utensils size={32} color="#9CA3AF" />
                        </View>
                      );
                    })()}
                    <View>
                      <Text>{item.dish_name || item.name || 'Unknown Item'}</Text>
                      <Text style={styles.itemPrice}>
                        £ {((item.price || 0) >= 100 ? (item.price || 0) / 100 : (item.price || 0)).toFixed(2)}
                      </Text>
                    </View>
                  </View>

                  <IncrementalOrderAmount
                    initialValue={item.quantity || 1}
                    min={1}
                    onChange={(newQuantity) => {
                      // Use setTimeout to defer the async operation and prevent blocking
                      setTimeout(() => {
                        handleQuantityChange(index, newQuantity);
                      }, 0);
                    }}
                    onRemoveRequest={() => {
                      handleRemoveRequest(index);
                    }}
                    isOrdered={true}
                    key={item._id} // Add key to force re-render on quantity change
                  />
                </View>
              ))}
            </View>
            <View>
              {/* Delivery Address Section */}
              <Pressable
                style={styles.sectionRow}
                onPress={handleOpenAddressModal}
              >
                <View style={styles.sectionLeft}>
                  <View style={styles.iconBadge}>
                    <CarFront color={"white"} />
                  </View>
                  <View style={styles.sectionText}>
                    {hasAddress ? (
                      <>
                        <Text style={styles.sectionTitle}>
                          Delivery in 38-64 mins
                        </Text>
                        <Text style={styles.sectionSubtitle}>
                          {formatAddress(userAddress)}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.sectionTitle}>
                          Add delivery address
                        </Text>
                        <Text style={styles.sectionSubtitle}>
                          Tap to set your delivery location
                        </Text>
                      </>
                    )}
                  </View>
                </View>

                <Entypo name="chevron-right" size={24} color="#094327" />
              </Pressable>

              {/* Nosh Pass Section */}
              <Pressable
                style={[styles.sectionRow, styles.sectionRowSpacing]}
                onPress={() => setIsNoshPassModalVisible(true)}
              >
                <View style={styles.sectionLeft}>
                  <View style={styles.iconContainer}>
                    <Image
                      style={styles.smallIcon}
                      source={require("@/assets/images/nosh-pass.png")}
                    />
                  </View>
                  <Text style={styles.sectionTitle}>Nosh Pass</Text>
                </View>

                <View style={styles.sectionRight}>
                  {appliedCouponCode ? (
                    <Text style={styles.badgeText}>#{appliedCouponCode}</Text>
                  ) : (
                    <Text style={styles.badgeText}>Add code</Text>
                  )}
                  <Entypo name="chevron-right" size={24} color="#094327" />
                </View>
              </Pressable>
              <View style={[styles.sectionRow, styles.sectionRowSpacing]}>
                <View style={styles.sectionLeft}>
                  <View style={styles.iconContainer}>
                    <Image
                      style={styles.smallIcon}
                      source={require("@/assets/images/utensils.png")}
                    />
                  </View>
                  <View style={styles.sectionText}>
                    <Text style={styles.sectionTitle}>Cutlery</Text>
                    <Text style={styles.sectionDescription}>
                      We do not include cutlery by default for
                      sustainability{" "}
                    </Text>
                  </View>
                </View>

                <View style={styles.actionButtonWrapper}>
                  <Pressable
                    onPress={handleCutleryToggle}
                    style={[
                      styles.actionButton,
                      cutleryIncluded && styles.actionButtonSelected,
                    ]}
                  >
                    <Text style={[
                      styles.actionButtonText,
                      cutleryIncluded && styles.actionButtonTextSelected,
                    ]}>Include</Text>
                  </Pressable>
                </View>
              </View>
              <View style={[styles.sectionRow, styles.sectionRowSpacing]}>
                <View style={styles.sectionLeft}>
                  <View style={styles.iconContainer}>
                    <Image
                      style={styles.shareIcon}
                      source={require("@/assets/images/share.png")}
                    />
                  </View>
                  <View style={styles.sectionText}>
                    <Text style={styles.sectionTitle}>
                      Ask a friend to pay
                    </Text>
                    <Text style={styles.sectionDescription}>
                      Share the payment link with a friend to split the cost
                    </Text>
                  </View>
                </View>

                <View style={styles.actionButtonWrapper}>
                  <Pressable
                    onPress={() => router.push('/orders/cart/choose-friend')}
                    style={styles.actionButton}
                  >
                    <Text style={styles.actionButtonText}>Choose</Text>
                  </Pressable>
                </View>
              </View>

              {/* Order Note Section */}
              <View style={[styles.sectionRow, styles.sectionRowSpacing]}>
                <View style={styles.sectionLeft}>
                  <View style={styles.iconContainer}>
                    <MessageSquare size={32} color="#094327" />
                  </View>
                  <View style={styles.sectionText}>
                    <Text style={styles.sectionTitle}>Order Note</Text>
                    <Text style={styles.sectionDescription}>
                      Add special instructions for your order
                    </Text>
                  </View>
                </View>
              </View>
              <View style={styles.noteInputWrapper}>
                <TextInput
                  style={styles.noteInput}
                  placeholder="E.g., Please leave at the door, No onions, etc."
                  placeholderTextColor="#9CA3AF"
                  value={orderNote}
                  onChangeText={setOrderNote}
                  onFocus={handleNoteInputFocus}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>
            </View>
          </View>

          <View style={styles.summary}>
            {discountAmount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>
                  Discount
                </Text>
                <Text style={[styles.summaryValue, styles.discountValue]}>
                  -£ {discountAmount.toFixed(2)}
                </Text>
              </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Delivery Fee
              </Text>
              <Text style={styles.summaryValue}>
                {freeDelivery ? (
                  <Text style={styles.freeDeliveryText}>Free</Text>
                ) : (
                  `£ ${deliveryFee.toFixed(2)}`
                )}
              </Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotalLabel}>Total </Text>
              <Text style={styles.summaryTotalValue}>£ {total.toFixed(2)}</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Continue Button */}
      <View style={styles.footer}>
        <Link asChild href={"/orders/cart/sides"}>
          <Pressable style={styles.continueButton}>
            <Text style={styles.continueButtonText}>
              Continue to Sides
            </Text>
          </Pressable>
        </Link>
      </View>

      {/* Nosh Pass Modal */}
      <NoshPassModal
        isVisible={isNoshPassModalVisible}
        onClose={() => setIsNoshPassModalVisible(false)}
        onApplyCode={handleNoshPassApply}
        appliedCode={appliedCouponCode}
        appliedCodeType={appliedCouponType}
        appliedPoints={appliedPoints}
        cartSubtotal={subtotal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // flex-1
    padding: 16, // Reduced from 20
    backgroundColor: '#FFFFFF', // bg-white
  },
  scrollView: {
    flex: 1, // flex-1
  },
  content: {
    flexDirection: 'column', // flex flex-col
    flex: 1, // flex-1
  },
  mainContent: {
    flex: 1, // flex-1
  },
  header: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
  },
  headerTitle: {
    fontSize: 18, // text-lg
    fontWeight: '500', // font-medium
    textAlign: 'center', // text-center
    color: '#094327', // text-dark-green
  },
  headerSpacer: {
    width: 24, // Match icon width for symmetry
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  skeletonContainer: {
    flex: 1,
  },
  skeletonItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  skeletonItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  skeletonItemText: {
    flex: 1,
  },
  skeletonSection: {
    marginTop: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
  },
  skeletonSectionSpacing: {
    marginTop: 20,
  },
  skeletonSectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonSectionText: {
    flex: 1,
  },
  skeletonSummary: {
    marginTop: 48,
  },
  skeletonSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemsContainer: {
    // empty className
  },
  itemRow: {
    borderBottomWidth: 1, // border-b
    borderBottomColor: '#F3F4F6', // border-[#F3F4F6]
    paddingVertical: 20, // py-5
    flexDirection: 'row', // flex flex-row
    justifyContent: 'space-between', // justify-between
    alignItems: 'center', // items-center
  },
  itemLeft: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    gap: 12, // gap-3
  },
  imageContainer: {
    backgroundColor: '#EAEAEA', // bg-[#eaeaea]
    height: 80, // h-20
    width: 80, // w-20
    borderRadius: 12, // rounded-xl
    padding: 8, // p-2
  },
  itemImage: {
    width: '100%', // w-full
    height: '100%', // h-full
    borderRadius: 12, // rounded-xl
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F3F4F6', // Light gray background for icon
    padding: 8, // p-2
  },
  itemPrice: {
    fontWeight: '700', // font-bold
  },
  sectionRow: {
    flexDirection: 'row', // flex flex-row
    justifyContent: 'space-between', // justify-between
    alignItems: 'flex-start', // items-start (align to top, don't stretch)
    marginTop: 32, // mt-8
    borderBottomWidth: 1, // border-b
    borderBottomColor: '#F3F4F6', // border-[#F3F4F6]
    paddingBottom: 8, // pb-2
  },
  sectionRowSpacing: {
    marginTop: 20, // mt-5
  },
  sectionLeft: {
    flexDirection: 'row', // flex flex-row
    gap: 8, // gap-x-2
    flex: 1, // flex-1
    alignItems: 'center', // items-center
  },
  iconBadge: {
    padding: 8, // p-2
    borderRadius: 9999, // rounded-full
    backgroundColor: '#094327', // bg-dark-green
    flexShrink: 0, // flex-shrink-0
  },
  sectionText: {
    flex: 1, // flex-1
  },
  sectionTitle: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
  },
  sectionSubtitle: {
    fontSize: 18, // text-lg
  },
  sectionDescription: {
    color: '#6B7280', // text-[#6B7280]
    fontSize: 14, // text-sm
  },
  sectionRight: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    gap: 1, // gap-x-[1px]
  },
  badgeText: {
    fontWeight: '700', // font-bold
    color: '#094327', // text-dark-green
  },
  smallIcon: {
    width: 32, // w-8
    height: 32, // h-8
  },
  shareIcon: {
    width: 29, // w-[29px]
    height: 17, // h-[17px]
  },
  actionButtonWrapper: {
    alignItems: 'flex-start', // Align button to top
    justifyContent: 'flex-start', // Justify to top
  },
  actionButton: {
    backgroundColor: '#F3F4F6', // bg-[#F3F4F6]
    borderRadius: 16, // rounded-2xl
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
    minWidth: 80, // Ensure button has minimum width
    alignItems: 'center', // Center text
    justifyContent: 'center', // Center text vertically
  },
  actionButtonSelected: {
    backgroundColor: '#094327', // Selected state - dark green
  },
  actionButtonText: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    color: '#111827', // Default text color
  },
  actionButtonTextSelected: {
    color: '#FFFFFF', // Selected text color - white
  },
  summary: {
    marginTop: 48, // mt-12
  },
  summaryRow: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
  },
  summaryLabel: {
    fontSize: 18, // text-lg
    fontFamily: 'Inter', // font-inter
    color: '#094327', // text-dark-green
  },
  summaryValue: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#094327', // text-dark-green
  },
  summaryTotalLabel: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
  },
  summaryTotalValue: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
  },
  discountValue: {
    color: '#10B981', // Green color for discount
  },
  freeDeliveryText: {
    color: '#10B981', // Green color for free delivery
    fontWeight: '600',
  },
  footer: {
    position: 'absolute', // absolute
    bottom: 0, // bottom-0
    left: 0, // left-0
    right: 0, // right-0
    backgroundColor: '#FFFFFF', // bg-white
    paddingHorizontal: 16, // Reduced from 20
    paddingVertical: 16, // py-4
    borderTopWidth: 1, // border-t
    borderTopColor: '#E5E7EB', // border-gray-200
  },
  continueButton: {
    backgroundColor: '#FF3B30', // bg-[#FF3B30]
    borderRadius: 16, // rounded-2xl
    padding: 20, // p-5
    flexDirection: 'row', // flex
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
  },
  continueButtonText: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
  },
  noteInputWrapper: {
    marginTop: 12,
    marginBottom: 8,
    paddingLeft: 48, // Align with text below icon (iconContainer 32px + padding 8px + gap 8px)
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#111827',
    minHeight: 80,
    backgroundColor: '#FFFFFF',
    textAlignVertical: 'top',
  },
});
