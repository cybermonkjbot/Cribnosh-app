import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Id } from '../../packages/convex/_generated/dataModel';
import { CallUI } from '../components/CallUI';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { Colors } from '../constants/Colors';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { useCallMonitoring } from '../hooks/useCallMonitoring';
import { LocationData, LocationService } from '../services/LocationService';
import { callingService } from '../services/callingService';
import { useGetDriverOrderQuery, useUpdateOrderStatusMutation } from '../store/driverApi';
import { logger } from '../utils/Logger';

export default function ActiveOrderScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.id as string;

  // Get driver order data using RTK Query (includes assignment details)
  const { data: orderData, isLoading: isLoadingOrder } = useGetDriverOrderQuery(orderId, { skip: !orderId });
  
  // Extract order and assignment from response
  const order = orderData?.data?.order;
  const assignment = orderData?.data?.assignment;
  
  // Get customer data if order exists
  const customer = order?.customer_id ? { _id: order.customer_id } : null;

  // Get driver data
  const { driver } = useDriverAuth();

  // Mutations - use RTK Query for order status updates
  const [updateOrderStatus, { isLoading: isUpdatingStatus }] = useUpdateOrderStatusMutation();

  // Monitor for incoming calls
  const { activeCall } = useCallMonitoring({
    orderId: order?._id || null,
    userId: driver?.userId ? (driver.userId as Id<"users">) : null,
    onIncomingCall: (callId) => {
      setIsIncomingCall(true);
      setShowCallUI(true);
    },
  });

  // Process call signaling data from Convex
  useEffect(() => {
    if (!activeCall || !callingService.getCallState()?.callId) return;

    const currentState = callingService.getCallState();
    if (!currentState || currentState?.callId !== activeCall._id) return;

    if (activeCall.receiverAnswer && currentState.isCaller && activeCall.status === 'connected') {
      callingService.processReceiverAnswer(activeCall._id, activeCall.receiverAnswer);
    }

    if (activeCall.callerOffer && !currentState.isCaller && activeCall.status === 'ringing') {
      callingService.processCallerOffer(activeCall._id, activeCall.callerOffer);
    }

    if (activeCall.callerIceCandidates && currentState.isCaller) {
      activeCall.callerIceCandidates.forEach((candidate: any) => {
        callingService.processIceCandidate(activeCall._id, candidate, true);
      });
    }

    if (activeCall.receiverIceCandidates && !currentState.isCaller) {
      activeCall.receiverIceCandidates.forEach((candidate: any) => {
        callingService.processIceCandidate(activeCall._id, candidate, false);
      });
    }
  }, [activeCall]);

  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [showCustomerInfo, setShowCustomerInfo] = useState(false);
  
  // Location service instance
  const locationService = LocationService.getInstance();

  useEffect(() => {
    // Get current location using LocationService
    const getCurrentLocation = async () => {
      try {
        const location = await locationService.getCurrentLocation({
          accuracy: Location.Accuracy.High,
          enableHighAccuracy: true,
        });
        
        if (location) {
          setCurrentLocation(location);
          setLocationError(null);
        } else {
          setLocationError('Unable to get current location. Please check your location permissions.');
        }
      } catch (error) {
        logger.error('Error getting location:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
        setLocationError(`Location error: ${errorMessage}`);
      }
    };

    getCurrentLocation();

    // Set up location tracking using LocationService
    const startLocationTracking = async () => {
      try {
        const success = await locationService.startLocationWatching(
          (location: LocationData) => {
            setCurrentLocation(location);
            setLocationError(null);
          },
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 10000, // Update every 10 seconds
            distanceInterval: 10, // Update every 10 meters
          }
        );

        if (!success) {
          setLocationError('Location tracking failed to start');
        }
      } catch (error) {
        logger.error('Error starting location tracking:', error);
        setLocationError('Failed to start location tracking');
      }
    };

    startLocationTracking();

    return () => {
      locationService.stopLocationWatching();
    };
  }, []);

  const handleBack = () => {
    router.back();
  };

  const handleStartNavigation = () => {
    setIsNavigating(true);
    Alert.alert('Navigation Started', 'Opening navigation to customer location...');
  };

  const handleArrived = () => {
    Alert.alert(
      'Mark as Arrived',
      'Have you arrived at the customer location?',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes Arrived',
          onPress: async () => {
            try {
              await updateOrderStatus({
                orderId: order._id,
                newStatus: 'COMPLETED'
              });
              Alert.alert('Arrived!', 'Customer has been notified of your arrival.');
            } catch (error) {
              Alert.alert('Error', 'Failed to update order status. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCompleteDelivery = () => {
    Alert.alert(
      'Complete Delivery',
      'Have you completed the fuel delivery?',
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Complete Delivery',
          onPress: async () => {
            try {
              await updateOrderStatus({
                orderId: order._id,
                newStatus: 'COMPLETED'
              });
              Alert.alert(
                'Delivery Completed!',
                'Great job! Your earnings have been added to your account.',
                [
                {
                  text: 'Back to Dashboard',
                  onPress: () => router.push('/dashboard'),
                },
              ]
            );
            } catch (error) {
              Alert.alert('Error', 'Failed to complete delivery. Please try again.');
            }
          },
        },
      ]
    );
  };

  const [showCallUI, setShowCallUI] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);

  const handleCallCustomer = async () => {
    if (!order || !customer || !driver?._id) {
      Alert.alert('Error', 'Cannot make call. Missing required information.');
      return;
    }

    Alert.alert(
      'Call Customer',
      `Start voice call with ${customer.fullName || customer.email || 'Customer'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: async () => {
            try {
              // Get driver's userId from driver document
              if (!driver?.userId) {
                Alert.alert('Error', 'Unable to get driver user ID.');
                return;
              }

              const result = await callingService.initiateCall(
                order._id,
                driver.userId as Id<"users">,
                order.customerId,
                customer.fullName || customer.email || 'Customer',
                customer?.phone // Pass phone for fallback
              );

              if (result.success) {
                // Don't show CallUI if fallback was used (native dialer opened)
                if (result.usedFallback) {
                  // Native dialer was opened, just show success message
                  Alert.alert(
                    'Calling',
                    'Opening phone dialer...\n\nNote: Using native dialer because WebRTC is not available in Expo Go.',
                    [{ text: 'OK' }]
                  );
                } else {
                  // WebRTC call initiated, show CallUI
                  setIsIncomingCall(false);
                  setShowCallUI(true);
                }
              } else {
                // Display error message to user (includes backend validation for admin calls)
                Alert.alert(
                  'Call Failed',
                  result.error || 'Unable to initiate call. Please try again.',
                  [{ text: 'OK' }]
                );
              }
            } catch (error) {
              logger.error('Error initiating call:', error);
              const errorMessage = error instanceof Error ? error.message : 'Failed to start call';
              
              if (errorMessage.includes('WebRTC not available') || errorMessage.includes('react-native-webrtc')) {
                Alert.alert(
                  'Calling Not Available',
                  'Voice calling requires WebRTC support. Please install react-native-webrtc.\n\nSee WEBRTC_SETUP.md for installation instructions.',
                  [{ text: 'OK' }]
                );
              } else if (errorMessage.includes('permission')) {
                Alert.alert('Permission Required', 'Microphone access is required for voice calls. Please enable it in device settings.');
              } else {
                Alert.alert('Error', errorMessage);
              }
            }
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'EN_ROUTE':
        return Colors.light.primary;
      case 'ARRIVED':
        return Colors.light.accent;
      case 'COMPLETED':
        return Colors.light.accent;
      default:
        return Colors.light.icon;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'EN_ROUTE':
        return 'En Route';
      case 'ARRIVED':
        return 'Arrived';
      case 'COMPLETED':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };

  const getDistance = () => {
    if (!currentLocation || !order) return 'Calculating...';
    
    // Calculate distance between current location and delivery location
    const R = 6371; // Earth's radius in kilometers
    const dLat = (order.deliveryLocation.latitude - currentLocation.latitude) * Math.PI / 180;
    const dLon = (order.deliveryLocation.longitude - currentLocation.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(currentLocation.latitude * Math.PI / 180) * Math.cos(order.deliveryLocation.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    return distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`;
  };

  const getEstimatedTime = () => {
    if (!currentLocation || !order.deliveryLocation) {
      return 'Calculating...';
    }
    
    // Calculate distance using the same logic as getDistance
    const R = 6371; // Earth's radius in kilometers
    const dLat = (order.deliveryLocation.latitude - currentLocation.latitude) * Math.PI / 180;
    const dLon = (order.deliveryLocation.longitude - currentLocation.longitude) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(currentLocation.latitude * Math.PI / 180) * Math.cos(order.deliveryLocation.latitude * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    // Rough estimate: 1km = 2 minutes in city traffic
    const estimatedMinutes = Math.ceil(distance * 2);
    return `${estimatedMinutes} minutes`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content} lightColor={Colors.light.background} darkColor={Colors.dark.background}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle} lightColor={Colors.light.text} darkColor={Colors.dark.text}>Active Order</ThemedText>
          <TouchableOpacity style={styles.callButton} onPress={handleCallCustomer}>
            <Ionicons name="call" size={24} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Order Status */}
          <View style={styles.statusCard}>
            <View style={styles.statusHeader}>
              <View style={[styles.statusIcon, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                <Ionicons 
                  name="car" 
                  size={24} 
                  color={getStatusColor(order.status)} 
                />
              </View>
              <View style={styles.statusInfo}>
                <ThemedText style={styles.statusTitle} lightColor={Colors.light.text} darkColor={Colors.dark.text}>Order #{order._id.slice(-8)}</ThemedText>
                <ThemedText style={[styles.statusValue, { color: getStatusColor(order.status) }]} lightColor={Colors.light.text} darkColor={Colors.dark.text}>
                  {getStatusText(order.status)}
                </ThemedText>
              </View>
            </View>
          </View>

          {/* Customer Information */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle} lightColor={Colors.light.text} darkColor={Colors.dark.text}>Customer Information</ThemedText>
              <TouchableOpacity onPress={() => setShowCustomerInfo(!showCustomerInfo)}>
                <Ionicons 
                  name={showCustomerInfo ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color={Colors.light.icon} 
                />
              </TouchableOpacity>
            </View>
            
            {showCustomerInfo && (
              <View style={styles.customerInfo}>
                <View style={styles.customerDetail}>
                  <Ionicons name="person" size={20} color={Colors.light.icon} />
                  <ThemedText style={styles.customerDetailText} lightColor={Colors.light.text} darkColor={Colors.dark.text}>
                    {customer?.fullName || customer?.email || 'Customer'}
                  </ThemedText>
                </View>
                <View style={styles.customerDetail}>
                  <Ionicons name="call" size={20} color={Colors.light.icon} />
                  <ThemedText style={styles.customerDetailText} lightColor={Colors.light.text} darkColor={Colors.dark.text}>
                    {customer?.phone || 'Phone not available'}
                  </ThemedText>
                </View>
              </View>
            )}
          </View>

          {/* Delivery Information */}
          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionTitle} lightColor={Colors.light.text} darkColor={Colors.dark.text}>Delivery Information</ThemedText>
            <View style={styles.deliveryInfo}>
              <View style={styles.deliveryDetail}>
                <Ionicons name="location" size={20} color={Colors.light.primary} />
                <View style={styles.deliveryText}>
                  <ThemedText style={styles.deliveryLocation} lightColor={Colors.light.text} darkColor={Colors.dark.text}>Delivery Location</ThemedText>
                  <ThemedText style={styles.deliveryAddress} lightColor={Colors.light.text} darkColor={Colors.dark.text}>{order.deliveryLocation.address.formattedAddress}</ThemedText>
                </View>
              </View>
              <View style={styles.deliveryStats}>
                <View style={styles.deliveryStat}>
                  <Ionicons name="car" size={16} color={Colors.light.icon} />
                  <ThemedText style={styles.deliveryStatText} lightColor={Colors.light.text} darkColor={Colors.dark.text}>{getDistance()}</ThemedText>
                </View>
                <View style={styles.deliveryStat}>
                  <Ionicons name="time" size={16} color={Colors.light.icon} />
                  <ThemedText style={styles.deliveryStatText} lightColor={Colors.light.text} darkColor={Colors.dark.text}>{getEstimatedTime()}</ThemedText>
                </View>
              </View>
            </View>
          </View>

          {/* Order Details */}
          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionTitle} lightColor={Colors.light.text} darkColor={Colors.dark.text}>Order Details</ThemedText>
            <View style={styles.orderDetails}>
              <View style={styles.orderDetailRow}>
                <ThemedText style={styles.orderDetailLabel} lightColor={Colors.light.text} darkColor={Colors.dark.text}>Fuel Type</ThemedText>
                <ThemedText style={styles.orderDetailValue} lightColor={Colors.light.text} darkColor={Colors.dark.text}>{order.product}</ThemedText>
              </View>
              <View style={styles.orderDetailRow}>
                <ThemedText style={styles.orderDetailLabel}>Volume</ThemedText>
                <ThemedText style={styles.orderDetailValue}>{order.volume}L</ThemedText>
              </View>
              <View style={styles.orderDetailRow}>
                <ThemedText style={styles.orderDetailLabel}>Total Price</ThemedText>
                <ThemedText style={styles.orderDetailValue}>₦{order.totalPrice.toLocaleString()}</ThemedText>
              </View>
              <View style={[styles.orderDetailRow, styles.orderEarningsRow]}>
                <ThemedText style={styles.orderEarningsLabel}>Your Earnings</ThemedText>
                <ThemedText style={styles.orderEarningsValue}>₦{order.commission.toLocaleString()}</ThemedText>
              </View>
            </View>
          </View>

          {/* Special Instructions - Not available in current schema */}

          {/* Current Location */}
          <View style={styles.sectionCard}>
            <ThemedText style={styles.sectionTitle}>Current Location</ThemedText>
            <View style={styles.locationInfo}>
              {locationError ? (
                <ThemedText style={styles.locationError}>
                  Location Error: {locationError}
                </ThemedText>
              ) : currentLocation ? (
                <>
                  <ThemedText style={styles.locationCoordinates}>
                    {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                  </ThemedText>
                  <ThemedText style={styles.locationUpdate}>
                    Last updated: {new Date(currentLocation.timestamp).toLocaleTimeString()}
                  </ThemedText>
                </>
              ) : (
                <ThemedText style={styles.locationLoading}>
                  Getting location...
                </ThemedText>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {order.status === 'EN_ROUTE' && (
            <>
              <TouchableOpacity style={styles.navigationButton} onPress={handleStartNavigation}>
                <Ionicons name="navigate" size={20} color={Colors.light.background} />
                <ThemedText style={styles.navigationButtonText}>Start Navigation</ThemedText>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.arrivedButton} onPress={handleArrived}>
                <Ionicons name="checkmark-circle" size={20} color={Colors.light.background} />
                <ThemedText style={styles.arrivedButtonText}>Mark as Arrived</ThemedText>
              </TouchableOpacity>
            </>
          )}

          {order.status === 'EN_ROUTE' && (
            <TouchableOpacity style={styles.completeButton} onPress={handleCompleteDelivery}>
              <Ionicons name="checkmark-circle" size={20} color={Colors.light.background} />
              <ThemedText style={styles.completeButtonText}>Complete Delivery</ThemedText>
            </TouchableOpacity>
          )}

          {order.status === 'COMPLETED' && (
            <TouchableOpacity 
              style={styles.dashboardButton} 
              onPress={() => router.push('/dashboard')}
            >
              <Ionicons name="home" size={20} color={Colors.light.background} />
              <ThemedText style={styles.dashboardButtonText}>Back to Dashboard</ThemedText>
            </TouchableOpacity>
          )}
        </View>

        {/* Call UI */}
        <CallUI
          visible={showCallUI}
          isIncoming={isIncomingCall}
          remoteUserName={isIncomingCall ? undefined : customer?.fullName || customer?.email || null}
          callId={callingService.getCallState()?.callId || null}
          onEnd={() => setShowCallUI(false)}
          onDecline={() => {
            setShowCallUI(false);
          }}
          onAnswer={() => {
            setIsIncomingCall(false);
          }}
        />
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  callButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  statusCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  customerInfo: {
    gap: 12,
  },
  customerDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerDetailText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  deliveryInfo: {
    gap: 16,
  },
  deliveryDetail: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  deliveryText: {
    flex: 1,
  },
  deliveryLocation: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  deliveryAddress: {
    fontSize: 14,
    color: Colors.light.icon,
    lineHeight: 20,
  },
  deliveryStats: {
    flexDirection: 'row',
    gap: 24,
  },
  deliveryStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  deliveryStatText: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  orderDetails: {
    gap: 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderDetailLabel: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  orderDetailValue: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  orderEarningsRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.secondary,
    paddingTop: 12,
    marginTop: 8,
  },
  orderEarningsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  orderEarningsValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.accent,
  },
  specialInstructions: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    backgroundColor: Colors.light.secondary,
    padding: 12,
    borderRadius: 8,
  },
  locationInfo: {
    gap: 8,
  },
  locationCoordinates: {
    fontSize: 14,
    fontFamily: 'monospace',
    color: Colors.light.text,
  },
  locationUpdate: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  locationError: {
    fontSize: 14,
    color: Colors.light.error,
    textAlign: 'center',
  },
  locationLoading: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
  },
  actionButtons: {
    gap: 12,
    paddingVertical: 16,
  },
  navigationButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  navigationButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
  },
  arrivedButton: {
    backgroundColor: Colors.light.accent,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  arrivedButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
  },
  completeButton: {
    backgroundColor: Colors.light.accent,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
  },
  dashboardButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  dashboardButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
  },
});
