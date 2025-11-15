import { EmptyState } from '@/components/ui/EmptyState';
import { Feather } from '@expo/vector-icons';
import { MapPin } from 'lucide-react-native';
import React, { useEffect, useState, useCallback } from 'react';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';
import { useAuthContext } from '@/contexts/AuthContext';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapView } from './MapView';

interface DeliveryMapScreenProps {
  onClose: () => void;
  orderId?: string;
}

// Mock delivery person and destination locations (fallback)
const defaultDeliveryPersonLocation = {
  latitude: 37.7849,
  longitude: -122.4094,
};

const defaultDestinationLocation = {
  latitude: 37.7749,
  longitude: -122.4194,
};

export default function DeliveryMapScreen({ onClose, orderId }: DeliveryMapScreenProps) {
  const { isAuthenticated } = useAuthContext();
  const [orderStatusData, setOrderStatusData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<any>(null);

  // Fetch order status from Convex
  const fetchOrderStatus = useCallback(async () => {
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

      const result = await convex.action(api.actions.orders.customerGetOrderStatus, {
        sessionToken,
        order_id: orderId,
      });

      if (result.success === false) {
        setError(new Error(result.error || 'Failed to fetch order status'));
        return;
      }

      // Transform order to match expected format
      const order = result.order;
      if (order) {
        setOrderStatusData({
          data: {
            order_id: order._id || order.id,
            current_status: order.order_status || order.status,
            delivery_person: order.delivery_person || order.deliveryPerson,
            status_updates: order.status_updates || order.statusUpdates || [],
            order: order,
          },
        });
      }
    } catch (error: any) {
      setError(error);
      console.error('Error fetching order status:', error);
    } finally {
      setIsLoading(false);
    }
  }, [orderId, isAuthenticated]);

  // Fetch on mount and set up polling
  useEffect(() => {
    if (orderId && isAuthenticated) {
      fetchOrderStatus();
      // Poll every 30 seconds for active orders
      const interval = setInterval(() => {
        fetchOrderStatus();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [orderId, isAuthenticated, fetchOrderStatus]);

  // Get delivery person info and location from order status
  const deliveryPerson = orderStatusData?.data?.delivery_person || 
                         (orderStatusData?.data?.order as any)?.delivery_person;
  
  // Get delivery location from order status updates
  const latestStatusUpdate = orderStatusData?.data?.status_updates?.[
    (orderStatusData?.data?.status_updates?.length || 1) - 1
  ];
  
  const deliveryLocation = latestStatusUpdate?.location || 
                           (deliveryPerson as any)?.location ||
                           defaultDeliveryPersonLocation;

  // Get destination from order delivery address
  const order = orderStatusData?.data?.order as any;
  const deliveryAddress = order?.delivery_address || order?.deliveryAddress;
  
  // For now, use default destination (would need geocoding to convert address to coordinates)
  const destinationLocation = defaultDestinationLocation;

  // Get driver name
  const getDriverName = (): string => {
    if (deliveryPerson?.name) return deliveryPerson.name;
    return 'Delivery Driver'; // Default fallback
  };

  // Get estimated arrival time
  const getEstimatedTime = (): string => {
    if (orderStatusData?.data?.estimated_delivery_time) {
      return orderStatusData.data.estimated_delivery_time;
    }
    return '15 - 45 minutes'; // Default fallback
  };

  // Prepare chefs array for MapView
  const mapMarkers = [
    {
      id: 'delivery-person',
      kitchen_name: getDriverName(),
      cuisine: 'On the way',
      delivery_time: getEstimatedTime(),
      location: deliveryLocation,
      rating: 0,
      distance: 0,
    },
    {
      id: 'destination',
      kitchen_name: 'Your Location',
      cuisine: 'Destination',
      delivery_time: '',
      location: destinationLocation,
      rating: 0,
      distance: 0,
    },
  ];

  // Calculate center point for map
  const centerLat = (deliveryLocation.latitude + destinationLocation.latitude) / 2;
  const centerLng = (deliveryLocation.longitude + destinationLocation.longitude) / 2;
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Feather name="chevron-down" size={24} color="#ffffff" />
        </Pressable>
        <Text style={styles.headerTitle}>Order Tracking</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Map View */}
      {isLoading && !orderStatusData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E6FFE8" />
          <Text style={styles.loadingText}>Loading delivery status...</Text>
        </View>
      ) : (error && !orderStatusData && !isLoading) || (!orderId && !isLoading) ? (
        <View style={styles.emptyStateContainer}>
          <EmptyState
            title="Order not found"
            subtitle="We couldn't load the delivery information for this order."
            icon="map-outline"
            actionButton={{
              label: "Go Back",
              onPress: onClose,
            }}
            titleColor="#E6FFE8"
            subtitleColor="#EAEAEA"
            iconColor="#E6FFE8"
          />
        </View>
      ) : (
        <>
          <View style={styles.mapWrapper}>
            <MapView
              chefs={mapMarkers}
              initialRegion={{
                latitude: centerLat,
                longitude: centerLng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              }}
              showUserLocation={true}
              style={styles.mapView}
            />
          </View>

          {/* Delivery Info Card */}
          <View style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.infoIcon}>
                <MapPin size={20} color="#094327" />
              </View>
              <Text style={styles.infoTitle}>Delivery in Progress</Text>
            </View>
            <Text style={styles.infoText}>
              Your order is being delivered by {getDriverName()}
            </Text>
            <Text style={styles.infoSubtext}>
              Estimated arrival: {getEstimatedTime()}
            </Text>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02120A',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#02120A',
    zIndex: 100,
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  mapWrapper: {
    flex: 1,
    width: '100%',
    backgroundColor: '#02120A', // Dark background to match screen
  },
  mapView: {
    flex: 1,
    width: '100%',
    minHeight: 400,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingTop: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6FFE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  infoText: {
    fontSize: 16,
    color: '#4B5563',
    marginBottom: 8,
  },
  infoSubtext: {
    fontSize: 14,
    color: '#6B7280',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  loadingText: {
    color: '#E6FFE8',
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

