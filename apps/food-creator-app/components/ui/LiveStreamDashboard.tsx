import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useToast } from '@/lib/ToastContext';
import { useMutation, useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { CheckCircle, ChevronLeft, Power, ShoppingBag, X, XCircle } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiveCommentsView } from './LiveCommentsView';

interface LiveStreamDashboardProps {
  sessionId: Id<'liveSessions'>;
  onClose?: () => void;
  onEndStream?: () => void;
  onFlipCamera?: () => void;
}

export function LiveStreamDashboard({ sessionId, onClose, onEndStream, onFlipCamera }: LiveStreamDashboardProps) {
  const { foodCreator, sessionToken } = useFoodCreatorAuth();
  const insets = useSafeAreaInsets();
  const { showSuccess, showError } = useToast();
  const [showOrders, setShowOrders] = useState(false);
  const updateOrderStatus = useMutation(api.mutations.orders.updateStatus);

  // Get live session data
  // @ts-ignore - Type instantiation is excessively deep (Convex type system limitation)
  const liveSession = useQuery(
    api.queries.liveSessions.getById,
    sessionId ? { sessionId } : 'skip'
  ) as any;

  // Get meal data if mealId exists
  // @ts-ignore - Type instantiation is excessively deep (Convex type system limitation)
  const meal = useQuery(
    api.queries.meals.getById,
    liveSession?.mealId ? { mealId: liveSession.mealId } : 'skip'
  ) as any;

  // Get live orders
  // @ts-ignore - Type instantiation is excessively deep (Convex type system limitation)
  const liveOrders = useQuery(
    api.queries.liveSessions.getLiveOrdersForFood Creator,
    foodCreator?._id && sessionToken ? { sessionToken } : 'skip'
  ) as any[] | undefined;

  // Get live comments
  // @ts-ignore - Type instantiation is excessively deep (Convex type system limitation)
  const liveComments = useQuery(
    api.queries.liveSessions.getLiveComments,
    sessionId ? { sessionId, limit: 50 } : 'skip'
  ) as any[] | undefined;

  // Filter orders for this session
  const sessionOrders = React.useMemo(() => {
    if (!liveOrders || !liveSession) return [];
    return liveOrders.filter((order: any) => 
      order.channelName === liveSession.session_id || 
      order.sessionId === sessionId
    );
  }, [liveOrders, liveSession, sessionId]);

  // Track pending orders count for notifications
  const pendingOrdersCount = React.useMemo(() => {
    return sessionOrders.filter((order: any) => order.status === 'pending').length;
  }, [sessionOrders]);

  // Show notification when new pending orders arrive
  const [lastPendingCount, setLastPendingCount] = useState(0);
  useEffect(() => {
    if (pendingOrdersCount > lastPendingCount && lastPendingCount > 0) {
      const newOrders = pendingOrdersCount - lastPendingCount;
      showSuccess('New Order', `${newOrders} new order${newOrders > 1 ? 's' : ''} received!`);
    }
    setLastPendingCount(pendingOrdersCount);
  }, [pendingOrdersCount, lastPendingCount]);

  // Transform comments to display format
  const displayComments = React.useMemo(() => {
    if (!liveComments) return [];
    return liveComments.map((comment: any) => ({
      name: comment.user_display_name || 'Viewer',
      comment: comment.content || '',
    }));
  }, [liveComments]);

  const endLiveSession = useMutation(api.mutations.liveSessions.endLiveSession);

  // Poll for comments and orders
  useEffect(() => {
    // Comments and orders are reactive via Convex queries, no need for polling
  }, []);

  const handleAcceptOrder = async (order: any) => {
    if (!order._id && !order.order_id) {
      showError('Error', 'Order ID not available');
      return;
    }

    Alert.alert(
      'Accept Order',
      `Accept order from ${order.user?.name || 'Customer'} for £${((order.totalAmount || 0) / 100).toFixed(2)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await updateOrderStatus({
                order_id: order._id || order.order_id,
                status: 'confirmed',
              });
              showSuccess('Order Accepted', 'Order has been accepted successfully');
            } catch (error: any) {
              showError('Error', error.message || 'Failed to accept order');
            }
          },
        },
      ]
    );
  };

  const handleRejectOrder = async (order: any) => {
    if (!order._id && !order.order_id) {
      showError('Error', 'Order ID not available');
      return;
    }

    Alert.alert(
      'Reject Order',
      `Reject order from ${order.user?.name || 'Customer'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await updateOrderStatus({
                order_id: order._id || order.order_id,
                status: 'cancelled',
              });
              showSuccess('Order Rejected', 'Order has been rejected');
            } catch (error: any) {
              showError('Error', error.message || 'Failed to reject order');
            }
          },
        },
      ]
    );
  };

  const [showEndStreamModal, setShowEndStreamModal] = useState(false);
  const [saveAsVideo, setSaveAsVideo] = useState(false);

  const handleEndStream = () => {
    setShowEndStreamModal(true);
  };

  const confirmEndStream = async () => {
    try {
      await endLiveSession({
        sessionId,
        reason: 'ended_by_food creator',
        sessionToken,
        saveAsVideo,
      });
      
      // Show analytics summary before closing
      const analytics = {
        duration: streamDuration,
        peakViewers: liveSession.sessionStats?.peakViewers || viewerCount,
        totalViewers: liveSession.sessionStats?.totalViewers || viewerCount,
        totalComments: commentCount,
        totalOrders: totalOrders,
        confirmedOrders: confirmedOrders,
      };
      
      Alert.alert(
        'Stream Ended',
        `Stream Duration: ${analytics.duration}\nPeak Viewers: ${analytics.peakViewers}\nTotal Comments: ${analytics.totalComments}\nTotal Orders: ${analytics.totalOrders}${saveAsVideo ? '\n\nStream saved as video post!' : ''}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowEndStreamModal(false);
              onEndStream?.();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to end stream');
      setShowEndStreamModal(false);
    }
  };

  const formatDuration = (startTime: number) => {
    const duration = Date.now() - startTime;
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((duration % (1000 * 60)) / 1000);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!liveSession) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color="#E6FFE8" />
      </View>
    );
  }

  const viewerCount = liveSession.viewerCount || liveSession.currentViewers || 0;
  const commentCount = liveSession.totalComments || 0;
  const startTime = liveSession.actual_start_time || liveSession.scheduled_start_time || Date.now();
  const streamDuration = formatDuration(startTime);
  const totalOrders = sessionOrders.length;
  const confirmedOrders = sessionOrders.filter((o: any) => o.status === 'confirmed' || o.status === 'preparing' || o.status === 'ready').length;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Header - Similar to viewer screen */}
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 50) }]}>
        <TouchableOpacity onPress={onClose} style={styles.backButton}>
          <ChevronLeft color="#E6FFE8" size={24} />
        </TouchableOpacity>
        
        {/* Live Info Header */}
        <View style={styles.liveInfoContainer}>
          <View style={styles.liveHeaderContent}>
            <Text style={styles.liveTitle}>{foodCreator?.name || 'Live Stream'}</Text>
            <View style={styles.statsRow}>
              <View style={styles.viewersBadge}>
                <Text style={styles.viewersText}>{viewerCount} Viewers</Text>
              </View>
              {totalOrders > 0 && (
                <View style={styles.ordersBadgeHeader}>
                  <Text style={styles.ordersBadgeHeaderText}>{totalOrders} Orders</Text>
                </View>
              )}
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            </View>
            <View style={styles.statsRowSecondary}>
              <Text style={styles.streamDurationText}>{streamDuration}</Text>
              {commentCount > 0 && (
                <Text style={styles.commentsCountText}>{commentCount} comments</Text>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Live Comments - Positioned like TikTok on the right */}
      {displayComments.length > 0 && (
        <View style={styles.commentsContainer}>
          <LiveCommentsView comments={displayComments} />
        </View>
      )}

      {/* Orders Overlay - Bottom right - Auto-show if there are pending orders */}
      {(showOrders || (pendingOrdersCount > 0 && !showOrders)) && sessionOrders.length > 0 && (
        <View style={styles.ordersOverlay}>
          <View style={styles.ordersHeader}>
            <Text style={styles.ordersTitle}>Live Orders ({sessionOrders.length})</Text>
            <TouchableOpacity onPress={() => setShowOrders(false)}>
              <X size={18} color="#E6FFE8" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.ordersList} showsVerticalScrollIndicator={false}>
            {sessionOrders.map((order: any) => {
              const isPending = order.status === 'pending';
              return (
                <View key={order._id || order.order_id} style={styles.orderCard}>
                  <View style={styles.orderHeader}>
                    <Text style={styles.orderUser}>
                      {order.user?.name || 'Customer'}
                    </Text>
                    <View style={[
                      styles.orderStatusBadge,
                      { backgroundColor: getOrderStatusColor(order.status) + '40' }
                    ]}>
                      <Text style={[
                        styles.orderStatusText,
                        { color: getOrderStatusColor(order.status) }
                      ]}>
                        {order.status}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.orderAmount}>
                    £{((order.totalAmount || 0) / 100).toFixed(2)}
                  </Text>
                  {order.items && order.items.length > 0 && (
                    <Text style={styles.orderItems} numberOfLines={2}>
                      {order.items.slice(0, 2).map((item: any) => item.name || item.dish_name).join(', ')}
                      {order.items.length > 2 && ` +${order.items.length - 2} more`}
                    </Text>
                  )}
                  {order.deliveryAddress && (
                    <Text style={styles.orderAddress} numberOfLines={1}>
                      {order.deliveryAddress}
                    </Text>
                  )}
                  {isPending && (
                    <View style={styles.orderActions}>
                      <TouchableOpacity
                        style={[styles.orderActionButton, styles.acceptButton]}
                        onPress={() => handleAcceptOrder(order)}
                        activeOpacity={0.7}
                      >
                        <CheckCircle size={16} color="#FFFFFF" />
                        <Text style={styles.orderActionText}>Accept</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.orderActionButton, styles.rejectButton]}
                        onPress={() => handleRejectOrder(order)}
                        activeOpacity={0.7}
                      >
                        <XCircle size={16} color="#FFFFFF" />
                        <Text style={styles.orderActionText}>Reject</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={[styles.controls, { bottom: Math.max(insets.bottom, 20) }]}>
        {/* Orders Button - Show if orders overlay is closed */}
        {sessionOrders.length > 0 && !showOrders && pendingOrdersCount === 0 && (
          <TouchableOpacity
            style={styles.ordersButton}
            onPress={() => setShowOrders(true)}
          >
            <ShoppingBag size={20} color="#E6FFE8" />
            <View style={styles.ordersBadge}>
              <Text style={styles.ordersBadgeText}>{sessionOrders.length}</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Meal Details */}
        {meal && (
          <View style={styles.mealDetails}>
            {meal.images && meal.images.length > 0 && (
              <Image
                source={{ uri: meal.images[0] }}
                style={styles.mealImage}
                contentFit="cover"
              />
            )}
            <View style={styles.mealInfo}>
              <Text style={styles.mealName} numberOfLines={1}>
                {meal.name || 'Meal'}
              </Text>
              <Text style={styles.mealPrice}>
                £{meal.price?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        )}

        {/* End Stream Button */}
        <TouchableOpacity
          style={styles.endButton}
          onPress={handleEndStream}
        >
          <Power size={20} color="#FFFFFF" />
          <Text style={styles.endButtonText}>End</Text>
        </TouchableOpacity>
      </View>

      {/* End Stream Confirmation Modal */}
      <Modal
        visible={showEndStreamModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowEndStreamModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>End Live Stream</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to end this live stream?
            </Text>
            
            {/* Save as Video Option */}
            <View style={styles.saveVideoOption}>
              <View style={styles.saveVideoOptionContent}>
                <Text style={styles.saveVideoLabel}>Save as Video Post</Text>
                <Text style={styles.saveVideoHint}>
                  Save this stream as a video post that viewers can watch later
                </Text>
              </View>
              <Switch
                value={saveAsVideo}
                onValueChange={setSaveAsVideo}
                trackColor={{ false: '#E5E7EB', true: '#094327' }}
                thumbColor={saveAsVideo ? '#FFFFFF' : '#FFFFFF'}
              />
            </View>

            {/* Stream Stats Preview */}
            <View style={styles.statsPreview}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Duration</Text>
                <Text style={styles.statValue}>{streamDuration}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Peak Viewers</Text>
                <Text style={styles.statValue}>{liveSession.sessionStats?.peakViewers || viewerCount}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Total Orders</Text>
                <Text style={styles.statValue}>{totalOrders}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Comments</Text>
                <Text style={styles.statValue}>{commentCount}</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => {
                  setShowEndStreamModal(false);
                  setSaveAsVideo(false);
                }}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonEnd]}
                onPress={confirmEndStream}
              >
                <Text style={styles.modalButtonEndText}>End Stream</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function getOrderStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return '#FF9800';
    case 'confirmed':
      return '#2196F3';
    case 'preparing':
      return '#9C27B0';
    case 'ready':
      return '#4CAF50';
    case 'delivered':
      return '#4CAF50';
    case 'cancelled':
      return '#F44336';
    default:
      return '#9E9E9E';
  }
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContainer: {
    paddingHorizontal: 10,
    paddingBottom: 16,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveInfoContainer: {
    flex: 1,
    marginLeft: 16,
  },
  liveHeaderContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
  },
  liveTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 24,
    color: '#E6FFE8',
    marginTop: 4,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  viewersBadge: {
    backgroundColor: '#9CA3AF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 2,
  },
  viewersText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 15,
    lineHeight: 18,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  liveText: {
    color: '#E6FFE8',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  commentsContainer: {
    position: 'absolute',
    right: 16,
    left: 16,
    bottom: 250,
    zIndex: 500,
    maxHeight: 200,
    width: '60%',
    alignSelf: 'flex-end',
  },
  ordersOverlay: {
    position: 'absolute',
    bottom: 200,
    right: 20,
    width: 280,
    maxHeight: 400,
    backgroundColor: 'rgba(2, 18, 10, 0.95)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
    zIndex: 600,
  },
  ordersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  ordersTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E6FFE8',
    fontFamily: 'Inter',
  },
  ordersList: {
    maxHeight: 320,
  },
  orderCard: {
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
  },
  orderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  orderUser: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E6FFE8',
    fontFamily: 'Inter',
    flex: 1,
  },
  orderStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  orderStatusText: {
    fontSize: 10,
    fontWeight: '600',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
  },
  orderAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  orderAddress: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter',
    marginTop: 4,
  },
  orderItems: {
    fontSize: 12,
    color: '#E6FFE8',
    fontFamily: 'Inter',
    marginTop: 4,
    marginBottom: 4,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  orderActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  acceptButton: {
    backgroundColor: '#10B981',
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  orderActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  controls: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    zIndex: 700,
  },
  ordersButton: {
    backgroundColor: 'rgba(2, 18, 10, 0.8)',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
  },
  ordersBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  ordersBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  mealDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 18, 10, 0.8)',
    borderRadius: 16,
    padding: 8,
    marginRight: 12,
    maxWidth: 200,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
  },
  mealImage: {
    width: 48,
    height: 48,
    borderRadius: 12,
    marginRight: 8,
  },
  mealInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  mealName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E6FFE8',
    fontFamily: 'Inter',
    marginBottom: 2,
  },
  mealPrice: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(230, 255, 232, 0.8)',
    fontFamily: 'Inter',
  },
  endButton: {
    backgroundColor: '#EF4444',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  endButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
    marginLeft: 16,
  },
  flipIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E6FFE8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  flipIconInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E6FFE8',
  },
  statsRowSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  streamDurationText: {
    fontSize: 12,
    color: 'rgba(230, 255, 232, 0.7)',
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  commentsCountText: {
    fontSize: 12,
    color: 'rgba(230, 255, 232, 0.7)',
    fontFamily: 'Inter',
    fontWeight: '400',
  },
  ordersBadgeHeader: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  ordersBadgeHeaderText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'Inter',
    marginBottom: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginBottom: 20,
    lineHeight: 22,
  },
  saveVideoOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  saveVideoOptionContent: {
    flex: 1,
    marginRight: 12,
  },
  saveVideoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  saveVideoHint: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
    lineHeight: 16,
  },
  statsPreview: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#094327',
    fontFamily: 'Inter',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  modalButtonCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    fontFamily: 'Inter',
  },
  modalButtonEnd: {
    backgroundColor: '#EF4444',
  },
  modalButtonEndText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
});
