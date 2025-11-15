import IncrementalOrderAmount from "@/components/IncrementalOrderAmount";
import Entypo from "@expo/vector-icons/Entypo";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as SecureStore from "expo-secure-store";
import { AppleIcon } from "@/components/AppleIcon";
import { useCart } from "@/hooks/useCart";
import { useSides } from "@/hooks/useSides";
import { usePayments } from "@/hooks/usePayments";
import { SkeletonBox } from "@/components/ui/MealItemDetails/Skeletons/ShimmerBox";
import { SkeletonWithTimeout } from "@/components/ui/SkeletonWithTimeout";
import { AddCardSheet } from "@/components/ui/AddCardSheet";

const PAYMENT_METHOD_STORAGE_KEY = "cart_selected_payment_method";

interface PaymentMethod {
  id: string;
  name: string;
  description: string;
  iconType: string;
}

interface CartItem {
  _id: string;
  dish_id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  sides?: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
}

interface AvailableSide {
  _id: string;
  name: string;
  description?: string;
  price: number;
  category?: string;
  image?: string;
}

export default function SidesScreen() {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod | null>(null);
  const [cartData, setCartData] = useState<{ items: CartItem[] } | null>(null);
  const [availableSides, setAvailableSides] = useState<Record<string, AvailableSide[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAddCardSheetVisible, setIsAddCardSheetVisible] = useState(false);
  const { getCart } = useCart();
  const { getSidesForCart, addSideToCartItem, updateSideQuantity, removeSideFromCartItem, isLoading: sidesLoading } = useSides();
  const { getPaymentMethods } = usePayments();

  // Load cart data and sides when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        try {
          setIsLoading(true);
          
          // Load cart
          const cartResult = await getCart();
          if (cartResult.success && cartResult.data) {
            setCartData(cartResult.data);
            
            // Load available sides for cart items
            const sidesResult = await getSidesForCart();
            if (sidesResult.success && sidesResult.data) {
              setAvailableSides(sidesResult.data);
            }
          }
          
          // Load payment method - first check stored preference, then API
          const stored = await SecureStore.getItemAsync(PAYMENT_METHOD_STORAGE_KEY);
          if (stored) {
            setSelectedPaymentMethod(JSON.parse(stored));
          } else {
            // Fetch actual payment methods from API
            const paymentMethods = await getPaymentMethods();
            if (paymentMethods && paymentMethods.length > 0) {
              // Find the first card payment method or use the first available
              const cardMethod = paymentMethods.find((m: any) => m.type === 'card');
              const defaultMethod = cardMethod || paymentMethods[0];
              
              if (defaultMethod) {
                const paymentMethodData = {
                  id: defaultMethod.id,
                  name: defaultMethod.type === 'card' 
                    ? `**** **** **** ${defaultMethod.last4 || '****'}` 
                    : defaultMethod.type === 'apple_pay' 
                    ? 'Apple Pay'
                    : defaultMethod.name || 'Payment Method',
                  description: defaultMethod.type === 'card'
                    ? `${defaultMethod.brand || 'Card'} •••• ${defaultMethod.last4 || '****'}`
                    : defaultMethod.name || 'Payment Method',
                  iconType: defaultMethod.type === 'card' ? 'card' : defaultMethod.type === 'apple_pay' ? 'apple' : 'card',
                };
                setSelectedPaymentMethod(paymentMethodData);
                // Store it for future use
                await SecureStore.setItemAsync(PAYMENT_METHOD_STORAGE_KEY, JSON.stringify(paymentMethodData));
              } else {
                // No payment methods available
                setSelectedPaymentMethod(null);
              }
            } else {
              // No payment methods available
              setSelectedPaymentMethod(null);
            }
          }
        } catch (error) {
          console.error("Error loading data:", error);
          // On error, set to null instead of hardcoded card
          setSelectedPaymentMethod(null);
        } finally {
          setIsLoading(false);
        }
      };
      loadData();
    }, [getCart, getSidesForCart, getPaymentMethods])
  );

  const handleBack = () => {
    router.back();
  };

  const handleProceedToPayment = async () => {
    // Check if user has a valid payment method
    try {
      const paymentMethods = await getPaymentMethods();
      
      // Check if there are any valid card payment methods
      const hasValidCard = paymentMethods && paymentMethods.some((method: any) => 
        method.type === 'card' && method.id
      );
      
      // Also check if there's a stored payment method (could be Apple Pay, etc.)
      const storedPaymentMethod = await SecureStore.getItemAsync(PAYMENT_METHOD_STORAGE_KEY);
      const hasStoredMethod = !!storedPaymentMethod;
      
      if (!hasValidCard && !hasStoredMethod) {
        // No valid payment method, show add card sheet
        setIsAddCardSheetVisible(true);
        return;
      }
      
      // Has valid payment method, proceed to payment
      router.push("/orders/cart/payment");
    } catch (error) {
      console.error('Error checking payment methods:', error);
      // On error, show add card sheet to be safe
      setIsAddCardSheetVisible(true);
    }
  };
  
  const handleCardAdded = async () => {
    setIsAddCardSheetVisible(false);
    // Refresh payment methods and proceed to payment
    const paymentMethods = await getPaymentMethods();
    if (paymentMethods && paymentMethods.length > 0) {
      // Set the newly added card as the selected payment method
      const newCard = paymentMethods.find((m: any) => m.type === 'card');
      if (newCard) {
        await SecureStore.setItemAsync(PAYMENT_METHOD_STORAGE_KEY, JSON.stringify({
          id: newCard.id,
          name: `**** **** **** ${newCard.last4 || '****'}`,
          description: `${newCard.brand || 'Card'} •••• ${newCard.last4 || '****'}`,
          iconType: 'card',
        }));
        setSelectedPaymentMethod({
          id: newCard.id,
          name: `**** **** **** ${newCard.last4 || '****'}`,
          description: `${newCard.brand || 'Card'} •••• ${newCard.last4 || '****'}`,
          iconType: 'card',
        });
      }
    }
    // Proceed to payment after card is added
    router.push("/orders/cart/payment");
  };

  const handleChangePaymentMethod = () => {
    // This will lead to payment method selection
    router.push("/orders/cart/payment-method");
  };

  const handleSideQuantityChange = async (cartItemId: string, sideId: string, newQuantity: number) => {
    try {
      if (newQuantity <= 0) {
        await removeSideFromCartItem(cartItemId, sideId);
      } else {
        // Check if side is already in cart
        const cartItem = cartData?.items.find(item => item._id === cartItemId);
        const existingSide = cartItem?.sides?.find(s => s.id === sideId);
        
        if (existingSide) {
          await updateSideQuantity(cartItemId, sideId, newQuantity);
        } else {
          await addSideToCartItem(cartItemId, sideId, newQuantity);
        }
      }
      
      // Refresh cart data
      const cartResult = await getCart();
      if (cartResult.success && cartResult.data) {
        setCartData(cartResult.data);
      }
    } catch (error) {
      console.error('Error updating side quantity:', error);
    }
  };

  // Calculate total price including sides
  const calculateTotal = () => {
    if (!cartData) return 0;
    
    let total = 0;
    cartData.items.forEach(item => {
      // Item total
      total += (item.price * item.quantity);
      
      // Sides total
      if (item.sides) {
        item.sides.forEach(side => {
          total += (side.price * side.quantity);
        });
      }
    });
    
    return total;
  };

  // Get all unique sides combined from all cart items
  const getAllCombinedSides = () => {
    // Collect all unique sides from all items
    const allSidesMap = new Map<string, AvailableSide & { quantity: number; cartItemIds: string[] }>();
    
    // Iterate through all cart items and their available sides
    cartData?.items.forEach(item => {
      const available = availableSides[item._id] || [];
      const addedSides = item.sides || [];
      
      available.forEach(side => {
        const existing = allSidesMap.get(side._id);
        const added = addedSides.find(s => s.id === side._id);
        const quantity = added?.quantity || 0;
        
        if (existing) {
          // Side already exists, add this cart item ID and sum quantities
          existing.cartItemIds.push(item._id);
          existing.quantity += quantity; // Sum quantities across all items
        } else {
          // New side, add it
          allSidesMap.set(side._id, {
            ...side,
            quantity,
            cartItemIds: [item._id],
          });
        }
      });
    });
    
    return Array.from(allSidesMap.values());
  };

  // Get the first cart item ID that supports a given side
  const getFirstCartItemForSide = (sideId: string): string | null => {
    for (const item of cartData?.items || []) {
      const available = availableSides[item._id] || [];
      if (available.some(side => side._id === sideId)) {
        return item._id;
      }
    }
    return null;
  };

  // Render payment method icon based on type
  const renderPaymentMethodIcon = () => {
    if (!selectedPaymentMethod) return null;

    if (selectedPaymentMethod.iconType === "card") {
      return (
        <Image
          style={styles.cardIcon}
          source={require("@/assets/images/mastercard-logo.png")}
        />
      );
    }
    
    if (selectedPaymentMethod.iconType === "apple") {
      return (
        <View style={styles.appleIconContainer}>
          <AppleIcon size={20} />
        </View>
      );
    }

    if (selectedPaymentMethod.iconType === "balance") {
      return (
        <Image
          style={styles.cardIcon}
          source={require("@/assets/images/nosh-pass.png")}
        />
      );
    }

    return null;
  };

  // Render payment method text based on type
  const renderPaymentMethodText = () => {
    if (!selectedPaymentMethod) return "Add payment method";

    if (selectedPaymentMethod.iconType === "apple") {
      return selectedPaymentMethod.name || "Apple Pay";
    }

    return selectedPaymentMethod.description || "Add payment method";
  };

  // Sides Screen Skeleton Loader Component
  const SidesSkeleton = () => (
    <View style={styles.skeletonContainer}>
      {/* Order Header Skeleton - Stacked Images + "Your order" */}
      <View style={styles.skeletonOrderHeaderSection}>
        {/* Stacked Images Skeleton */}
        <View style={styles.skeletonImageStackContainer}>
          {Array.from({ length: 3 }).map((_, index) => {
            const offset = index * 8;
            return (
              <View
                key={index}
                style={[
                  styles.skeletonStackedImage,
                  {
                    transform: [
                      { translateX: offset },
                      { translateY: offset * 0.5 },
                    ],
                    zIndex: 3 - index,
                  },
                ]}
              >
                <SkeletonBox width={80} height={80} borderRadius={12} />
              </View>
            );
          })}
        </View>
        
        {/* Order Text Section Skeleton */}
        <View style={styles.skeletonOrderTextContainer}>
          <SkeletonBox width={120} height={28} borderRadius={4} style={{ marginBottom: 8 }} />
          <View style={styles.skeletonOrderDetailsRow}>
            <SkeletonBox width={60} height={16} borderRadius={4} />
            <View style={styles.skeletonOrderPriceContainer}>
              <SkeletonBox width={50} height={14} borderRadius={4} />
              <SkeletonBox width={60} height={18} borderRadius={4} />
            </View>
          </View>
        </View>
      </View>
      
      {/* Combined Sides Section Skeleton */}
      <View style={styles.skeletonSidesSection}>
        <SkeletonBox width={200} height={18} borderRadius={4} style={{ marginBottom: 16 }} />
        {Array.from({ length: 4 }).map((_, sideIndex) => (
          <View key={sideIndex} style={styles.skeletonSideRow}>
            <View style={styles.skeletonSideLeft}>
              <SkeletonBox width={140} height={16} borderRadius={4} style={{ marginBottom: 6 }} />
              <SkeletonBox width={200} height={14} borderRadius={4} style={{ marginBottom: 6 }} />
              <SkeletonBox width={50} height={14} borderRadius={4} />
            </View>
            <SkeletonBox width={79} height={36} borderRadius={10} />
          </View>
        ))}
      </View>
      
      {/* Payment Section Skeleton */}
      <View style={styles.skeletonPaymentSection}>
        <SkeletonBox width={140} height={20} borderRadius={4} style={{ marginBottom: 16 }} />
        <View style={styles.skeletonPaymentMethodRow}>
          <View style={styles.skeletonPaymentMethodLeft}>
            <SkeletonBox width={32} height={25} borderRadius={6} />
            <SkeletonBox width={150} height={16} borderRadius={4} />
          </View>
          <SkeletonBox width={70} height={32} borderRadius={9999} />
        </View>
        
        <View style={styles.skeletonDietSection}>
          <SkeletonBox width={32} height={23} borderRadius={4} style={{ marginBottom: 8 }} />
          <SkeletonBox width="100%" height={14} borderRadius={4} />
        </View>
      </View>
      
      {/* Summary Section Skeleton */}
      <View style={styles.skeletonSummarySection}>
        <View style={styles.skeletonSummaryRow}>
          <SkeletonBox width={80} height={18} borderRadius={4} />
          <SkeletonBox width={80} height={18} borderRadius={4} />
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <View style={styles.content}>
          <View style={styles.mainContent}>
            <View style={styles.header}>
              <Pressable onPress={handleBack}>
                <Entypo name="chevron-down" size={18} color="white" />
              </Pressable>
              <Text style={styles.headerTitle}>
                Sides & Extras
              </Text>
              <View style={styles.headerSpacer} />
            </View>
            
            {isLoading ? (
              <SkeletonWithTimeout isLoading={isLoading}>
                <SidesSkeleton />
              </SkeletonWithTimeout>
            ) : cartData && cartData.items.length > 0 ? (
              <View style={styles.itemsContainer}>
                {/* Stacked Image Gallery with "Your order" text */}
                <View style={styles.orderHeaderSection}>
                  <View style={styles.imageStackContainer}>
                    {cartData.items.slice(0, 4).map((item, index) => {
                      const offset = index * 8; // Stagger offset for scattered effect
                      const rotation = (index % 2 === 0 ? 1 : -1) * (index * 3); // Alternate rotation
                      return (
                        <View
                          key={item._id}
                          style={[
                            styles.stackedImage,
                            {
                              transform: [
                                { translateX: offset },
                                { translateY: offset * 0.5 },
                                { rotate: `${rotation}deg` },
                              ],
                              zIndex: cartData.items.length - index,
                            },
                          ]}
                        >
                          {item.image_url ? (
                            <Image
                              source={{ uri: item.image_url }}
                              style={styles.stackedImageContent}
                            />
                          ) : (
                            <View style={[styles.stackedImageContent, styles.placeholderImage]}>
                              <Text style={styles.placeholderText}>📦</Text>
                            </View>
                          )}
                        </View>
                      );
                    })}
                    {cartData.items.length > 4 && (
                      <View
                        style={[
                          styles.stackedImage,
                          styles.moreItemsOverlay,
                          {
                            transform: [
                              { translateX: 4 * 8 },
                              { translateY: 4 * 8 * 0.5 },
                            ],
                            zIndex: 0,
                          },
                        ]}
                      >
                        <View style={[styles.stackedImageContent, styles.moreItemsContainer]}>
                          <Text style={styles.moreItemsText}>+{cartData.items.length - 4}</Text>
                        </View>
                      </View>
                    )}
                  </View>
                  <View style={styles.orderTextContainer}>
                    <Text style={styles.yourOrderText}>Your order</Text>
                    <View style={styles.orderDetailsRow}>
                      {(() => {
                        const totalItems = cartData.items.reduce((sum, item) => sum + item.quantity, 0);
                        return (
                          <Text style={styles.orderItemCount}>
                            {totalItems} {totalItems === 1 ? 'item' : 'items'}
                          </Text>
                        );
                      })()}
                      <View style={styles.orderPriceContainer}>
                        <Text style={styles.orderSubtotalLabel}>Subtotal</Text>
                        <Text style={styles.orderSubtotalPrice}>
                          £{(calculateTotal() / 100).toFixed(2)}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
                
                {/* Combined Sides Section */}
                {(() => {
                  const allSides = getAllCombinedSides();
                  return allSides.length > 0 ? (
                    <View style={styles.sidesSection}>
                      <Text style={styles.sidesSectionTitle}>Available Sides & Extras</Text>
                      {allSides.map((side) => {
                        const firstCartItemId = getFirstCartItemForSide(side._id);
                        return (
                          <View key={side._id} style={styles.sideRow}>
                            <View style={styles.sideLeft}>
                              <View>
                                <Text style={styles.sideName}>{side.name}</Text>
                                {side.description && (
                                  <Text style={styles.sideDescription}>{side.description}</Text>
                                )}
                                <Text style={styles.sidePrice}>
                                  £{(side.price / 100).toFixed(2)}
                                </Text>
                              </View>
                            </View>
                            <IncrementalOrderAmount
                              initialValue={side.quantity}
                              onChange={(newQuantity) => {
                                if (firstCartItemId) {
                                  handleSideQuantityChange(firstCartItemId, side._id, newQuantity);
                                }
                              }}
                              isOrdered={side.quantity > 0}
                              buttonText="Add"
                            />
                          </View>
                        );
                      })}
                    </View>
                  ) : (
                    <View style={styles.noSidesContainer}>
                      <Text style={styles.noSidesText}>
                        No sides available
                      </Text>
                    </View>
                  );
                })()}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Your cart is empty</Text>
                <Pressable onPress={handleBack} style={styles.backToCartButton}>
                  <Text style={styles.backToCartButtonText}>Back to Cart</Text>
                </Pressable>
              </View>
            )}

            <View style={styles.paymentSection}>
              <Text style={styles.paymentTitle}>Payment method</Text>
              <View style={styles.paymentMethodRow}>
                <View style={styles.paymentMethodLeft}>
                  {renderPaymentMethodIcon()}
                  <Text style={styles.cardNumber}>
                    {renderPaymentMethodText()}
                  </Text>
                </View>

                <Pressable 
                  onPress={handleChangePaymentMethod}
                  style={styles.changeButton}
                >
                  <Text style={styles.changeButtonText}>
                    {selectedPaymentMethod ? "Change" : "Add"}
                  </Text>
                </Pressable>
              </View>
              
              <View style={styles.dietSection}>
                <View style={styles.dietLeft}>
                  <Image
                    source={require("@/assets/images/livelogo.png")}
                    style={styles.liveLogo}
                  />
                  <Text style={styles.dietText}>
                    These options are limited by Your Diet Preferences{" "}
                    <Pressable onPress={() => router.push("/food-safety")}>
                      <Text style={styles.dietBoldText}>Update Diet</Text>
                    </Pressable>
                  </Text>
                </View>
                <View />
              </View>
            </View>

            {cartData && cartData.items.length > 0 && (
              <View style={styles.summarySection}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Subtotal</Text>
                  <Text style={styles.summaryValue}>
                    £{((calculateTotal() + 900) / 100).toFixed(2)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Delivery Fee</Text>
                  <Text style={styles.summaryValue}>£9.00</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryTotalLabel}>Total</Text>
                  <Text style={styles.summaryTotalValue}>
                    £{((calculateTotal() + 900) / 100).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Payment Button */}
      <View style={styles.footer}>
        <Pressable
          onPress={handleProceedToPayment}
          style={styles.paymentButton}
        >
          <Text style={styles.paymentButtonText}>Proceed to Payment</Text>
        </Pressable>
      </View>

      {/* Add Card Sheet */}
      <AddCardSheet
        isVisible={isAddCardSheetVisible}
        onClose={() => setIsAddCardSheetVisible(false)}
        onSuccess={handleCardAdded}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // flex-1
    backgroundColor: '#02120A', // bg-[#02120A]
  },
  scrollView: {
    flex: 1, // flex-1
  },
  content: {
    flexDirection: 'column', // flex flex-col
    justifyContent: 'space-between', // justify-between
    flex: 1, // flex-1
    padding: 20, // p-5
  },
  mainContent: {
    flex: 1, // flex-1
  },
  header: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    marginBottom: 24, // mb-6
  },
  headerTitle: {
    fontSize: 18, // text-lg
    fontWeight: '500', // font-[500]
    textAlign: 'center', // text-center
    color: '#FFFFFF', // text-white
  },
  headerSpacer: {
    width: 24, // w-6
  },
  itemsContainer: {
    marginBottom: 48, // mb-12
  },
  itemRow: {
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
  itemName: {
    color: '#FFFFFF', // text-white
  },
  itemPrice: {
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
  },
  paymentSection: {
    marginBottom: 32, // mb-8
  },
  paymentTitle: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
    marginTop: 16, // mt-4
    marginBottom: 32, // mb-8
  },
  paymentMethodRow: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    marginBottom: 20, // mb-5
    gap: 8, // gap-x-2
  },
  paymentMethodLeft: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    gap: 8, // gap-x-2
  },
  cardIcon: {
    width: 32.26, // w-[32.26px]
    height: 25, // h-[25px]
  },
  cardNumber: {
    color: '#FFFFFF', // text-white
  },
  appleIconContainer: {
    width: 32.26, // w-[32.26px]
    height: 25, // h-[25px]
    backgroundColor: '#000000', // bg-black
    borderRadius: 6, // rounded-md
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    paddingHorizontal: 4, // px-1
  },
  changeButton: {
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
    borderWidth: 2, // border-2
    borderColor: '#FFFFFF', // border-white
    borderRadius: 9999, // rounded-full
  },
  changeButtonText: {
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
  },
  dietSection: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    marginBottom: 20, // mb-5
    gap: 8, // gap-x-2
  },
  dietLeft: {
    width: '66.666667%', // w-2/3
    gap: 8, // gap-2
  },
  liveLogo: {
    width: 146.63, // w-[146.63px]
    height: 23, // h-[23px]
  },
  dietText: {
    color: '#FFFFFF', // text-white
    marginTop: 8, // mt-2
  },
  dietBoldText: {
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
  },
  summarySection: {
    paddingTop: 16, // pt-4
    borderTopWidth: 1, // border-t
    borderTopColor: '#374151', // border-gray-700
  },
  summaryRow: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    marginBottom: 12, // mb-3
  },
  summaryLabel: {
    fontSize: 18, // text-lg
    color: '#FFFFFF', // text-white
    fontFamily: 'Inter', // font-inter
  },
  summaryValue: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
  },
  summaryTotalLabel: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
    marginBottom: 32, // mb-8
  },
  summaryTotalValue: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
    marginBottom: 32, // mb-8
  },
  footer: {
    position: 'absolute', // absolute
    bottom: 0, // bottom-0
    left: 0, // left-0
    right: 0, // right-0
    backgroundColor: '#02120A', // bg-[#02120A]
    paddingHorizontal: 20, // px-5
    paddingVertical: 16, // py-4
    borderTopWidth: 1, // border-t
    borderTopColor: '#374151', // border-gray-700
  },
  paymentButton: {
    backgroundColor: '#FF3B30', // bg-[#FF3B30]
    borderRadius: 16, // rounded-2xl
    padding: 20, // p-5
    flexDirection: 'row', // flex
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
  },
  paymentButtonText: {
    fontSize: 18, // text-lg
    fontWeight: '700', // font-bold
    color: '#FFFFFF', // text-white
  },
  skeletonContainer: {
    flex: 1,
  },
  skeletonOrderHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  skeletonImageStackContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  skeletonStackedImage: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
  },
  skeletonOrderTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  skeletonOrderDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  skeletonOrderPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonSidesSection: {
    marginBottom: 32,
  },
  skeletonSideRow: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skeletonSideLeft: {
    flex: 1,
    marginRight: 16,
  },
  skeletonPaymentSection: {
    marginBottom: 32,
    marginTop: 16,
  },
  skeletonPaymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 8,
  },
  skeletonPaymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  skeletonDietSection: {
    marginTop: 16,
  },
  skeletonSummarySection: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  skeletonSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  cartItemSection: {
    marginBottom: 32,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  mainItemRow: {
    marginBottom: 16,
  },
  placeholderImage: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  sidesSection: {
    marginTop: 16,
  },
  sidesSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  sideRow: {
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sideLeft: {
    flex: 1,
    marginRight: 16,
  },
  sideName: {
    fontSize: 15,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  sideDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  sidePrice: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  noSidesContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  noSidesText: {
    color: '#9CA3AF',
    fontSize: 14,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 24,
  },
  backToCartButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
  },
  backToCartButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
  orderHeaderSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
    gap: 16,
  },
  imageStackContainer: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  stackedImage: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#EAEAEA',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stackedImageContent: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  moreItemsOverlay: {
    backgroundColor: '#02120A',
    borderColor: '#374151',
  },
  moreItemsContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#02120A',
  },
  moreItemsText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  yourOrderText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  orderTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  orderDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  orderItemCount: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  orderPriceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderSubtotalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  orderSubtotalPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
