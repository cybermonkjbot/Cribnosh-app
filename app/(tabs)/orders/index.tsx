import { BurgerIcon } from "@/components/ui/BurgerIcon";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { OrderCard } from "@/components/ui/OrderCard";
import { OrdersCampaignBanner } from "@/components/ui/OrdersCampaignBanner";
import { PremiumHeader } from "@/components/ui/PremiumHeader";
import { PremiumTabs } from "@/components/ui/PremiumTabs";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useRouter } from "expo-router";
import { useState } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useGetCustomOrdersQuery } from "../../store/customerApi";
import { CustomOrder } from "../../types/customer";

// Define order status types
export type OrderStatus =
  | "preparing"
  | "ready"
  | "on-the-way"
  | "delivered"
  | "cancelled";

// Define order types
export type OrderType = "individual" | "group";

// User interface for group orders
interface GroupUser {
  id: string;
  name: string;
  avatar?: string;
  initials?: string;
  color?: string;
}

// Group order interface
interface GroupOrder {
  id: string;
  users: GroupUser[];
  totalUsers: number;
  isActive: boolean;
}

interface Order {
  id: number;
  time: string;
  description: string;
  price: string;
  status?: OrderStatus;
  estimatedTime?: string;
  kitchenName?: string;
  orderNumber?: string;
  items?: string[];
  orderType?: OrderType;
  groupOrder?: GroupOrder;
}

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<"ongoing" | "past">("ongoing");
  const router = useRouter();
  const scrollY = useSharedValue(0);

  // Fetch custom orders from API
  const {
    data: customOrdersData,
    error: customOrdersError,
    isLoading: customOrdersLoading,
  } = useGetCustomOrdersQuery(
    { page: 1, limit: 20 },
    {
      skip: false, // Always fetch to check if we have data
    }
  );

  // Mock custom orders data for fallback
  const mockCustomOrders: CustomOrder[] = [
    {
      _id: "mock_custom_order_1",
      userId: "mock_user_1",
      requirements: "Gluten-free pasta with vegan cheese",
      serving_size: 2,
      custom_order_id: "CUST-MOCK-001",
      status: "pending",
      dietary_restrictions: "gluten-free, vegan",
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
      createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    },
  ];

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  // Convert custom orders to Order format
  const convertCustomOrderToOrder = (customOrder: CustomOrder): Order => {
    const statusMap: Record<string, OrderStatus> = {
      pending: "preparing",
      processing: "preparing",
      accepted: "preparing",
      preparing: "preparing",
      ready: "ready",
      delivered: "delivered",
      cancelled: "cancelled",
    };

    return {
      id: parseInt(customOrder._id.replace(/\D/g, "")) || Math.random() * 1000,
      time: new Date(customOrder.createdAt).toLocaleString("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        day: "numeric",
        month: "long",
      }),
      description: `${customOrder.requirements} (Custom Order)`,
      price: customOrder.estimatedPrice
        ? `£${customOrder.estimatedPrice}`
        : "TBD",
      status: statusMap[customOrder.status] || "preparing",
      estimatedTime:
        customOrder.status === "ready" ? "Ready for pickup" : "Processing",
      kitchenName: "Custom Kitchen",
      orderNumber: customOrder.custom_order_id,
      items: [customOrder.requirements],
      orderType: "individual",
    };
  };

  // Get custom orders (API data or fallback to mock)
  const customOrders =
    customOrdersData?.data?.orders && customOrdersData.data.orders.length > 0
      ? customOrdersData.data.orders
      : mockCustomOrders;

  // Convert custom orders to Order format
  const customOrdersAsOrders = customOrders.map(convertCustomOrderToOrder);

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

  const bannerStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, 200],
      [0, -50],
      Extrapolate.CLAMP
    );

    const scale = interpolate(
      scrollY.value,
      [0, 200],
      [1, 0.95],
      Extrapolate.CLAMP
    );

    return {
      transform: [{ translateY }, { scale }],
    };
  });

  const tabs = [
    { key: "ongoing", label: "Ongoing" },
    { key: "past", label: "Past" },
  ];

  // Enhanced mock data for ongoing orders with group order support
  const ongoingOrders: Order[] = [
    {
      id: 1,
      time: "19:18, 6th June",
      description: "Keto Diet, Burger from Mr.s Burger",
      price: "£28",
      status: "preparing",
      estimatedTime: "25-30 min",
      kitchenName: "Mr.s Burger",
      orderNumber: "#ORD-2024-001",
      items: ["Keto Burger", "Sweet Potato Fries", "Diet Coke"],
      orderType: "individual",
    },
    {
      id: 2,
      time: "19:15, 6th June",
      description: "Team Lunch from Pizza Palace",
      price: "£45",
      status: "on-the-way",
      estimatedTime: "10-15 min",
      kitchenName: "Pizza Palace",
      orderNumber: "#ORD-2024-002",
      items: [
        "Margherita Pizza",
        "Pepperoni Pizza",
        "Garlic Bread",
        "Fresh Juice",
      ],
      orderType: "group",
      groupOrder: {
        id: "group-1",
        users: [
          { id: "1", name: "Sarah", initials: "S", color: "#FF6B6B" },
          { id: "2", name: "Mike", initials: "M", color: "#4ECDC4" },
          { id: "3", name: "Emma", initials: "E", color: "#45B7D1" },
          { id: "4", name: "Alex", initials: "A", color: "#96CEB4" },
        ],
        totalUsers: 4,
        isActive: true,
      },
    },
    {
      id: 3,
      time: "19:10, 6th June",
      description: "Chicken Salad from Fresh Bites",
      price: "£18",
      status: "ready",
      estimatedTime: "Ready for pickup",
      kitchenName: "Fresh Bites",
      orderNumber: "#ORD-2024-003",
      items: ["Grilled Chicken Salad", "Balsamic Dressing", "Iced Tea"],
      orderType: "individual",
    },
    {
      id: 4,
      time: "19:05, 6th June",
      description: "Office Dinner from Tokyo Dreams",
      price: "£78",
      status: "preparing",
      estimatedTime: "35-40 min",
      kitchenName: "Tokyo Dreams",
      orderNumber: "#ORD-2024-004",
      items: ["Salmon Nigiri Set", "Tuna Rolls", "Miso Soup", "Green Tea"],
      orderType: "group",
      groupOrder: {
        id: "group-2",
        users: [
          { id: "5", name: "David", initials: "D", color: "#FFA07A" },
          { id: "6", name: "Lisa", initials: "L", color: "#98D8C8" },
          { id: "7", name: "Tom", initials: "T", color: "#F7DC6F" },
          { id: "8", name: "Anna", initials: "A", color: "#BB8FCE" },
          { id: "9", name: "Chris", initials: "C", color: "#85C1E9" },
          { id: "10", name: "Maria", initials: "M", color: "#F8C471" },
        ],
        totalUsers: 6,
        isActive: true,
      },
    },
    {
      id: 5,
      time: "18:55, 6th June",
      description: "Indian Curry from Spice Garden",
      price: "£24",
      status: "on-the-way",
      estimatedTime: "5-8 min",
      kitchenName: "Spice Garden",
      orderNumber: "#ORD-2024-005",
      items: ["Butter Chicken", "Basmati Rice", "Naan Bread"],
      orderType: "individual",
    },
  ];

  const pastOrders: Order[] = [
    {
      id: 6,
      time: "15:30, 5th June",
      description: "Vegan Pizza from Pizza Palace",
      price: "£22",
      status: "delivered",
    },
    {
      id: 7,
      time: "12:45, 4th June",
      description: "Chicken Salad from Fresh Bites",
      price: "£18",
      status: "delivered",
    },
  ];

  // Combine regular orders with custom orders
  const allOngoingOrders = [
    ...ongoingOrders,
    ...customOrdersAsOrders.filter(
      (order) =>
        order.status === "preparing" ||
        order.status === "ready" ||
        order.status === "on-the-way"
    ),
  ];

  const allPastOrders = [
    ...pastOrders,
    ...customOrdersAsOrders.filter(
      (order) => order.status === "delivered" || order.status === "cancelled"
    ),
  ];

  const currentOrders =
    activeTab === "ongoing" ? allOngoingOrders : allPastOrders;

  const handleInfoPress = () => {
    // Navigate to custom order management
    router.push("/custom-order-management");
  };

  const handleOrderPress = (
    orderId: number,
    isCustomOrder: boolean = false
  ) => {
    if (isCustomOrder) {
      // Navigate to custom order details
      router.push(`/custom-order-details?id=${orderId}`);
    } else {
      // Handle regular order press
      console.log("Order pressed:", orderId);
    }
  };

  const renderContent = () => {
    if (currentOrders.length === 0) {
      return (
        <EmptyState
          title={
            activeTab === "ongoing" ? "No Ongoing Orders" : "No Past Orders"
          }
          subtitle={
            activeTab === "ongoing"
              ? "Your active orders will appear here"
              : "Your order history will appear here"
          }
          icon={activeTab === "ongoing" ? "time-outline" : "receipt-outline"}
        />
      );
    }

    return (
      <>
        <SectionHeader
          title={activeTab === "ongoing" ? "Current Orders" : "June 2025"}
        />

        {/* Regular Orders */}
        {currentOrders
          .filter((order) => !order.description.includes("(Custom Order)"))
          .map((order, index) => (
            <OrderCard
              key={order.id}
              time={order.time}
              description={order.description}
              price={order.price}
              status={order.status}
              estimatedTime={order.estimatedTime}
              orderNumber={order.orderNumber}
              items={order.items}
              orderType={order.orderType}
              groupOrder={order.groupOrder}
              icon={<BurgerIcon />}
              onPress={() => handleOrderPress(order.id)}
              showSeparator={index < currentOrders.length - 1}
              index={index}
            />
          ))}

        {/* Custom Orders Section */}
        {currentOrders.filter((order) =>
          order.description.includes("(Custom Order)")
        ).length > 0 && (
          <>
            <SectionHeader title="Custom Orders" />
            {currentOrders
              .filter((order) => order.description.includes("(Custom Order)"))
              .map((order, index) => (
                <OrderCard
                  key={`custom-${order.id}`}
                  time={order.time}
                  description={order.description}
                  price={order.price}
                  status={order.status}
                  estimatedTime={order.estimatedTime}
                  orderNumber={order.orderNumber}
                  items={order.items}
                  orderType={order.orderType}
                  groupOrder={order.groupOrder}
                  icon={<BurgerIcon />}
                  onPress={() => handleOrderPress(order.id, true)}
                  showSeparator={
                    index <
                    currentOrders.filter((order) =>
                      order.description.includes("(Custom Order)")
                    ).length -
                      1
                  }
                  index={index}
                />
              ))}
          </>
        )}
      </>
    );
  };

  return (
    <GradientBackground>
      <Animated.View style={headerStyle}>
        <PremiumHeader title="Orders" onInfoPress={handleInfoPress} />

        <PremiumTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={(tabKey) => setActiveTab(tabKey as "ongoing" | "past")}
        />
      </Animated.View>

      {/* Campaign Banner */}
      <Animated.View style={bannerStyle}>
        <OrdersCampaignBanner onPress={() => router.push("/orders/group")} />
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
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100, // Account for tab bar
  },
});
