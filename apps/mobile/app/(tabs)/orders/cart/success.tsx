import { FoodCreatorNameCard } from '@/components/FoodCreatorNameCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { SuperButton } from '@/components/ui/SuperButton';
import { useAuthContext } from '@/contexts/AuthContext';
import { api } from '@/convex/_generated/api';
import { getSessionToken } from '@/lib/convexClient';
import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SuccessScreen() {
  const { order_id } = useLocalSearchParams<{ order_id?: string }>();
  const orderId = typeof order_id === 'string' ? order_id : undefined;
  const { isAuthenticated } = useAuthContext();
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Load session token for reactive queries
  useEffect(() => {
    const loadToken = async () => {
      const token = await getSessionToken();
      setSessionToken(token);
    };
    if (isAuthenticated) {
      loadToken();
    }
  }, [isAuthenticated]);

  // Use reactive Convex query for order data - same as order-details screen
  const orderData = useQuery(
    api.queries.orders.getEnrichedOrderBySessionToken,
    sessionToken && orderId ? { sessionToken, order_id: orderId } : "skip"
  );

  const isLoading = orderData === undefined && sessionToken !== null;
  const hasError = orderData === null && sessionToken !== null && !isLoading;

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
    if (!orderData) return '15 - 45 minutes';

    // Check for estimated_prep_time_minutes
    const estimatedMins = (orderData as any).estimated_prep_time_minutes;
    if (typeof estimatedMins === 'number' && estimatedMins > 0) {
      return `${estimatedMins}-${estimatedMins + 15} minutes`;
    }

    // Check for estimated_delivery_time string
    const estimatedTime = (orderData as any).estimated_delivery_time;
    if (typeof estimatedTime === 'string' && estimatedTime) {
      return estimatedTime;
    }

    return '15 - 45 minutes'; // Default fallback
  };

  // Format delivery address
  const getDeliveryAddress = (): string => {
    if (!orderData) return 'Address not provided';

    const address = (orderData as any).delivery_address;
    if (!address) return 'Address not provided';

    // Handle different address formats
    if (typeof address === 'string') {
      return address;
    }

    if (typeof address === 'object') {
      const parts: string[] = [];

      // Try all possible field names
      const street = address.street || address.address_line_1 || address.addressLine1 || address.line1;
      const city = address.city || address.town;
      const postcode = address.postal_code || address.postcode || address.postalCode || address.zip || address.zipCode;
      const state = address.state || address.county || address.province;
      const country = address.country;

      if (typeof street === 'string' && street.trim()) parts.push(street.trim());
      if (typeof city === 'string' && city.trim()) parts.push(city.trim());
      if (typeof state === 'string' && state.trim()) parts.push(state.trim());
      if (typeof postcode === 'string' && postcode.trim()) parts.push(postcode.trim());
      if (typeof country === 'string' && country.trim() && country.toLowerCase() !== 'uk') {
        parts.push(country.trim());
      }

      if (parts.length > 0) {
        return parts.join(', ');
      }
    }

    return 'Address not provided';
  };

  // Get foodCreator name
  const getFoodCreatorName = (): string => {
    if (!orderData) return 'FoodCreator';

    const foodCreatorName = (orderData as any).foodCreator_name || (orderData as any).restaurant_name;
    if (typeof foodCreatorName === 'string' && foodCreatorName) {
      return foodCreatorName;
    }
    return 'FoodCreator'; // Default fallback
  };

  // Get foodCreator description
  const getFoodCreatorDescription = (): string => {
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
  if (hasError || !orderId) {
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
  const foodCreatorName = getFoodCreatorName();
  const foodCreatorDescription = getFoodCreatorDescription();

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

        {/* FoodCreator Information Card */}
        <View style={styles.foodCreatorCard}>
          <FoodCreatorNameCard
            name={foodCreatorName}
            description={foodCreatorDescription}
            tiltEnabled={false}
          />
        </View>

        {/* Payment Link Card (for Pay for Me orders) */}
        {(orderData as any)?.payment_link_token && (orderData as any)?.payment_status === 'pending' && (
          <View style={styles.paymentLinkCard}>
            <View style={styles.paymentLinkHeader}>
              <Feather name="share-2" size={20} color="#4F46E5" />
              <Text style={styles.paymentLinkTitle}>Share Payment Link</Text>
            </View>
            <Text style={styles.paymentLinkDescription}>
              Share this link with someone to pay for your order:
            </Text>
            <View style={styles.linkContainer}>
              <Text style={styles.linkText} numberOfLines={1}>
                cribnosh.com/pay/{(orderData as any).payment_link_token}
              </Text>
            </View>
            <SuperButton
              title="Share Link"
              onPress={async () => {
                try {
                  const Share = require('react-native').Share;
                  await Share.share({
                    message: `Hey! Can you pay for my Cribnosh order? Here's the link: https://cribnosh.com/pay/${(orderData as any).payment_link_token}`,
                  });
                } catch (error) {
                  // Ignore
                }
              }}
              backgroundColor="#4F46E5"
              textColor="white"
              style={{ marginTop: 16 }}
            />
          </View>
        )}

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
  foodCreatorCard: {
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
  paymentLinkCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  paymentLinkHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  paymentLinkTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  paymentLinkDescription: {
    fontSize: 14,
    color: '#4B5563',
    marginBottom: 12,
  },
  linkContainer: {
    backgroundColor: '#F3F4F6',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  linkText: {
    fontFamily: 'Courier',
    fontSize: 14,
    color: '#1F2937',
  },
});
