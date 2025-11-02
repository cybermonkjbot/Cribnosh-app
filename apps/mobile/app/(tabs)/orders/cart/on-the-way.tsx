import { useGetOrderStatusQuery } from '@/store/customerApi';
import { EmptyState } from '@/components/ui/EmptyState';
import { SuperButton } from '@/components/ui/SuperButton';
import { Feather } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function OnTheWayScreen() {
  const { order_id } = useLocalSearchParams<{ order_id?: string }>();
  const orderId = typeof order_id === 'string' ? order_id : undefined;

  // Fetch order status with polling for active orders
  const { data: orderStatusData, isLoading, error, refetch } = useGetOrderStatusQuery(
    orderId || '',
    {
      skip: !orderId,
      pollingInterval: orderId ? 30000 : 0, // Poll every 30 seconds if order_id exists
    }
  );

  const handleBack = () => {
    router.back();
  };

  const handleViewOrders = () => {
    router.push("/(tabs)/orders");
  };

  // Get delivery driver info from order status
  const deliveryPerson = orderStatusData?.data?.delivery_person || 
                         (orderStatusData?.data?.order as any)?.delivery_person;

  const getDriverName = (): string => {
    if (deliveryPerson?.name) return deliveryPerson.name;
    return 'Delivery Driver'; // Default fallback
  };

  const getDriverInitial = (): string => {
    const name = getDriverName();
    return name.charAt(0).toUpperCase();
  };

  const getDriverPhone = (): string => {
    if (deliveryPerson?.phone) return deliveryPerson.phone;
    return '+44 7700 900123'; // Default fallback
  };

  const getDriverStatus = (): string => {
    const status = orderStatusData?.data?.order?.order_status || 
                   orderStatusData?.data?.current_status;
    if (status === 'on_the_way' || status === 'on-the-way') {
      return 'Delivering to you now';
    }
    if (status === 'ready') {
      return 'Ready for pickup';
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
  if (isLoading && !orderStatusData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
          <Text style={styles.loadingText}>Loading order status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show empty state when order not found or error
  if ((error && !orderStatusData && !isLoading) || (!orderId && !isLoading)) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={handleBack}>
            <Feather name="chevron-left" size={24} color="white" />
          </Pressable>
          <View style={styles.headerIcon} />
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

  // If no order_id or error, show default/mock data
  const displayDriverName = orderId && deliveryPerson ? getDriverName() : 'David Morel';
  const displayDriverInitial = orderId && deliveryPerson ? getDriverInitial() : 'D';
  const displayDriverStatus = orderId && orderStatusData ? getDriverStatus() : 'Delivering to you now';

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack}>
          <Feather name="chevron-left" size={24} color="white" />
        </Pressable>
        <View style={styles.headerIcon} />
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
            {/* Profile Picture with Red Ring */}
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{displayDriverInitial}</Text>
              </View>
              <View style={styles.avatarRing} />
            </View>

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
  avatarContainer: {
    position: 'relative', // relative
    marginRight: 32, // mr-8
  },
  avatar: {
    width: 64, // w-16
    height: 64, // h-16
    backgroundColor: '#4B5563', // bg-gray-600
    borderRadius: 9999, // rounded-full
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
  },
  avatarText: {
    color: '#FFFFFF', // text-white
    fontSize: 20, // text-xl
    fontWeight: '700', // font-bold
  },
  avatarRing: {
    position: 'absolute', // absolute
    top: -4, // -top-1
    right: -4, // -right-1
    width: 72, // w-18
    height: 72, // h-18
    borderWidth: 4, // border-4
    borderColor: '#FF3B30', // border-[#FF3B30]
    borderRadius: 9999, // rounded-full
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
