import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { api } from '@/convex/_generated/api';
import { getSessionToken } from '@/lib/convexClient';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useToast } from '../lib/ToastContext';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const checkIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 4L7 13L4 10" stroke="#0B9E58" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const clockIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.99995 1.69995C11.6415 1.69995 13.2462 2.18694 14.6112 3.09896C15.976 4.01095 17.0403 5.30686 17.6686 6.82342C18.2967 8.34003 18.4606 10.0094 18.1403 11.6194C17.82 13.2294 17.0298 14.7084 15.8691 15.8691C14.7084 17.0298 13.2294 17.82 11.6194 18.1403C10.0094 18.4606 8.34003 18.2967 6.82342 17.6686C5.30686 17.0403 4.01095 15.976 3.09896 14.6112C2.18694 13.2462 1.69995 11.6415 1.69995 9.99995C1.69995 9.54154 2.07156 9.16995 2.52995 9.16995C2.98834 9.16995 3.35995 9.54154 3.35995 9.99995C3.35995 11.3133 3.7497 12.5968 4.47931 13.6887C5.20889 14.7807 6.24566 15.6316 7.45889 16.1341C8.67212 16.6367 10.0073 16.7689 11.2952 16.5127C12.5832 16.2565 13.7668 15.624 14.6954 14.6954C15.624 13.7668 16.2565 12.5832 16.5127 11.2952C16.7689 10.0073 16.6367 8.67212 16.1341 7.45889C15.6316 6.24566 14.7807 5.20889 13.6887 4.47931C12.5973 3.75 11.3143 3.36027 10.0016 3.35995C8.12799 3.36739 6.32976 4.09864 4.98267 5.4009L3.11679 7.26679C2.79265 7.59093 2.26725 7.59093 1.94312 7.26679C1.61898 6.94265 1.61898 6.41725 1.94312 6.09312L3.81872 4.21751L4.14537 3.91598C5.76066 2.49844 7.838 1.7081 9.99671 1.69995H9.99995Z" fill="#8E8E93"/>
<path d="M1.67505 2.50505C1.67505 2.04666 2.04666 1.67505 2.50505 1.67505C2.96344 1.67505 3.33505 2.04666 3.33505 2.50505L3.33505 5.82505L6.65505 5.82505C7.11344 5.82505 7.48505 6.19666 7.48505 6.65505C7.48505 7.11344 7.11344 7.48505 6.65505 7.48505L2.50505 7.48505C2.04666 7.48505 1.67505 7.11344 1.67505 6.65505L1.67505 2.50505Z" fill="#8E8E93"/>
<path d="M9.17993 5.84514C9.17993 5.38674 9.55152 5.01514 10.0099 5.01514C10.4683 5.01514 10.8399 5.38674 10.8399 5.84514L10.8399 9.48203L13.7012 10.9127L13.7749 10.9548C14.1303 11.18 14.2646 11.642 14.0724 12.0264C13.8802 12.4108 13.4299 12.5808 13.0365 12.4316L12.9587 12.3976L9.63867 10.7376C9.35755 10.597 9.17993 10.3095 9.17993 9.99514L9.17993 5.84514Z" fill="#8E8E93"/>
</svg>`;

const warningIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M10 2L2 18H18L10 2Z" stroke="#FF6B35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 12V8" stroke="#FF6B35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M10 14H10.01" stroke="#FF6B35" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

type ViewType = 'payouts' | 'earnings';

export default function PayoutHistoryScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { foodCreator, sessionToken: authSessionToken } = useFoodCreatorAuth();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [viewType, setViewType] = useState<ViewType>('payouts');

  // Get session token
  useEffect(() => {
    const loadToken = async () => {
      if (authSessionToken) {
        setSessionToken(authSessionToken);
      } else {
        const token = await getSessionToken();
        setSessionToken(token);
      }
    };
    loadToken();
  }, [authSessionToken]);

  // Get payout history
   
  // @ts-ignore - Type instantiation depth issue with Convex conditional types
  const payoutHistory = useQuery(
    api.queries.chefPayouts.getHistory,
    foodCreator?._id && sessionToken && viewType === 'payouts'
      ? {
          chefId: foodCreator._id,
          status: selectedStatus || undefined,
          limit: 50,
          sessionToken: sessionToken,
        }
      : ('skip' as const)
  );

  // Get earnings transactions
   
  // @ts-ignore - Type instantiation depth issue with Convex conditional types
  const earningsTransactions = useQuery(
    api.queries.chefEarnings.getTransactions,
    foodCreator?._id && sessionToken && viewType === 'earnings'
      ? {
          chefId: foodCreator._id,
          limit: 50,
          sessionToken: sessionToken,
        }
      : ('skip' as const)
  );

  const handleBack = () => {
    router.back();
  };

  const formatCurrency = (amountInPence: number) => {
    return `£${(amountInPence / 100).toFixed(2)}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#0B9E58';
      case 'processing':
        return '#FF6B35';
      case 'pending':
        return '#6B7280';
      case 'failed':
        return '#EF4444';
      case 'cancelled':
        return '#9CA3AF';
      default:
        return '#6B7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return checkIconSVG;
      case 'processing':
      case 'pending':
        return clockIconSVG;
      case 'failed':
      case 'cancelled':
        return warningIconSVG;
      default:
        return clockIconSVG;
    }
  };

  const getEarningsTypeIcon = (type: string) => {
    switch (type) {
      case 'earning':
        return checkIconSVG;
      case 'payout':
        return clockIconSVG;
      case 'fee':
      case 'refund':
        return warningIconSVG;
      default:
        return checkIconSVG;
    }
  };

  const getEarningsTypeColor = (type: string) => {
    switch (type) {
      case 'earning':
        return '#0B9E58';
      case 'payout':
        return '#6B7280';
      case 'fee':
        return '#FF6B35';
      case 'refund':
        return '#EF4444';
      default:
        return '#0B9E58';
    }
  };

  const payouts = payoutHistory?.payouts || [];
  const earnings = earningsTransactions || [];

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <SvgXml xml={backArrowSVG} width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {viewType === 'payouts' ? 'Payout History' : 'Earnings History'}
        </Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* View Type Toggle */}
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewType === 'payouts' && styles.viewToggleButtonActive
            ]}
            onPress={() => {
              setViewType('payouts');
              setSelectedStatus(null);
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.viewToggleText,
              viewType === 'payouts' && styles.viewToggleTextActive
            ]}>
              Payouts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.viewToggleButton,
              viewType === 'earnings' && styles.viewToggleButtonActive
            ]}
            onPress={() => {
              setViewType('earnings');
              setSelectedStatus(null);
            }}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.viewToggleText,
              viewType === 'earnings' && styles.viewToggleTextActive
            ]}>
              Earnings
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filter Buttons - Only show for payouts */}
        {viewType === 'payouts' && (
          <View style={styles.filters}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                !selectedStatus && styles.filterButtonActive
              ]}
              onPress={() => setSelectedStatus(null)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterButtonText,
                !selectedStatus && styles.filterButtonTextActive
              ]}>
                All
              </Text>
            </TouchableOpacity>
            {['pending', 'processing', 'completed', 'failed'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterButton,
                  selectedStatus === status && styles.filterButtonActive
                ]}
                onPress={() => setSelectedStatus(status)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.filterButtonText,
                  selectedStatus === status && styles.filterButtonTextActive
                ]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Payouts List */}
        {viewType === 'payouts' && (
          payouts.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No Payouts Yet</Text>
              <Text style={styles.emptyStateText}>
                Your payout history will appear here once you request your first payout
              </Text>
            </View>
          ) : (
            payouts.map((payout: any) => (
              <View key={payout.payoutId} style={styles.payoutCard}>
                <View style={styles.payoutHeader}>
                  <View style={styles.payoutLeft}>
                    <View style={[styles.statusIcon, { backgroundColor: getStatusColor(payout.status) + '20' }]}>
                      <SvgXml xml={getStatusIcon(payout.status)} width={20} height={20} />
                    </View>
                    <View style={styles.payoutInfo}>
                      <Text style={styles.payoutAmount}>
                        {formatCurrency(payout.amount)}
                      </Text>
                      <Text style={styles.payoutDate}>
                        {formatDate(payout.requestedAt)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payout.status) + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: getStatusColor(payout.status) }]}>
                      {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </Text>
                  </View>
                </View>
                {payout.bankAccount && (
                  <View style={styles.bankInfo}>
                    <Text style={styles.bankInfoText}>
                      {payout.bankAccount.bankName} •••• {payout.bankAccount.last4}
                    </Text>
                  </View>
                )}
                {payout.completedAt && (
                  <Text style={styles.completedText}>
                    Completed: {formatDate(payout.completedAt)}
                  </Text>
                )}
                {payout.failureReason && (
                  <Text style={styles.failureText}>
                    {payout.failureReason}
                  </Text>
                )}
              </View>
            ))
          )
        )}

        {/* Earnings List */}
        {viewType === 'earnings' && (
          earnings.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>No Earnings Yet</Text>
              <Text style={styles.emptyStateText}>
                Your earnings history will appear here once you complete your first order
              </Text>
            </View>
          ) : (
            earnings.map((earning: any) => (
              <View key={earning.transactionId} style={styles.payoutCard}>
                <View style={styles.payoutHeader}>
                  <View style={styles.payoutLeft}>
                    <View style={[styles.statusIcon, { backgroundColor: getEarningsTypeColor(earning.type) + '20' }]}>
                      <SvgXml xml={getEarningsTypeIcon(earning.type)} width={20} height={20} />
                    </View>
                    <View style={styles.payoutInfo}>
                      <Text style={[
                        styles.payoutAmount,
                        (earning.type === 'fee' || earning.type === 'refund') && styles.negativeAmount
                      ]}>
                        {(earning.type === 'fee' || earning.type === 'refund') ? '-' : '+'}
                        {formatCurrency(Math.abs(earning.amount))}
                      </Text>
                      <Text style={styles.payoutDate}>
                        {formatDate(earning.date)}
                      </Text>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getEarningsTypeColor(earning.type) + '20' }]}>
                    <Text style={[styles.statusBadgeText, { color: getEarningsTypeColor(earning.type) }]}>
                      {earning.type.charAt(0).toUpperCase() + earning.type.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.bankInfo}>
                  <Text style={styles.bankInfoText}>
                    {earning.description}
                  </Text>
                </View>
                {earning.orderId && (
                  <Text style={styles.completedText}>
                    Order: {earning.orderId}
                  </Text>
                )}
              </View>
            ))
          )
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#094327',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 4,
    marginTop: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  viewToggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewToggleButtonActive: {
    backgroundColor: '#094327',
  },
  viewToggleText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  viewToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 24,
    marginBottom: 24,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterButtonActive: {
    backgroundColor: '#094327',
    borderColor: '#094327',
  },
  filterButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 8,
  },
  emptyStateText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  payoutCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  payoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  payoutLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  payoutInfo: {
    flex: 1,
  },
  payoutAmount: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#094327',
    marginBottom: 4,
  },
  payoutDate: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  statusBadgeText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  bankInfo: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  bankInfoText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  completedText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#0B9E58',
    marginTop: 8,
  },
  failureText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#EF4444',
    marginTop: 8,
  },
  negativeAmount: {
    color: '#EF4444',
  },
});

