import { useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { useToast } from '../lib/ToastContext';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { getSessionToken } from '@/lib/convexClient';

// Back arrow SVG
const backArrowSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M19 12H5M12 19L5 12L12 5" stroke="#094327" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const plusIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M19 11C19.5523 11 20 11.4477 20 12C20 12.5523 19.5523 13 19 13L5 13C4.44772 13 4 12.5523 4 12C4 11.4477 4.44772 11 5 11L19 11Z" fill="#094327"/>
<path d="M11 19L11 5C11 4.44772 11.4477 4 12 4C12.5523 4 13 4.44772 13 5L13 19C13 19.5523 12.5523 20 12 20C11.4477 20 11 19.5523 11 19Z" fill="#094327"/>
</svg>`;

const bankIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M2.5 7.5L10 2.5L17.5 7.5V8.75H2.5V7.5Z" stroke="#094327" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M2.5 8.75V15H17.5V8.75" stroke="#094327" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M7.5 8.75V15M12.5 8.75V15" stroke="#094327" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const checkIconSVG = `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M16 4L7 13L4 10" stroke="#0B9E58" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

export default function BankAccountsScreen() {
  const router = useRouter();
  const { showToast } = useToast();
  const { chef, sessionToken: authSessionToken } = useChefAuth();
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [accountHolderName, setAccountHolderName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [sortCode, setSortCode] = useState('');
  const [bankName, setBankName] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);

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

  // Get bank accounts
  const bankAccounts = useQuery(
    api.queries.chefBankAccounts.getByChefId,
    chef?._id && sessionToken ? { chefId: chef._id, sessionToken } : 'skip'
  );

  // Mutations
  const createAccount = useMutation(api.mutations.chefBankAccounts.create);
  const setPrimaryAccount = useMutation(api.mutations.chefBankAccounts.setPrimary);
  const removeAccount = useMutation(api.mutations.chefBankAccounts.remove);

  const handleBack = () => {
    router.back();
  };

  const handleAddAccount = () => {
    setIsAddingAccount(true);
  };

  const handleCancelAdd = () => {
    setIsAddingAccount(false);
    setAccountHolderName('');
    setAccountNumber('');
    setSortCode('');
    setBankName('');
    setIsPrimary(false);
  };

  const handleSubmitAccount = async () => {
    if (!accountHolderName.trim() || !accountNumber.trim() || !sortCode.trim() || !bankName.trim()) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Please fill in all fields',
        duration: 3000,
      });
      return;
    }

    // Validate sort code format (XX-XX-XX)
    const sortCodeRegex = /^\d{2}-\d{2}-\d{2}$/;
    if (!sortCodeRegex.test(sortCode)) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Sort code must be in format XX-XX-XX',
        duration: 3000,
      });
      return;
    }

    setIsSubmitting(true);
    try {
      if (!chef?._id || !sessionToken) {
        throw new Error('Not authenticated');
      }

      const result = await createAccount({
        chefId: chef._id,
        accountHolderName: accountHolderName.trim(),
        accountNumber: accountNumber.trim(),
        sortCode: sortCode.trim(),
        bankName: bankName.trim(),
        isPrimary: isPrimary || (bankAccounts?.length === 0),
        sessionToken,
      });

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Bank account added successfully',
          duration: 3000,
        });
        handleCancelAdd();
      } else {
        throw new Error(result.message || 'Failed to add bank account');
      }
    } catch (error: any) {
      console.error('Error adding bank account:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: error?.message || 'Failed to add bank account. Please try again.',
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetPrimary = async (accountId: string) => {
    if (!chef?._id || !sessionToken) {
      return;
    }

    try {
      const result = await setPrimaryAccount({
        chefId: chef._id,
        accountId,
        sessionToken,
      });

      if (result.success) {
        showToast({
          type: 'success',
          title: 'Success',
          message: 'Primary account updated',
          duration: 3000,
        });
      } else {
        throw new Error(result.message || 'Failed to update primary account');
      }
    } catch (error: any) {
      console.error('Error setting primary account:', error);
      showToast({
        type: 'error',
        title: 'Error',
        message: error?.message || 'Failed to update primary account',
        duration: 3000,
      });
    }
  };

  const handleDeleteAccount = (accountId: string) => {
    Alert.alert(
      'Delete Bank Account',
      'Are you sure you want to delete this bank account?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (!sessionToken) {
                throw new Error('Not authenticated');
              }

              const result = await removeAccount({
                accountId,
                sessionToken,
              });

              if (result.success) {
                showToast({
                  type: 'success',
                  title: 'Success',
                  message: 'Bank account deleted',
                  duration: 3000,
                });
              } else {
                throw new Error(result.message || 'Failed to delete bank account');
              }
            } catch (error: any) {
              console.error('Error deleting bank account:', error);
              showToast({
                type: 'error',
                title: 'Error',
                message: error?.message || 'Failed to delete bank account',
                duration: 3000,
              });
            }
          },
        },
      ]
    );
  };

  const formatSortCode = (text: string) => {
    // Remove all non-digits
    const digits = text.replace(/\D/g, '');
    // Format as XX-XX-XX
    if (digits.length <= 2) {
      return digits;
    } else if (digits.length <= 4) {
      return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    } else {
      return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4, 6)}`;
    }
  };

  return (
    <SafeAreaView style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <SvgXml xml={backArrowSVG} width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Bank Accounts</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Add Account Button */}
        {!isAddingAccount && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={handleAddAccount}
            activeOpacity={0.7}
          >
            <SvgXml xml={plusIconSVG} width={24} height={24} />
            <Text style={styles.addButtonText}>Add Bank Account</Text>
          </TouchableOpacity>
        )}

        {/* Add Account Form */}
        {isAddingAccount && (
          <View style={styles.addForm}>
            <Text style={styles.formTitle}>Add Bank Account</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Holder Name</Text>
              <TextInput
                style={styles.input}
                value={accountHolderName}
                onChangeText={setAccountHolderName}
                placeholder="John Doe"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Bank Name</Text>
              <TextInput
                style={styles.input}
                value={bankName}
                onChangeText={setBankName}
                placeholder="Barclays"
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Sort Code</Text>
              <TextInput
                style={styles.input}
                value={sortCode}
                onChangeText={(text) => setSortCode(formatSortCode(text))}
                placeholder="12-34-56"
                keyboardType="number-pad"
                maxLength={8}
                editable={!isSubmitting}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Account Number</Text>
              <TextInput
                style={styles.input}
                value={accountNumber}
                onChangeText={setAccountNumber}
                placeholder="12345678"
                keyboardType="number-pad"
                maxLength={8}
                editable={!isSubmitting}
              />
            </View>

            <TouchableOpacity
              style={styles.checkboxContainer}
              onPress={() => setIsPrimary(!isPrimary)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, isPrimary && styles.checkboxChecked]}>
                {isPrimary && <SvgXml xml={checkIconSVG} width={16} height={16} />}
              </View>
              <Text style={styles.checkboxLabel}>Set as primary account</Text>
            </TouchableOpacity>

            <View style={styles.formButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelAdd}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
                onPress={handleSubmitAccount}
                disabled={isSubmitting}
                activeOpacity={0.7}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>Add Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Bank Accounts List */}
        {bankAccounts && bankAccounts.length > 0 ? (
          <View style={styles.accountsList}>
            {bankAccounts.map((account) => (
              <View key={account.accountId} style={styles.accountCard}>
                <View style={styles.accountHeader}>
                  <View style={styles.accountLeft}>
                    <View style={styles.bankIconContainer}>
                      <SvgXml xml={bankIconSVG} width={24} height={24} />
                    </View>
                    <View style={styles.accountInfo}>
                      <Text style={styles.accountName}>{account.accountHolderName}</Text>
                      <Text style={styles.accountDetails}>
                        {account.bankName} •••• {account.last4}
                      </Text>
                      <Text style={styles.accountSortCode}>Sort Code: {account.sortCode}</Text>
                    </View>
                  </View>
                  {account.isPrimary && (
                    <View style={styles.primaryBadge}>
                      <Text style={styles.primaryBadgeText}>Primary</Text>
                    </View>
                  )}
                </View>
                <View style={styles.accountActions}>
                  {!account.isPrimary && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleSetPrimary(account.accountId)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.actionButtonText}>Set as Primary</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.actionButton, styles.deleteButton]}
                    onPress={() => handleDeleteAccount(account.accountId)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        ) : !isAddingAccount && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>No Bank Accounts</Text>
            <Text style={styles.emptyStateText}>
              Add a bank account to receive payouts
            </Text>
          </View>
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
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#094327',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 24,
    gap: 8,
  },
  addButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  addForm: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginTop: 24,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  formTitle: {
    fontFamily: 'Archivo',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 28,
    color: '#094327',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FAFFFA',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#094327',
    borderColor: '#094327',
  },
  checkboxLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
  },
  formButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#6B7280',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#094327',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
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
  accountsList: {
    marginTop: 24,
  },
  accountCard: {
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
  accountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  accountLeft: {
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
  accountInfo: {
    flex: 1,
  },
  accountName: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 4,
  },
  accountDetails: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginBottom: 2,
  },
  accountSortCode: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#9CA3AF',
  },
  primaryBadge: {
    backgroundColor: '#0B9E5820',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  primaryBadgeText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
    color: '#0B9E58',
  },
  accountActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FAFFFA',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
  },
  deleteButton: {
    borderColor: '#EF4444',
  },
  deleteButtonText: {
    color: '#EF4444',
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
  },
});

