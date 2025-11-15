import { EmptyState } from "@/components/ui/EmptyState";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Order as ApiOrder } from "@/types/customer";
import * as Linking from "expo-linking";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import {
  Clock,
  MapPin,
  Package,
  Phone,
  Star,
} from "lucide-react-native";
import { useState, useEffect } from "react";
import { useOrders } from "@/hooks/useOrders";
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
import { SvgXml } from "react-native-svg";

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const orderId = typeof id === "string" ? id : undefined;

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");
  const [order, setOrder] = useState<ApiOrder | undefined>(undefined);
  const [apiLoading, setApiLoading] = useState(false);

  const { getOrder, cancelOrder, rateOrder, isLoading: ordersLoading } = useOrders();

  // Fetch order details using Convex
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      setApiLoading(true);
      const orderData = await getOrder(orderId);
      if (orderData) {
        // Transform the order data to match ApiOrder format
        setOrder(orderData as ApiOrder);
      }
      setApiLoading(false);
    };
    fetchOrder();
  }, [orderId, getOrder]);

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

  const handleRateOrder = async () => {
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
    router.push(`/order-status-tracking?id=${orderId}`);
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
        <GradientBackground>
          <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <SvgXml xml={backArrowSVG} width={24} height={24} />
              </TouchableOpacity>
              <View style={styles.headerSpacer} />
            </View>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#E6FFE8" />
              <Text style={styles.loadingText}>Loading Order Details...</Text>
            </View>
          </SafeAreaView>
        </GradientBackground>
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
        <GradientBackground>
          <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <SvgXml xml={backArrowSVG} width={24} height={24} />
              </TouchableOpacity>
              <View style={styles.headerSpacer} />
            </View>
            <EmptyState
              title="Order Not Found"
              subtitle="The order you are looking for could not be found or an error occurred."
              icon="alert-circle-outline"
            />
          </SafeAreaView>
        </GradientBackground>
      </>
    );
  }

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: 'Order Details'
        }} 
      />
      <GradientBackground>
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <SvgXml xml={backArrowSVG} width={24} height={24} />
            </TouchableOpacity>
            <View style={styles.headerSpacer} />
          </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <SectionHeader title={`Order #${order.id}`} />

          {/* Order Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View
                style={[
                  styles.statusIndicator,
                  { backgroundColor: getStatusColor(order.status) },
                ]}
              />
              <Text style={styles.statusText}>
                {getStatusText(order.status)}
              </Text>
            </View>
            {order.estimated_delivery_time && (
              <View style={styles.deliveryTime}>
                <Clock size={16} color="#C0DCC0" />
                <Text style={styles.deliveryTimeText}>
                  Estimated delivery:{" "}
                  {formatTime(order.estimated_delivery_time)}
                </Text>
              </View>
            )}
          </View>

          {/* Kitchen Info */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kitchen</Text>
            <Text style={styles.kitchenName}>{order.kitchen_name}</Text>
            <TouchableOpacity
              style={styles.callButton}
              onPress={handleCallKitchen}
            >
              <Phone size={16} color="#E6FFE8" />
              <Text style={styles.callButtonText}>Call Kitchen</Text>
            </TouchableOpacity>
          </View>

          {/* Order Items */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Items</Text>
            {order.items.map((item: any, index: number) => (
              <View key={item.id} style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.dish_name}</Text>
                  <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                  {item.special_instructions && (
                    <Text style={styles.specialInstructions}>
                      Note: {item.special_instructions}
                    </Text>
                  )}
                </View>
                <Text style={styles.itemPrice}>
                  {formatPrice(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>

          {/* Order Summary */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Summary</Text>
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

          {/* Delivery Address */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Delivery Address</Text>
            <View style={styles.addressContainer}>
              <MapPin size={16} color="#C0DCC0" />
              <Text style={styles.addressText}>
                {`${order.delivery_address.street}, ${order.delivery_address.city}, ${order.delivery_address.state} ${order.delivery_address.postal_code}, ${order.delivery_address.country}`}
              </Text>
            </View>
            {order.special_instructions && (
              <Text style={styles.specialInstructions}>
                Special Instructions: {order.special_instructions}
              </Text>
            )}
          </View>

          {/* Order Timeline */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Timeline</Text>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Order Placed</Text>
                <Text style={styles.timelineTime}>
                  {formatTime(order.created_at)}
                </Text>
              </View>
            </View>
            {order.status === "preparing" && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.activeDot]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Preparing</Text>
                  <Text style={styles.timelineTime}>In progress</Text>
                </View>
              </View>
            )}
            {order.status === "ready" && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.activeDot]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Ready for Pickup</Text>
                  <Text style={styles.timelineTime}>Ready now</Text>
                </View>
              </View>
            )}
            {order.status === "delivered" && (
              <View style={styles.timelineItem}>
                <View style={[styles.timelineDot, styles.activeDot]} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>Delivered</Text>
                  <Text style={styles.timelineTime}>
                    {formatTime(order.updated_at)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          {order.status === "preparing" && (
            <TouchableOpacity
              style={styles.trackButton}
              onPress={handleTrackOrder}
            >
              <Package size={20} color="#E6FFE8" />
              <Text style={styles.trackButtonText}>Track Order</Text>
            </TouchableOpacity>
          )}

          {order.status === "preparing" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancelOrder}
              disabled={isCancelling}
            >
              <Text style={styles.actionButtonText}>
                {isCancelling ? "Cancelling..." : "Cancel Order"}
              </Text>
            </TouchableOpacity>
          )}

          {order.status === "delivered" && (
            <TouchableOpacity
              style={[styles.actionButton, styles.rateButton]}
              onPress={() => setShowRatingModal(true)}
            >
              <Star size={20} color="#E6FFE8" />
              <Text style={styles.actionButtonText}>Rate Order</Text>
            </TouchableOpacity>
          )}
        </View>

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
                onPress={handleRateOrder}
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
    </GradientBackground>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 16,
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerSpacer: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#E6FFE8",
    marginTop: 10,
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  statusCard: {
    backgroundColor: "rgba(230, 255, 232, 0.1)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(230, 255, 232, 0.2)",
  },
  statusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    color: "#E6FFE8",
    fontSize: 18,
    fontWeight: "bold",
  },
  deliveryTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  deliveryTimeText: {
    color: "#C0DCC0",
    fontSize: 14,
    marginLeft: 8,
  },
  card: {
    backgroundColor: "rgba(230, 255, 232, 0.1)",
    borderRadius: 12,
    padding: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "rgba(230, 255, 232, 0.2)",
  },
  cardTitle: {
    color: "#E6FFE8",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  kitchenName: {
    color: "#C0DCC0",
    fontSize: 16,
    marginBottom: 10,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(230, 255, 232, 0.15)",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  callButtonText: {
    color: "#E6FFE8",
    fontSize: 14,
    marginLeft: 8,
  },
  orderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(230, 255, 232, 0.1)",
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: "#E6FFE8",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  itemQuantity: {
    color: "#C0DCC0",
    fontSize: 14,
    marginBottom: 4,
  },
  specialInstructions: {
    color: "#A0A0A0",
    fontSize: 12,
    fontStyle: "italic",
  },
  itemPrice: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "bold",
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    color: "#C0DCC0",
    fontSize: 14,
  },
  summaryValue: {
    color: "#E6FFE8",
    fontSize: 14,
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: "rgba(230, 255, 232, 0.2)",
    paddingTop: 8,
    marginTop: 8,
  },
  totalLabel: {
    color: "#E6FFE8",
    fontSize: 16,
    fontWeight: "bold",
  },
  totalValue: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "bold",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  addressText: {
    color: "#C0DCC0",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#6B7280",
    marginRight: 15,
    marginTop: 4,
  },
  activeDot: {
    backgroundColor: "#22c55e",
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    color: "#E6FFE8",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  timelineTime: {
    color: "#C0DCC0",
    fontSize: 12,
  },
  actionButtonsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  trackButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  trackButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginLeft: 8,
  },
  actionButton: {
    backgroundColor: "#22c55e",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#dc2626",
  },
  rateButton: {
    backgroundColor: "#F59E0B",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
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
