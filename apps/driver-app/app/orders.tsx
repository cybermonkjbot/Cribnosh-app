import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EmptyState } from '../components/EmptyState';
import { LoadingScreen } from '../components/LoadingScreen';
import { Colors } from '../constants/Colors';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { useGetDriverOrdersQuery } from '../store/driverApi';

export default function DriverOrdersScreen() {
  const router = useRouter();
  const { driver } = useDriverAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const pageSize = 20;

  // Fetch driver orders using RTK Query
  const { data: ordersData, isLoading, refetch } = useGetDriverOrdersQuery(
    { limit: pageSize, offset: page * pageSize },
    { skip: !driver }
  );

  // Extract orders and pagination info
  const driverOrders = ordersData?.data?.orders || [];
  const total = ordersData?.data?.total || 0;
  const hasMoreOrders = (page + 1) * pageSize < total;

  const handleRefresh = async () => {
    setRefreshing(true);
    setPage(0);
    await refetch();
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleLoadMore = () => {
    if (hasMoreOrders && !isLoading) {
      setPage(prev => prev + 1);
    }
  };

  const handleOrderPress = (order: any) => {
    // Use order_id if available, otherwise use _id
    const orderId = order.order_id || order._id;
    router.push(`/order-details?id=${orderId}`);
  };

  const handleBack = () => {
    router.back();
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ASSIGNED':
        return Colors.light.warning;
      case 'ACCEPTED':
        return Colors.light.primary;
      case 'PICKED_UP':
        return Colors.light.primary;
      case 'IN_TRANSIT':
        return Colors.light.primary;
      case 'DELIVERED':
        return Colors.light.accent;
      case 'CANCELLED':
      case 'FAILED':
        return Colors.light.error;
      default:
        return Colors.light.icon;
    }
  };

  const getStatusText = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ASSIGNED':
        return 'Assigned';
      case 'ACCEPTED':
        return 'Accepted';
      case 'PICKED_UP':
        return 'Picked Up';
      case 'IN_TRANSIT':
        return 'In Transit';
      case 'DELIVERED':
        return 'Delivered';
      case 'CANCELLED':
        return 'Cancelled';
      case 'FAILED':
        return 'Failed';
      default:
        return status || 'Unknown';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ASSIGNED':
        return 'time-outline';
      case 'ACCEPTED':
        return 'checkmark-circle-outline';
      case 'PICKED_UP':
        return 'car-outline';
      case 'IN_TRANSIT':
        return 'car-sport-outline';
      case 'DELIVERED':
        return 'checkmark-done-outline';
      case 'CANCELLED':
      case 'FAILED':
        return 'close-circle-outline';
      default:
        return 'help-circle-outline';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  // Show loading screen while data is loading
  if (isLoading && page === 0) {
    return <LoadingScreen message="Loading your orders..." />;
  }

  // Handle case where driver is not authenticated
  if (!driver) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Orders</Text>
            <View style={styles.headerSpacer} />
          </View>
          <EmptyState
            icon="person-outline"
            title="Authentication Required"
            message="Please sign in to view your orders"
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Order History</Text>
            <View style={styles.headerSpacer} />
          </View>

        {/* Orders List */}
        <ScrollView
          style={styles.ordersList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
        >
          {driverOrders.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No Orders Found"
              message="No orders found"
            />
          ) : (
            driverOrders.map((order: any) => {
              const orderId = order.order_id || order._id;
              const assignment = order.assignment;
              const status = assignment?.status || order.order_status || order.status;
              const createdAt = order._creationTime || order.createdAt || Date.now();
              
              return (
                <TouchableOpacity
                  key={orderId}
                  style={styles.orderCard}
                  onPress={() => handleOrderPress(order)}
                >
                  <View style={styles.orderHeader}>
                    <View style={styles.orderInfo}>
                      <Text style={styles.orderId}>
                        Order #{orderId.slice(-8)}
                      </Text>
                      <Text style={styles.orderDate}>
                        {formatDate(createdAt)}
                      </Text>
                    </View>
                    <View style={styles.orderStatus}>
                      <View
                        style={[
                          styles.statusBadge,
                          { backgroundColor: getStatusColor(status) + '20' },
                        ]}
                      >
                        <Ionicons
                          name={getStatusIcon(status)}
                          size={16}
                          color={getStatusColor(status)}
                        />
                        <Text
                          style={[
                            styles.statusText,
                            { color: getStatusColor(status) },
                          ]}
                        >
                          {getStatusText(status)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.orderDetails}>
                    <View style={styles.orderDetailRow}>
                      <Ionicons name="car" size={16} color={Colors.light.icon} />
                      <Text style={styles.orderDetailText}>
                        {order.order_items?.length || 0} items
                      </Text>
                    </View>
                    <View style={styles.orderDetailRow}>
                      <Ionicons name="location" size={16} color={Colors.light.icon} />
                      <Text style={styles.orderDetailText}>
                        {typeof order.delivery_address === 'string' 
                          ? order.delivery_address 
                          : order.delivery_address?.address || 'Location not specified'}
                      </Text>
                    </View>
                    <View style={styles.orderDetailRow}>
                      <Ionicons name="cash" size={16} color={Colors.light.icon} />
                      <Text style={styles.orderDetailText}>
                        {formatCurrency(order.total_amount || 0)} total
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          
          {/* Load More Button */}
          {hasMoreOrders && (
            <TouchableOpacity
              style={styles.loadMoreButton}
              onPress={handleLoadMore}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.loadMoreText}>Loading...</Text>
              ) : (
                <Text style={styles.loadMoreText}>Load More Orders</Text>
              )}
            </TouchableOpacity>
          )}
        </ScrollView>
      </View>
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
  headerSpacer: {
    width: 40,
  },
  ordersList: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  orderStatus: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  orderDetails: {
    gap: 8,
    marginBottom: 12,
  },
  orderDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderDetailText: {
    fontSize: 14,
    color: Colors.light.icon,
    flex: 1,
  },
  orderAction: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.secondary,
    paddingTop: 12,
  },
  actionButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.background,
  },
  loadMoreButton: {
    backgroundColor: Colors.light.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginVertical: 16,
    alignItems: 'center',
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
  },
});
