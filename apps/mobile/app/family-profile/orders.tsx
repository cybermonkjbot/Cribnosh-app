import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Package } from 'lucide-react-native';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useFamilyProfile } from '@/hooks/useFamilyProfile';
import { useEffect, useState } from 'react';

export default function FamilyOrdersScreen() {
  const router = useRouter();
  const { getFamilyOrders } = useFamilyProfile();
  const [ordersData, setOrdersData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          title: 'Family Orders',
        }}
      />
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
        
        <ScreenHeader title="Family Orders" onBack={() => router.back()} />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#094327" />
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.description}>
              All orders placed by family members
            </Text>

            {ordersData?.data && ordersData.data.length > 0 ? (
              ordersData.data.map((order: any, index: number) => (
                <TouchableOpacity key={index} style={styles.orderCard} activeOpacity={0.7}>
                  <View style={styles.packageIconContainer}>
                    <Package size={24} color="#094327" />
                  </View>
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderTitle}>Order #{order.order_id || order._id?.slice(-8) || 'N/A'}</Text>
                    <Text style={styles.orderDetails}>
                      {order.status || 'Unknown'} • £{order.total?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No orders found</Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 20,
  },
  description: {
    color: '#6B7280',
    fontSize: 16,
    marginBottom: 24,
    fontFamily: 'Inter',
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
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
  packageIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  orderInfo: {
    flex: 1,
  },
  orderTitle: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  orderDetails: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    fontFamily: 'Inter',
  },
});

