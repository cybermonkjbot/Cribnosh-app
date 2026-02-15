import { useFoodCreatorAuth } from '@/contexts/FoodCreatorAuthContext';
import { api } from '@/convex/_generated/api';
import { getSessionToken } from '@/lib/convexClient';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useToast } from '../lib/ToastContext';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const bankIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M2.5 7.5L10 2.5L17.5 7.5V8.75H2.5V7.5Z" stroke="#094327" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2.5 8.75V15H17.5V8.75" stroke="#094327" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M7.5 8.75V15M12.5 8.75V15" stroke="#094327" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function RequestPayoutScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { foodCreator: chef, sessionToken: authSessionToken } = useFoodCreatorAuth();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedBankAccount, setSelectedBankAccount] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Get earnings summary
  const earningsSummary = useQuery(
    api.queries.chefEarnings.getSummary,
    chef?._id && sessionToken ? { chefId: chef._id, sessionToken } : 'skip'
  );

  // Get bank accounts
  const bankAccounts = useQuery(
    api.queries.chefBankAccounts.getByChefId,
    chef?._id && sessionToken ? { chefId: chef._id, sessionToken } : 'skip'
  );

  // Request payout mutation
  const requestPayout = useMutation(api.mutations.chefPayouts.requestPayout);

  useEffect(() => {
    if (bankAccounts && bankAccounts.length > 0 && !selectedBankAccount) {
      const primary = bankAccounts.find((acc: any) => acc.isPrimary) || bankAccounts[0];
      setSelectedBankAccount(primary.accountId);
    }
  }, [bankAccounts, selectedBankAccount]);

  const handleBack = () => {
    router.back();
  };

  const handleUseAllAvailable = () => {
    if (earningsSummary) {
      setAmount((earningsSummary.availableBalance / 100).toFixed(2));
    }
  };

  const handleRequestPayout = async () => {
    if (!selectedBankAccount) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Please select a bank account',
        duration: 3000,
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Please enter a valid amount',
        duration: 3000,
      });
      return;
    }

    const amountInPence = Math.round(parseFloat(amount) * 100);

    if (earningsSummary && amountInPence > earningsSummary.availableBalance) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Amount exceeds available balance',
        duration: 3000,
      });
      return;
    }

    const minAmount = 1000; // £10.00 minimum
    if (amountInPence < minAmount) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Minimum payout amount is £10.00',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!chef?._id || !sessionToken) {
        throw new Error('Not authenticated');
      }

      const result = await requestPayout({
        chefId: chef._id,
        bankAccountId: selectedBankAccount,
        amount: amountInPence,
        sessionToken,
      });

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Payout request submitted successfully',
          duration: 3000,
        });
        router.back();
      } else {
        throw new Error(result.message || 'Failed to request payout');
      }
    } catch (error: any) {
      console.error('Error requesting payout:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: error?.message || 'Failed to request payout. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amountInPence: number) => {
    return `£${(amountInPence / 100).toFixed(2)}`;
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <SvgXml xml={backArrowSVG} width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Payout</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Available Balance */}
        {earningsSummary && (
          <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>Available Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(earningsSummary.availableBalance)}
            </Text>
          </View>
        )}

        {/* Bank Account Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select Bank Account</Text>
          {bankAccounts && bankAccounts.length > 0 ? (
            bankAccounts.map((account: any) => (
              <TouchableOpacity
                key={account.accountId}
                style={[
                  styles.bankAccountCard,
                  selectedBankAccount === account.accountId && styles.bankAccountCardSelected
                ]}
                onPress={() => setSelectedBankAccount(account.accountId)}
                activeOpacity={0.7}
              >
                <View style={styles.bankAccountLeft}>
                  <View style={styles.bankIconContainer}>
                    <SvgXml xml={bankIconSVG} width={24} height={24} />
                  </View>
                  <View style={styles.bankAccountInfo}>
                    <Text style={styles.bankAccountName}>{account.accountHolderName}</Text>
                    <Text style={styles.bankAccountDetails}>
                      {account.bankName} •••• {account.last4}
                    </Text>
                    {account.isPrimary && (
                      <Text style={styles.primaryBadge}>Primary</Text>
                    )}
                  </View>
                </View>
                <View style={[
                  styles.radioButton,
                  selectedBankAccount === account.accountId && styles.radioButtonSelected
                ]} />
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No bank accounts found</Text>
              <TouchableOpacity
                style={styles.addAccountButton}
                onPress={() => router.push('/bank-accounts' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.addAccountButtonText}>Add Bank Account</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Amount</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>£</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              editable={!isSubmitting}
            />
          </View>
          {earningsSummary && (
            <TouchableOpacity
              style={styles.useAllButton}
              onPress={handleUseAllAvailable}
              activeOpacity={0.7}
            >
              <Text style={styles.useAllButtonText}>
                Use All Available ({formatCurrency(earningsSummary.availableBalance)})
              </Text>
            </TouchableOpacity>
          )}
          <Text style={styles.minAmountText}>Minimum: £10.00</Text>
          <Text style={styles.processingText}>Processing: 1-3 business days</Text>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedBankAccount || !amount || isSubmitting) && styles.submitButtonDisabled
          ]}
          onPress={handleRequestPayout}
          disabled={!selectedBankAccount || !amount || isSubmitting}
          activeOpacity={0.7}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitButtonText}>Request Payout</Text>
          )}
        </TouchableOpacity>
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
  balanceCard: {
    backgroundColor: 'rgba(244, 255, 245, 0.79)',
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    marginBottom: 32,
    alignItems: 'center',
  },
  balanceLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 8,
  },
  balanceAmount: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 32,
    lineHeight: 40,
    color: '#094327',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 16,
  },
  bankAccountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  bankAccountCardSelected: {
    borderColor: '#094327',
  },
  bankAccountLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  bankIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E6FFE8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  bankAccountInfo: {
    flex: 1,
  },
  bankAccountName: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 4,
  },
  bankAccountDetails: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  primaryBadge: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    color: '#0B9E58',
    marginTop: 4,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  radioButtonSelected: {
    borderColor: '#094327',
    backgroundColor: '#094327',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 16,
  },
  addAccountButton: {
    backgroundColor: '#094327',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  addAccountButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  currencySymbol: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
  },
  useAllButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  useAllButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
  },
  minAmountText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  processingText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#6B7280',
  },
  submitButton: {
    backgroundColor: '#094327',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  submitButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  submitButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
});

