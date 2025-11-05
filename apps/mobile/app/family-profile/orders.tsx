import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Package } from 'lucide-react-native';
import { GradientBackground } from '@/components/ui/GradientBackground';
import { useGetFamilyOrdersQuery } from '@/store/customerApi';

export default function FamilyOrdersScreen() {
  const router = useRouter();
  const { data: ordersData, isLoading } = useGetFamilyOrdersQuery({ limit: 50 });

  return (
    <GradientBackground>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ChevronLeft size={24} color="#E6FFE8" />
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#E6FFE8" />
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <Text style={styles.title}>Family Orders</Text>
            <Text style={styles.description}>
              All orders placed by family members
            </Text>

            {ordersData?.data && ordersData.data.length > 0 ? (
              ordersData.data.map((order: any, index: number) => (
                <View key={index} style={styles.orderCard}>
                  <Package size={24} color="#E6FFE8" />
                  <View style={styles.orderInfo}>
                    <Text style={styles.orderTitle}>Order #{order.order_id || order._id}</Text>
                    <Text style={styles.orderDetails}>
                      {order.status || 'Unknown'} • £{order.total?.toFixed(2) || '0.00'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No orders found</Text>
              </View>
            )}
          </ScrollView>
        )}
      </SafeAreaView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  backText: {
    color: '#E6FFE8',
    fontSize: 16,
    marginLeft: 8,
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
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    color: '#E6FFE8',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    marginTop: 20,
  },
  description: {
    color: '#C0DCC0',
    fontSize: 16,
    marginBottom: 24,
  },
  orderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
  },
  orderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  orderTitle: {
    color: '#E6FFE8',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  orderDetails: {
    color: '#C0DCC0',
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#C0DCC0',
    fontSize: 16,
  },
});

