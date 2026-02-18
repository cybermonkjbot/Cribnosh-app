import { BurgerIcon } from "@/components/ui/BurgerIcon";
import { EmptyState } from "@/components/ui/EmptyState";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { OrderCard } from "@/components/ui/OrderCard";
import { OrderCardSkeleton } from "@/components/ui/OrderCardSkeleton";
import { OrdersCampaignBanner } from "@/components/ui/OrdersCampaignBanner";
import { PremiumHeader } from "@/components/ui/PremiumHeader";
import { PremiumTabs } from "@/components/ui/PremiumTabs";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useAuthContext } from "@/contexts/AuthContext";
import { api } from '@/convex/_generated/api';
import { getSessionToken } from "@/lib/convexClient";
import { Order as ApiOrder, CustomOrder } from "@/types/customer";
import { useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
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
  | "pending"
  | "confirmed"
  | "preparing"
  | "on-the-way"
  | "cancelled"
  | "completed";

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

interface OrderItemWithImage {
  _id?: string;
  dish_id?: string;
  name?: string;
  image_url?: string;
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
  orderItems?: OrderItemWithImage[];
  orderType?: OrderType;
  groupOrder?: GroupOrder;
  _uniqueKey?: string; // Unique key for React list rendering
  _originalId?: string; // Original ID from API (_id or order_id) for navigation
  paymentStatus?: string;
}

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<"ongoing" | "past">("ongoing");
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const { isAuthenticated } = useAuthContext();

  // Get session token for reactive queries
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    const loadToken = async () => {
      if (isAuthenticated) {
        const token = await getSessionToken();
        setSessionToken(token);
      } else {
        setSessionToken(null);
      }
    };
    loadToken();
  }, [isAuthenticated]);

  // Get user by session token (reactive query)
  const user = useQuery(
    api.queries.users.getUserBySessionToken,
    sessionToken ? { sessionToken } : "skip"
  );

  // Get orders (reactive query)
  const ordersDataRaw = useQuery(
    api.queries.orders.listByCustomer,
    user?._id && sessionToken ? {
      customer_id: user._id.toString(),
      sessionToken,
      status: activeTab === "ongoing" ? "ongoing" : activeTab === "past" ? "past" : "all",
      order_type: "all",
      limit: 20,
    } : "skip"
  );

  // Transform orders data to match expected format
  const ordersData = useMemo(() => {
    if (!ordersDataRaw) return null;
    return {
      data: {
        orders: ordersDataRaw,
        total: ordersDataRaw.length,
      }
    };
  }, [ordersDataRaw]);

  const ordersLoading = user === undefined || (user && ordersDataRaw === undefined);

  // Get active offers (reactive query)
  const offersDataRaw = useQuery(
    api.queries.specialOffers.getActiveOffers,
    user?._id ? {
      user_id: user._id,
      target_audience: "group_orders" as const,
    } : "skip"
  );

  // Transform offers data to match expected format
  const offersData = useMemo(() => {
    if (!offersDataRaw) return null;
    return {
      data: offersDataRaw || [],
    };
  }, [offersDataRaw]);



  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      "worklet";
      scrollY.value = event.contentOffset.y;
    },
  });

  // Helper function to get ordinal suffix
  const getOrdinalSuffix = (day: number): string => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  // Helper function to format order ID (show last 6 characters)
  const formatOrderId = (orderId: string | undefined): string => {
    if (!orderId) return "";
    // Remove any existing # prefix
    const cleanId = orderId.replace(/^#/, "");
    // If it's a short ID (8 chars or less), return as is
    if (cleanId.length <= 8) {
      return `#${cleanId.toUpperCase()}`;
    }
    // Otherwise, show last 6 characters
    return `#${cleanId.slice(-6).toUpperCase()}`;
  };

  // Convert API orders to UI Order format
  const convertApiOrderToOrder = (apiOrder: ApiOrder): Order => {
    const statusMap: Record<string, OrderStatus> = {
      pending: "pending",
      confirmed: "confirmed",
      preparing: "preparing",
      on_the_way: "on-the-way",
      "on-the-way": "on-the-way",
      delivered: "completed", // Map delivered to completed
      cancelled: "cancelled",
      completed: "completed",
    };

    // Format timestamp
    const timestamp =
      apiOrder.createdAt || apiOrder.created_at
        ? typeof apiOrder.createdAt === "number"
          ? apiOrder.createdAt
          : new Date(apiOrder.created_at).getTime()
        : Date.now();
    const date = new Date(timestamp);
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");
    const day = date.getDate();
    const monthName = date.toLocaleString("en-GB", { month: "long" });
    const formattedTime = `${hours}:${minutes} • ${day}${getOrdinalSuffix(day)} ${monthName}`;

    // Format estimated time
    let estimatedTime: string | undefined;
    if (apiOrder.estimated_prep_time_minutes) {
      const mins = apiOrder.estimated_prep_time_minutes;
      estimatedTime = `${mins}-${mins + 5} min`;
    } else if (apiOrder.estimated_delivery_time) {
      estimatedTime = apiOrder.estimated_delivery_time;
    }

    // Get items
    const items = apiOrder.order_items
      ? apiOrder.order_items.map((item: any) => item.name || item.dish_name)
      : apiOrder.items.map((item: any) => item.dish_name);

    // Get order items with images for stacking
    const orderItemsWithImages = apiOrder.order_items
      ? apiOrder.order_items.map((item: any) => ({
        _id: item._id || item.id,
        dish_id: item.dish_id || item.id,
        name: item.name || item.dish_name,
        image_url: item.image_url || item.imageUrl || item.image,
      }))
      : apiOrder.items
        ? apiOrder.items.map((item: any) => ({
          _id: item._id || item.id,
          dish_id: item.dish_id || item.id,
          name: item.dish_name || item.name,
          image_url: item.image_url || item.imageUrl || item.image,
        }))
        : [];

    // Get description
    const kitchenName =
      apiOrder.kitchen_name || apiOrder.restaurant_name || undefined;
    const description =
      items.length > 0
        ? kitchenName
          ? `${items.slice(0, 2).join(", ")}${items.length > 2 ? `, +${items.length - 2} more` : ""} from ${kitchenName}`
          : `${items.slice(0, 2).join(", ")}${items.length > 2 ? `, +${items.length - 2} more` : ""}`
        : kitchenName
          ? `Order from ${kitchenName}`
          : "Order";

    // Get price
    const totalAmount = apiOrder.total_amount || apiOrder.total || 0;
    const price = `£${(totalAmount / 100).toFixed(2)}`;

    // Get order number (formatted to show last 6 characters)
    const rawOrderId = apiOrder.order_id || apiOrder.id || apiOrder._id;
    const orderNumber = formatOrderId(rawOrderId);

    // Generate a unique ID for the order
    const uniqueId =
      apiOrder._id ||
      apiOrder.id ||
      `api-${Math.random().toString(36).slice(2, 11)}`;
    const numericId =
      parseInt(uniqueId.toString().replace(/\D/g, "")) || Math.random() * 1000;

    const baseOrder: Order = {
      id: numericId,
      time: formattedTime,
      description,
      price,
      status:
        statusMap[apiOrder.order_status || apiOrder.status] || "preparing",
      estimatedTime,
      kitchenName,
      orderNumber,
      items,
      orderItems: orderItemsWithImages,
      orderType: apiOrder.is_group_order ? "group" : "individual",
      // Store unique identifier for key generation
      _uniqueKey: `api-${uniqueId}`,
      // Store original ID for navigation (prefer _id, then order_id, then id)
      _originalId: apiOrder._id || apiOrder.order_id || (apiOrder.id ? String(apiOrder.id) : undefined),
      paymentStatus: (apiOrder as any).payment_status || (apiOrder as any).paymentStatus,
    };

    // Add group order info if applicable
    if (
      apiOrder.is_group_order &&
      (apiOrder.group_order || apiOrder.group_order_details)
    ) {
      const groupData = apiOrder.group_order || apiOrder.group_order_details;
      if (groupData && groupData.participants) {
        baseOrder.groupOrder = {
          id: (apiOrder as any).group_order_id || apiOrder._id || apiOrder.id,
          users: groupData.participants.map((p: any) => ({
            id: p.user_id,
            name: p.user_name,
            initials:
              p.user_initials || p.user_name?.charAt(0).toUpperCase() || "U",
            color: p.user_color,
            avatar: p.avatar_url,
          })),
          totalUsers:
            groupData.total_participants || groupData.participants.length,
          isActive:
            (apiOrder.order_status || apiOrder.status) !== "completed" &&
            (apiOrder.order_status || apiOrder.status) !== "cancelled",
        };
      }
    }

    return baseOrder;
  };

  // Convert custom orders to Order format
  const convertCustomOrderToOrder = (customOrder: CustomOrder): Order => {
    const statusMap: Record<string, OrderStatus> = {
      pending: "pending",
      processing: "preparing",
      accepted: "confirmed",
      confirmed: "confirmed",
      preparing: "preparing",
      delivered: "completed", // Map delivered to completed
      cancelled: "cancelled",
      completed: "completed",
    };

    // Generate a unique ID for the custom order
    const uniqueId =
      customOrder._id || `custom-${Math.random().toString(36).slice(2, 11)}`;
    const numericId =
      parseInt(uniqueId.toString().replace(/\D/g, "")) || Math.random() * 1000;

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
      estimatedTime: "Processing",
      kitchenName: "Custom Kitchen",
      orderNumber: formatOrderId(customOrder.custom_order_id),
      items: [customOrder.requirements],
      orderType: "individual",
      // Store unique identifier for key generation
      _uniqueKey: `custom-${uniqueId}`,
      // Store original ID for navigation
      _originalId: customOrder._id || customOrder.custom_order_id || String((customOrder as any).id),
    };
  };

  // Get regular orders from Convex response - only use API data
  const apiOrders =
    ordersData?.data?.orders && ordersData.data.orders.length > 0
      ? ordersData.data.orders
      : [];

  // Custom orders are now included in the reactive orders query
  const customOrders: CustomOrder[] = [];

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
  // Ongoing orders: pending, confirmed, preparing, on-the-way
  const allOngoingOrders = [
    ...apiOrdersAsOrders.filter(
      (order: Order) =>
        order.status === "pending" ||
        order.status === "confirmed" ||
        order.status === "preparing" ||
        order.status === "on-the-way"
    ),
    ...customOrdersAsOrders.filter(
      (order: Order) =>
        order.status === "pending" ||
        order.status === "confirmed" ||
        order.status === "preparing" ||
        order.status === "on-the-way"
    ),
  ];

  // Past orders: cancelled, completed
  const allPastOrders = [
    ...apiOrdersAsOrders.filter(
      (order: Order) =>
        order.status === "cancelled" ||
        order.status === "completed"
    ),
    ...customOrdersAsOrders.filter(
      (order: Order) =>
        order.status === "cancelled" ||
        order.status === "completed"
    ),
  ];

  const currentOrders =
    activeTab === "ongoing" ? allOngoingOrders : allPastOrders;

  const handleOrderPress = (
    order: Order,
    isCustomOrder: boolean = false
  ) => {
    // Use original ID for navigation if available, otherwise fall back to numeric ID
    const orderId = order._originalId || String(order.id);

    if (isCustomOrder) {
      // Navigate to custom order details
      router.push(`/custom-order-details?id=${orderId}`);
    } else {
      // Navigate to regular order details
      router.push(`/order-details?id=${orderId}`);
    }
  };

  const renderContent = () => {
    // Show skeleton loader while loading
    // Show skeleton if orders are loading OR if we haven't fetched any data yet
    const isLoading = ordersLoading || (ordersData === null && isAuthenticated);

    if (isLoading) {
      return (
        <>
          <SectionHeader
            title={activeTab === "ongoing" ? "Current Orders" : "June 2026"}
          />
          {Array.from({ length: 3 }).map((_, index) => (
            <OrderCardSkeleton
              key={`skeleton-${index}`}
              showSeparator={index < 2}
            />
          ))}
        </>
      );
    }

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
            onPress: () => router.push("/(tabs)" as any),
          }}
        />
      );
    }

    // Sort all orders by time (most recent first)
    const sortedOrders = [...currentOrders].sort((a: Order, b: Order) => {
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
          title={activeTab === "ongoing" ? "Current Orders" : "June 2026"}
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
              orderItems={order.orderItems}
              orderType={order.orderType}
              groupOrder={order.groupOrder}
              icon={<BurgerIcon />}
              onPress={() => handleOrderPress(order, isCustomOrder)}
              showSeparator={index < sortedOrders.length - 1}
              index={index}
              paymentStatus={order.paymentStatus}
            />
          );
        })}
      </>
    );
  };

  return (
    <GradientBackground>
      <Animated.View style={headerStyle}>
        <PremiumHeader title="Orders" showInfoButton={false} />

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
