import { EmptyState } from "@/components/ui/EmptyState";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { PremiumTabs } from "@/components/ui/PremiumTabs";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useGetCustomOrdersQuery } from "@/store/customerApi";
import { CustomOrder } from "@/types/customer";
import { useRouter } from "expo-router";
import {
  AlertCircle,
  CheckCircle,
  ChevronLeft,
  Clock,
  Plus,
  XCircle,
} from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

export default function CustomOrderManagementScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "active" | "completed" | "cancelled"
  >("active");
  const scrollY = useSharedValue(0);

  // Fetch custom orders from API
  const { data: customOrdersData, isLoading } = useGetCustomOrdersQuery(
    { page: 1, limit: 50 },
    {
      skip: false,
    }
  );

  // Mock data fallback
  const mockCustomOrders: CustomOrder[] = [
    {
      _id: "mock_custom_order_1",
      userId: "mock_user_1",
      requirements: "Gluten-free pasta with vegan cheese",
      serving_size: 2,
      custom_order_id: "CUST-MOCK-001",
      status: "pending",
      dietary_restrictions: "gluten-free, vegan",
      estimatedPrice: 25.99,
      createdAt: new Date().toISOString(),
    },
    {
      _id: "mock_custom_order_2",
      userId: "mock_user_1",
      requirements: "Custom sushi platter for office lunch",
      serving_size: 8,
      custom_order_id: "CUST-MOCK-002",
      status: "processing",
      dietary_restrictions: "halal",
      estimatedPrice: 89.99,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      _id: "mock_custom_order_3",
      userId: "mock_user_1",
      requirements: "Birthday cake with specific decorations",
      serving_size: 12,
      custom_order_id: "CUST-MOCK-003",
      status: "delivered",
      dietary_restrictions: "nut-free",
      estimatedPrice: 45.99,
      createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    },
    {
      _id: "mock_custom_order_4",
      userId: "mock_user_1",
      requirements: "Vegetarian Indian feast",
      serving_size: 6,
      custom_order_id: "CUST-MOCK-004",
      status: "cancelled",
      dietary_restrictions: "vegetarian",
      estimatedPrice: 65.99,
      createdAt: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
    },
  ];

  // Only use mock data if API explicitly fails, not if data is just empty
  const customOrders =
    customOrdersData?.data?.orders && customOrdersData.data.orders.length > 0
      ? customOrdersData.data.orders
      : isLoading === false && !customOrdersData && customOrdersData === undefined
        ? mockCustomOrders
        : [];

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      "worklet";
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [1, 0.8],
      Extrapolate.CLAMP
    );

    return {
      opacity,
    };
  });

  const tabs = [
    { key: "active", label: "Active" },
    { key: "completed", label: "Completed" },
    { key: "cancelled", label: "Cancelled" },
  ];

  const getFilteredOrders = () => {
    switch (activeTab) {
      case "active":
        return customOrders.filter(
          (order) =>
            order.status === "pending" ||
            order.status === "processing" ||
            order.status === "accepted" ||
            order.status === "preparing" ||
            order.status === "ready"
        );
      case "completed":
        return customOrders.filter((order) => order.status === "delivered");
      case "cancelled":
        return customOrders.filter((order) => order.status === "cancelled");
      default:
        return [];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock size={16} color="#F59E0B" />;
      case "processing":
        return <AlertCircle size={16} color="#3B82F6" />;
      case "accepted":
        return <CheckCircle size={16} color="#10B981" />;
      case "preparing":
        return <Clock size={16} color="#8B5CF6" />;
      case "ready":
        return <CheckCircle size={16} color="#EF4444" />;
      case "delivered":
        return <CheckCircle size={16} color="#10B981" />;
      case "cancelled":
        return <XCircle size={16} color="#EF4444" />;
      default:
        return <Clock size={16} color="#6B7280" />;
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

  const handleBack = () => {
    router.back();
  };

  const handleCreateOrder = () => {
    router.push("/shared-ordering");
  };

  const handleOrderPress = (orderId: string) => {
    router.push(`/custom-order-details?id=${orderId}`);
  };

  const filteredOrders = getFilteredOrders();

  const renderOrderCard = (order: CustomOrder, index: number) => (
    <TouchableOpacity
      key={order._id}
      style={styles.orderCard}
      onPress={() => handleOrderPress(order._id)}
    >
      <View style={styles.orderHeader}>
        <View style={styles.orderInfo}>
          <Text style={styles.orderId}>{order.custom_order_id}</Text>
          <View style={styles.statusContainer}>
            {getStatusIcon(order.status)}
            <Text style={styles.statusText}>{getStatusText(order.status)}</Text>
          </View>
        </View>
        <Text style={styles.orderPrice}>
          {order.estimatedPrice ? `£${order.estimatedPrice}` : "TBD"}
        </Text>
      </View>

      <Text style={styles.orderDescription} numberOfLines={2}>
        {order.requirements}
      </Text>

      <View style={styles.orderFooter}>
        <Text style={styles.servingSize}>
          {order.serving_size}{" "}
          {order.serving_size === 1 ? "serving" : "servings"}
        </Text>
        <Text style={styles.orderDate}>
          {new Date(order.createdAt).toLocaleDateString()}
        </Text>
      </View>

      {order.dietary_restrictions && (
        <View style={styles.dietaryContainer}>
          <Text style={styles.dietaryText}>{order.dietary_restrictions}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading custom orders...</Text>
        </View>
      );
    }

    if (filteredOrders.length === 0) {
      return (
        <EmptyState
          title={`No ${activeTab} Custom Orders`}
          subtitle={
            activeTab === "active"
              ? "Your active custom orders will appear here"
              : `Your ${activeTab} custom orders will appear here`
          }
          icon={
            activeTab === "active"
              ? "time-outline"
              : activeTab === "completed"
                ? "checkmark-circle-outline"
                : "close-circle-outline"
          }
        />
      );
    }

    return (
      <>
        <SectionHeader
          title={`${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Orders`}
        />

        {filteredOrders.map((order, index) => renderOrderCard(order, index))}
      </>
    );
  };

  return (
    <GradientBackground>
      <Animated.View style={headerStyle}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <ChevronLeft size={24} color="#E6FFE8" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Custom Orders</Text>
          <TouchableOpacity
            onPress={handleCreateOrder}
            style={styles.createButton}
          >
            <Plus size={20} color="#E6FFE8" />
          </TouchableOpacity>
        </View>

        <PremiumTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={(tabKey) =>
            setActiveTab(tabKey as "active" | "completed" | "cancelled")
          }
        />
      </Animated.View>

      <Animated.ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {renderContent()}
      </Animated.ScrollView>
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
  createButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(230, 255, 232, 0.1)",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
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
  orderCard: {
    backgroundColor: "rgba(230, 255, 232, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(230, 255, 232, 0.1)",
  },
  orderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    color: "#E6FFE8",
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusText: {
    color: "#A0A0A0",
    fontSize: 12,
    fontWeight: "500",
  },
  orderPrice: {
    color: "#E6FFE8",
    fontSize: 18,
    fontWeight: "700",
  },
  orderDescription: {
    color: "#FFFFFF",
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  orderFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  servingSize: {
    color: "#A0A0A0",
    fontSize: 12,
    fontWeight: "500",
  },
  orderDate: {
    color: "#A0A0A0",
    fontSize: 12,
  },
  dietaryContainer: {
    backgroundColor: "rgba(230, 255, 232, 0.1)",
    borderRadius: 8,
    padding: 8,
    marginTop: 8,
  },
  dietaryText: {
    color: "#E6FFE8",
    fontSize: 12,
    fontWeight: "500",
  },
});
