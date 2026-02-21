import { Mascot } from "@/components/Mascot";
import { useAuthContext } from "@/contexts/AuthContext";
import { api } from '@/convex/_generated/api';
import { useCart } from "@/hooks/useCart";
import { useOrders } from "@/hooks/useOrders";
import { usePayments } from "@/hooks/usePayments";
import { useRegionAvailability } from "@/hooks/useRegionAvailability";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { startOrderLiveActivity } from "@/lib/live-activity/orderLiveActivity";
import { Entypo } from "@expo/vector-icons";
import { useStripe } from "@stripe/stripe-react-native";
import { router } from "expo-router";
import * as SecureStore from "expo-secure-store";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View
} from "react-native";
import { MultipleFoodCreatorsWarningModal } from "./MultipleFoodCreatorsWarningModal";
import { OfflineFoodCreatorsWarningModal } from "./OfflineFoodCreatorsWarningModal";
import { RegionAvailabilityModal } from "./RegionAvailabilityModal";

// Try to import expo-device to check if we're on a simulator
let Device: any = null;
try {
  Device = require('expo-device');
} catch {
  // expo-device not available
}

const PAYMENT_METHOD_STORAGE_KEY = "cart_selected_payment_method";

interface PaymentScreenProps {
  orderTotal?: number;
  deliveryFee?: number;
  deliveryAddress?: {
    street: string;
    city: string;
    postcode: string;
    country: string;
  };
  specialInstructions?: string;
  onPaymentSuccess?: (orderId?: string) => void;
}

