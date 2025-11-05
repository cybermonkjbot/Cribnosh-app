import { Mascot } from "@/components/Mascot";
import { useRegionAvailability } from "@/hooks/useRegionAvailability";
import { startOrderLiveActivity } from "@/lib/live-activity/orderLiveActivity";
import {
  useCreateCheckoutMutation,
  useCreateOrderFromCartMutation,
  useGetCartQuery,
} from "@/store/customerApi";
import { Entypo } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { RegionAvailabilityModal } from "./RegionAvailabilityModal";

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
    "processing" | "success" | "error"
  >("processing");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRegionModal, setShowRegionModal] = useState(false);

  // Get cart data for real totals
  const { data: cartData } = useGetCartQuery(undefined, {
    skip: !!orderTotal, // Skip if orderTotal is provided (fallback)
  });

  const [createCheckout] = useCreateCheckoutMutation();
  const [createOrderFromCart] = useCreateOrderFromCartMutation();

  // Regional availability check
  const { checkAddress, isChecking: isCheckingRegion } =
    useRegionAvailability();

  // Calculate totals from cart or use provided values
  const calculatedSubtotal =
    cartData?.data?.items?.reduce(
      (sum: number, item: any) =>
        sum + (item.price || 0) * (item.quantity || 1),
      0
    ) || 0;
  const calculatedDeliveryFee =
    cartData?.data?.delivery_fee || deliveryFee || 900; // Default £9 in pence
  const calculatedTotal =
    (calculatedSubtotal || (orderTotal ? orderTotal * 100 : 0)) +
    calculatedDeliveryFee;

  // Convert to pounds for display
  const displayTotal = calculatedTotal / 100;

  const processPayment = useCallback(async () => {
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

      // Step 1: Create payment intent from cart
      const checkoutResult = await createCheckout({}).unwrap();

      if (!checkoutResult.success || !checkoutResult.data) {
        throw new Error("Failed to create payment intent");
      }

      const paymentIntent = checkoutResult.data;
      const paymentIntentId = paymentIntent.id;

      // Step 2: Simulate payment confirmation
      // TODO: Replace this with actual Stripe SDK payment confirmation
      // For now, we'll simulate payment success after a delay
      // In production, you would use:
      // import { useStripe } from '@stripe/stripe-react-native';
      // const { confirmPayment } = useStripe();
      // const { error, paymentIntent: confirmedIntent } = await confirmPayment(paymentIntent.client_secret, { ... });

      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Step 3: Create order from cart after payment
      const orderResult = await createOrderFromCart({
        payment_intent_id: paymentIntentId,
        delivery_address: deliveryAddress
          ? {
              street: deliveryAddress.street,
              city: deliveryAddress.city,
              state: "", // Not provided in props
              postal_code: deliveryAddress.postcode,
              country: deliveryAddress.country,
            }
          : undefined,
        special_instructions: specialInstructions,
      }).unwrap();

      if (!orderResult.success || !orderResult.data?.order_id) {
        throw new Error("Failed to create order");
      }

      const orderId = orderResult.data.order_id;

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
        router.push(`/orders/cart/success?order_id=${orderId}`);
      }
    } catch (error: any) {
      console.error("Payment processing error:", error);
      setPaymentStatus("error");
      const errorMsg =
        error?.data?.error?.message ||
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
  ]);

  useEffect(() => {
    processPayment();
  }, [processPayment]);

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
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
          {(paymentStatus === "processing" || isCheckingRegion) && (
            <>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.statusText}>
                {isCheckingRegion
                  ? "Checking delivery availability..."
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

      {/* Region Availability Modal */}
      <RegionAvailabilityModal
        isVisible={showRegionModal}
        onClose={() => setShowRegionModal(false)}
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
