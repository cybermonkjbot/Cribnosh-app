import { EmptyState } from "@/components/ui/EmptyState";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SuperButton } from "@/components/ui/SuperButton";
import { useAuthContext } from "@/contexts/AuthContext";
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import {
  endOrderLiveActivity,
  hasActiveLiveActivity,
  startOrderLiveActivity,
  updateOrderLiveActivity,
} from "@/lib/live-activity/orderLiveActivity";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  CheckCircle,
  ChevronLeft,
  Circle,
  Clock,
  MapPin,
  Package,
  Phone,
  Truck,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
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
import { BottomSheetBase } from "../components/BottomSheetBase";

export default function OrderStatusTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const orderId = typeof id === "string" ? id : undefined;
  const { isAuthenticated } = useAuthContext();

  // Order status state
  const [orderStatus, setOrderStatus] = useState<any>(undefined);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<any>(null);

  // Fetch order status from Convex
  useEffect(() => {
    const fetchOrderStatus = async () => {
      if (!orderId || !isAuthenticated) return;

      try {
        setApiLoading(true);
        setApiError(null);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          setApiError(new Error('Not authenticated'));
          return;
        }

        const result = await convex.action(api.actions.orders.customerGetOrderStatus, {
          sessionToken,
          order_id: orderId,
        });

        if (result.success === false) {
          setApiError(new Error(result.error || 'Failed to fetch order status'));
          return;
        }

        // Transform order to match expected format
        const order = result.order;
        if (order) {
          setOrderStatus({
            order_id: order._id || order.id,
            current_status: order.order_status || order.status,
            estimated_delivery_time: order.estimated_delivery_time || order.delivery_time,
            delivery_address: order.delivery_address || order.deliveryAddress,
            order_items: order.order_items || order.items,
            total_amount: order.total_amount || order.total,
            foodCreatorId: order.foodCreatorId || order.foodCreatorId,
            created_at: order.created_at || order.createdAt,
          });
        }
      } catch (error: any) {
        setApiError(error);
        console.error('Error fetching order status:', error);
      } finally {
        setApiLoading(false);
      }
    };

    if (orderId && isAuthenticated) {
      fetchOrderStatus();
    }
  }, [orderId, isAuthenticated]);

  // Track previous status to detect changes
  const previousStatusRef = useRef<string | undefined>(undefined);

  // Live Activity integration
  useEffect(() => {
    if (!orderStatus || !orderId) return;

    const currentStatus = orderStatus.current_status;
    const orderNumber = orderStatus.order_id || orderId.substring(0, 8).toUpperCase();
    
    // Calculate estimated minutes
    let estimatedMinutes: number | undefined;
    if (orderStatus.estimated_delivery_time) {
      const now = new Date();
      const deliveryTime = new Date(orderStatus.estimated_delivery_time);
      estimatedMinutes = Math.ceil((deliveryTime.getTime() - now.getTime()) / (1000 * 60));
    }

    const handleLiveActivity = async () => {
      try {
        // Check if status changed
        const statusChanged = previousStatusRef.current !== currentStatus;
        
        // Normalize status values
        let normalizedStatus = currentStatus;
        if (currentStatus === 'on-the-way') {
          normalizedStatus = 'out_for_delivery';
        } else if (currentStatus === 'on_the_way') {
          normalizedStatus = 'out_for_delivery';
        }

        // End Live Activity for completed orders
        if (normalizedStatus === 'cancelled' || normalizedStatus === 'completed') {
          if (hasActiveLiveActivity(orderId)) {
            await endOrderLiveActivity(orderId, normalizedStatus as any);
          }
          return;
        }

        // Start or update Live Activity for active orders
        if (!hasActiveLiveActivity(orderId)) {
          // Start new Live Activity
          await startOrderLiveActivity({
            orderId: orderId,
            orderNumber: orderNumber,
            status: normalizedStatus as any,
            statusText: getStatusText(currentStatus),
            estimatedDeliveryTime: orderStatus.estimated_delivery_time,
            estimatedMinutes: estimatedMinutes && estimatedMinutes > 0 ? estimatedMinutes : undefined,
            totalAmount: 0, // Will be updated if we get order details
            deliveryPersonName: orderStatus.delivery_person?.name,
          });
        } else if (statusChanged) {
          // Update existing Live Activity when status changes
          await updateOrderLiveActivity(orderId, {
            status: normalizedStatus as any,
            statusText: getStatusText(currentStatus),
            estimatedDeliveryTime: orderStatus.estimated_delivery_time,
            estimatedMinutes: estimatedMinutes && estimatedMinutes > 0 ? estimatedMinutes : undefined,
            deliveryPersonName: orderStatus.delivery_person?.name,
          });
        }
      } catch (error) {
        console.error('Error managing Live Activity:', error);
      }
    };

    handleLiveActivity();
    previousStatusRef.current = currentStatus;
  }, [orderStatus, orderId]);

  const handleBack = () => {
    router.back();
  };

  const handleCallDeliveryPerson = async () => {
    if (!orderStatus?.delivery_person?.phone) {
      Alert.alert("No Phone Number", "Delivery person phone number is not available.");
      return;
    }

    try {
      const phoneNumber = orderStatus.delivery_person.phone;
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
      console.error("Error calling delivery person:", error);
      Alert.alert(
        "Call Failed",
        "Unable to make the call. Please try again."
      );
    }
  };

  const handleViewMap = () => {
    // Navigate to map view or open map app
    // For now, show an alert - in a full implementation, this would open a map screen
    Alert.alert(
      "Map View",
      "Map view functionality will open here. This would show real-time order tracking on a map.",
      [{ text: "OK" }]
    );
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      day: "numeric",
      month: "short",
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return <Circle size={20} color="#6B7280" />;
      case "confirmed":
        return <CheckCircle size={20} color="#3B82F6" />;
      case "preparing":
        return <Package size={20} color="#F59E0B" />;
      case "on-the-way":
      case "on_the_way":
        return <Truck size={20} color="#3B82F6" />;
      case "cancelled":
        return <Circle size={20} color="#EF4444" />;
      case "completed":
        return <CheckCircle size={20} color="#10B981" />;
      default:
        return <Circle size={20} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "#6B7280";
      case "confirmed":
        return "#3B82F6";
      case "preparing":
        return "#F59E0B";
      case "on-the-way":
      case "on_the_way":
        return "#3B82F6";
      case "cancelled":
        return "#EF4444";
      case "completed":
        return "#10B981";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "Order Pending";
      case "confirmed":
        return "Order Confirmed";
      case "preparing":
        return "Preparing";
      case "on-the-way":
      case "on_the_way":
        return "On the Way";
      case "cancelled":
        return "Cancelled";
      case "completed":
        return "Completed";
      default:
        return status;
    }
  };

  const getEstimatedTime = () => {
    if (orderStatus.estimated_delivery_time) {
      const now = new Date();
      const deliveryTime = new Date(orderStatus.estimated_delivery_time);
      const diffMinutes = Math.ceil(
        (deliveryTime.getTime() - now.getTime()) / (1000 * 60)
      );

      if (diffMinutes <= 0) {
        return "Arriving now";
      } else if (diffMinutes < 60) {
        return `Arriving in ${diffMinutes} minutes`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `Arriving in ${hours}h ${minutes}m`;
      }
    }
    return "Estimated time unavailable";
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
            <Text style={styles.loadingText}>Loading Order Status...</Text>
          </View>
        </SafeAreaView>
      </GradientBackground>
    );
  }

  if (apiError || !orderStatus) {
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
            title="Status Not Available"
            subtitle="Unable to load order status. Please try again later."
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
          <SectionHeader title={`Order #${orderStatus.order_id}`} />

          {/* Current Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View
                style={[
                  styles.statusIndicator,
                  {
                    backgroundColor: getStatusColor(orderStatus.current_status),
                  },
                ]}
              />
              <Text style={styles.statusText}>
                {getStatusText(orderStatus.current_status)}
              </Text>
            </View>
            <View style={styles.estimatedTime}>
              <Clock size={16} color="#C0DCC0" />
              <Text style={styles.estimatedTimeText}>{getEstimatedTime()}</Text>
            </View>
          </View>

          {/* Delivery Person Info */}
          {orderStatus.delivery_person && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Delivery Driver</Text>
              <View style={styles.driverInfo}>
                <View style={styles.driverAvatar}>
                  <Text style={styles.driverInitials}>
                    {orderStatus.delivery_person.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </Text>
                </View>
                <View style={styles.driverDetails}>
                  <Text style={styles.driverName}>
                    {orderStatus.delivery_person.name}
                  </Text>
                  <Text style={styles.driverPhone}>
                    {orderStatus.delivery_person.phone}
                  </Text>
                  {orderStatus.delivery_person.vehicle_type && (
                    <Text style={styles.vehicleInfo}>
                      {orderStatus.delivery_person.vehicle_type} •{" "}
                      {orderStatus.delivery_person.vehicle_number}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.callButton}
                  onPress={handleCallDeliveryPerson}
                >
                  <Phone size={20} color="#E6FFE8" />
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Status Timeline */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Order Progress</Text>
            {orderStatus.status_updates.map((update: any, index: number) => (
              <View key={index} style={styles.timelineItem}>
                <View style={styles.timelineIcon}>
                  {getStatusIcon(update.status)}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>
                    {getStatusText(update.status)}
                  </Text>
                  <Text style={styles.timelineTime}>
                    {formatTime(update.timestamp)}
                  </Text>
                  {update.message && (
                    <Text style={styles.timelineMessage}>{update.message}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>

          {/* Map Button */}
          <TouchableOpacity style={styles.mapButton} onPress={handleViewMap}>
            <MapPin size={20} color="#E6FFE8" />
            <Text style={styles.mapButtonText}>View on Map</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Delivery Driver Bottom Sheet */}
        {orderStatus.delivery_person && (
          <SuperButton
            title={
              <View style={styles.driverBottomSheetContainer}>
                {/* Driver Info */}
                <View style={styles.driverBottomSheetInfo}>
                  <Text style={styles.driverBottomSheetName}>
                    {orderStatus.delivery_person.name}
                  </Text>
                  <Text style={styles.driverBottomSheetTime}>
                    {getEstimatedTime()}
                  </Text>
                </View>

                {/* Call Button */}
                <TouchableOpacity
                  onPress={handleCallDeliveryPerson}
                  style={styles.driverBottomSheetCallButton}
                >
                  <Phone size={20} color="#094327" />
                </TouchableOpacity>
              </View>
            }
            onPress={() => {}} // No action on main button press
            backgroundColor="#02120A"
            textColor="white"
            style={{
              borderTopLeftRadius: 50,
              borderTopRightRadius: 50,
              height: 162,
              paddingHorizontal: 20,
              paddingTop: 20,
              bottom: -60, // Custom positioning for this screen only
            }}
          />
        )}
      </SafeAreaView>

      {/* Map Bottom Sheet */}
      <BottomSheetBase
        snapPoints={["50%", "90%"]}
        onChange={(index) => {
          if (index === -1) {
            // Sheet is closed
          }
        }}
        enablePanDownToClose
      >
        <View style={styles.mapSheetContent}>
          <Text style={styles.mapSheetTitle}>Order Location</Text>
          <View style={styles.mapPlaceholder}>
            <MapPin size={48} color="#6B7280" />
            <Text style={styles.mapPlaceholderText}>Map View</Text>
            <Text style={styles.mapPlaceholderSubtext}>
              Real-time tracking will be available here
            </Text>
          </View>
          {orderStatus.delivery_person && (
            <View style={styles.driverLocationInfo}>
              <Text style={styles.driverLocationTitle}>Driver Location</Text>
              <Text style={styles.driverLocationText}>
                {orderStatus.delivery_person.name} is currently on the way to
                your location
              </Text>
            </View>
          )}
        </View>
      </BottomSheetBase>
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
  estimatedTime: {
    flexDirection: "row",
    alignItems: "center",
  },
  estimatedTimeText: {
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
  driverInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  driverAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#6B7280",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  driverInitials: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  driverDetails: {
    flex: 1,
  },
  driverName: {
    color: "#E6FFE8",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  driverPhone: {
    color: "#C0DCC0",
    fontSize: 14,
    marginBottom: 2,
  },
  vehicleInfo: {
    color: "#A0A0A0",
    fontSize: 12,
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(230, 255, 232, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  timelineIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(230, 255, 232, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  timelineContent: {
    flex: 1,
  },
  timelineTitle: {
    color: "#E6FFE8",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  timelineTime: {
    color: "#C0DCC0",
    fontSize: 12,
    marginBottom: 4,
  },
  timelineMessage: {
    color: "#A0A0A0",
    fontSize: 12,
    fontStyle: "italic",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(230, 255, 232, 0.15)",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginTop: 10,
  },
  mapButtonText: {
    color: "#E6FFE8",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  mapSheetContent: {
    padding: 20,
    height: "100%",
  },
  mapSheetTitle: {
    color: "#094327",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  mapPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    marginBottom: 20,
  },
  mapPlaceholderText: {
    color: "#6B7280",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 10,
  },
  mapPlaceholderSubtext: {
    color: "#9CA3AF",
    fontSize: 14,
    marginTop: 5,
    textAlign: "center",
  },
  driverLocationInfo: {
    backgroundColor: "rgba(230, 255, 232, 0.1)",
    borderRadius: 12,
    padding: 15,
  },
  driverLocationTitle: {
    color: "#094327",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 8,
  },
  driverLocationText: {
    color: "#6B7280",
    fontSize: 14,
  },
  driverBottomSheetContainer: {
    flexDirection: 'row', // flex-row
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    width: '100%', // w-full
    marginTop: -48, // -mt-12
  },
  driverBottomSheetInfo: {
    flex: 1, // flex-1
  },
  driverBottomSheetName: {
    color: '#E6FFE8', // text-[#E6FFE8]
    fontSize: 20, // text-xl
    fontWeight: '600', // font-semibold
    marginBottom: 4, // mb-1
    textAlign: 'left', // text-left
  },
  driverBottomSheetTime: {
    color: '#FFFFFF', // text-white
    fontSize: 12, // text-xs
    fontWeight: '500', // font-medium
    textAlign: 'left', // text-left
  },
  driverBottomSheetCallButton: {
    width: 56, // w-14
    height: 56, // h-14
    backgroundColor: '#E6FFE8', // bg-[#E6FFE8]
    borderRadius: 9999, // rounded-full
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    marginLeft: 16, // ml-4
  },
});
