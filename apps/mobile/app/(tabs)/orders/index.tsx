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

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      "worklet";
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

  // Get custom orders from API response
  const customOrders =
    customOrdersData?.data?.orders && customOrdersData.data.orders.length > 0
      ? customOrdersData.data.orders
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

  // Combine API orders with custom orders
  const allOngoingOrders = [
    ...apiOrdersAsOrders.filter(
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
    ...apiOrdersAsOrders.filter(
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
          title="Place your first order to see orders here"
          subtitle="Browse kitchens and meals to get started with your first order"
          icon="receipt-outline"
          titleColor="#094327"
          subtitleColor="#6B7280"
          iconColor="#10B981"
          style={{
            paddingVertical: 80,
            paddingHorizontal: 32,
          }}
          actionButton={{
            label: "Browse Kitchens",
            onPress: () => router.push("/(tabs)/"),
          }}
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
                // Navigate to create group order screen (user will need to select chef)
                router.push("/orders/group/create");
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
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 100, // Account for tab bar
  },
});
