import { KitchenNameCard } from '@/components/KitchenNameCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SuperButton } from '@/components/ui/SuperButton';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';
import { useAuthContext } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';

export default function SuccessScreen() {
  const { order_id } = useLocalSearchParams<{ order_id?: string }>();
  const orderId = typeof order_id === 'string' ? order_id : undefined;
  const { isAuthenticated } = useAuthContext();
  const [orderData, setOrderData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  // Fetch order details from Convex
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId || !isAuthenticated) return;

      try {
        setIsLoading(true);
        setError(null);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          setError(new Error('Not authenticated'));
          return;
        }

        const result = await convex.action(api.actions.orders.customerGetOrder, {
          sessionToken,
          order_id: orderId,
        });

        if (result.success === false) {
          setError(new Error(result.error || 'Failed to fetch order'));
          return;
        }

        // Transform to match expected format
        setOrderData({
          data: result.order,
        });
      } catch (error: any) {
        setError(error);
        console.error('Error fetching order:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId && isAuthenticated) {
      fetchOrder();
    }
  }, [orderId, isAuthenticated]);

  const handleBackToHome = () => {
    router.replace("/(tabs)");
  };

  const handleTrackOrder = () => {
    if (orderId) {
      router.push(`/orders/cart/on-the-way?order_id=${orderId}`);
    } else {
      router.push("/orders/cart/on-the-way");
    }
  };

  const handleViewOrders = () => {
    router.push("/(tabs)/orders");
  };

  // Format delivery time
  const getDeliveryTime = (): string => {
    const order = orderData?.data;
    if (!order) return '15 - 45 minutes';
    
    // Check for estimated_prep_time_minutes from API response
    const estimatedMins = (order as any).estimated_prep_time_minutes || 
                           (order as any).estimatedPrepTimeMinutes;
    if (typeof estimatedMins === 'number' && estimatedMins > 0) {
      return `${estimatedMins}-${estimatedMins + 15} minutes`;
    }
    
    // Check for estimated_delivery_time string
    const estimatedTime = (order as any).estimated_delivery_time;
    if (typeof estimatedTime === 'string' && estimatedTime) {
      return estimatedTime;
    }
    
    return '15 - 45 minutes'; // Default fallback
  };

  // Format delivery address
  const getDeliveryAddress = (): string => {
    const order = orderData?.data;
    if (!order) return 'Address not provided';
    
    const address = (order as any).delivery_address || (order as any).deliveryAddress;
    if (!address || typeof address !== 'object') return 'Address not provided';
    
    const parts: string[] = [];
    if (typeof address.street === 'string' && address.street) parts.push(address.street);
    if (typeof address.city === 'string' && address.city) parts.push(address.city);
    if (typeof address.postcode === 'string' && address.postcode) parts.push(address.postcode);
    if (typeof address.postal_code === 'string' && address.postal_code) parts.push(address.postal_code);
    
    return parts.length > 0 ? parts.join(', ') : 'Address not provided';
  };

  // Get kitchen name
  const getKitchenName = (): string => {
    const order = orderData?.data;
    if (!order) return 'Kitchen';
    
    if (typeof (order as any).kitchen_name === 'string' && (order as any).kitchen_name) {
      return (order as any).kitchen_name;
    }
    if (typeof (order as any).restaurant_name === 'string' && (order as any).restaurant_name) {
      return (order as any).restaurant_name;
    }
    return 'Kitchen'; // Default fallback
  };

  // Get kitchen description
  const getKitchenDescription = (): string => {
    // Could be enhanced with cuisine type from order/chef data
    return 'Top Rated'; // Default fallback
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state when order not found or error
  if ((error && !orderData) || (!orderId && !isLoading)) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBackToHome}>
            <Feather name="chevron-left" size={24} color="white" />
          </Pressable>
          <View style={styles.headerIcon} />
        </View>

        {/* Empty State */}
        <View style={styles.emptyStateContainer}>
          <EmptyState
            title="Order not found"
            subtitle="We couldn't find the order details. It may have been cancelled or the link is invalid."
            icon="receipt-outline"
            actionButton={{
              label: "Back to Home",
              onPress: handleBackToHome,
            }}
            secondaryActionButton={{
              label: "View Orders",
              onPress: handleViewOrders,
            }}
            titleColor="#FFFFFF"
            subtitleColor="#E6FFE8"
            iconColor="#FFFFFF"
          />
        </View>
      </SafeAreaView>
    );
  }

  // Get order data (with fallbacks)
  const deliveryTime = getDeliveryTime();
  const deliveryAddress = getDeliveryAddress();
  const kitchenName = getKitchenName();
  const kitchenDescription = getKitchenDescription();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBackToHome}>
          <Feather name="chevron-left" size={24} color="white" />
        </Pressable>
        <View style={styles.headerIcon} />
      </View>

      {/* Scrollable Main Content */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Order Confirmation Image */}
        <View style={styles.imageContainer}>
          <Image
            source={require("@/assets/images/order-confirmation.png")}
            style={styles.confirmationImage}
            resizeMode="contain"
          />
        </View>

        {/* Delivery Details */}
        <View style={styles.detailsContainer}>
          {/* Progress Dots - positioned absolutely on the left between icons */}
          <View style={styles.progressDots}>
            <View style={[styles.progressDot, styles.progressDot1]} />
            <View style={[styles.progressDot, styles.progressDot2]} />
            <View style={[styles.progressDot, styles.progressDot3]} />
          </View>

          {/* Delivery Time */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Feather name="clock" size={16} color="white" />
            </View>
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>
                Your delivery time
              </Text>
              <Text style={styles.detailValue}>
                {deliveryTime}
              </Text>
            </View>
          </View>

          {/* Delivery Address */}
          <View style={styles.detailRow}>
            <View style={styles.detailIcon}>
              <Feather name="map-pin" size={16} color="white" />
            </View>
            <View style={styles.detailText}>
              <Text style={styles.detailLabel}>
                Your address
              </Text>
              <Text style={styles.detailValue}>
                {deliveryAddress}
              </Text>
            </View>
          </View>
        </View>

        {/* Kitchen Information Card */}
        <View style={styles.kitchenCard}>
          <KitchenNameCard 
            name={kitchenName}
            description={kitchenDescription}
            tiltEnabled={false}
          />
        </View>

        {/* Spacer for fixed buttons at bottom */}
        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Fixed Buttons Container */}
      <View style={styles.buttonsContainer}>
        {/* Track Order Button - positioned above the super button */}
        <View style={styles.trackButtonContainer}>
          <Pressable
            onPress={handleTrackOrder}
            style={styles.trackButton}
          >
            <Text style={styles.trackButtonText}>
              Track Order
            </Text>
          </Pressable>
        </View>

        {/* Super Button - Start New Order */}
        <SuperButton
          title="Start New Order"
          onPress={handleBackToHome}
          backgroundColor="#094327"
          textColor="white"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // flex-1
    backgroundColor: '#FF3B30', // bg-[#FF3B30]
  },
  header: {
    flexDirection: 'row', // flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    paddingHorizontal: 24, // px-6
    paddingVertical: 16, // py-4
  },
  headerIcon: {
    width: 40, // w-10
    height: 40, // h-10
    backgroundColor: '#FFFFFF', // bg-white
    borderRadius: 9999, // rounded-full
  },
  scrollView: {
    flex: 1, // flex-1
  },
  scrollContent: {
    paddingHorizontal: 24, // px-6
    paddingBottom: 16, // pb-4
  },
  imageContainer: {
    alignItems: 'center', // items-center
    marginBottom: 32, // mb-8
  },
  confirmationImage: {
    width: '100%', // w-full
    height: 256, // h-64
    marginLeft: -80, // -ml-20
  },
  detailsContainer: {
    width: '100%', // w-full
    gap: 80, // space-y-20
    position: 'relative', // relative
  },
  progressDots: {
    position: 'absolute', // absolute
    left: 12, // left-3
    top: 96, // top-24
    flexDirection: 'column', // flex flex-col
    alignItems: 'center', // items-center
    gap: 16, // space-y-4
  },
  progressDot: {
    borderRadius: 9999, // rounded-full
    backgroundColor: '#FFFFFF', // bg-white
  },
  progressDot1: {
    width: 4, // w-1
    height: 4, // h-1
    opacity: 0.25, // opacity-25
  },
  progressDot2: {
    width: 6, // w-1.5
    height: 6, // h-1.5
    opacity: 0.5, // opacity-50
  },
  progressDot3: {
    width: 6, // w-1.5
    height: 6, // h-1.5
    opacity: 0.75, // opacity-75
  },
  detailRow: {
    flexDirection: 'row', // flex flex-row
    alignItems: 'center', // items-center
    gap: 10, // gap-2.5
  },
  detailIcon: {
    width: 24, // w-6
    height: 24, // h-6
    backgroundColor: '#094327', // bg-[#094327]
    borderRadius: 9999, // rounded-full
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
  },
  detailText: {
    flex: 1, // flex-1
  },
  detailLabel: {
    color: '#FFFFFF', // text-white
    fontSize: 16, // text-base
    fontWeight: '400', // font-normal
    marginBottom: 8, // mb-2
  },
  detailValue: {
    color: '#094327', // text-[#094327]
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
  },
  kitchenCard: {
    marginTop: 32, // mt-8
    marginBottom: 24, // mb-6
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
    fontWeight: '500',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  bottomSpacer: {
    height: 180, // Space for fixed buttons (Track Order + SuperButton + spacing)
  },
  buttonsContainer: {
    position: 'absolute', // absolute
    bottom: 0, // bottom-0
    left: 0, // left-0
    right: 0, // right-0
    zIndex: 10, // Ensure buttons are above content
  },
  trackButtonContainer: {
    paddingHorizontal: 16, // px-4 (reduced to make button wider)
    paddingBottom: 8, // pb-2 (reduced spacing between Track Order and Start New Order)
    marginBottom: 40, // mb-2 (move button up a bit)
  },
  trackButton: {
    backgroundColor: '#FFFFFF', // bg-white
    paddingVertical: 16, // py-4
    paddingHorizontal: 24, // px-6
    borderRadius: 16, // rounded-2xl
    alignItems: 'center', // items-center
    width: '100%', // w-full (make button full width of container)
  },
  trackButtonText: {
    color: '#FF3B30', // text-[#FF3B30]
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
  },
});
