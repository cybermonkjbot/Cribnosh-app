import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/convexApi';
import { Colors } from '../constants/Colors';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDriverAuth } from '../contexts/EnhancedDriverAuthContext';
import { ThemedText } from '../components/ThemedText';
import { ThemedView } from '../components/ThemedView';
import { logger } from '../utils/Logger';
import { PersistentBottomSheet } from '../components/PersistentBottomSheet';

export default function WithdrawalsScreen() {
  const router = useRouter();
  const { driver } = useDriverAuth();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  // Fetch driver earnings data
  const earningsData = useQuery(
    api.driverEarnings.getDriverEarningsSummary,
    driver ? { driverId: driver._id } : 'skip'
  );
  const payoutHistory = useQuery(
    api.driverEarnings.getDriverPayoutHistory,
    driver ? { driverId: driver._id } : 'skip'
  );

  // Mutations
  const requestPayout = useMutation(api.driverEarnings.requestPayout);

  const handleBack = () => {
    router.back();
  };

  const handleViewEarnings = () => {
    router.push('/earnings');
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return Colors.light.warning;
      case 'PROCESSING':
        return Colors.light.primary;
      case 'COMPLETED':
        return Colors.light.accent;
      case 'FAILED':
        return Colors.light.error;
      default:
        return Colors.light.icon;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'Pending';
      case 'PROCESSING':
        return 'Processing';
      case 'COMPLETED':
        return 'Completed';
      case 'FAILED':
        return 'Failed';
      default:
        return status;
    }
  };

  const handleRequestWithdrawal = () => {
    if (!driver) return;

    const amount = parseFloat(withdrawAmount.replace(/,/g, ''));
    
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to withdraw.');
      return;
    }

    if (amount < 1000) {
      Alert.alert('Minimum Amount', 'Minimum withdrawal amount is ₦1,000.');
      return;
    }

    const availableBalance = earningsData?.pendingEarnings || 0;
    if (amount > availableBalance) {
      Alert.alert('Insufficient Funds', `You can only withdraw up to ${formatCurrency(availableBalance)}.`);
      return;
    }

    // Parse bank details from vehicleDetails JSON string
    let bankDetails: { accountNumber?: string; bankName?: string; bankCode?: string; accountName?: string } = {};
    try {
      bankDetails = JSON.parse(driver.vehicleDetails) as { accountNumber?: string; bankName?: string; bankCode?: string; accountName?: string };
    } catch (error) {
      logger.error('Error parsing vehicle details:', error);
    }

    const bankAccountNumber = bankDetails.accountNumber;
    const bankName = bankDetails.bankName;

    // Check if driver has bank details
    if (!bankAccountNumber || !bankName) {
      Alert.alert(
        'Bank Details Required',
        'Please update your bank account details in your profile before requesting a withdrawal.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Update Profile', 
            onPress: () => {
              router.push('/profile/edit');
            }
          }
        ]
      );
      return;
    }

    // Show confirmation sheet
    setShowWithdrawModal(true);
  };

  const handleConfirmWithdrawal = async () => {
    if (!driver) return;
    
    // Parse bank details from vehicleDetails JSON string
    let bankDetails: { accountNumber?: string; bankName?: string; bankCode?: string; accountName?: string } = {};
    try {
      bankDetails = JSON.parse(driver.vehicleDetails) as { accountNumber?: string; bankName?: string; bankCode?: string; accountName?: string };
    } catch (error) {
      logger.error('Error parsing vehicle details:', error);
    }

    const bankAccountNumber = bankDetails.accountNumber;
    const bankName = bankDetails.bankName;

    try {
      setIsRequesting(true);
      const result = await requestPayout({
        driverId: driver._id,
        paymentMethod: 'BANK_TRANSFER',
        paymentDetails: {
          accountNumber: bankAccountNumber,
          bankName: bankName,
          bankCode: bankDetails.bankCode || undefined,
        },
      });

      setShowWithdrawModal(false);
      
      if (result.success) {
        Alert.alert('Success', result.message);
        setWithdrawAmount('');
      } else {
        Alert.alert('Error', result.message);
      }
    } catch (error) {
      logger.error('Withdrawal error:', error);
      setShowWithdrawModal(false);
      Alert.alert('Error', 'Failed to process withdrawal request. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const handleUpdateBankDetails = () => {
    router.push('/profile/edit');
  };

  if (!driver) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (!earningsData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>Loading withdrawals data...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  const availableBalance = earningsData.pendingEarnings || 0;
  const hasBankDetails = (() => {
    try {
      const bankDetails = JSON.parse(driver.vehicleDetails) as { accountNumber?: string; bankName?: string };
      return !!(bankDetails.accountNumber && bankDetails.bankName);
    } catch {
      return false;
    }
  })();

  const bankDetails = (() => {
    try {
      return JSON.parse(driver.vehicleDetails) as { accountNumber?: string; bankName?: string; accountName?: string };
    } catch {
      return {};
    }
  })();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
          </TouchableOpacity>
          <ThemedText type="defaultSemiBold" style={styles.headerTitle}>Withdrawals</ThemedText>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Available Balance Card */}
          <ThemedView style={styles.balanceCard}>
            <View style={styles.balanceHeader}>
              <View style={styles.balanceIconContainer}>
                <Ionicons name="wallet-outline" size={32} color={Colors.light.primary} />
              </View>
              <View style={styles.balanceInfo}>
                <ThemedText style={styles.balanceLabel}>Available for Withdrawal</ThemedText>
                <ThemedText type="title" style={styles.balanceAmount}>
                  {formatCurrency(availableBalance)}
                </ThemedText>
                <ThemedText style={styles.balanceSubtext}>
                  Pending earnings ready to withdraw
                </ThemedText>
              </View>
            </View>
          </ThemedView>

          {/* Bank Details Section */}
          <ThemedView style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Bank Details</ThemedText>
              <TouchableOpacity onPress={handleUpdateBankDetails}>
                <ThemedText type="link" style={styles.editLink}>Update</ThemedText>
              </TouchableOpacity>
            </View>
            {hasBankDetails ? (
              <View style={styles.bankDetailsContainer}>
                <View style={styles.bankDetailItem}>
                  <Ionicons name="business-outline" size={20} color={Colors.light.icon} />
                  <View style={styles.bankDetailInfo}>
                    <ThemedText style={styles.bankDetailLabel}>Bank Name</ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.bankDetailValue}>
                      {bankDetails.bankName || 'Not set'}
                    </ThemedText>
                  </View>
                </View>
                <View style={styles.bankDetailItem}>
                  <Ionicons name="card-outline" size={20} color={Colors.light.icon} />
                  <View style={styles.bankDetailInfo}>
                    <ThemedText style={styles.bankDetailLabel}>Account Number</ThemedText>
                    <ThemedText type="defaultSemiBold" style={styles.bankDetailValue}>
                      {bankDetails.accountNumber || 'Not set'}
                    </ThemedText>
                  </View>
                </View>
                {bankDetails.accountName && (
                  <View style={styles.bankDetailItem}>
                    <Ionicons name="person-outline" size={20} color={Colors.light.icon} />
                    <View style={styles.bankDetailInfo}>
                      <ThemedText style={styles.bankDetailLabel}>Account Name</ThemedText>
                      <ThemedText type="defaultSemiBold" style={styles.bankDetailValue}>
                        {bankDetails.accountName}
                      </ThemedText>
                    </View>
                  </View>
                )}
              </View>
            ) : (
              <View style={styles.emptyBankDetails}>
                <Ionicons name="alert-circle-outline" size={48} color={Colors.light.warning} />
                <ThemedText type="defaultSemiBold" style={styles.emptyBankDetailsTitle}>
                  No Bank Details
                </ThemedText>
                <ThemedText style={styles.emptyBankDetailsText}>
                  Please add your bank account details to enable withdrawals.
                </ThemedText>
                <TouchableOpacity style={styles.addBankButton} onPress={handleUpdateBankDetails}>
                  <ThemedText style={styles.addBankButtonText}>Add Bank Details</ThemedText>
                </TouchableOpacity>
              </View>
            )}
          </ThemedView>

          {/* Withdrawal Request Section */}
          {availableBalance > 0 && hasBankDetails && (
            <ThemedView style={styles.sectionCard}>
              <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Request Withdrawal</ThemedText>
              <View style={styles.withdrawalInputContainer}>
                <View style={styles.amountInputWrapper}>
                  <ThemedText style={styles.inputLabel}>Amount (₦)</ThemedText>
                  <View style={styles.amountAndButtonRow}>
                    <View style={styles.amountInputContainer}>
                      <TextInput
                        style={styles.amountInput}
                        placeholder="0.00"
                        placeholderTextColor={Colors.light.icon}
                        value={withdrawAmount}
                        onChangeText={(text) => {
                          // Remove non-numeric characters except decimal point
                          const cleaned = text.replace(/[^0-9.]/g, '');
                          // Ensure only one decimal point
                          const parts = cleaned.split('.');
                          if (parts.length > 2) {
                            setWithdrawAmount(parts[0] + '.' + parts.slice(1).join(''));
                          } else {
                            setWithdrawAmount(cleaned);
                          }
                        }}
                        keyboardType="decimal-pad"
                        editable={!isRequesting}
                      />
                      <TouchableOpacity
                        style={styles.maxButton}
                        onPress={() => setWithdrawAmount(availableBalance.toString())}
                        disabled={isRequesting}
                      >
                        <ThemedText style={styles.maxButtonText}>MAX</ThemedText>
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity
                      style={[styles.withdrawButtonInline, isRequesting && styles.withdrawButtonDisabled]}
                      onPress={handleRequestWithdrawal}
                      disabled={isRequesting || !withdrawAmount || parseFloat(withdrawAmount.replace(/,/g, '')) < 1000}
                    >
                      {isRequesting ? (
                        <ActivityIndicator size="small" color={Colors.light.background} />
                      ) : (
                        <>
                          <Ionicons name="cash-outline" size={20} color={Colors.light.background} />
                          <ThemedText style={styles.withdrawButtonTextInline}>Withdraw</ThemedText>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                  <ThemedText style={styles.inputHint}>
                    Minimum: ₦1,000 • Available: {formatCurrency(availableBalance)}
                  </ThemedText>
                </View>
              </View>
              <ThemedText style={styles.withdrawalHint}>
                Withdrawals are typically processed within 24-48 hours.
              </ThemedText>
            </ThemedView>
          )}

          {/* Withdrawal History */}
          <ThemedView style={styles.sectionCard}>
            <ThemedText type="defaultSemiBold" style={styles.sectionTitle}>Withdrawal History</ThemedText>
            {!payoutHistory ? (
              <View style={styles.loadingHistory}>
                <ActivityIndicator size="small" color={Colors.light.primary} />
                <ThemedText style={styles.loadingHistoryText}>Loading history...</ThemedText>
              </View>
            ) : payoutHistory.length === 0 ? (
              <View style={styles.emptyHistory}>
                <Ionicons name="receipt-outline" size={48} color={Colors.light.icon} />
                <ThemedText type="defaultSemiBold" style={styles.emptyHistoryTitle}>
                  No Withdrawals Yet
                </ThemedText>
                <ThemedText style={styles.emptyHistoryText}>
                  Your withdrawal history will appear here once you make your first withdrawal request.
                </ThemedText>
              </View>
            ) : (
              <View style={styles.historyList}>
                {payoutHistory.map((payout: {
                  _id: string;
                  totalAmount: number;
                  status: string;
                  requestedAt: number;
                  processedAt?: number;
                  failureReason?: string;
                }) => (
                  <View key={payout._id} style={styles.historyItem}>
                    <View style={styles.historyItemLeft}>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(payout.status) + '20' }]}>
                        <Ionicons 
                          name={payout.status === 'COMPLETED' ? 'checkmark-circle' : 
                                payout.status === 'FAILED' ? 'close-circle' : 
                                payout.status === 'PROCESSING' ? 'hourglass' : 'time-outline'} 
                          size={16} 
                          color={getStatusColor(payout.status)} 
                        />
                      </View>
                      <View style={styles.historyInfo}>
                        <ThemedText type="defaultSemiBold" style={styles.historyAmount}>
                          {formatCurrency(payout.totalAmount)}
                        </ThemedText>
                        <ThemedText style={styles.historyDate}>
                          {formatDate(payout.requestedAt)}
                        </ThemedText>
                        {payout.processedAt && (
                          <ThemedText style={styles.historyProcessed}>
                            Processed: {formatDate(payout.processedAt)}
                          </ThemedText>
                        )}
                        {payout.failureReason && (
                          <ThemedText style={[styles.historyFailure, { color: Colors.light.error }]}>
                            {payout.failureReason}
                          </ThemedText>
                        )}
                      </View>
                    </View>
                    <View style={styles.historyItemRight}>
                      <ThemedText style={[styles.historyStatus, { color: getStatusColor(payout.status) }]}>
                        {getStatusText(payout.status)}
                      </ThemedText>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </ThemedView>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Floating Action Button for Earnings History */}
        <TouchableOpacity
          style={styles.fab}
          onPress={handleViewEarnings}
          activeOpacity={0.8}
        >
          <Ionicons name="trending-up-outline" size={24} color={Colors.light.background} />
          <ThemedText style={styles.fabText}>Earnings</ThemedText>
        </TouchableOpacity>
      </View>

      {/* Withdrawal Confirmation Sheet */}
      <PersistentBottomSheet
        visible={showWithdrawModal}
        onClose={() => !isRequesting && setShowWithdrawModal(false)}
        title="Confirm Withdrawal"
        height="50%"
        showCloseButton={!isRequesting}
        enablePanDownToClose={!isRequesting}
      >
        <View style={styles.confirmationSheetContent}>
          <View style={styles.confirmationAmountContainer}>
            <ThemedText style={styles.confirmationLabel}>Withdrawal Amount</ThemedText>
            <ThemedText type="title" style={styles.confirmationAmount}>
              {formatCurrency(parseFloat(withdrawAmount.replace(/,/g, '')) || 0)}
            </ThemedText>
          </View>

          <View style={styles.confirmationBankDetails}>
            <ThemedText type="defaultSemiBold" style={styles.confirmationSectionTitle}>
              Transfer to Bank Account
            </ThemedText>
            
            <View style={styles.confirmationBankDetailItem}>
              <Ionicons name="business-outline" size={20} color={Colors.light.icon} />
              <View style={styles.confirmationBankDetailInfo}>
                <ThemedText style={styles.confirmationBankDetailLabel}>Bank Name</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.confirmationBankDetailValue}>
                  {(() => {
                    try {
                      const bankDetails = JSON.parse(driver.vehicleDetails) as { bankName?: string };
                      return bankDetails.bankName || 'Not set';
                    } catch {
                      return 'Not set';
                    }
                  })()}
                </ThemedText>
              </View>
            </View>

            <View style={styles.confirmationBankDetailItem}>
              <Ionicons name="card-outline" size={20} color={Colors.light.icon} />
              <View style={styles.confirmationBankDetailInfo}>
                <ThemedText style={styles.confirmationBankDetailLabel}>Account Number</ThemedText>
                <ThemedText type="defaultSemiBold" style={styles.confirmationBankDetailValue}>
                  {(() => {
                    try {
                      const bankDetails = JSON.parse(driver.vehicleDetails) as { accountNumber?: string };
                      return bankDetails.accountNumber || 'Not set';
                    } catch {
                      return 'Not set';
                    }
                  })()}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={styles.confirmationNote}>
            <Ionicons name="information-circle-outline" size={20} color={Colors.light.icon} />
            <ThemedText style={styles.confirmationNoteText}>
              Withdrawals are typically processed within 24-48 hours.
            </ThemedText>
          </View>

          <View style={styles.confirmationButtons}>
            <TouchableOpacity
              style={[styles.confirmationCancelButton, isRequesting && styles.confirmationButtonDisabled]}
              onPress={() => setShowWithdrawModal(false)}
              disabled={isRequesting}
            >
              <ThemedText style={styles.confirmationCancelButtonText}>Cancel</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmationConfirmButton, isRequesting && styles.confirmationButtonDisabled]}
              onPress={handleConfirmWithdrawal}
              disabled={isRequesting}
            >
              {isRequesting ? (
                <ActivityIndicator size="small" color={Colors.light.background} />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color={Colors.light.background} />
                  <ThemedText style={styles.confirmationConfirmButtonText}>Confirm Withdrawal</ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </PersistentBottomSheet>
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
    textAlign: 'center',
    flex: 1,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    color: Colors.light.icon,
  },
  balanceCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  balanceInfo: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.text,
    marginBottom: 4,
  },
  balanceSubtext: {
    fontSize: 12,
    color: Colors.light.icon,
  },
  sectionCard: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  editLink: {
    fontSize: 14,
  },
  bankDetailsContainer: {
    gap: 16,
  },
  bankDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bankDetailInfo: {
    flex: 1,
  },
  bankDetailLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 4,
  },
  bankDetailValue: {
    fontSize: 15,
  },
  emptyBankDetails: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyBankDetailsTitle: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyBankDetailsText: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
    marginBottom: 16,
  },
  addBankButton: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addBankButtonText: {
    color: Colors.light.background,
    fontWeight: '600',
    fontSize: 14,
  },
  withdrawalInputContainer: {
    marginBottom: 16,
  },
  amountInputWrapper: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 8,
  },
  amountAndButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  amountInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.secondary,
    borderRadius: 8,
    paddingHorizontal: 16,
    backgroundColor: Colors.light.background,
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    paddingVertical: 12,
  },
  maxButton: {
    backgroundColor: Colors.light.secondary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  maxButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.primary,
  },
  inputHint: {
    fontSize: 12,
    color: Colors.light.icon,
    marginTop: 4,
  },
  withdrawButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 8,
  },
  withdrawButtonInline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 6,
    minWidth: 100,
  },
  withdrawButtonDisabled: {
    opacity: 0.5,
  },
  withdrawButtonText: {
    color: Colors.light.background,
    fontSize: 16,
    fontWeight: '600',
  },
  withdrawButtonTextInline: {
    color: Colors.light.background,
    fontSize: 14,
    fontWeight: '600',
  },
  withdrawalHint: {
    fontSize: 12,
    color: Colors.light.icon,
    textAlign: 'center',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.secondary,
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    gap: 12,
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  historyInfo: {
    flex: 1,
  },
  historyAmount: {
    fontSize: 16,
    marginBottom: 4,
  },
  historyDate: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 2,
  },
  historyProcessed: {
    fontSize: 11,
    color: Colors.light.icon,
    marginTop: 2,
  },
  historyFailure: {
    fontSize: 11,
    marginTop: 4,
  },
  historyItemRight: {
    alignItems: 'flex-end',
  },
  historyStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  loadingHistory: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    gap: 8,
  },
  loadingHistoryText: {
    fontSize: 14,
    color: Colors.light.icon,
  },
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyHistoryTitle: {
    fontSize: 16,
    marginTop: 12,
    marginBottom: 4,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: Colors.light.icon,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 32,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 16,
    backgroundColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    gap: 8,
  },
  fabText: {
    color: Colors.light.background,
    fontSize: 14,
    fontWeight: '600',
  },
  confirmationSheetContent: {
    flex: 1,
    paddingVertical: 8,
  },
  confirmationAmountContainer: {
    alignItems: 'center',
    marginBottom: 24,
    paddingVertical: 16,
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
  },
  confirmationLabel: {
    fontSize: 14,
    color: Colors.light.icon,
    marginBottom: 8,
  },
  confirmationAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  confirmationBankDetails: {
    marginBottom: 24,
  },
  confirmationSectionTitle: {
    fontSize: 16,
    marginBottom: 16,
  },
  confirmationBankDetailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  confirmationBankDetailInfo: {
    flex: 1,
  },
  confirmationBankDetailLabel: {
    fontSize: 12,
    color: Colors.light.icon,
    marginBottom: 4,
  },
  confirmationBankDetailValue: {
    fontSize: 15,
  },
  confirmationNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 24,
    padding: 12,
    backgroundColor: Colors.light.secondary,
    borderRadius: 8,
  },
  confirmationNoteText: {
    flex: 1,
    fontSize: 12,
    color: Colors.light.icon,
    lineHeight: 18,
  },
  confirmationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmationCancelButton: {
    flex: 1,
    backgroundColor: Colors.light.secondary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmationCancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  confirmationConfirmButton: {
    flex: 1,
    backgroundColor: Colors.light.primary,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  confirmationConfirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.background,
  },
  confirmationButtonDisabled: {
    opacity: 0.5,
  },
});