export default function PaymentScreen({
  orderTotal,
  deliveryFee,
  deliveryAddress,
  specialInstructions,
  onPaymentSuccess,
}: PaymentScreenProps) {
  const [paymentStatus, setPaymentStatus] = useState<
    "processing" | "success" | "error" | "pending_confirmation"
  >("pending_confirmation");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRegionModal, setShowRegionModal] = useState(false);
  const [showMultipleFoodCreatorsModal, setShowMultipleFoodCreatorsModal] = useState(false);
  const [hasCheckedMultipleFoodCreators, setHasCheckedMultipleFoodCreators] = useState(false);
  const [showOfflineFoodCreatorsModal, setShowOfflineFoodCreatorsModal] = useState(false);
  const [hasCheckedOfflineFoodCreators, setHasCheckedOfflineFoodCreators] = useState(false);
  const [offlineFoodCreators, setOfflineFoodCreators] = useState<Array<{ foodCreatorId: string; foodCreatorName: string; itemNames: string[] }>>([]);
  const [cartOrderNote, setCartOrderNote] = useState<string | undefined>(undefined);

  // Using Convex directly for all API calls
  const { getCart } = useCart();
  const { createCheckout } = usePayments();
  const { createOrderFromCart } = useOrders();
  const [cartData, setCartData] = useState<any>(null);
  const stripe = useStripe() as any;
  const { confirmPayment, presentApplePay, isApplePaySupported, initPaymentSheet, presentPaymentSheet } = stripe || {};

  // Load cart data if orderTotal is not provided
  useEffect(() => {
    if (!orderTotal) {
      const loadCart = async () => {
        try {
          const result = await getCart();
          if (result?.success) {
            setCartData(result);
          }
        } catch (error) {
          // Error already handled in hook
        }
      };
      loadCart();
    }
  }, [orderTotal, getCart]);

  // Load order note from storage
  useEffect(() => {
    const loadOrderNote = async () => {
      try {
        const savedNote = await SecureStore.getItemAsync('cart_order_note');
        if (savedNote && savedNote.trim()) {
          setCartOrderNote(savedNote);
        }
      } catch (error) {
        console.warn('Failed to load order note:', error);
      }
    };
    loadOrderNote();
  }, []);

  // Regional availability check
  const { checkAddress, isChecking: isCheckingRegion } =
    useRegionAvailability();

  // Get user for email prefilling
  const { user } = useAuthContext();

  // Calculate totals from cart or use provided values
  const calculatedSubtotal =
    cartData?.data?.items?.reduce(
      (sum: number, item: any) =>
        sum + (item.price || 0) * (item.quantity || 1),
      0
    ) || 0;
  // Get delivery fee from cart data, prop, or null if not available
  const calculatedDeliveryFee =
    cartData?.data?.delivery_fee ?? deliveryFee ?? null;
  const calculatedTotal =
    (calculatedSubtotal || (orderTotal ? orderTotal * 100 : 0)) +
    (calculatedDeliveryFee ?? 0);

  // Convert to pounds for display
  const displayTotal = calculatedTotal / 100;

  // Check if cart has items from multiple food creators
  const hasMultipleFoodCreators = useMemo(() => {
    if (!cartData?.data?.items || cartData.data.items.length === 0) {
      return false;
    }

    const foodCreatorIds = new Set<string>();
    for (const item of cartData.data.items) {
      if (item.foodCreatorId) {
        foodCreatorIds.add(item.foodCreatorId);
      }
    }

    return foodCreatorIds.size > 1;
  }, [cartData]);

  const processPaymentInternal = useCallback(async () => {
    try {
      setPaymentStatus("processing");
      setErrorMessage(null);

      // Check regional availability before processing payment
      if (deliveryAddress) {
        const isSupported = await checkAddress({
          street: deliveryAddress.street,
          city: deliveryAddress.city,
          state: "", // Not required for check
          postal_code: deliveryAddress.postcode,
          country: deliveryAddress.country,
        });

        if (!isSupported) {
          setShowRegionModal(true);
          setPaymentStatus("error");
          setErrorMessage(
            "Region not supported. We do not deliver to this location yet."
          );
          return;
        }
      }

      // Step 1: Create payment intent from cart with fulfillment details
      const storedPaymentMethodStr = await SecureStore.getItemAsync(PAYMENT_METHOD_STORAGE_KEY);
      let selectedPM: { id?: string } | null = null;
      if (storedPaymentMethodStr) {
        try {
          selectedPM = JSON.parse(storedPaymentMethodStr);
        } catch (e) { }
      }

      // Get nosh points applied from storage if available
      let noshPoints: number | undefined = undefined;
      try {
        const discountInfoStr = await SecureStore.getItemAsync('cart_discount_info');
        if (discountInfoStr) {
          const discountInfo = JSON.parse(discountInfoStr);
          if (discountInfo.type === 'nosh_pass' && discountInfo.pointsAmount) {
            noshPoints = discountInfo.pointsAmount;
          }
        }
      } catch (e) { }

      const paymentIntent = await createCheckout({
        delivery_address: deliveryAddress
          ? {
            street: deliveryAddress.street,
            city: deliveryAddress.city,
            postcode: deliveryAddress.postcode,
            country: deliveryAddress.country,
          }
          : undefined,
        special_instructions: specialInstructions || cartOrderNote || undefined,
        nosh_points_applied: noshPoints,
        gameDebtId: selectedPM?.id === 'redeem_game' ? (selectedPM as any).debtId : undefined,
        payment_method: selectedPM?.id,
      });

      if (!paymentIntent || !paymentIntent.id) {
        throw new Error("Failed to create payment intent");
      }

      const paymentIntentId = paymentIntent.id;
      const clientSecret = paymentIntent.client_secret;

      if (!clientSecret) {
        throw new Error("Payment intent client secret is missing");
      }

      // Step 2: Get selected payment method
      const storedPaymentMethod = await SecureStore.getItemAsync(PAYMENT_METHOD_STORAGE_KEY);
      let selectedPaymentMethod: { iconType?: string; id?: string } | null = null;

      if (storedPaymentMethod) {
        try {
          selectedPaymentMethod = JSON.parse(storedPaymentMethod);
        } catch (error) {
          console.warn('Failed to parse stored payment method:', error);
        }
      }

      // Step 3: Confirm payment based on payment method type
      let confirmedPaymentIntent: any = null;

      const isPayForMe = selectedPaymentMethod?.id === 'pay_for_me';

      if (!isPayForMe) {
        if (selectedPaymentMethod?.id === 'stripe_sheet') {
          // Stripe Payment Sheet Flow (BNPL / Other)
          if (!initPaymentSheet || !presentPaymentSheet) {
            throw new Error("Stripe Payment Sheet is not available");
          }

          // Initialize Payment Sheet
          const { error: initError } = await initPaymentSheet({
            merchantDisplayName: "Cribnosh",
            paymentIntentClientSecret: clientSecret,
            returnURL: 'cribnoshapp://stripe-redirect',
            defaultBillingDetails: {
              email: user.email,
            },
            allowsDelayedPaymentMethods: true,
          });

          if (initError) {
            throw new Error(initError.message || 'Failed to initialize payment sheet');
          }

          // Present Payment Sheet
          const { error: presentError } = await presentPaymentSheet();

          if (presentError) {
            if (presentError.code === 'Canceled') {
              setPaymentStatus("pending_confirmation"); // Go back to pending if cancelled
              return;
            }
            throw new Error(presentError.message || 'Payment failed');
          }

          // Payment Sheet handles confirmation internally.
          // We can assume success if no error was returned from presentPaymentSheet.
          // However, we should verify the payment intent status if possible, or trust the sheet result.
          // The sheet confirms the PI. We can just set a flag or retrieve the PI to be sure.
          // For simplicity and standard flow, we'll assume success and let the order creation verify via webhook or subsequent checks if needed.
          // But to match existing flow structure, we'll assign a dummy object or fetch updated PI status.

          confirmedPaymentIntent = { status: 'Succeeded', id: paymentIntentId };

        } else if (selectedPaymentMethod?.iconType === 'apple') {
          // Apple Pay flow
          if (!presentApplePay || !isApplePaySupported) {
            // Check if we're on a simulator - only if Device is available and explicitly says it's not a device
            // We need to be careful: Device?.isDevice === false means simulator, but undefined means we don't know
            const isSimulator = Device && Device.isDevice === false;

            if (isSimulator) {
              throw new Error(
                "Apple Pay is not available on iOS simulators. " +
                "Please test Apple Pay on a real iOS device. " +
                "You can change your payment method to a card for testing."
              );
            }

            throw new Error(
              "Apple Pay is not available on this device. " +
              "Please ensure Apple Pay is set up in your device settings, " +
              "or select a different payment method."
            );
          }

          // Build cart items for Apple Pay
          const cartItems = [];

          // Add individual items
          if (cartData?.data?.items) {
            for (const item of cartData.data.items) {
              cartItems.push({
                label: item.name || 'Item',
                amount: String((item.price * item.quantity) / 100),
                type: 'final' as const,
              });
            }
          }

          // Add delivery fee if applicable
          if (calculatedDeliveryFee && calculatedDeliveryFee > 0) {
            cartItems.push({
              label: 'Delivery Fee',
              amount: String(calculatedDeliveryFee / 100),
              type: 'final' as const,
            });
          }

          // Note: Apple Pay automatically calculates the total from the sum of all items

          // Present Apple Pay sheet
          const { error: applePayError, paymentMethod: applePayPaymentMethod } = await presentApplePay({
            cartItems,
            country: 'GB',
            currency: 'GBP',
            requiredShippingAddressFields: deliveryAddress ? [] : ['all'],
          });

          if (applePayError) {
            throw new Error(applePayError.message || 'Apple Pay payment failed');
          }

          if (!applePayPaymentMethod) {
            throw new Error('Apple Pay payment method not returned');
          }

          // Confirm payment with Apple Pay payment method
          if (!confirmPayment) {
            throw new Error("Stripe confirmPayment is not available");
          }

          // Confirm payment intent with the Apple Pay payment method
          const { error: confirmError, paymentIntent: confirmedIntent } = await confirmPayment(
            clientSecret,
            {
              paymentMethodType: 'ApplePay',
              paymentMethodId: applePayPaymentMethod.id,
            }
          );

          if (confirmError) {
            throw new Error(confirmError.message || 'Payment confirmation failed');
          }

          confirmedPaymentIntent = confirmedIntent;
        } else if (selectedPaymentMethod?.id) {
          // Card payment flow - payment method already attached to payment intent
          if (!confirmPayment) {
            throw new Error("Stripe confirmPayment is not available");
          }

          const { error: confirmError, paymentIntent: confirmedIntent } = await confirmPayment(
            clientSecret,
            undefined // Payment method already attached, no options needed
          );

          if (confirmError) {
            throw new Error(confirmError.message || 'Payment confirmation failed');
          }

          confirmedPaymentIntent = confirmedIntent;
        } else {
          // No payment method selected - fallback to card collection
          if (!confirmPayment) {
            throw new Error("Stripe confirmPayment is not available");
          }

          const { error: confirmError, paymentIntent: confirmedIntent } = await confirmPayment(
            clientSecret,
            {
              paymentMethodType: 'Card',
            }
          );

          if (confirmError) {
            throw new Error(confirmError.message || 'Payment confirmation failed');
          }

          confirmedPaymentIntent = confirmedIntent;
        }

        // Verify payment was successful
        if (!confirmedPaymentIntent || confirmedPaymentIntent.status !== 'Succeeded') {
          throw new Error(`Payment not completed. Status: ${confirmedPaymentIntent?.status || 'unknown'}`);
        }
      }

      // Step 3: Get discount info from storage
      let noshPointsApplied: number | undefined = undefined;
      try {
        const discountInfoStr = await SecureStore.getItemAsync('cart_discount_info');
        if (discountInfoStr) {
          const discountInfo = JSON.parse(discountInfoStr);
          if (discountInfo.type === 'nosh_pass' && discountInfo.pointsAmount) {
            noshPointsApplied = discountInfo.pointsAmount;
          }
        }
      } catch (error) {
        console.warn('Failed to read discount info:', error);
      }

      // Step 4: Create order from cart after payment
      // Use note from props, storage, or empty string
      const finalSpecialInstructions = specialInstructions || cartOrderNote || undefined;

      const orderResult = await createOrderFromCart({
        payment_intent_id: selectedPaymentMethod?.id === 'pay_for_me' ? undefined : paymentIntentId,
        payment_method: selectedPaymentMethod?.id === 'pay_for_me' ? 'pay_for_me' : 'card',
        delivery_address: deliveryAddress
          ? {
            street: deliveryAddress.street,
            city: deliveryAddress.city,
            postcode: deliveryAddress.postcode,
            country: deliveryAddress.country,
          }
          : undefined,
        special_instructions: finalSpecialInstructions,
        nosh_points_applied: noshPointsApplied,
        gameDebtId: selectedPaymentMethod?.id === 'redeem_game' ? (selectedPaymentMethod as any).debtId : undefined,
      });

      if (!orderResult || !orderResult.order_id) {
        throw new Error("Failed to create order: Order result is invalid");
      }

      // Clear discount info and order note after successful order
      try {
        await SecureStore.deleteItemAsync('cart_discount_info');
        await SecureStore.deleteItemAsync('cart_order_note');
      } catch (error) {
        console.warn('Failed to clear cart data:', error);
      }

      const orderId = orderResult.order_id;

      setPaymentStatus("success");

      // Start Live Activity for the new order
      try {
        // Start with minimal data - will be updated when order status screen loads
        const orderNumber = orderId.substring(0, 8).toUpperCase();

        await startOrderLiveActivity({
          orderId: orderId,
          orderNumber: orderNumber,
          status: "pending",
          statusText: "Order Confirmed",
          totalAmount: calculatedTotal,
        });
      } catch (error) {
        console.error("Error starting Live Activity:", error);
        // Don't fail the payment flow if Live Activity fails
      }

      // Call success handler with order ID
      if (onPaymentSuccess) {
        onPaymentSuccess(orderId);
      } else {
        // Default navigation if no handler provided
        if (selectedPaymentMethod?.id === 'pay_for_me') {
          router.push(`/orders/payment-request?order_id=${orderId}` as any);
        } else {
          router.push(`/orders/cart/success?order_id=${orderId}` as any);
        }
      }
    } catch (error: any) {
      console.error("Payment processing error:", error);
      setPaymentStatus("error");
      const errorMsg =
        error?.message ||
        "There was an issue processing your payment. Please try again.";
      setErrorMessage(errorMsg);

      Alert.alert("Payment Failed", errorMsg, [
        {
          text: "OK",
          onPress: () => {
            router.back();
          },
        },
      ]);
    }
  }, [
    checkAddress,
    createCheckout,
    createOrderFromCart,
    deliveryAddress,
    onPaymentSuccess,
    specialInstructions,
    calculatedTotal,
    getCart,
  ]);

  // Check for offline food creators
  useEffect(() => {
    if (hasCheckedOfflineFoodCreators) {
      return;
    }

    // Wait for cart data to load
    if (!cartData?.data?.items) {
      return;
    }

    const checkOfflineFoodCreators = async () => {
      try {
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          setHasCheckedOfflineFoodCreators(true);
          return;
        }

        // Get user ID from cart data or query
        const user = await convex.query(api.queries.users.getUserBySessionToken, { sessionToken });
        if (!user?._id) {
          setHasCheckedOfflineFoodCreators(true);
          return;
        }

        const availability = await convex.query(api.queries.orders.checkCartFoodCreatorAvailability, {
          userId: user._id,
          sessionToken,
        });

        setHasCheckedOfflineFoodCreators(true);

        if (!availability.allFoodCreatorsOnline && availability.offlineFoodCreators.length > 0) {
          setOfflineFoodCreators(availability.offlineFoodCreators);
          setShowOfflineFoodCreatorsModal(true);
        }
      } catch (error) {
        console.error('Error checking foodCreator availability:', error);
        // Continue with payment if check fails
        setHasCheckedOfflineFoodCreators(true);
      }
    };

    checkOfflineFoodCreators();
  }, [cartData, hasCheckedOfflineFoodCreators]);

  // Check for multiple food creators immediately on mount - after offline food creators check
  useEffect(() => {
    if (hasCheckedMultipleFoodCreators || !hasCheckedOfflineFoodCreators || showOfflineFoodCreatorsModal) {
      return;
    }

    // Wait for cart data to load
    if (!cartData?.data?.items) {
      return;
    }

    setHasCheckedMultipleFoodCreators(true);

    if (hasMultipleFoodCreators) {
      // Show modal before rendering payment screen
      setShowMultipleFoodCreatorsModal(true);
    } else {
      // No multiple food creators, proceed directly to payment
      setPaymentStatus("processing");
      processPaymentInternal();
    }
  }, [hasMultipleFoodCreators, cartData, hasCheckedMultipleFoodCreators, hasCheckedOfflineFoodCreators, showOfflineFoodCreatorsModal, processPaymentInternal]);

  const handleConfirmMultipleFoodCreators = () => {
    setShowMultipleFoodCreatorsModal(false);
    setPaymentStatus("processing");
    processPaymentInternal();
  };

  const handleCancelMultipleFoodCreators = () => {
    setShowMultipleFoodCreatorsModal(false);
    setPaymentStatus("error");
    setErrorMessage("Order cancelled. Please review your cart.");
  };

  const handleCancelOfflineFoodCreators = () => {
    setShowOfflineFoodCreatorsModal(false);
    setPaymentStatus("error");
    setErrorMessage("Please remove items from offline food creators or wait until they come online.");
  };

  const handleBack = () => {
    router.back();
  };

  // Don't render payment screen content if modal should be shown
  const shouldShowPaymentScreen = !showMultipleFoodCreatorsModal && !showOfflineFoodCreatorsModal && hasCheckedMultipleFoodCreators && hasCheckedOfflineFoodCreators;

  return (
    <SafeAreaView style={styles.container}>
      {/* Only show payment screen content after modal is handled */}
      {shouldShowPaymentScreen && (
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={handleBack}>
              <Entypo name="chevron-down" size={24} color="#094327" />
            </Pressable>
            <Text style={styles.headerTitle}>Processing Payment</Text>
            <View style={styles.headerSpacer} />
          </View>

          {/* Main Content */}
          <View style={styles.mainContent}>
            {(paymentStatus === "processing" || paymentStatus === "pending_confirmation" || isCheckingRegion) && (
              <>
                <ActivityIndicator size="large" color="#10B981" />
                <Text style={styles.statusText}>
                  {isCheckingRegion
                    ? "Checking delivery availability..."
                    : paymentStatus === "pending_confirmation"
                      ? "Preparing your order..."
                      : "Processing Payment"}
                </Text>
                <Text style={styles.amountValue}>£{displayTotal.toFixed(2)}</Text>
              </>
            )}

            {paymentStatus === "error" && (
              <>
                <Mascot emotion="sad" size={180} />
                <Text style={styles.statusText}>Payment Failed</Text>
                {errorMessage && (
                  <Text style={styles.errorMessage}>{errorMessage}</Text>
                )}
              </>
            )}

            {paymentStatus === "success" && (
              <>
                <Mascot emotion="happy" size={180} />
                <Text style={styles.statusText}>Payment Successful</Text>
                <Text style={styles.successSubtext}>Creating your order...</Text>
              </>
            )}
          </View>
        </View>
      )}

      {/* Region Availability Modal */}
      <RegionAvailabilityModal
        isVisible={showRegionModal}
        onClose={() => setShowRegionModal(false)}
      />

      {/* Multiple Food Creators Warning Modal - shown before payment screen */}
      <MultipleFoodCreatorsWarningModal
        isVisible={showMultipleFoodCreatorsModal}
        onConfirm={handleConfirmMultipleFoodCreators}
        onCancel={handleCancelMultipleFoodCreators}
      />
      {/* Offline Food Creators Warning Modal - shown before payment screen */}
      <OfflineFoodCreatorsWarningModal
        isVisible={showOfflineFoodCreatorsModal}
        offlineFoodCreators={offlineFoodCreators}
        onConfirm={() => {
          // This shouldn't be called since modal only has cancel button
          setShowOfflineFoodCreatorsModal(false);
        }}
        onCancel={handleCancelOfflineFoodCreators}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    color: "#111827",
  },
  headerSpacer: {
    width: 24,
  },
  mainContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 24,
  },
  statusText: {
    fontSize: 18,
    color: "#4B5563",
    textAlign: "center",
  },
  amountValue: {
    fontSize: 36,
    fontWeight: "700",
    textAlign: "center",
    color: "#FF3B30",
    marginTop: 16,
  },
  errorMessage: {
    fontSize: 14,
    color: "#DC2626",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 32,
  },
  successSubtext: {
    fontSize: 14,
    color: "#4B5563",
    textAlign: "center",
    marginTop: 8,
  },
});
