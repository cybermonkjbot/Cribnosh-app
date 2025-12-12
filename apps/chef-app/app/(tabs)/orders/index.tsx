import { BurgerIcon } from "@/components/ui/BurgerIcon";
import { CameraModalScreen } from "@/components/ui/CameraModalScreen";
import { CreateMealModal } from "@/components/ui/CreateMealModal";
import { CreateRecipeModal } from "@/components/ui/CreateRecipeModal";
import { CreateStoryModal } from "@/components/ui/CreateStoryModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { GradientBackground } from "@/components/ui/GradientBackground";
import { OrderCard } from "@/components/ui/OrderCard";
import { OrderCardSkeleton } from "@/components/ui/OrderCardSkeleton";
import { PremiumHeader } from "@/components/ui/PremiumHeader";
import { PremiumTabs } from "@/components/ui/PremiumTabs";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { useChefAuth } from "@/contexts/ChefAuthContext";
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { useMutation, useQuery } from "convex/react";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { Alert, Modal, StyleSheet } from "react-native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  totalAmount?: number; // Total amount in pence for earnings calculation
}

export default function OrdersScreen() {
  const [activeTab, setActiveTab] = useState<"ongoing" | "past">("ongoing");
  const router = useRouter();
  const scrollY = useSharedValue(0);
  const { chef, sessionToken, isAuthenticated } = useChefAuth();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();
  const updateStatus = useMutation(api.mutations.orders.updateStatus);
  const [isCameraVisible, setIsCameraVisible] = useState(false);
  const [autoShowLiveStreamSetup, setAutoShowLiveStreamSetup] = useState(false);
  const [isRecipeModalVisible, setIsRecipeModalVisible] = useState(false);
  const [isMealModalVisible, setIsMealModalVisible] = useState(false);
  const [isStoryModalVisible, setIsStoryModalVisible] = useState(false);

  // Get orders (reactive query) - chef-specific
  const ordersDataRaw = useQuery(
    api.queries.orders.listByChef,
    chef?._id && sessionToken ? {
      chef_id: chef._id.toString(),
      sessionToken,
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

  const ordersLoading = chef === undefined || (chef && ordersDataRaw === undefined);

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
  const convertApiOrderToOrder = (apiOrder: any): Order => {
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
      ? apiOrder.order_items.map((item: any) => item.name || item.dish_name || item.dishName)
      : apiOrder.items
        ? apiOrder.items.map((item: any) => item.dish_name || item.name || item.dishName)
        : [];

    // Get order items with images for stacking
    const orderItemsWithImages = apiOrder.order_items
      ? apiOrder.order_items.map((item: any) => ({
        _id: item._id || item.id,
        dish_id: item.dish_id || item.id,
        name: item.name || item.dish_name || item.dishName,
        image_url: item.image_url || item.imageUrl || item.image,
      }))
      : apiOrder.items
        ? apiOrder.items.map((item: any) => ({
          _id: item._id || item.id,
          dish_id: item.dish_id || item.id,
          name: item.dish_name || item.name || item.dishName,
          image_url: item.image_url || item.imageUrl || item.image,
        }))
        : [];

    // Get description
    const customerName = apiOrder.customer_name || apiOrder.customerName || null;
    const description =
      items.length > 0
        ? customerName
          ? `${items.slice(0, 2).join(", ")}${items.length > 2 ? `, +${items.length - 2} more` : ""} from ${customerName}`
          : `${items.slice(0, 2).join(", ")}${items.length > 2 ? `, +${items.length - 2} more` : ""}`
        : customerName
          ? `Order from ${customerName}`
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
      kitchenName: undefined,
      orderNumber,
      items,
      orderItems: orderItemsWithImages,
      orderType: apiOrder.is_group_order ? "group" : "individual",
      // Store unique identifier for key generation
      _uniqueKey: `api-${uniqueId}`,
      // Store original ID for navigation (prefer _id, then order_id, then id)
      _originalId: apiOrder._id || apiOrder.order_id || (apiOrder.id ? String(apiOrder.id) : undefined),
      // Store total amount for earnings calculation
      totalAmount: totalAmount,
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

  // Get regular orders from Convex response
  const apiOrders =
    ordersData?.data?.orders && ordersData.data.orders.length > 0
      ? ordersData.data.orders
      : [];

  // Convert API orders to Order format
  const apiOrdersAsOrders = apiOrders.map(convertApiOrderToOrder);

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
    { key: "ongoing", label: "Ongoing" },
    { key: "past", label: "Past" },
  ];

  // Combine API orders
  // Ongoing orders: pending, confirmed, preparing, on-the-way
  const allOngoingOrders = apiOrdersAsOrders.filter(
    (order: Order) =>
      order.status === "pending" ||
      order.status === "confirmed" ||
      order.status === "preparing" ||
      order.status === "on-the-way"
  );

  // Past orders: cancelled, completed
  const allPastOrders = apiOrdersAsOrders.filter(
    (order: Order) =>
      order.status === "cancelled" ||
      order.status === "completed"
  );

  const currentOrders =
    activeTab === "ongoing" ? allOngoingOrders : allPastOrders;

  const handleOrderPress = (order: Order) => {
    // Use original ID for navigation if available, otherwise fall back to numeric ID
    const orderId = order._originalId || String(order.id);
    // Navigate to order details
    router.push(`/(tabs)/orders/${orderId}`);
  };

  const handleQuickAction = async (order: Order, action: 'accept' | 'preparing' | 'ready' | 'complete') => {
    if (!order._originalId || !sessionToken) {
      showError('Error', 'Order information not available');
      return;
    }

    const statusMap: Record<string, string> = {
      accept: 'confirmed',
      preparing: 'preparing',
      ready: 'ready',
      complete: 'completed',
    };

    const newStatus = statusMap[action];
    if (!newStatus) return;

    const actionLabels: Record<string, string> = {
      accept: 'Accept Order',
      preparing: 'Start Preparing',
      ready: 'Mark as Ready',
      complete: 'Complete Order',
    };

    Alert.alert(
      actionLabels[action],
      `Are you sure you want to ${actionLabels[action].toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateStatus({
                order_id: order._originalId!,
                status: newStatus as any,
              });
              showSuccess('Success', `Order ${actionLabels[action].toLowerCase()} successfully`);
            } catch (error: any) {
              showError('Error', error.message || 'Failed to update order status');
            }
          },
        },
      ]
    );
  };

  const renderContent = () => {
    // Show skeleton loader while loading
    // Show skeleton if orders are loading OR if we haven't fetched any data yet
    const isLoading = ordersLoading || (ordersData === null && isAuthenticated);

    if (isLoading) {
      return (
        <>
          <SectionHeader
            title={activeTab === "ongoing" ? "Current Orders" : "Past Orders"}
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
          title="No orders found"
          subtitle={activeTab === "ongoing"
            ? "You don't have any ongoing orders at the moment."
            : "You don't have any past orders yet."}
          icon="receipt-outline"
          titleColor="#094327"
          subtitleColor="#6B7280"
          iconColor="#10B981"
          style={{
            paddingVertical: 80,
            paddingHorizontal: 32,
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
          title={activeTab === "ongoing" ? "Current Orders" : "Past Orders"}
        />

        {/* All Orders - Sorted by time */}
        {sortedOrders.map((order, index) => {
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
              onPress={() => handleOrderPress(order)}
              showSeparator={index < sortedOrders.length - 1}
              index={index}
              showChefEarnings={true}
              totalAmount={order.totalAmount}
              showQuickActions={activeTab === 'ongoing'}
              onQuickAction={(action) => handleQuickAction(order, action)}
            />
          );
        })}
      </>
    );
  };

  if (!chef) {
    return (
      <GradientBackground>
        <EmptyState
          title="Loading..."
          subtitle="Please wait while we load your orders"
          icon="receipt-outline"
        />
      </GradientBackground>
    );
  }

  return (
    <GradientBackground>
      <Animated.View style={[headerStyle, { paddingTop: insets.top }]}>
        <PremiumHeader title="Orders" showInfoButton={false} />

        <PremiumTabs
          tabs={tabs}
          activeTab={activeTab}
          onTabPress={(tabKey) => setActiveTab(tabKey as "ongoing" | "past")}
        />
      </Animated.View>

      <Animated.ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.contentContainer,
          { paddingBottom: 95 + insets.bottom + 8 } // Tab bar height (95px) + safe area bottom + padding
        ]}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {renderContent()}
      </Animated.ScrollView>

      {/* Floating Action Button */}
      {isAuthenticated && (
        <FloatingActionButton
          bottomPosition={2}
          onCameraPress={() => {
            setAutoShowLiveStreamSetup(false);
            setIsCameraVisible(true);
          }}
          onRecipePress={() => {
            setIsRecipeModalVisible(true);
          }}
          onLiveStreamPress={() => {
            setAutoShowLiveStreamSetup(true);
            setIsCameraVisible(true);
          }}
          onStoryPress={() => {
            setIsStoryModalVisible(true);
          }}
        />
      )}

      {/* Camera Modal for Live Streaming */}
      {isAuthenticated && (
        <Modal
          visible={isCameraVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => {
            setIsCameraVisible(false);
            setAutoShowLiveStreamSetup(false);
          }}
          statusBarTranslucent={true}
          hardwareAccelerated={true}
        >
          <CameraModalScreen
            onClose={() => {
              setIsCameraVisible(false);
              setAutoShowLiveStreamSetup(false);
            }}
            onStartLiveStream={(sessionId) => {
              setIsCameraVisible(false);
              setAutoShowLiveStreamSetup(false);
              showSuccess('Live Session Started', 'Your live session has been created successfully!');
            }}
            autoShowLiveStreamSetup={autoShowLiveStreamSetup}
          />
        </Modal>
      )}

      {/* Recipe Creation Modal */}
      <CreateRecipeModal
        isVisible={isRecipeModalVisible}
        onClose={() => setIsRecipeModalVisible(false)}
      />

      {/* Meal Creation Modal */}
      <CreateMealModal
        isVisible={isMealModalVisible}
        onClose={() => setIsMealModalVisible(false)}
      />

      {/* Story Creation Modal */}
      <CreateStoryModal
        isVisible={isStoryModalVisible}
        onClose={() => setIsStoryModalVisible(false)}
      />
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
    // paddingBottom is now calculated dynamically with safe area insets
  },
});
