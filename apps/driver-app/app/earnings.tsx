import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/Colors';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { logger } from '../utils/Logger';
import { useGetDriverEarningsQuery, useRequestPayoutMutation } from '../store/driverApi';

export default function EarningsScreen() {
  const router = useRouter();
  const { driver } = useDriverAuth();
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  const handleBack = () => {
    router.back();
  };

  // Fetch driver earnings data using RTK Query
  const { data: earningsData, isLoading: isLoadingEarnings } = useGetDriverEarningsQuery(
    driver ? { startDate: undefined, endDate: undefined } : undefined,
    { skip: !driver }
  );
  
  // TODO: Payout history may need separate endpoint
  const payoutHistory = null; // Placeholder - may need to create endpoint

  // Mutations
  const [requestPayout, { isLoading: isRequestingPayout }] = useRequestPayoutMutation();

  const handleRequestPayout = async () => {
    if (!driver) return;

    // Parse bank details from vehicleDetails JSON string or use direct properties
    const bankAccountNumber = driver.accountNumber || '';
    const bankName = driver.bankName || '';
    const bankAccountName = driver.accountName || '';

    // Check if driver has bank details
    if (!bankAccountNumber || !bankName) {
      Alert.alert(
        'Bank Details Required',
        'Please update your bank account details in your profile before requesting a payout.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Update Profile', onPress: () => {
            router.push('/bank-details');
          }}
        ]
      );
      return;
    }

    try {
      const result = await requestPayout({
        amount: earningsData?.data?.earnings?.total || 0,
        bankDetails: {
          accountNumber: bankAccountNumber,
          bankName: bankName,
          accountName: bankAccountName,
        },
      }).unwrap();

      if (result.success) {
        Alert.alert('Success', result.message || 'Payout request submitted successfully');
      } else {
        Alert.alert('Error', result.message || 'Failed to request payout');
      }
    } catch (error: any) {
      logger.error('Error requesting payout:', error);
      const errorMessage = error?.data?.error?.message || error?.message || 'Failed to request payout. Please try again.';
      Alert.alert('Error', errorMessage);
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return Colors.light.warning;
      case 'PROCESSING': return Colors.light.primary;
      case 'COMPLETED': return Colors.light.accent;
      case 'FAILED': return Colors.light.error;
      default: return Colors.light.icon;
    }
  };

  if (!driver) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!earningsData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Earnings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Statistics */}
        <View style={styles.statsCard}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Completed Orders</Text>
              <Text style={styles.statValue}>
                {earningsData.completedOrders}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Total Distance</Text>
              <Text style={styles.statValue}>
                {earningsData.totalDistance.toFixed(1)} km
              </Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Average Rating</Text>
              <Text style={styles.statValue}>
                {earningsData.averageRating ? earningsData.averageRating.toFixed(1) : 'N/A'}
              </Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Avg per Order</Text>
              <Text style={styles.statValue}>
                {earningsData.completedOrders > 0 
                  ? formatCurrency(earningsData.totalEarnings / earningsData.completedOrders)
                  : 'N/A'
                }
              </Text>
            </View>
          </View>
        </View>

        {/* Recent Earnings */}
        <View style={styles.earningsCard}>
          <Text style={styles.sectionTitle}>Recent Earnings</Text>
          {earningsData.recentEarnings.length === 0 ? (
            <Text style={styles.emptyText}>No earnings yet</Text>
          ) : (
            earningsData.recentEarnings.map((earning: { _id: string; orderId: string; earnings: number; distance: number; status: string; paidAt?: number; _creationTime: number }) => (
              <View key={earning._id} style={styles.earningItem}>
                <View style={styles.earningInfo}>
                  <Text style={styles.earningAmount}>
                    {formatCurrency(earning.earnings)}
                  </Text>
                  <Text style={styles.earningDistance}>
                    {earning.distance.toFixed(1)} km
                  </Text>
                </View>
                <View style={styles.earningStatus}>
                  <Ionicons 
                    name="checkmark-circle-outline" 
                    size={16} 
                    color={getStatusColor(earning.status)} 
                  />
                  <Text style={[styles.earningStatusText, { color: getStatusColor(earning.status) }]}>
                    {earning.status}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Payout History */}
        {payoutHistory && payoutHistory.length > 0 && (
          <View style={styles.payoutCard}>
            <Text style={styles.sectionTitle}>Payout History</Text>
            {payoutHistory.map((payout: Payout) => (
              <View key={payout._id} style={styles.payoutItem}>
                <View style={styles.payoutInfo}>
                  <Text style={styles.payoutAmount}>
                    {formatCurrency(payout.amount)}
                  </Text>
                  <Text style={styles.payoutDate}>
                    {formatDate(payout.requestedAt)}
                  </Text>
                </View>
                <View style={styles.payoutStatus}>
                  <Ionicons 
                    name="checkmark-circle-outline" 
                    size={16} 
                    color={getStatusColor(payout.status)} 
                  />
                  <Text style={[styles.payoutStatusText, { color: getStatusColor(payout.status) }]}>
                    {payout.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Request Payout Button */}
        {earningsData.pendingEarnings > 0 && (
          <TouchableOpacity 
            style={styles.payoutButton} 
            onPress={handleRequestPayout}
          >
            <Ionicons name="cash-outline" size={24} color="#FFFFFF" />
            <Text style={styles.payoutButtonText}>
              Request Payout ({formatCurrency(earningsData.pendingEarnings)})
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: Colors.light.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondary,
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
    color: Colors.light.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  statsCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  earningsCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  emptyText: {
    textAlign: 'center',
    color: '#6B7280',
    fontStyle: 'italic',
  },
  earningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  earningInfo: {
    flex: 1,
  },
  earningAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  earningDistance: {
    fontSize: 14,
    color: '#6B7280',
  },
  earningStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  earningStatusText: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  payoutCard: {
    margin: 16,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
  },
  payoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  payoutInfo: {
    flex: 1,
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  payoutDate: {
    fontSize: 14,
    color: '#6B7280',
  },
  payoutStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  payoutStatusText: {
    fontSize: 12,
    textTransform: 'uppercase',
  },
  payoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#9C1314',
    margin: 16,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  payoutButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
