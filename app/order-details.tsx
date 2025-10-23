import { EmptyState } from "@/components/ui/EmptyState";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ChevronLeft,
  Clock,
  MapPin,
  Package,
  Phone,
  Star,
} from "lucide-react-native";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useCancelOrderMutation,
  useGetOrderQuery,
  useRateOrderMutation,
} from "./store/customerApi";
import { Order as ApiOrder } from "./types/customer";

export default function OrderDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const orderId = typeof id === "string" ? id : undefined;

  const [showRatingModal, setShowRatingModal] = useState(false);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState("");

  // Fetch order details from API
  const { data: apiData, isLoading: apiLoading } = useGetOrderQuery(
    orderId || "",
    {
      skip: !orderId,
    }
  );

  // Mutations
  const [cancelOrder, { isLoading: isCancelling }] = useCancelOrderMutation();
  const [rateOrder, { isLoading: isRating }] = useRateOrderMutation();

  // Mock data fallback
  const mockOrder: ApiOrder = {
    id: orderId || "mock_order_fallback",
    customer_id: "mock_user_1",
    kitchen_id: "mock_kitchen_1",
    kitchen_name: "Mr.s Burger",
    status: "preparing",
    items: [
      {
        id: "item_1",
        dish_id: "dish_1",
        dish_name: "Keto Burger",
        quantity: 1,
        price: 1200, // in cents
        special_instructions: "No pickles",
      },
      {
        id: "item_2",
        dish_id: "dish_2",
        dish_name: "Sweet Potato Fries",
        quantity: 1,
        price: 600,
      },
      {
        id: "item_3",
        dish_id: "dish_3",
        dish_name: "Diet Coke",
        quantity: 1,
        price: 200,
      },
    ],
    subtotal: 2000,
    delivery_fee: 300,
    tax: 200,
    total: 2500,
    delivery_address: {
      street: "123 Mockingbird Lane",
      city: "Faketown",
      state: "FS",
      postal_code: "12345",
      country: "Mockland",
      coordinates: { latitude: 0, longitude: 0 },
    },
    special_instructions: "Please leave at the back door and ring twice.",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    estimated_delivery_time: new Date(
      Date.now() + 30 * 60 * 1000
    ).toISOString(), // 30 minutes from now
  };

  const order: ApiOrder | undefined = apiData?.data || mockOrder;

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
          try {
            await cancelOrder({
              orderId: order.id,
              data: {
                reason: "Customer requested cancellation",
                refund_preference: "full_refund",
              },
            }).unwrap();
            Alert.alert("Success", "Order has been cancelled successfully");
            router.back();
          } catch {
            Alert.alert("Error", "Failed to cancel order. Please try again.");
          }
        },
      },
    ]);
  };

  const handleRateOrder = async () => {
    if (!order || rating === 0) return;

    try {
      await rateOrder({
        orderId: order.id,
        data: {
          rating,
          review: review.trim() || undefined,
        },
      }).unwrap();
      Alert.alert("Success", "Thank you for your rating!");
      setShowRatingModal(false);
      setRating(0);
      setReview("");
    } catch {
      Alert.alert("Error", "Failed to submit rating. Please try again.");
    }
  };

  const handleTrackOrder = () => {
    router.push(`/order-status-tracking?id=${orderId}`);
  };

  const handleCallKitchen = () => {
    // TODO: Implement call functionality
    console.log("Call kitchen");
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
      <GradientBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color="#E6FFE8" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E6FFE8" />
            <Text style={styles.loadingText}>Loading Order Details...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (!order) {
    return (
      <GradientBackground>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <ChevronLeft size={24} color="#E6FFE8" />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          </View>
          <EmptyState
            title="Order Not Found"
            subtitle="The order you are looking for could not be found or an error occurred."
            icon="alert-circle-outline"
          />
        </SafeAreaView>
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color="#E6FFE8" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  backText: {
    color: "#E6FFE8",
    fontSize: 16,
    marginLeft: 8,
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
