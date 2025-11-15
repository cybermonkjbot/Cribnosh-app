import { GradientBackground } from "@/components/ui/GradientBackground";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from '@/convex/_generated/api';
import { useAuthContext } from "@/contexts/AuthContext";
import { useEffect, useState } from "react";
import {
  ChevronLeft,
  Clock,
  DollarSign,
  Edit3,
  MapPin,
  Share2,
  Trash2,
  User,
} from "lucide-react-native";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useToast } from "../lib/ToastContext";

export default function CustomOrderDetailsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { id } = useLocalSearchParams();
  const { isAuthenticated } = useAuthContext();

  // Get custom order ID from route params
  const customOrderId = typeof id === "string" ? id : undefined;

  // Order state
  const [customOrderData, setCustomOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // Fetch custom order details from Convex
  useEffect(() => {
    const fetchCustomOrder = async () => {
      if (!customOrderId || !isAuthenticated) return;

      try {
        setIsLoading(true);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          return;
        }

        const result = await convex.action(api.actions.orders.customerGetOrder, {
          sessionToken,
          order_id: customOrderId,
        });

        if (result.success === false) {
          return;
        }

        // Transform to match expected format
        setCustomOrderData({
          data: result.order,
        });
      } catch (error: any) {
        console.error('Error fetching custom order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (customOrderId && isAuthenticated) {
      fetchCustomOrder();
    }
  }, [customOrderId, isAuthenticated]);

  // Use only API data - no mock fallback
  const customOrder = customOrderData?.data || undefined;

  const handleBack = () => {
    router.back();
  };

  const handleEdit = () => {
    // Navigate to edit screen or show edit modal
    showToast({
      type: "info",
      title: "Edit Mode",
      message:
        "Edit functionality will be implemented when POST/PUT endpoints are available",
      duration: 3000,
    });
  };

  const handleShare = async () => {
    if (!customOrderId) {
      showToast({
        type: "error",
        title: "Error",
        message: "Order ID is missing",
        duration: 3000,
      });
      return;
    }

    try {
      setIsGeneratingLink(true);
      // TODO: Implement share link generation via Convex action when available
      // For now, generate a simple share link
      const shareLink = `${process.env.EXPO_PUBLIC_APP_URL || 'https://cribnosh.com'}/orders/${customOrderId}`;
      
      showToast({
        type: "success",
        title: "Share Link Generated",
        message: `Share link: ${shareLink}`,
        duration: 5000,
      });
    } catch (error: any) {
      console.error("Error generating share link:", error);
      showToast({
        type: "error",
        title: "Share Failed",
        message: error?.message || "Failed to generate share link. Please try again.",
        duration: 4000,
      });
    } finally {
      setIsGeneratingLink(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Delete Custom Order",
      "Are you sure you want to delete this custom order? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              if (!customOrderId) {
                showToast({
                  type: "error",
                  title: "Error",
                  message: "Order ID is missing",
                  duration: 3000,
                });
                return;
              }

              const convex = getConvexClient();
              const sessionToken = await getSessionToken();

              if (!sessionToken) {
                showToast({
                  type: "error",
                  title: "Error",
                  message: "Not authenticated",
                  duration: 3000,
                });
                return;
              }

              // Use cancel order action (custom orders can be cancelled/deleted)
              const result = await convex.action(api.actions.orders.customerCancelOrder, {
                sessionToken,
                order_id: customOrderId,
                reason: "User requested deletion",
              });

              if (result.success === false) {
                throw new Error(result.error || 'Failed to delete custom order');
              }

              showToast({
                type: "success",
                title: "Order Deleted",
                message: "Custom order has been deleted successfully",
                duration: 3000,
              });
              router.back();
            } catch (error: any) {
              console.error("Error deleting custom order:", error);
              showToast({
                type: "error",
                title: "Delete Failed",
                message: error?.message || "Failed to delete custom order. Please try again.",
                duration: 4000,
              });
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#F59E0B";
      case "processing":
        return "#3B82F6";
      case "accepted":
        return "#10B981";
      case "preparing":
        return "#8B5CF6";
      case "ready":
        return "#EF4444";
      case "delivered":
        return "#6B7280";
      case "cancelled":
        return "#EF4444";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Pending Review";
      case "processing":
        return "Processing";
      case "accepted":
        return "Accepted";
      case "preparing":
        return "Preparing";
      case "ready":
        return "Ready";
      case "delivered":
        return "Delivered";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  if (isLoading || !customOrder) {
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
            <Text style={styles.loadingText}>
              {isLoading ? "Loading order details..." : "Order not found"}
            </Text>
          </View>
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
          <Text style={styles.headerTitle}>Custom Order Details</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={handleShare}
              style={styles.actionButton}
              disabled={isGeneratingLink}
            >
              <Share2 size={20} color="#E6FFE8" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleEdit} style={styles.actionButton}>
              <Edit3 size={20} color="#E6FFE8" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.actionButton}
            >
              <Trash2 size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contentContainer}
        >
          {/* Order Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusLabel}>Order Status</Text>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(customOrder.status) },
                ]}
              >
                <Text style={styles.statusText}>
                  {getStatusText(customOrder.status)}
                </Text>
              </View>
            </View>
            <Text style={styles.orderId}>
              Order ID: {customOrder.custom_order_id || customOrder._id}
            </Text>
          </View>

          {/* Order Requirements */}
          <SectionHeader title="Order Requirements" />
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Requirements</Text>
            <Text style={styles.cardContent}>{customOrder.requirements}</Text>

            <View style={styles.infoRow}>
              <User size={16} color="#E6FFE8" />
              <Text style={styles.infoText}>
                Serving Size: {customOrder.serving_size} people
              </Text>
            </View>

            {customOrder.dietary_restrictions && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Dietary Restrictions:</Text>
                <Text style={styles.infoText}>
                  {customOrder.dietary_restrictions}
                </Text>
              </View>
            )}

            {customOrder.specialInstructions && (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Special Instructions:</Text>
                <Text style={styles.infoText}>
                  {customOrder.specialInstructions}
                </Text>
              </View>
            )}
          </View>

          {/* Pricing */}
          <SectionHeader title="Pricing" />
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <DollarSign size={16} color="#E6FFE8" />
              <Text style={styles.infoText}>
                Estimated Price:{" "}
                {customOrder.estimatedPrice
                  ? `£${customOrder.estimatedPrice}`
                  : "TBD"}
              </Text>
            </View>
          </View>

          {/* Delivery Information */}
          <SectionHeader title="Delivery Information" />
          <View style={styles.card}>
            {customOrder.deliveryDate && (
              <View style={styles.infoRow}>
                <Clock size={16} color="#E6FFE8" />
                <Text style={styles.infoText}>
                  Delivery Date:{" "}
                  {new Date(customOrder.deliveryDate).toLocaleDateString()}
                </Text>
              </View>
            )}

            {customOrder.deliveryAddress && (
              <View style={styles.infoRow}>
                <MapPin size={16} color="#E6FFE8" />
                <View style={styles.addressContainer}>
                  <Text style={styles.infoText}>
                    {customOrder.deliveryAddress.street}
                  </Text>
                  <Text style={styles.infoText}>
                    {customOrder.deliveryAddress.city},{" "}
                    {customOrder.deliveryAddress.postal_code}
                  </Text>
                  <Text style={styles.infoText}>
                    {customOrder.deliveryAddress.country}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Order Timeline */}
          <SectionHeader title="Order Timeline" />
          <View style={styles.card}>
            <View style={styles.timelineItem}>
              <View style={styles.timelineDot} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineTitle}>Order Created</Text>
                <Text style={styles.timelineDate}>
                  {new Date(customOrder.createdAt).toLocaleString()}
                </Text>
              </View>
            </View>

            {customOrder.updatedAt &&
              customOrder.updatedAt !== customOrder.createdAt && (
                <View style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Last Updated</Text>
                    <Text style={styles.timelineDate}>
                      {new Date(customOrder.updatedAt).toLocaleString()}
                    </Text>
                  </View>
                </View>
              )}
          </View>
        </ScrollView>
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
    justifyContent: "space-between",
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
  headerTitle: {
    color: "#E6FFE8",
    fontSize: 18,
    fontWeight: "600",
    flex: 1,
    textAlign: "center",
  },
  headerActions: {
    flexDirection: "row",
    gap: 12,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(230, 255, 232, 0.1)",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#E6FFE8",
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  statusCard: {
    backgroundColor: "rgba(230, 255, 232, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(230, 255, 232, 0.1)",
  },
  statusHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusLabel: {
    color: "#E6FFE8",
    fontSize: 16,
    fontWeight: "600",
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "600",
  },
  orderId: {
    color: "#A0A0A0",
    fontSize: 14,
  },
  card: {
    backgroundColor: "rgba(230, 255, 232, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(230, 255, 232, 0.1)",
  },
  cardTitle: {
    color: "#E6FFE8",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
  },
  cardContent: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  infoLabel: {
    color: "#A0A0A0",
    fontSize: 14,
    fontWeight: "500",
  },
  infoText: {
    color: "#E6FFE8",
    fontSize: 14,
    flex: 1,
  },
  addressContainer: {
    flex: 1,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  timelineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E6FFE8",
    marginTop: 6,
    marginRight: 12,
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
  timelineDate: {
    color: "#A0A0A0",
    fontSize: 12,
  },
});
