import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// Customer API imports
import { useOrders } from "@/hooks/useOrders";

// Global toast imports
import { OrderAgainQuickActionModal } from "./OrderAgainQuickActionModal";
import { OrderAgainSectionSkeleton } from "./OrderAgainSectionSkeleton";
import { SkeletonWithTimeout } from "./SkeletonWithTimeout";

interface OrderItem {
  id: string;
  name: string;
  price: string;
  image: string;
  hasBussinBadge?: boolean;
  lastOrderId?: string | null;
}

interface OrderAgainSectionProps {
  isHeaderSticky?: boolean;
  isAuthenticated?: boolean;
  shouldShow?: boolean; // Controls visibility while maintaining hook consistency
  onItemPress?: (item: OrderItem) => void;
  onAddItem?: (itemId: string) => Promise<void>;
  onAddEntireOrder?: (orderId: string) => Promise<void>;
  onViewDetails?: (itemId: string) => void;
  hasInitialLoadCompleted?: boolean;
}

export function OrderAgainSection({
  isHeaderSticky = false,
  isAuthenticated = false,
  shouldShow = true, // Default to showing
  onItemPress,
  onAddItem,
  onAddEntireOrder,
  onViewDetails,
  hasInitialLoadCompleted = false,
}: OrderAgainSectionProps) {
  const horizontalScrollRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<OrderItem | null>(null);

  // Recent dishes using useOrders hook
  const { getRecentDishes } = useOrders();
  const [recentDishesData, setRecentDishesData] = useState<any>(null);
  const [dishesLoading, setDishesLoading] = useState(false);
  const [dishesError, setDishesError] = useState<any>(null);

  // Load recent dishes
  useEffect(() => {
    if (isAuthenticated) {
      const loadRecentDishes = async () => {
        try {
          setDishesLoading(true);
          setDishesError(null);
          const result = await getRecentDishes(10);
          if (result?.success) {
            setRecentDishesData({ success: true, data: result });
          }
        } catch (error: any) {
          setDishesError(error);
        } finally {
          setDishesLoading(false);
        }
      };
      loadRecentDishes();
    } else {
      setRecentDishesData(null);
    }
  }, [isAuthenticated, getRecentDishes]);

  // Transform API dishes to component format
  const transformDishesData = useCallback((apiDishes: any[]) => {
    return apiDishes.map((dish) => ({
      id: dish.dish_id,
      name: dish.name || "Previous Order",
      price: `£${(dish.price / 100).toFixed(2)}`, // Convert from pence to pounds
      image: dish.image_url || "https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=120&h=120&fit=crop", // Default image if null
      hasBussinBadge: dish.has_bussin_badge || false,
      lastOrderId: dish.last_order_id || null,
    }));
  }, []);

  // Process dishes data from API - return empty array if no data
  const orderItems = useMemo(() => {
    if (recentDishesData?.success && recentDishesData.data && isAuthenticated) {
      // Handle different data structures
      const dishes = recentDishesData.data.dishes || recentDishesData.data || [];
      const transformedData = transformDishesData(Array.isArray(dishes) ? dishes : []);
      return transformedData;
    }

    // Return empty array instead of mock data when not authenticated or no API results
    return [];
  }, [recentDishesData, isAuthenticated, transformDishesData]);

  // Error state is shown in UI - no toast needed

  // Handle entrance and exit animations based on header state
  // IMPORTANT: This hook must be called before any early returns to maintain hook consistency
  useEffect(() => {
    if (!isHeaderSticky) {
      // Header is normal - animate in
      const animateIn = () => {
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]).start();
      };

      // Delay the animation slightly to ensure smooth transition
      const timer = setTimeout(animateIn, 150);
      return () => clearTimeout(timer);
    } else {
      // Header is sticky - animate out smoothly
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0.3, // Fade to 30% opacity instead of completely hiding
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: -10, // Slide up slightly
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isHeaderSticky, fadeAnim, slideAnim]);

  // Hide section if shouldShow is false (after all hooks are called)
  if (!shouldShow) {
    return null;
  }

  // Only show skeleton during initial load, never after initial load is complete
  if (dishesLoading && isAuthenticated && !hasInitialLoadCompleted) {
    return (
      <SkeletonWithTimeout isLoading={dishesLoading}>
        <OrderAgainSectionSkeleton itemCount={3} />
      </SkeletonWithTimeout>
    );
  }

  // Hide section completely if no orders (after all hooks are called)
  if (orderItems.length === 0) {
    return null;
  }

  return (
    <Animated.View
      style={{
        marginBottom: 24,
        paddingTop: 28, // 10% of typical screen height (280px) to avoid header
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          paddingHorizontal: 10,
        }}
      >
        <Text
          style={{
            color: "#1a1a1a",
            fontSize: 20,
            fontWeight: "700",
            lineHeight: 24,
          }}
        >
          Order again
        </Text>
      </View>

      <ScrollView
        ref={horizontalScrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingLeft: 10, // Changed from paddingHorizontal to paddingLeft only
          gap: 12,
        }}
        scrollEventThrottle={16}
        decelerationRate="fast"
        nestedScrollEnabled={true}
        scrollEnabled={true}
      >
        {orderItems.map((item, index) => (
          <TouchableOpacity
            key={item.id}
            style={{
              width: 120,
              backgroundColor: "#fff",
              borderRadius: 16,
              padding: 12,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 8,
              elevation: 3,
            }}
            onPress={() => {
              if (onAddItem || onAddEntireOrder || onViewDetails) {
                setSelectedItem(item);
                setModalVisible(true);
              } else {
                onItemPress?.(item);
              }
            }}
            activeOpacity={0.8}
          >
            <View style={{ position: "relative", marginBottom: 8 }}>
              <Image
                source={{ uri: item.image }}
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 12,
                }}
                contentFit="cover"
              />
              {item.hasBussinBadge && (
                <View
                  style={{
                    position: "absolute",
                    top: 6,
                    right: 6,
                    backgroundColor: "#ef4444",
                    borderRadius: 12,
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: "600",
                      marginRight: 2,
                    }}
                  >
                    Bussin
                  </Text>
                  <Ionicons name="flame" size={8} color="#FFE4E1" />
                </View>
              )}
            </View>

            <Text
              style={{
                fontSize: 12,
                fontWeight: "500",
                color: "#000",
                marginBottom: 4,
              }}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: "#000",
              }}
            >
              {item.price}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Quick Action Modal */}
      <OrderAgainQuickActionModal
        isVisible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setSelectedItem(null);
        }}
        item={selectedItem}
        onAddItem={onAddItem || (async () => {})}
        onAddEntireOrder={onAddEntireOrder || (async () => {})}
        onViewDetails={onViewDetails || (() => {})}
      />
    </Animated.View>
  );
}
