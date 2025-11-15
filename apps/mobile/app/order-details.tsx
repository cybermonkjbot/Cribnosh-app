import { EmptyState } from "@/components/ui/EmptyState";
import { Order as ApiOrder } from "@/types/customer";
import * as Linking from "expo-linking";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import Entypo from "@expo/vector-icons/Entypo";
import {
  Package,
  Star,
  Phone,
} from "lucide-react-native";
import { useState, useEffect } from "react";
import { useOrders } from "@/hooks/useOrders";
import { useQuery } from "convex/react";
import { api } from '@/convex/_generated/api';
import { getSessionToken } from "@/lib/convexClient";
import { useAuthContext } from "@/contexts/AuthContext";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

// Helper function to check if order is active
const isOrderActive = (status: string): boolean => {
  const activeStatuses = ["pending", "confirmed", "preparing", "ready", "on-the-way", "on_the_way"];
  return activeStatuses.includes(status.toLowerCase());
};

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const orderId = typeof id === "string" ? id : undefined;
  const { isAuthenticated } = useAuthContext();

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  const { cancelOrder, rateOrder, isLoading: ordersLoading } = useOrders();

  // Load session token for reactive queries
  useEffect(() => {
    const loadToken = async () => {
      const token = await getSessionToken();
      setSessionToken(token);
    };
    if (isAuthenticated) {
      loadToken();
    }
  }, [isAuthenticated]);

  // Use reactive Convex query for order data - this will automatically update when order changes
  const orderData = useQuery(
    api.queries.orders.getEnrichedOrderBySessionToken,
    sessionToken && orderId ? { sessionToken, order_id: orderId } : "skip"
  );

  // Transform order data to match ApiOrder format
  const order = orderData ? (orderData as ApiOrder) : undefined;
  const apiLoading = orderData === undefined && sessionToken !== null; // undefined means query is loading

  const isCancelling = ordersLoading;
  const isRating = ordersLoading;

  const handleBack = () => {
    router.back();
  };

  const handleCancelOrder = async () => {
    if (!order) return;

    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "No", style: "cancel" },
      {
        text: "Yes, Cancel",
        style: "destructive",
        onPress: async () => {
          const success = await cancelOrder(
            order.id || order._id || orderId || "",
            "Customer requested cancellation",
            "full_refund"
          );
          if (success) {
            Alert.alert("Success", "Order has been cancelled successfully");
            router.back();
          }
        },
      },
    ]);
  };

  const handleSubmitRating = async () => {
    if (!order || rating === 0) return;

    const result = await rateOrder({
      order_id: order.id || order._id || orderId || "",
      rating,
      review: review.trim() || undefined,
    });
    if (result) {
      Alert.alert("Success", "Thank you for your rating!");
      setShowRatingModal(false);
      setRating(0);
      setReview("");
    }
  };

  const handleTrackOrder = () => {
    if (orderId) {
      router.push(`/(tabs)/orders/cart/on-the-way?order_id=${orderId}`);
    }
  };

  const handleNavigateToRateOrder = () => {
    if (orderId) {
      router.push(`/rate-order?id=${orderId}`);
    }
  };

  const handleCallKitchen = async () => {
    // Extract phone number from order if available
    // In a real implementation, the order would have kitchen.phone or similar field
    const phoneNumber = order?.kitchen_id || "+44 123 456 7890"; // Fallback if no phone in order
    
    if (!phoneNumber || phoneNumber === order?.kitchen_id) {
      // If we only have kitchen_id, show a message that phone number is not available
      Alert.alert(
        "Phone Number Not Available",
        "The kitchen phone number is not available for this order. Please contact support if you need assistance."
      );
      return;
    }
    
    try {
      const url = `tel:${phoneNumber.replace(/[^0-9+]/g, "")}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Unable to Make Call",
          "Phone calling is not available on this device."
        );
      }
    } catch (error) {
      console.error("Error calling kitchen:", error);
      Alert.alert(
        "Call Failed",
        "Unable to make the call. Please try again."
      );
    }
  };

  const formatPrice = (priceInCents: number) => {
    return `£${(priceInCents / 100).toFixed(2)}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "long",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "preparing":
        return "#F59E0B";
      case "ready":
        return "#10B981";
      case "delivered":
        return "#059669";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "preparing":
        return "Preparing";
      case "ready":
        return "Ready for Pickup";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  if (apiLoading) {
    return (
      <>
        <Stack.Screen 
          options={{ 
            headerShown: false,
            title: 'Order Details'
          }} 
        />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Entypo name="chevron-down" size={18} color="#094327" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order Details</Text>
            <View style={styles.headerSpacer} />
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#094327" />
            <Text style={styles.loadingText}>Loading Order Details...</Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Stack.Screen 
          options={{ 
            headerShown: false,
            title: 'Order Details'
          }} 
        />
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Entypo name="chevron-down" size={18} color="#094327" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order Details</Text>
            <View style={styles.headerSpacer} />
          </View>
          <EmptyState
            title="Order Not Found"
            subtitle="The order you are looking for could not be found or an error occurred."
            icon="alert-circle-outline"
          />
        </SafeAreaView>
      </>
    );
  }

  const isActive = isOrderActive(order.status);

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: 'Order Details'
        }} 
      />
      <SafeAreaView style={styles.container} edges={['top']}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.content}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Entypo name="chevron-down" size={18} color="#094327" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Order Details</Text>
              <View style={styles.headerSpacer} />
            </View>
            {/* Order Header */}
            <View style={styles.orderHeader}>
              <Text style={styles.orderTitle}>Order</Text>
              <Text style={styles.orderId}>#{order.id}</Text>
            </View>

            {/* Order Status */}
            <View style={styles.statusContainer}>
              <View style={styles.statusIndicator} />
              <Text style={styles.statusText}>{getStatusText(order.status).toLowerCase()}</Text>
            </View>

            {/* Kitchen Info */}
            <View style={styles.sectionRow}>
              <View style={styles.sectionLeft}>
                <View style={styles.iconBadge}>
                  <Phone size={16} color="white" />
                </View>
                <View style={styles.sectionText}>
                  <Text style={styles.sectionTitle}>Kitchen</Text>
                  <Text style={styles.kitchenName}>{order.kitchen_name}</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.callKitchenButton}
                onPress={handleCallKitchen}
              >
                <Text style={styles.callKitchenText}>Call</Text>
              </TouchableOpacity>
            </View>

            {/* Order Items */}
            <View style={styles.itemsSection}>
              <Text style={styles.sectionTitle}>Order Items</Text>
              {order.items.map((item: any, index: number) => (
                <View key={item.id || index} style={styles.orderItem}>
                  <View style={styles.itemInfo}>
                    <Text style={styles.itemName}>{item.dish_name}</Text>
                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                  </View>
                  <Text style={styles.itemPrice}>
                    {formatPrice(item.price * item.quantity)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Order Summary */}
            <View style={styles.summary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>
                  {formatPrice(order.subtotal)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Delivery Fee</Text>
                <Text style={styles.summaryValue}>
                  {formatPrice(order.delivery_fee)}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Tax</Text>
                <Text style={styles.summaryValue}>{formatPrice(order.tax)}</Text>
              </View>
              <View style={[styles.summaryRow, styles.totalRow]}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{formatPrice(order.total)}</Text>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* Footer with Action Buttons */}
        <SafeAreaView style={styles.footerContainer} edges={['bottom']}>
          <View style={styles.footer}>
            {isActive ? (
              <TouchableOpacity
                style={styles.trackButton}
                onPress={handleTrackOrder}
              >
                <Text style={styles.trackButtonText}>Track Order</Text>
              </TouchableOpacity>
            ) : order.status === "delivered" ? (
              <TouchableOpacity
                style={styles.trackButton}
                onPress={handleNavigateToRateOrder}
              >
                <Text style={styles.trackButtonText}>Rate Order</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </SafeAreaView>

        {/* Rating Modal */}
        {showRatingModal && (
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Rate Your Order</Text>
              <View style={styles.starsContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity
                    key={star}
                    onPress={() => setRating(star)}
                    style={styles.starButton}
                  >
                    <Star
                      size={32}
                      color={star <= rating ? "#F59E0B" : "#6B7280"}
                      fill={star <= rating ? "#F59E0B" : "transparent"}
                    />
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.modalButton, styles.submitButton]}
                onPress={handleSubmitRating}
                disabled={rating === 0 || isRating}
              >
                <Text style={styles.modalButtonText}>
                  {isRating ? "Submitting..." : "Submit Rating"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalButton]}
                onPress={() => setShowRatingModal(false)}
              >
                <Text style={styles.modalButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexDirection: 'column',
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    color: '#094327',
  },
  headerSpacer: {
    width: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#094327",
    marginTop: 10,
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  orderHeader: {
    marginBottom: 16,
  },
  orderTitle: {
    color: "#111827",
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 4,
  },
  orderId: {
    color: "#6B7280",
    fontSize: 14,
    fontFamily: "monospace",
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 32,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#111827",
    marginRight: 8,
  },
  statusText: {
    color: "#6B7280",
    fontSize: 14,
    textTransform: "capitalize",
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginTop: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
  },
  sectionLeft: {
    flexDirection: 'row',
    gap: 8,
    flex: 1,
    alignItems: 'center',
  },
  iconBadge: {
    padding: 8,
    borderRadius: 9999,
    backgroundColor: '#094327',
    flexShrink: 0,
  },
  sectionText: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  kitchenName: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "600",
  },
  callKitchenButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  callKitchenText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  itemsSection: {
    marginTop: 32,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    paddingBottom: 8,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: "#111827",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemQuantity: {
    color: "#6B7280",
    fontSize: 14,
  },
  itemPrice: {
    color: "#094327",
    fontSize: 18,
    fontWeight: "700",
  },
  summary: {
    marginTop: 48,
  },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 18,
    fontFamily: 'Inter',
    color: '#094327',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#094327',
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  trackButton: {
    backgroundColor: '#FF3B30',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  actionButton: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#dc2626',
  },
  rateButton: {
    backgroundColor: '#FF3B30',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  rateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "rgba(230, 255, 232, 0.95)",
    borderRadius: 12,
    padding: 30,
    width: "80%",
    alignItems: "center",
  },
  modalTitle: {
    color: "#094327",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
  },
  starsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  starButton: {
    marginHorizontal: 5,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
    marginBottom: 10,
  },
  submitButton: {
    backgroundColor: "#22c55e",
  },
  cancelModalButton: {
    backgroundColor: "#6B7280",
  },
  modalButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
