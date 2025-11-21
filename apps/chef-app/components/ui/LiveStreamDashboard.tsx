import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { Image } from 'expo-image';
import { ChevronLeft, Power, ShoppingBag, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiveCommentsView } from './LiveCommentsView';

interface LiveStreamDashboardProps {
  sessionId: Id<'liveSessions'>;
  onClose?: () => void;
  onEndStream?: () => void;
  onFlipCamera?: () => void;
}

export function LiveStreamDashboard({ sessionId, onClose, onEndStream, onFlipCamera }: LiveStreamDashboardProps) {
  const { chef, sessionToken } = useChefAuth();
  const insets = useSafeAreaInsets();
  const [showOrders, setShowOrders] = useState(false);

  // Get live session data
  const liveSession = useQuery(
    api.queries.liveSessions.getById,
    sessionId ? { sessionId } : 'skip'
  ) as any;

  // Get meal data if mealId exists
  const meal = useQuery(
    api.queries.meals.getById,
    liveSession?.mealId ? { mealId: liveSession.mealId } : 'skip'
  ) as any;

  // Get live orders
  const liveOrders = useQuery(
    api.queries.liveSessions.getLiveOrdersForChef,
    chef?._id && sessionToken ? { sessionToken } : 'skip'
  ) as any[] | undefined;

  // Get live comments
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

  const handleEndStream = () => {
    Alert.alert(
      'End Live Stream',
      'Are you sure you want to end this live stream?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Stream',
          style: 'destructive',
          onPress: async () => {
            try {
              await endLiveSession({
                sessionId,
                reason: 'ended_by_chef',
                sessionToken,
              });
              onEndStream?.();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to end stream');
            }
          },
        },
      ]
    );
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
            <Text style={styles.liveTitle}>{chef?.name || 'Live Stream'}</Text>
            <View style={styles.statsRow}>
              <View style={styles.viewersBadge}>
                <Text style={styles.viewersText}>{viewerCount} Viewers</Text>
              </View>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
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

      {/* Orders Overlay - Bottom right */}
      {showOrders && sessionOrders.length > 0 && (
        <View style={styles.ordersOverlay}>
          <View style={styles.ordersHeader}>
            <Text style={styles.ordersTitle}>Live Orders ({sessionOrders.length})</Text>
            <TouchableOpacity onPress={() => setShowOrders(false)}>
              <X size={18} color="#E6FFE8" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.ordersList} showsVerticalScrollIndicator={false}>
            {sessionOrders.map((order: any) => (
              <View key={order._id} style={styles.orderCard}>
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
                {order.deliveryAddress && (
                  <Text style={styles.orderAddress} numberOfLines={1}>
                    {order.deliveryAddress}
                  </Text>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Bottom Controls */}
      <View style={[styles.controls, { bottom: Math.max(insets.bottom, 20) }]}>
        {/* Orders Button */}
        {sessionOrders.length > 0 && !showOrders && (
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
});
