import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/convexApi';
import { LoadingScreen } from '../components/LoadingScreen';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { useSessionAwareQuery } from '../hooks/useSessionAwareConvex';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, Pressable, Image } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { driverNotificationService } from '../services/notificationService';
import { logger } from '../utils/Logger';
import type { Order } from '../types/driver';

export default function DriverDashboardScreen() {
  const router = useRouter();
  const { driver, user, isLoading: authLoading, isAuthenticated, sessionToken } = useDriverAuth();
  const [refreshing, setRefreshing] = useState(false);
  const [driverStatus, setDriverStatus] = useState<'online' | 'offline'>('offline');
  const driverRef = useRef(driver);
  const insets = useSafeAreaInsets();

  // Update ref when driver changes
  useEffect(() => {
    driverRef.current = driver;
  }, [driver]);

  useEffect(() => {
    // Initialize notifications
    const initializeNotifications = async () => {
      await driverNotificationService.initialize();
    };
    initializeNotifications();
  }, []);

  // Redirect to login if driver is not authenticated (and auth is done loading)
  // Give extra time if there's a session token (driver might still be loading)
  useEffect(() => {
    if (!authLoading) {
      // If we have a session token and user, but no driver yet, give time for driver to load
      // This handles the race condition where currentUser resolves before getDriverByUserId
      if (sessionToken && user && !driver) {
        // Wait a bit more for driver to load
        const timer = setTimeout(() => {
          // Check current driver state using ref
          if (!driverRef.current) {
            logger.warn('Session token exists but driver not loaded after wait, redirecting to auth-entry');
            router.replace('/auth-entry');
          }
        }, 3000); // Give 3 seconds for driver to load
        return () => clearTimeout(timer);
      } else if (!sessionToken && !user && !isAuthenticated) {
        // No session token and not authenticated, redirect immediately
        router.replace('/auth-entry');
      }
    }
  }, [authLoading, driver, user, isAuthenticated, sessionToken, router]);

  // Fetch available orders from shared Convex backend
  const availableOrdersData = useSessionAwareQuery(api.drivers.getAvailableOrders);
  
  const handleRefresh = async () => {
    setRefreshing(true);
    // Convex automatically refetches data when useQuery is called
    setTimeout(() => setRefreshing(false), 1000);
  };

  const toggleDriverStatus = () => {
    setDriverStatus(prev => prev === 'online' ? 'offline' : 'online');
  };

  
  // Show skeleton while data is loading or driver is not authenticated
  // Show skeleton if:
  // 1. Auth is still loading, OR
  // 2. Driver exists but queries haven't loaded yet (they're undefined while loading)
  if (authLoading || (driver && availableOrdersData === undefined)) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={{ flex: 1 }}>
          <View style={{ padding: 20, gap: 16 }}>
            <View style={{ gap: 12 }}>
              <SkeletonOrderCard />
              <SkeletonOrderCard />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Show loading screen while redirecting to login
  if (!authLoading && !driver) {
    return <LoadingScreen message="Redirecting to login..." />;
  }

  const handleOrderPress = (orderId: string) => {
    router.push(`/active-order?id=${orderId}`);
  };

  const handleViewOrders = () => {
    router.push('/orders?filter=completed');
  };

  const handleProfile = () => {
    router.push('/profile');
  };


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>Welcome back, Driver!</Text>
          </View>
          <TouchableOpacity style={styles.profileButton} onPress={handleProfile}>
            <Ionicons name="person-circle" size={32} color={Colors.light.primary} />
          </TouchableOpacity>
        </View>

        {/* Driver Status Button - Full Width */}
        <Pressable 
          style={[
            styles.statusButton, 
            { backgroundColor: driverStatus === 'online' ? Colors.light.error : Colors.light.accent }
          ]}
            onPress={toggleDriverStatus}
          >
          <View style={styles.statusButtonContent}>
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={Colors.light.background} 
              style={styles.statusButtonIconLeft}
            />
            <Ionicons 
              name="chevron-forward" 
              size={20} 
              color={Colors.light.background} 
              style={styles.statusButtonIconLeft}
            />
            <Text style={styles.statusButtonText}>
              {driverStatus === 'online' ? 'Go Offline' : 'Go Online'}
            </Text>
          </View>
        </Pressable>

        {/* Available Orders */}
        <View style={styles.ordersSection}>
          <View style={styles.ordersHeader}>
            <Text style={styles.ordersTitle}>Available Orders</Text>
            <TouchableOpacity onPress={handleViewOrders}>
              <Text style={styles.viewAllText}>Order History</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.ordersList}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          >
            {availableOrdersData && availableOrdersData.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="receipt-outline" size={64} color={Colors.light.icon} />
                <Text style={styles.emptyTitle}>No Available Orders</Text>
                <Text style={styles.emptyMessage}>
                  New orders will appear here when they become available
                </Text>
                <TouchableOpacity style={styles.refreshEmptyButton} onPress={handleRefresh}>
                  <Ionicons name="refresh" size={20} color={Colors.light.background} />
                  <Text style={styles.refreshEmptyText}>Refresh</Text>
                </TouchableOpacity>
              </View>
            ) : (
              availableOrdersData?.map((order: Order) => (
                <TouchableOpacity
                  key={order._id}
                  style={styles.orderCard}
                  onPress={() => handleOrderPress(order._id)}
                >
                <View style={styles.orderHeader}>
                  <View style={styles.orderInfo}>
                    <Text style={styles.customerName}>
                      {order.customerName || 'Customer'}
                    </Text>
                    <Text style={styles.orderTime}>
                      {new Date(order.createdAt).toLocaleTimeString('en-NG', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View style={styles.earningsContainer}>
                    <Text style={styles.earningsAmount}>
                      ₦{Math.round(order.totalAmount * 0.1).toLocaleString()}
                    </Text>
                    <Text style={styles.earningsLabel}>Estimated</Text>
                  </View>
                </View>

                <View style={styles.orderDetails}>
                  <View style={styles.orderDetail}>
                    <Ionicons name="car" size={16} color={Colors.light.icon} />
                    <Text style={styles.orderDetailText}>
                      {order.quantity} {order.product || order.meal_name || 'Meal'}
                    </Text>
                  </View>
                  <View style={styles.orderDetail}>
                    <Ionicons name="business" size={16} color={Colors.light.icon} />
                    <Text style={styles.orderDetailText}>
                      Supplier ID: {order.supplierId.slice(-8)}
                    </Text>
                  </View>
                  <View style={styles.orderDetail}>
                    <Ionicons name="location" size={16} color={Colors.light.icon} />
                    <Text style={styles.orderDetailText}>
                      {order.deliveryAddress.street}, {order.deliveryAddress.city}
                    </Text>
                  </View>
                </View>

                <View style={styles.orderActions}>
                  <TouchableOpacity style={styles.acceptButton}>
                    <Ionicons name="checkmark" size={16} color={Colors.light.background} />
                    <Text style={styles.acceptButtonText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.declineButton}>
                    <Ionicons name="close" size={16} color={Colors.light.error} />
                    <Text style={styles.declineButtonText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )))}
          </ScrollView>
        </View>
      </View>

      {/* Floating Fuel Finder Logo Pill - Bottom Right */}
      <View style={[styles.floatingLogoPill, { bottom: insets.bottom + 20 }]}>
        <Image 
          source={require('../assets/depictions/logo.png')} 
          style={styles.floatingLogoImage}
          resizeMode="contain"
        />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  profileButton: {
    padding: 8,
  },
  statusButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderRadius: 0,
  },
  statusButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statusButtonIconLeft: {
    marginRight: -10,
  },
  statusButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.background,
    textTransform: 'lowercase',
    marginLeft: 8,
  },
  ordersSection: {
    flex: 1,
    paddingHorizontal: 16,
  },
  ordersHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ordersTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '600',
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
  customerName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderTime: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  earningsContainer: {
    alignItems: 'flex-end',
  },
  earningsAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.light.accent,
  },
  earningsLabel: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  orderDetails: {
    gap: 8,
    marginBottom: 16,
  },
  orderDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  orderDetailText: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  orderActions: {
    flexDirection: 'row',
    gap: 12,
  },
  acceptButton: {
    flex: 1,
    backgroundColor: Colors.light.accent,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.background,
  },
  declineButton: {
    flex: 1,
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.light.error,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.error,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyMessage: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  refreshEmptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  refreshEmptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.background,
  },
  floatingLogoPill: {
    position: 'absolute',
    right: 20,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 10,
  },
  floatingLogoImage: {
    width: 120,
    height: 32,
  },
});
