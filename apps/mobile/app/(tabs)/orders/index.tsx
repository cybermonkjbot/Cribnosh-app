import { BurgerIcon } from "@/components/ui/BurgerIcon";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { OrderCard } from "@/components/ui/OrderCard";
import { OrdersCampaignBanner } from "@/components/ui/OrdersCampaignBanner";
import { PremiumHeader } from "@/components/ui/PremiumHeader";
import { PremiumTabs } from "@/components/ui/PremiumTabs";
import { SectionHeader } from "@/components/ui/SectionHeader";
import {
  useGetActiveOffersQuery,
  useGetCustomOrdersQuery,
  useGetOrdersQuery,
} from "@/store/customerApi";
import { Order as ApiOrder, CustomOrder } from "@/types/customer";
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
  _uniqueKey?: string; // Unique key for React list rendering
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

  // Fetch regular orders from API with status filtering
  const {
    data: ordersData,
  } = useGetOrdersQuery(
    { 
      page: 1, 
      limit: 20,
      status: activeTab === "ongoing" ? "ongoing" : "past",
      order_type: "all",
    },
    {
      skip: false,
    }
  );

  // Fetch active special offers
  const {
    data: offersData,
  } = useGetActiveOffersQuery(
    { target: "group_orders" },
    { skip: false }
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

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return 'th';
    switch (day % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  // Convert API orders to UI Order format
  const convertApiOrderToOrder = (apiOrder: ApiOrder): Order => {
    const statusMap: Record<string, OrderStatus> = {
      pending: "preparing",
      confirmed: "preparing",
      preparing: "preparing",
      ready: "ready",
      on_the_way: "on-the-way",
      "on-the-way": "on-the-way",
      delivered: "delivered",
      cancelled: "cancelled",
    };

    // Format timestamp
    const timestamp = apiOrder.createdAt || apiOrder.created_at
      ? (typeof apiOrder.createdAt === 'number' 
          ? apiOrder.createdAt 
          : new Date(apiOrder.created_at).getTime())
      : Date.now();
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const day = date.getDate();
    const monthName = date.toLocaleString('en-GB', { month: 'long' });
    const formattedTime = `${hours}:${minutes} • ${day}${getOrdinalSuffix(day)} ${monthName}`;

    // Format estimated time
    let estimatedTime = "TBD";
    if (apiOrder.estimated_prep_time_minutes) {
      const mins = apiOrder.estimated_prep_time_minutes;
      estimatedTime = `${mins}-${mins + 5} min`;
    } else if (apiOrder.estimated_delivery_time) {
      estimatedTime = apiOrder.estimated_delivery_time;
    }

    // Get items
    const items = apiOrder.order_items 
      ? apiOrder.order_items.map((item: any) => item.name || item.dish_name)
      : apiOrder.items.map((item) => item.dish_name);

    // Get description
    const kitchenName = apiOrder.kitchen_name || apiOrder.restaurant_name || "Kitchen";
    const description = items.length > 0
      ? `${items.slice(0, 2).join(", ")}${items.length > 2 ? `, +${items.length - 2} more` : ''} from ${kitchenName}`
      : `Order from ${kitchenName}`;

    // Get price
    const totalAmount = apiOrder.total_amount || apiOrder.total || 0;
    const price = `£${(totalAmount / 100).toFixed(2)}`;

    // Get order number
    const orderNumber = apiOrder.order_id 
      ? `#${apiOrder.order_id}`
      : apiOrder.id 
        ? `#${apiOrder.id}` 
        : `#${apiOrder._id || 'ORD-001'}`;

    // Generate a unique ID for the order
    const uniqueId = apiOrder._id || apiOrder.id || `api-${Math.random().toString(36).slice(2, 11)}`;
    const numericId = parseInt(uniqueId.toString().replace(/\D/g, "")) || Math.random() * 1000;

    const baseOrder: Order = {
      id: numericId,
      time: formattedTime,
      description,
      price,
      status: statusMap[apiOrder.order_status || apiOrder.status] || "preparing",
      estimatedTime,
      kitchenName,
      orderNumber,
      items,
      orderType: apiOrder.is_group_order ? "group" : "individual",
      // Store unique identifier for key generation
      _uniqueKey: `api-${uniqueId}`,
    };

      // Add group order info if applicable
      if (apiOrder.is_group_order && (apiOrder.group_order || apiOrder.group_order_details)) {
        const groupData = apiOrder.group_order || apiOrder.group_order_details;
        if (groupData && groupData.participants) {
          baseOrder.groupOrder = {
            id: (apiOrder as any).group_order_id || apiOrder._id || apiOrder.id,
            users: groupData.participants.map((p: any) => ({
              id: p.user_id,
              name: p.user_name,
              initials: p.user_initials || p.user_name?.charAt(0).toUpperCase() || 'U',
              color: p.user_color,
              avatar: p.avatar_url,
            })),
            totalUsers: groupData.total_participants || groupData.participants.length,
            isActive: (apiOrder.order_status || apiOrder.status) !== "delivered" && (apiOrder.order_status || apiOrder.status) !== "cancelled",
          };
        }
      }

    return baseOrder;
  };

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

    // Generate a unique ID for the custom order
    const uniqueId = customOrder._id || `custom-${Math.random().toString(36).slice(2, 11)}`;
    const numericId = parseInt(uniqueId.toString().replace(/\D/g, "")) || Math.random() * 1000;

    return {
      id: numericId,
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
      // Store unique identifier for key generation
      _uniqueKey: `custom-${uniqueId}`,
    };
  };

  // Get regular orders from API response
  const apiOrders =
    ordersData?.data?.orders && ordersData.data.orders.length > 0 
      ? ordersData.data.orders 
      : [];

  // Only use mock data if API explicitly fails, not if data is just empty
  const customOrders =
    customOrdersData?.data?.orders && customOrdersData.data.orders.length > 0
      ? customOrdersData.data.orders
      : customOrdersLoading === false && !customOrdersData && !customOrdersError
        ? []
        : customOrdersError
          ? mockCustomOrders // Only use mock on error
          : [];

  // Convert API orders to Order format
  const apiOrdersAsOrders = apiOrders.map(convertApiOrderToOrder);

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
      _uniqueKey: "mock-ongoing-1",
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
      _uniqueKey: "mock-ongoing-2",
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
      _uniqueKey: "mock-ongoing-3",
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
      _uniqueKey: "mock-ongoing-4",
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
      _uniqueKey: "mock-ongoing-5",
    },
  ];

  const pastOrders: Order[] = [
    {
      id: 6,
      time: "15:30, 5th June",
      description: "Vegan Pizza from Pizza Palace",
      price: "£22",
      status: "delivered",
      _uniqueKey: "mock-past-6",
    },
    {
      id: 7,
      time: "12:45, 4th June",
      description: "Chicken Salad from Fresh Bites",
      price: "£18",
      status: "delivered",
      _uniqueKey: "mock-past-7",
    },
  ];

  // Combine API orders with custom orders, fallback to mock data if no API data
  const allOngoingOrders = [
    ...(apiOrdersAsOrders.length > 0
      ? apiOrdersAsOrders
      : ongoingOrders
    ).filter(
      (order) =>
        order.status === "preparing" ||
        order.status === "ready" ||
        order.status === "on-the-way"
    ),
    ...customOrdersAsOrders.filter(
      (order) =>
        order.status === "preparing" ||
        order.status === "ready" ||
        order.status === "on-the-way"
    ),
  ];

  const allPastOrders = [
    ...(apiOrdersAsOrders.length > 0 ? apiOrdersAsOrders : pastOrders).filter(
      (order) => order.status === "delivered" || order.status === "cancelled"
    ),
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
      // Navigate to regular order details
      router.push(`/order-details?id=${orderId}`);
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

    // Sort all orders by time (most recent first)
    const sortedOrders = [...currentOrders].sort((a, b) => {
      // Parse time strings to compare - format: "20:00 • 2nd November" or "19:18, 6th June"
      const timeA = a.time.match(/(\d{1,2}):(\d{2})/);
      const timeB = b.time.match(/(\d{1,2}):(\d{2})/);
      
      if (timeA && timeB) {
        const hourA = parseInt(timeA[1]);
        const hourB = parseInt(timeB[1]);
        const minA = parseInt(timeA[2]);
        const minB = parseInt(timeB[2]);
        
        // Simple time comparison (for same day, this works)
        if (hourA !== hourB) return hourB - hourA;
        return minB - minA;
      }
      return 0;
    });

    return (
      <>
        <SectionHeader
          title={activeTab === "ongoing" ? "Current Orders" : "June 2025"}
        />

        {/* All Orders (Regular + Custom) - Sorted by time */}
        {sortedOrders.map((order, index) => {
          const isCustomOrder = order.description.includes("(Custom Order)");
          // Use _uniqueKey if available, otherwise fall back to id
          const uniqueKey = order._uniqueKey || `order-${order.id}-${index}`;
          return (
            <OrderCard
              key={uniqueKey}
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
              onPress={() => handleOrderPress(order.id, isCustomOrder)}
              showSeparator={index < sortedOrders.length - 1}
              index={index}
            />
          );
        })}
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
      {offersData?.data?.offers?.[0] && (
        <Animated.View style={bannerStyle}>
          <OrdersCampaignBanner 
            offer={offersData.data.offers[0]}
            onPress={() => {
              const offer = offersData.data.offers[0];
              if (offer.action_type === "group_order") {
                router.push("/orders/group");
              } else if (offer.action_type === "navigate") {
                router.push(offer.action_target as any);
              }
            }} 
          />
        </Animated.View>
      )}

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
