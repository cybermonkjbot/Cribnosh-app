import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { useFamilyProfile } from '@/hooks/useFamilyProfile';
import { formatOrderDate } from '@/utils/dateFormat';
import { Package } from 'lucide-react-native';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface FamilyOrdersSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onSelectOrder?: (orderId: string) => void;
}

export function FamilyOrdersSheet({
  isVisible,
  onClose,
  onSelectOrder,
}: FamilyOrdersSheetProps) {
  const { getFamilyOrders } = useFamilyProfile();
  const [ordersData, setOrdersData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isVisible) {
      loadOrders();
    }
  }, [isVisible]);

  const loadOrders = async () => {
    try {
      setIsLoading(true);
      const result = await getFamilyOrders({ limit: 50 });
      if (result.success) {
        setOrdersData({ success: true, data: result.orders });
      }
    } catch (error) {
      // Error already handled in hook
    } finally {
      setIsLoading(false);
    }
  };

  const orders = ordersData?.data || [];

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleOrderPress = useCallback((orderId: string) => {
    if (onSelectOrder) {
      onSelectOrder(orderId);
      onClose();
    }
  }, [onSelectOrder, onClose]);

  const formatOrderStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      on_the_way: 'On the way',
      'on-the-way': 'On the way',
      cancelled: 'Cancelled',
      completed: 'Completed',
    };
    return statusMap[status] || status;
  };

  const formatPrice = (amount: number | undefined): string => {
    if (!amount) return '£0.00';
    // If amount is in cents, convert to pounds
    const pounds = amount > 1000 ? amount / 100 : amount;
    return `£${pounds.toFixed(2)}`;
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Family Orders</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <SvgXml xml={closeIconSVG} width={24} height={24} />
            </TouchableOpacity>
          </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#094327" />
            <Text style={styles.loadingText}>Loading orders...</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Package size={64} color="#9CA3AF" strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyTitle}>No orders found</Text>
            <Text style={styles.emptySubtitle}>
              No orders have been placed by family members yet.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
            {orders.map((order: any, index: number) => {
              const orderId = order._id || order.id || order.order_id || `order-${index}`;
              const timestamp = order.createdAt || order.created_at || Date.now();
              const formattedDate = formatOrderDate(timestamp);
              const totalAmount = order.total_amount || order.total || 0;
              const status = order.status || 'pending';
              const memberName = order.member_name || order.user_name || 'Family Member';

              return (
                <TouchableOpacity
                  key={orderId}
                  style={styles.orderItem}
                  onPress={() => handleOrderPress(orderId)}
                  activeOpacity={0.7}
                >
                  <View style={styles.orderLeft}>
                    <View style={styles.packageIconContainer}>
                      <Package size={20} color="#094327" />
                    </View>
                    <View style={styles.orderContent}>
                      <Text style={styles.orderNumber} numberOfLines={1}>
                        Order #{order.order_id || order._id?.slice(-8) || 'N/A'}
                      </Text>
                      <Text style={styles.orderMember} numberOfLines={1}>
                        {memberName}
                      </Text>
                      <Text style={styles.orderDate}>{formattedDate}</Text>
                    </View>
                  </View>
                  <View style={styles.orderRight}>
                    <Text style={styles.orderAmount}>{formatPrice(totalAmount)}</Text>
                    <View style={[
                      styles.statusBadge,
                      status === 'completed' && styles.statusBadgeDelivered,
                      status === 'cancelled' && styles.statusBadgeCancelled,
                      (status === 'pending' || status === 'confirmed' || status === 'preparing' || status === 'on-the-way' || status === 'on_the_way') && styles.statusBadgeActive,
                    ]}>
                      <Text style={styles.statusText}>{formatOrderStatus(status)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
  },
  closeButton: {
    padding: 8,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#6B7280',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontFamily: 'Archivo',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 28,
    color: '#111827',
    marginTop: 24,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  orderItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  orderLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  packageIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderContent: {
    flex: 1,
  },
  orderNumber: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    marginBottom: 4,
  },
  orderMember: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 4,
  },
  orderDate: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    color: '#9CA3AF',
  },
  orderRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 12,
  },
  orderAmount: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  statusBadgeDelivered: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeCancelled: {
    backgroundColor: '#FEE2E2',
  },
  statusBadgeActive: {
    backgroundColor: '#DBEAFE',
  },
  statusText: {
    fontFamily: 'Inter',
    fontSize: 10,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
  },
});

