import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useToast } from '../lib/ToastContext';
import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getSessionToken } from '@/lib/convexClient';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

// Icons
const checkIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 4L7 13L4 10" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const clockIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M9.99995 1.69995C11.6415 1.69995 13.2462 2.18694 14.6112 3.09896C15.976 4.01095 17.0403 5.30686 17.6686 6.82342C18.2967 8.34003 18.4606 10.0094 18.1403 11.6194C17.82 13.2294 17.0298 14.7084 15.8691 15.8691C14.7084 17.0298 13.2294 17.82 11.6194 18.1403C10.0094 18.4606 8.34003 18.2967 6.82342 17.6686C5.30686 17.0403 4.01095 15.976 3.09896 14.6112C2.18694 13.2462 1.69995 11.6415 1.69995 9.99995C1.69995 9.54154 2.07156 9.16995 2.52995 9.16995C2.98834 9.16995 3.35995 9.54154 3.35995 9.99995C3.35995 11.3133 3.7497 12.5968 4.47931 13.6887C5.20889 14.7807 6.24566 15.6316 7.45889 16.1341C8.67212 16.6367 10.0073 16.7689 11.2952 16.5127C12.5832 16.2565 13.7668 15.624 14.6954 14.6954C15.624 13.7668 16.2565 12.5832 16.5127 11.2952C16.7689 10.0073 16.6367 8.67212 16.1341 7.45889C15.6316 6.24566 14.7807 5.20889 13.6887 4.47931C12.5973 3.75 11.3143 3.36027 10.0016 3.35995C8.12799 3.36739 6.32976 4.09864 4.98267 5.4009L3.11679 7.26679C2.79265 7.59093 2.26725 7.59093 1.94312 7.26679C1.61898 6.94265 1.61898 6.41725 1.94312 6.09312L3.81872 4.21751L4.14537 3.91598C5.76066 2.49844 7.838 1.7081 9.99671 1.69995H9.99995Z" fill="#8E8E93"/>
<path d="M1.67505 2.50505C1.67505 2.04666 2.04666 1.67505 2.50505 1.67505C2.96344 1.67505 3.33505 2.04666 3.33505 2.50505L3.33505 5.82505L6.65505 5.82505C7.11344 5.82505 7.48505 6.19666 7.48505 6.65505C7.48505 7.11344 7.11344 7.48505 6.65505 7.48505L2.50505 7.48505C2.04666 7.48505 1.67505 7.11344 1.67505 6.65505L1.67505 2.50505Z" fill="#8E8E93"/>
<path d="M9.17993 5.84514C9.17993 5.38674 9.55152 5.01514 10.0099 5.01514C10.4683 5.01514 10.8399 5.38674 10.8399 5.84514L10.8399 9.48203L13.7012 10.9127L13.7749 10.9548C14.1303 11.18 14.2646 11.642 14.0724 12.0264C13.8802 12.4108 13.4299 12.5808 13.0365 12.4316L12.9587 12.3976L9.63867 10.7376C9.35755 10.597 9.17993 10.3095 9.17993 9.99514L9.17993 5.84514Z" fill="#8E8E93"/>
</svg>`;

const chevronRightIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M7 4L13 10L7 16" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const bankIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M2.5 7.5L10 2.5L17.5 7.5V8.75H2.5V7.5Z" stroke="#094327" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2.5 8.75V15H17.5V8.75" stroke="#094327" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M7.5 8.75V15M12.5 8.75V15" stroke="#094327" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function PayoutSettingsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { foodCreator } = useFoodCreatorAuth();
  
  const [availableBalance, setAvailableBalance] = useState<number>(0);
  const [pendingPayouts, setPendingPayouts] = useState<number>(0);
  const [totalEarnings, setTotalEarnings] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Get session token
  useEffect(() => {
    const loadToken = async () => {
      const token = await getSessionToken();
      setSessionToken(token);
    };
    loadToken();
  }, []);

  // Get foodCreator earnings summary
  const earningsSummary = useQuery(
    api.queries.chefEarnings.getSummary,
    foodCreator?._id && sessionToken ? { chefId: foodCreator._id, sessionToken } : 'skip'
  );

  useEffect(() => {
    if (earningsSummary) {
      setAvailableBalance(earningsSummary.availableBalance / 100); // Convert from pence to pounds
      setPendingPayouts(earningsSummary.pendingPayouts / 100);
      setTotalEarnings(earningsSummary.totalEarnings / 100);
      setIsLoading(false);
    } else if (earningsSummary === null) {
      // Query returned null (not loading)
      setIsLoading(false);
    }
  }, [earningsSummary]);

  const handleBack = () => {
    router.back();
  };

  const handleRequestPayout = () => {
    router.push('/request-payout' as any);
  };

  const handleViewPayoutHistory = () => {
    router.push('/payout-history' as any);
  };

  const handleManageBankAccounts = () => {
    router.push('/bank-accounts' as any);
  };

  const formatCurrency = (amount: number) => {
    return `£${amount.toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
      
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <SvgXml xml={backArrowSVG} width={24} height={24} />
        </TouchableOpacity>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Main Title */}
        <Text style={styles.mainTitle}>Payouts</Text>
        
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#094327" />
          </View>
        ) : (
          <>
            {/* Available Balance Section */}
            <View style={styles.balanceSection}>
              <View style={styles.balanceCard}>
                <Text style={styles.balanceTitle}>Available Balance</Text>
                <Text style={styles.balanceAmount}>
                  {formatCurrency(availableBalance)}
                </Text>
                <Text style={styles.balanceDescription}>
                  Ready for payout
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.requestPayoutButton}
                onPress={handleRequestPayout}
                activeOpacity={0.7}
              >
                <Text style={styles.requestPayoutButtonText}>Request Payout</Text>
              </TouchableOpacity>
            </View>

            {/* Earnings Summary */}
            <View style={styles.summarySection}>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Total Earnings</Text>
                <Text style={styles.summaryValue}>{formatCurrency(totalEarnings)}</Text>
              </View>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryLabel}>Pending Payouts</Text>
                <Text style={styles.summaryValue}>{formatCurrency(pendingPayouts)}</Text>
              </View>
            </View>

            {/* Payout Options */}
            <View style={styles.optionsSection}>
              <TouchableOpacity style={styles.optionItem} onPress={handleViewPayoutHistory} activeOpacity={0.7}>
                <View style={styles.itemLeft}>
                  <View style={styles.itemIcon}>
                    <SvgXml xml={clockIconSVG} width={20} height={20} />
                  </View>
                  <Text style={styles.itemText}>Payout History</Text>
                </View>
                <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionItem} onPress={handleManageBankAccounts} activeOpacity={0.7}>
                <View style={styles.itemLeft}>
                  <View style={styles.itemIcon}>
                    <SvgXml xml={bankIconSVG} width={20} height={20} />
                  </View>
                  <Text style={styles.itemText}>Manage Bank Accounts</Text>
                </View>
                <SvgXml xml={chevronRightIconSVG} width={20} height={20} />
              </TouchableOpacity>
            </View>
          </>
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
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
    borderRadius: 8,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  mainTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    textAlign: 'left',
    marginTop: 16,
    marginBottom: 24,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Balance Section
  balanceSection: {
    marginBottom: 32,
  },
  balanceCard: {
    backgroundColor: 'rgba(244, 255, 245, 0.79)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  balanceTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 8,
  },
  balanceAmount: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 40,
    color: '#094327',
    marginBottom: 8,
  },
  balanceDescription: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  requestPayoutButton: {
    backgroundColor: '#094327',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  requestPayoutButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  // Summary Section
  summarySection: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 8,
  },
  summaryValue: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#094327',
  },
  // Options Section
  optionsSection: {
    marginBottom: 32,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  itemIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
});

