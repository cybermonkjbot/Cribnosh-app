import { EmptyState } from "@/components/ui/EmptyState";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { SuperButton } from "@/components/ui/SuperButton";
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
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BottomSheetBase } from "../components/BottomSheetBase";
import { useGetOrderStatusQuery } from "./store/customerApi";

export default function OrderStatusTrackingScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const orderId = typeof id === "string" ? id : undefined;

  // Fetch order status from API
  const {
    data: apiData,
    error: apiError,
    isLoading: apiLoading,
  } = useGetOrderStatusQuery(orderId || "", {
    skip: !orderId,
  });

  // Mock data fallback
  const mockOrderStatus = {
    order_id: orderId || "mock_order_fallback",
    current_status: "preparing",
    status_updates: [
      {
        status: "pending",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        message: "Order received and confirmed",
      },
      {
        status: "preparing",
        timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
        message: "Kitchen started preparing your order",
      },
    ],
    estimated_delivery_time: new Date(
      Date.now() + 30 * 60 * 1000
    ).toISOString(), // 30 minutes from now
    delivery_person: {
      name: "David Morel",
      phone: "+44 7700 900123",
      vehicle_type: "Motorcycle",
      vehicle_number: "ABC123",
    },
  };

  const orderStatus = apiData?.data || mockOrderStatus;

  const handleBack = () => {
    router.back();
  };

  const handleCallDeliveryPerson = () => {
    // TODO: Implement call functionality
    console.log("Call delivery person:", orderStatus.delivery_person?.phone);
  };

  const handleViewMap = () => {
    // TODO: Implement map view functionality
    console.log("View map pressed");
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
    switch (status) {
      case "pending":
        return <Circle size={20} color="#6B7280" />;
      case "preparing":
        return <Package size={20} color="#F59E0B" />;
      case "ready":
        return <CheckCircle size={20} color="#10B981" />;
      case "on-the-way":
        return <Truck size={20} color="#3B82F6" />;
      case "delivered":
        return <CheckCircle size={20} color="#059669" />;
      default:
        return <Circle size={20} color="#6B7280" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "#6B7280";
      case "preparing":
        return "#F59E0B";
      case "ready":
        return "#10B981";
      case "on-the-way":
        return "#3B82F6";
      case "delivered":
        return "#059669";
      default:
        return "#6B7280";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "pending":
        return "Order Confirmed";
      case "preparing":
        return "Preparing";
      case "ready":
        return "Ready for Pickup";
      case "on-the-way":
        return "On the Way";
      case "delivered":
        return "Delivered";
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
              <View className="flex-row items-center justify-center w-full -mt-12">
                {/* Profile Picture with Status Ring */}
                <View className="relative mr-8">
                  <View className="w-16 h-16 bg-gray-600 rounded-full items-center justify-center">
                    <Text className="text-white text-xl font-bold">
                      {orderStatus.delivery_person.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </Text>
                  </View>
                  <View
                    className="absolute -top-1 -right-1 w-18 h-18 border-4 rounded-full"
                    style={{
                      borderColor: getStatusColor(orderStatus.current_status),
                    }}
                  />
                </View>

                {/* Driver Info */}
                <View className="flex-1">
                  <Text className="text-[#E6FFE8] text-xl font-semibold mb-1 text-left">
                    {orderStatus.delivery_person.name}
                  </Text>
                  <Text className="text-white text-xs font-medium text-left">
                    {getEstimatedTime()}
                  </Text>
                </View>

                {/* Call Button */}
                <TouchableOpacity
                  onPress={handleCallDeliveryPerson}
                  className="w-14 h-14 bg-[#E6FFE8] rounded-full items-center justify-center ml-4"
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
});
