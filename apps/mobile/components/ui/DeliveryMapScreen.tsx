import { EmptyState } from '@/components/ui/EmptyState';
import { Feather } from '@expo/vector-icons';
import { MapPin } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { getSessionToken } from '@/lib/convexClient';
import { api } from '@/convex/_generated/api';
import { useAuthContext } from '@/contexts/AuthContext';
import { useQuery } from 'convex/react';
import { ActivityIndicator, Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MapView } from './MapView';

interface DeliveryMapScreenProps {
  onClose: () => void;
  orderId?: string;
}

// No default locations - require real data from order

export default function DeliveryMapScreen({ onClose, orderId }: DeliveryMapScreenProps) {
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

  // Get delivery person info and location from order data
  const deliveryPerson = (orderData as any)?.delivery_person;
  
  // Get delivery location from order data - require real location
  const deliveryLocation = (deliveryPerson as any)?.location;

  // Get destination from order delivery address
  const deliveryAddress = (orderData as any)?.delivery_address;
  
  // Get destination coordinates from delivery address if available
  const destinationLocation = deliveryAddress?.coordinates 
    ? { latitude: deliveryAddress.coordinates[0], longitude: deliveryAddress.coordinates[1] }
    : null;

  // Get driver name
  const getDriverName = (): string => {
    if (deliveryPerson?.name) return deliveryPerson.name;
    return 'Delivery Driver'; // Default fallback
  };

  // Get estimated arrival time
  const getEstimatedTime = (): string => {
    if ((orderData as any)?.estimated_delivery_time) {
      const deliveryTime = new Date((orderData as any).estimated_delivery_time);
      const now = new Date();
      const diffMinutes = Math.ceil((deliveryTime.getTime() - now.getTime()) / (1000 * 60));
      
      if (diffMinutes <= 0) {
        return 'Arriving now';
      } else if (diffMinutes < 60) {
        return `Arriving in ${diffMinutes} minutes`;
      } else {
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        return `Arriving in ${hours}h ${minutes}m`;
      }
    }
    return '15 - 45 minutes'; // Default fallback
  };

  // Check if we have required location data
  const hasLocationData = deliveryLocation && destinationLocation;
  
  // Prepare chefs array for MapView (only if locations are available)
  const mapMarkers = hasLocationData ? [
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
  ] : [];

  // Calculate center point for map (only if locations are available)
  const centerLat = hasLocationData 
    ? (deliveryLocation.latitude + destinationLocation.latitude) / 2 
    : null;
  const centerLng = hasLocationData 
    ? (deliveryLocation.longitude + destinationLocation.longitude) / 2 
    : null;
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
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E6FFE8" />
          <Text style={styles.loadingText}>Loading delivery status...</Text>
        </View>
      ) : hasError || !orderId ? (
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
      ) : !hasLocationData ? (
        <View style={styles.emptyStateContainer}>
          <EmptyState
            title="Location data unavailable"
            subtitle="Delivery location information is not available for this order yet."
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
              initialRegion={centerLat && centerLng ? {
                latitude: centerLat,
                longitude: centerLng,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
              } : undefined}
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

