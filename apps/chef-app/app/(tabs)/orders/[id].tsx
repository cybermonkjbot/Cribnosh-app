import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { useToast } from '@/lib/ToastContext';
import { useMutation, useQuery } from 'convex/react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Clock, MapPin, User } from 'lucide-react-native';
import { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'on_the_way' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled' | 'refunded';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'confirmed', label: 'Confirm Order' },
  { value: 'preparing', label: 'Start Preparing' },
  { value: 'ready', label: 'Mark as Ready' },
  { value: 'out_for_delivery', label: 'Out for Delivery' },
  { value: 'delivered', label: 'Mark as Delivered' },
];

export default function OrderDetailScreen() {
  const { chef, sessionToken } = useChefAuth();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const { showSuccess, showError } = useToast();

  const orderId = params.id;

  const order = useQuery(
    api.queries.orders.getById,
    orderId && sessionToken
      ? { order_id: orderId, sessionToken }
      : 'skip'
  ) as any;

  const updateStatus = useMutation(api.mutations.orders.updateStatus);
  const [isUpdating, setIsUpdating] = useState(false);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    if (!order || !order.order_id) return;

    Alert.alert(
      'Update Order Status',
      `Are you sure you want to mark this order as "${newStatus.replace('_', ' ')}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setIsUpdating(true);
            try {
              await updateStatus({
                order_id: order.order_id || order._id.toString(),
                status: newStatus,
              });
              showSuccess('Status Updated', `Order status updated to ${newStatus.replace('_', ' ')}`);
            } catch (error: any) {
              showError('Error', error.message || 'Failed to update order status');
            } finally {
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  };

  const getNextStatus = (currentStatus: OrderStatus): OrderStatus | null => {
    const statusFlow: Record<OrderStatus, OrderStatus | null> = {
      pending: 'confirmed',
      confirmed: 'preparing',
      preparing: 'ready',
      ready: 'out_for_delivery',
      on_the_way: 'delivered',
      out_for_delivery: 'delivered',
      delivered: 'completed',
      completed: null,
      cancelled: null,
      refunded: null,
    };
    return statusFlow[currentStatus] || null;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatAmount = (amount: number) => {
    return `£${(amount / 100).toFixed(2)}`;
  };

  if (!order) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Loading order details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentStatus = order.order_status as OrderStatus;
  const nextStatus = getNextStatus(currentStatus);
  const canUpdate = nextStatus !== null && !isUpdating;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.title}>Order Details</Text>
        </View>

        {/* Order Info Card */}
        <Card style={styles.card}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={styles.orderNumber}>
                Order #{order.order_id || order.orderNumber || order._id.slice(-8)}
              </Text>
              <Text style={styles.orderDate}>{formatDate(order.createdAt || Date.now())}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: '#E3F2FD' }]}>
              <Text style={[styles.statusText, { color: '#1976D2' }]}>
                {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1).replace('_', ' ')}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Payment Status:</Text>
            <Text style={[styles.infoValue, { color: order.payment_status === 'paid' ? '#4CAF50' : '#FF9800' }]}>
              {order.payment_status === 'paid' ? 'Paid' : 'Pending'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Total Amount:</Text>
            <Text style={styles.infoValue}>{formatAmount(order.total_amount || 0)}</Text>
          </View>
        </Card>

        {/* Customer Info */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Customer Information</Text>
          <View style={styles.infoRow}>
            <User size={16} color="#666" />
            <Text style={styles.infoValue}>Customer ID: {order.customer_id?.slice(-8) || 'N/A'}</Text>
          </View>
          {order.delivery_address && (
            <View style={styles.infoRow}>
              <MapPin size={16} color="#666" />
              <Text style={styles.infoValue}>{order.delivery_address}</Text>
            </View>
          )}
        </Card>

        {/* Order Items */}
        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Order Items</Text>
          {order.order_items && order.order_items.length > 0 ? (
            order.order_items.map((item: any, index: number) => (
              <View key={index} style={styles.orderItem}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name || item.meal_name || 'Item'}</Text>
                  {item.quantity && (
                    <Text style={styles.itemQuantity}>Qty: {item.quantity}</Text>
                  )}
                </View>
                {item.price && (
                  <Text style={styles.itemPrice}>{formatAmount(item.price)}</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.emptyText}>No items found</Text>
          )}
        </Card>

        {/* Special Instructions */}
        {order.special_instructions && (
          <Card style={styles.card}>
            <Text style={styles.sectionTitle}>Special Instructions</Text>
            <Text style={styles.instructionsText}>{order.special_instructions}</Text>
          </Card>
        )}

        {/* Delivery Time */}
        {order.delivery_time && (
          <Card style={styles.card}>
            <View style={styles.infoRow}>
              <Clock size={16} color="#666" />
              <View style={styles.deliveryTimeInfo}>
                <Text style={styles.infoLabel}>Delivery Time:</Text>
                <Text style={styles.infoValue}>{formatDate(order.delivery_time)}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Status Update Button */}
        {canUpdate && (
          <Card style={styles.card}>
            <Button
              onPress={() => nextStatus && handleStatusUpdate(nextStatus)}
              disabled={isUpdating}
              loading={isUpdating}
            >
              {nextStatus === 'confirmed' && 'Confirm Order'}
              {nextStatus === 'preparing' && 'Start Preparing'}
              {nextStatus === 'ready' && 'Mark as Ready'}
              {nextStatus === 'out_for_delivery' && 'Mark as Out for Delivery'}
              {nextStatus === 'delivered' && 'Mark as Delivered'}
              {nextStatus === 'completed' && 'Complete Order'}
            </Button>
          </Card>
        )}

        {/* Completed/Cancelled Message */}
        {(currentStatus === 'completed' || currentStatus === 'cancelled' || currentStatus === 'refunded') && (
          <Card style={styles.card}>
            <Text style={styles.completedText}>
              This order has been {currentStatus}.
            </Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
    marginRight: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  card: {
    marginBottom: 16,
    padding: 20,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#e0e0e0',
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#000',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    flex: 1,
  },
  orderItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 4,
  },
  itemQuantity: {
    fontSize: 14,
    color: '#666',
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  instructionsText: {
    fontSize: 14,
    color: '#000',
    lineHeight: 20,
  },
  deliveryTimeInfo: {
    flex: 1,
  },
  completedText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

