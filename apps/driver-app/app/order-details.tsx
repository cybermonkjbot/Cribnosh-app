import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Id } from '../../packages/convex/_generated/dataModel';
import { CallUI } from '../components/CallUI';
import { GlassCard } from '../components/GlassCard';
import { ShimmerEffect } from '../components/ShimmerEffect';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { Colors } from '../constants/Colors';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { useCallMonitoring } from '../hooks/useCallMonitoring';
import { useSessionAwareQuery } from '../hooks/useSessionAwareConvex';
import { api } from '../lib/convexApi';
import { driverOrderNotificationService } from '../services/OrderNotificationService';
import { callingService } from '../services/callingService';
import { NavigationService } from '../services/navigationService';
import { useAcceptOrderMutation, useDeclineOrderMutation, useGetDriverOrderQuery } from '../store/driverApi';
import { logger } from '../utils/Logger';

export default function OrderDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const orderId = params.id as string;
  const { driver, user } = useDriverAuth();

  const [isLoading, setIsLoading] = useState(false);
  
  // Fetch order details using RTK Query (includes assignment details)
  const { data: orderData, isLoading: isLoadingOrder } = useGetDriverOrderQuery(orderId, { skip: !orderId });
  const order = orderData?.data?.order;
  const assignment = orderData?.data?.assignment;
  
  // Use RTK Query mutations for accepting/declining orders
  const [acceptOrder, { isLoading: isAccepting }] = useAcceptOrderMutation();
  const [declineOrder, { isLoading: isDeclining }] = useDeclineOrderMutation();

  // Monitor for incoming calls
  const { activeCall } = useCallMonitoring({
    orderId: order?._id ? (order._id as unknown as Id<"orders">) : null,
    userId: user?._id ? (user._id as unknown as Id<"users">) : null,
    onIncomingCall: (callId) => {
      setIsIncomingCall(true);
      setShowCallUI(true);
    },
  });

  // Process call signaling data from Convex
  useEffect(() => {
    if (!activeCall || !callingService.getCallState()?.callId) return;

    const currentState = callingService.getCallState();
    if (!currentState) return;
    if (currentState.callId !== activeCall._id) return;

    if (activeCall.receiverAnswer && currentState!.isCaller && activeCall.status === 'connected') {
      callingService.processReceiverAnswer(activeCall._id, activeCall.receiverAnswer);
    }

    if (activeCall.callerOffer && !currentState!.isCaller && activeCall.status === 'ringing') {
      callingService.processCallerOffer(activeCall._id, activeCall.callerOffer);
    }

    if (activeCall.callerIceCandidates && currentState!.isCaller) {
      activeCall.callerIceCandidates.forEach((candidate: unknown) => {
        const candidateString =
          typeof candidate === 'string'
            ? candidate
            : (candidate as { candidate?: unknown })?.candidate;
        if (typeof candidateString === 'string') {
          callingService.processIceCandidate(activeCall._id, candidateString as string, true);
        }
      });
    }

    if (activeCall.receiverIceCandidates && !currentState!.isCaller) {
      activeCall.receiverIceCandidates.forEach((candidate: unknown) => {
        const candidateString =
          typeof candidate === 'string'
            ? candidate
            : (candidate as { candidate?: unknown })?.candidate;
        if (typeof candidateString === 'string') {
          callingService.processIceCandidate(activeCall._id, candidateString as string, false);
        }
      });
    }
  }, [activeCall]);

  const handleBack = () => {
    router.back();
  };

  const handleAcceptOrder = async () => {
    if (!order || !orderId) {
      Alert.alert('Error', 'Order not found');
      return;
    }

    Alert.alert(
      'Accept Order',
      'Are you sure you want to accept this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Accept order using RTK Query mutation
              const result = await acceptOrder(orderId).unwrap();
              
              if (result.success) {
                // Play success notification
                await driverOrderNotificationService.playOrderAccepted();
                
                // Get delivery location from assignment or order
                const deliveryLocation = assignment?.delivery_location || order.delivery_address;
                
                Alert.alert(
                  'Order Accepted!',
                  'You have successfully accepted this order. Navigate to the delivery location.',
                  [
                    {
                      text: 'Start Navigation',
                      onPress: async () => {
                        if (deliveryLocation) {
                          const location = typeof deliveryLocation === 'string' 
                            ? { address: deliveryLocation }
                            : deliveryLocation;
                          
                          await NavigationService.navigateToCustomer(
                            {
                              latitude: location.latitude || 0,
                              longitude: location.longitude || 0,
                              address: location.address || 'Customer Location',
                            },
                            'Customer Location'
                          );
                        }
                      },
                    },
                    { text: 'OK' },
                  ]
                );
              } else {
                Alert.alert('Error', result.message || 'Failed to accept order. Please try again.');
              }
            } catch (error: any) {
              logger.error('Accept order error:', error);
              const errorMessage = error?.data?.error?.message || error?.message || 'Failed to accept order. Please try again.';
              Alert.alert('Error', errorMessage);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleDeclineOrder = async () => {
    if (!order || !orderId) {
      Alert.alert('Error', 'Order not found');
      return;
    }

    Alert.alert(
      'Decline Order',
      'Are you sure you want to decline this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Decline order using RTK Query mutation
              const result = await declineOrder(orderId).unwrap();
              
              if (result.success) {
                // Play decline notification
                await driverOrderNotificationService.playOrderRejected();
                router.back();
              } else {
                Alert.alert('Error', result.message || 'Failed to decline order. Please try again.');
              }
            } catch (error: any) {
              logger.error('Decline order error:', error);
              const errorMessage = error?.data?.error?.message || error?.message || 'Failed to decline order. Please try again.';
              Alert.alert('Error', errorMessage);
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const [showCallUI, setShowCallUI] = useState(false);
  const [isIncomingCall, setIsIncomingCall] = useState(false);

  // Get customer details for calling
  // TODO: Use API endpoint when available
  const customerId = order?.customer_id || order?.customerId;
  const customerDetails = null; // Placeholder - use API endpoint when available

  const handleCallCustomer = async () => {
    if (!order) return;
    
    if (!customerDetails) {
      Alert.alert('Error', 'Customer information not available.');
      return;
    }

    Alert.alert(
      'Call Customer',
      `Start voice call with ${customerDetails.fullName || customerDetails.email || 'Customer'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Call',
          onPress: async () => {
              // Get driver's userId
              if (!driver?.userId) {
                Alert.alert('Error', 'Unable to get driver user ID.');
                return;
              }

              try {
              const result = await callingService.initiateCall(
                order._id,
                driver.userId as Id<"users">,
                order.customerId,
                customerDetails.fullName || customerDetails.email || 'Customer',
                customerDetails.phone // Pass phone for fallback
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
      case 'PENDING_ACCEPTANCE':
        return Colors.light.warning;
      case 'ACCEPTED':
        return Colors.light.primary;
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
      case 'PENDING_ACCEPTANCE':
        return 'Pending Acceptance';
      case 'ACCEPTED':
        return 'Accepted';
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

  // Show loading state while order is being fetched
  if (isLoadingOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.content}>
          <View style={styles.loadingContainer}>
            <ThemedText>Loading order details...</ThemedText>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  // Show error state if order is null
  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.content}>
          <View style={styles.errorContainer}>
            <ThemedText type="title">Order Not Found</ThemedText>
            <ThemedText>This order could not be found or may have been cancelled.</ThemedText>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <ThemedText>Go Back</ThemedText>
            </TouchableOpacity>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThemedView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.headerTitle}>Order Details</ThemedText>
          <TouchableOpacity style={styles.callButton} onPress={handleCallCustomer}>
            <Ionicons name="call" size={24} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Order Status */}
          <View style={styles.statusCardWrapper}>
            <GlassCard style={styles.statusCard}>
              <View style={styles.statusCardContent}>
                <ShimmerEffect />
            <View style={styles.statusHeader}>
              <View style={[styles.statusIcon, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                <Ionicons 
                  name="car" 
                  size={24} 
                  color={getStatusColor(order.status)} 
                />
              </View>
              <View style={styles.statusInfo}>
                <ThemedText style={styles.statusTitle}>Order #{order.order_id || order._id?.slice(-8) || 'N/A'}</ThemedText>
                <ThemedText style={[styles.statusValue, { color: getStatusColor(assignment?.status || order.order_status || order.status) }]}>
                  {getStatusText(assignment?.status || order.order_status || order.status)}
                </ThemedText>
              </View>
            </View>
            <ThemedText style={styles.orderTime}>Ordered at {new Date(order._creationTime || order.createdAt || Date.now()).toLocaleString()}</ThemedText>
              </View>
            </GlassCard>
          </View>

          {/* Customer Information */}
          <View style={styles.sectionCardWrapper}>
            <GlassCard style={styles.sectionCard}>
              <View style={styles.sectionCardContent}>
                <ShimmerEffect />
            <ThemedText style={styles.sectionTitle}>Customer Information</ThemedText>
            <View style={styles.customerInfo}>
              <View style={styles.customerDetail}>
                <Ionicons name="person" size={20} color={Colors.light.icon} />
                <ThemedText style={styles.customerDetailText}>
                  Customer ID: {(order.customer_id || order.customerId)?.slice(-8) || 'N/A'}
                </ThemedText>
              </View>
              <View style={styles.customerDetail}>
                <Ionicons name="call" size={20} color={Colors.light.icon} />
                <ThemedText style={styles.customerDetailText}>Contact via app                </ThemedText>
              </View>
            </View>
              </View>
            </GlassCard>
          </View>

          {/* Order Details */}
          <View style={styles.sectionCardWrapper}>
            <GlassCard style={styles.sectionCard}>
              <View style={styles.sectionCardContent}>
                <ShimmerEffect />
            <ThemedText style={styles.sectionTitle}>Order Details</ThemedText>
            <View style={styles.orderDetails}>
              {order.order_items && order.order_items.length > 0 ? (
                order.order_items.map((item: any, index: number) => (
                  <View key={index} style={styles.orderDetailRow}>
                    <ThemedText style={styles.orderDetailLabel}>{item.name || item.dish_id || 'Item'}</ThemedText>
                    <ThemedText style={styles.orderDetailValue}>
                      {item.quantity}x £{(item.price || 0).toFixed(2)}
                    </ThemedText>
                  </View>
                ))
              ) : (
                <View style={styles.orderDetailRow}>
                  <ThemedText style={styles.orderDetailLabel}>Items</ThemedText>
                  <ThemedText style={styles.orderDetailValue}>N/A</ThemedText>
                </View>
              )}
              <View style={[styles.orderDetailRow, styles.orderTotalRow]}>
                <ThemedText style={styles.orderTotalLabel}>Total Amount</ThemedText>
                <ThemedText style={styles.orderTotalValue}>£{(order.total_amount || 0).toFixed(2)}</ThemedText>
              </View>
            </View>
              </View>
            </GlassCard>
          </View>

          {/* Delivery Information */}
          <View style={styles.sectionCardWrapper}>
            <GlassCard style={styles.sectionCard}>
              <View style={styles.sectionCardContent}>
                <ShimmerEffect />
            <ThemedText style={styles.sectionTitle}>Delivery Information</ThemedText>
            <View style={styles.deliveryInfo}>
              <View style={styles.deliveryDetail}>
                <Ionicons name="location" size={20} color={Colors.light.primary} />
                <View style={styles.deliveryText}>
                  <ThemedText style={styles.deliveryLocation}>Delivery Location</ThemedText>
                  <ThemedText style={styles.deliveryAddress}>
                    {assignment?.delivery_location?.address 
                      || (typeof order.delivery_address === 'string' 
                        ? order.delivery_address 
                        : order.delivery_address?.address || 'Location not specified')}
                  </ThemedText>
                </View>
              </View>
              <View style={styles.deliveryStats}>
                <View style={styles.deliveryStat}>
                  <Ionicons name="car" size={16} color={Colors.light.icon} />
                  <ThemedText style={styles.deliveryStatText}>Distance: TBD</ThemedText>
                </View>
                <View style={styles.deliveryStat}>
                  <Ionicons name="time" size={16} color={Colors.light.icon} />
                  <ThemedText style={styles.deliveryStatText}>ETA: TBD</ThemedText>
                </View>
              </View>
            </View>
              </View>
            </GlassCard>
          </View>

          {/* Special Instructions */}
          {order.ratingComment && (
            <View style={styles.sectionCardWrapper}>
              <GlassCard style={styles.sectionCard}>
                <View style={styles.sectionCardContent}>
                  <ShimmerEffect />
                  <ThemedText style={styles.sectionTitle}>Comments</ThemedText>
                  <ThemedText style={styles.specialInstructions}>{order.ratingComment}</ThemedText>
                </View>
              </GlassCard>
            </View>
          )}

          {/* Assignment Details */}
          {assignment && (
            <View style={styles.sectionCardWrapper}>
              <GlassCard style={styles.sectionCard}>
                <View style={styles.sectionCardContent}>
                  <ShimmerEffect />
              <ThemedText style={styles.sectionTitle}>Assignment Details</ThemedText>
              <View style={styles.orderDetails}>
                <View style={styles.orderDetailRow}>
                  <ThemedText style={styles.orderDetailLabel}>Status</ThemedText>
                  <ThemedText style={styles.orderDetailValue}>{getStatusText(assignment.status)}</ThemedText>
                </View>
                {assignment.estimated_pickup_time && (
                  <View style={styles.orderDetailRow}>
                    <ThemedText style={styles.orderDetailLabel}>Estimated Pickup</ThemedText>
                    <ThemedText style={styles.orderDetailValue}>
                      {new Date(assignment.estimated_pickup_time).toLocaleString()}
                    </ThemedText>
                  </View>
                )}
                {assignment.estimated_delivery_time && (
                  <View style={styles.orderDetailRow}>
                    <ThemedText style={styles.orderDetailLabel}>Estimated Delivery</ThemedText>
                    <ThemedText style={styles.orderDetailValue}>
                      {new Date(assignment.estimated_delivery_time).toLocaleString()}
                    </ThemedText>
                  </View>
                )}
              </View>
                </View>
              </GlassCard>
            </View>
          )}
        </ScrollView>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.declineButton, (isLoading || isDeclining) && styles.declineButtonDisabled]}
            onPress={handleDeclineOrder}
            disabled={isLoading || isDeclining || !['assigned', 'accepted'].includes(assignment?.status || '')}
          >
            <Ionicons name="close" size={20} color={Colors.light.error} />
            <ThemedText style={styles.declineButtonText}>
              {(isLoading || isDeclining) ? 'Declining...' : 'Decline'}
            </ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.acceptButton, (isLoading || isAccepting) && styles.acceptButtonDisabled]}
            onPress={handleAcceptOrder}
            disabled={isLoading || isAccepting || assignment?.status !== 'assigned'}
          >
            <Ionicons name="checkmark" size={20} color={Colors.light.background} />
            <ThemedText style={styles.acceptButtonText}>
              {(isLoading || isAccepting) ? 'Accepting...' : 'Accept Order'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Call UI */}
        <CallUI
          visible={showCallUI}
          isIncoming={isIncomingCall}
          remoteUserName={isIncomingCall ? undefined : customerDetails?.fullName || customerDetails?.email || null}
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
  statusCardWrapper: {
    marginBottom: 16,
  },
  statusCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  statusCardContent: {
    padding: 20,
    position: 'relative',
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  orderTime: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  sectionCardWrapper: {
    marginBottom: 16,
  },
  sectionCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionCardContent: {
    padding: 20,
    position: 'relative',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
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
  orderTotalRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.secondary,
    paddingTop: 12,
    marginTop: 8,
  },
  orderTotalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  orderTotalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.primary,
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
  specialInstructions: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    backgroundColor: Colors.light.secondary,
    padding: 12,
    borderRadius: 8,
  },
  earningsContainer: {
    alignItems: 'center',
    backgroundColor: Colors.light.accent + '20',
    padding: 16,
    borderRadius: 8,
  },
  earningsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.light.accent,
    marginBottom: 4,
  },
  earningsLabel: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 16,
  },
  declineButton: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 2,
    borderColor: Colors.light.error,
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.error,
  },
  declineButtonDisabled: {
    opacity: 0.6,
  },
  acceptButton: {
    flex: 2,
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButtonDisabled: {
    opacity: 0.6,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
});
