import { EmptyState } from '@/components/ui/EmptyState';
import { SuperButton } from '@/components/ui/SuperButton';
import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQuery } from 'convex/react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnTheWayScreen() {
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

  const handleBack = () => {
    // Reset the navigation stack to go back to home/orders
    router.replace("/(tabs)/orders");
  };

  const handleViewOrders = () => {
    router.push("/(tabs)/orders");
  };

  // Get delivery driver info from order data
  const deliveryPerson = (orderData as any)?.delivery_person;
  const orderStatus = (orderData as any)?.status || (orderData as any)?.order_status;

  const getDriverName = (): string => {
    if (deliveryPerson?.name) return deliveryPerson.name;
    return 'Delivery Driver'; // Default fallback
  };

  const getDriverPhone = (): string => {
    if (deliveryPerson?.phone) return deliveryPerson.phone;
    return '+44 7700 900123'; // Default fallback
  };

  const getDriverStatus = (): string => {
    if (orderStatus === 'on_the_way' || orderStatus === 'on-the-way') {
      return 'Delivering to you now';
    }
    if (orderStatus === 'ready') {
      return 'Ready for pickup';
    }
    if (orderStatus === 'preparing') {
      return 'Preparing your order';
    }
    return 'Delivering to you now'; // Default
  };

  const handleCallDeliveryPerson = async () => {
    const phoneNumber = getDriverPhone();
    
    try {
      const url = `tel:${phoneNumber.replace(/[^0-9+]/g, "")}`;
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert(
          "Unable to Make Call",
          "Phone calling is not available on this device."
        );
      }
    } catch (error) {
      console.error("Error calling delivery person:", error);
      Alert.alert(
        "Call Failed",
        "Unable to make the call. Please try again."
      );
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleBack}>
            <Feather name="chevron-left" size={24} color="white" />
          </Pressable>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading order status...</Text>
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
          <Pressable onPress={handleBack}>
            <Feather name="chevron-left" size={24} color="white" />
          </Pressable>
        </View>

        {/* Empty State */}
        <View style={styles.emptyStateContainer}>
          <EmptyState
            title="Order not found"
            subtitle="We couldn't find this order. Please check your order ID or return to your orders."
            icon="location-outline"
            actionButton={{
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

  // Use order data or fallback to default values
  const displayDriverName = deliveryPerson ? getDriverName() : 'Delivery Driver';
  const displayDriverStatus = orderStatus ? getDriverStatus() : 'Delivering to you now';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack}>
          <Feather name="chevron-left" size={24} color="white" />
        </Pressable>
      </View>

      {/* Main Content */}
      <View style={styles.content}>
        {/* Order Coming Image */}
        <View style={styles.imageContainer}>
          <Image
            source={require("@/assets/images/ordercoming.png")}
            style={styles.orderImage}
            resizeMode="contain"
          />
        </View>

        {/* View Map Button - Above Delivery Driver Details */}
        <View style={styles.mapButtonContainer}>
          <Pressable
            onPress={() => {
              if (orderId) {
                router.push(`/orders/cart/map?order_id=${orderId}`);
              } else {
                router.push('/orders/cart/map');
              }
            }}
            style={styles.mapButton}
          >
            <Text style={styles.mapButtonText}>
              View Map
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Delivery Driver Info - Using SuperButton */}
      <SuperButton
        title={
          <View style={styles.driverContainer}>
            {/* Driver Info */}
            <View style={styles.driverInfo}>
              <Text style={styles.driverName}>
                {displayDriverName}
              </Text>
              <Text style={styles.driverStatus}>
                {displayDriverStatus}
              </Text>
            </View>

            {/* Call Button */}
            <Pressable
              onPress={handleCallDeliveryPerson}
              style={styles.callButton}
            >
              <Feather name="phone" size={20} color="#094327" />
            </Pressable>
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
    paddingHorizontal: 24, // px-6
    paddingVertical: 16, // py-4
  },
  content: {
    flex: 1, // flex-1
    paddingHorizontal: 24, // px-6
  },
  imageContainer: {
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    flex: 1, // flex-1
  },
  orderImage: {
    width: '100%', // w-full
    height: 600, // h-[600px]
  },
  mapButtonContainer: {
    position: 'absolute', // absolute
    bottom: 96, // bottom-24
    right: 24, // right-6
  },
  mapButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.3)', // bg-black bg-opacity-30
    paddingHorizontal: 16, // px-4
    paddingVertical: 8, // py-2
    borderRadius: 9999, // rounded-full
  },
  mapButtonText: {
    color: '#FFFFFF', // text-white
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
  },
  driverContainer: {
    flexDirection: 'row', // flex-row
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    width: '100%', // w-full
    marginTop: -48, // -mt-12
  },
  driverInfo: {
    flex: 1, // flex-1
  },
  driverName: {
    color: '#E6FFE8', // text-[#E6FFE8]
    fontSize: 20, // text-xl
    fontWeight: '600', // font-semibold
    marginBottom: 4, // mb-1
    textAlign: 'left', // text-left
  },
  driverStatus: {
    color: '#FFFFFF', // text-white
    fontSize: 12, // text-xs
    fontWeight: '500', // font-medium
    textAlign: 'left', // text-left
  },
  callButton: {
    width: 56, // w-14
    height: 56, // h-14
    backgroundColor: '#E6FFE8', // bg-[#E6FFE8]
    borderRadius: 9999, // rounded-full
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    marginLeft: 16, // ml-4
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
});
