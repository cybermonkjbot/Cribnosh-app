import { useToast } from '@/lib/ToastContext';
import { usePayments } from '@/hooks/usePayments';
import { useStripe } from '@stripe/stripe-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { SvgXml } from 'react-native-svg';
import { AddCardSheet } from './AddCardSheet';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

const PREDEFINED_AMOUNTS = [
  { label: '£10', value: 1000 },
  { label: '£25', value: 2500 },
  { label: '£50', value: 5000 },
  { label: '£100', value: 10000 },
];

interface TopUpBalanceSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

export function TopUpBalanceSheet({
  isVisible,
  onClose,
}: TopUpBalanceSheetProps) {
  const insets = useSafeAreaInsets();
  const { showToast } = useToast();
  const { confirmPayment } = useStripe();
  const { topUpBalance, getPaymentMethods, getBalance } = usePayments();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethodsData, setPaymentMethodsData] = useState<any>(null);
  const [isAddCardSheetVisible, setIsAddCardSheetVisible] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const hiddenInputRef = useRef<TextInput>(null);

  // Load payment methods when sheet becomes visible
  useEffect(() => {
    if (isVisible) {
      const loadPaymentMethods = async () => {
        try {
          const methods = await getPaymentMethods();
          if (methods) {
            setPaymentMethodsData({ data: methods });
          } else {
            setPaymentMethodsData({ data: [] });
          }
        } catch (error) {
          // Error already handled in hook
          setPaymentMethodsData({ data: [] });
        }
      };
      loadPaymentMethods();
    }
  }, [isVisible, getPaymentMethods]);

  // Refresh payment methods when AddCardSheet closes
  const handleCloseAddCardSheet = useCallback(() => {
    setIsAddCardSheetVisible(false);
  }, []);

  // Handle successful card addition
  const handleCardAdded = useCallback(async () => {
    // Refresh payment methods after adding a card
    const methods = await getPaymentMethods();
    if (methods) {
      setPaymentMethodsData({ data: methods });
    }
  }, [getPaymentMethods]);

  const handleClose = useCallback(() => {
    onClose();
    // Reset state when closing
    setSelectedAmount(null);
    setCustomAmount('');
    setSelectedPaymentMethod(null);
    setIsProcessing(false);
    setIsInputFocused(false);
  }, [onClose]);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
    setIsInputFocused(false);
  };

  const handleCustomAmountChange = (value: string) => {
    // Remove non-numeric characters except decimal point
    const cleaned = value.replace(/[^0-9.]/g, '');
    setCustomAmount(cleaned);
    setSelectedAmount(null);
  };

  const getAmountInPence = (): number | null => {
    if (selectedAmount) {
      return selectedAmount;
    }
    if (customAmount) {
      const amount = parseFloat(customAmount);
      if (!isNaN(amount) && amount >= 1) {
        return Math.round(amount * 100);
      }
    }
    return null;
  };

  const handleTopUp = async () => {
    const amountInPence = getAmountInPence();
    if (!amountInPence || amountInPence < 100) {
      showToast({
        type: 'error',
        title: 'Invalid Amount',
        message: 'Please select an amount of at least £1.00',
        duration: 3000,
      });
      return;
    }

    // Check if user has payment methods
    const paymentMethods = paymentMethodsData?.data || [];
    if (paymentMethods.length === 0) {
      // No payment methods - open AddCardSheet
      setIsAddCardSheetVisible(true);
      return;
    }

    // Get default payment method if none selected
    const paymentMethodToUse = selectedPaymentMethod || 
      paymentMethodsData?.data?.find(m => m.is_default)?.id || 
      null;

    setIsProcessing(true);
    try {
      // Create payment intent (with or without payment method)
      const paymentIntent = await topUpBalance(
        amountInPence,
        paymentMethodToUse || undefined
      );

      if (!paymentIntent || !paymentIntent.clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      // Prepare confirmation options
      // When a payment method is provided, it's already attached to the payment intent on the server
      // We still need to confirm it, but we don't need to collect card details
      // If no payment method is provided, we need to collect card details
      const confirmOptions = paymentMethodToUse 
        ? undefined // Payment method already attached - confirm without options (SDK handles 3D Secure if needed)
        : { paymentMethodType: 'Card' as const }; // No payment method - collect card details

      // Confirm payment using Stripe SDK
      const { error: stripeError, paymentIntent: confirmedIntent } = await confirmPayment(
        paymentIntent.clientSecret,
        confirmOptions
      );

      if (stripeError) {
        // If error is about missing card details, offer to add a card
        if (stripeError.message?.includes('Card details not complete') || 
            stripeError.message?.includes('card') ||
            stripeError.code === 'card_declined' ||
            !paymentMethodToUse) {
          setIsProcessing(false);
          showToast({
            type: 'error',
            title: 'Payment Method Required',
            message: 'Please add a payment method to continue',
            duration: 3000,
          });
          // Open add card sheet if no payment methods exist
          const methods = paymentMethodsData?.data || [];
          if (methods.length === 0) {
            setIsAddCardSheetVisible(true);
          }
          return;
        }
        throw new Error(stripeError.message || 'Payment confirmation failed');
      }

      if (confirmedIntent?.status === 'Succeeded') {
        // Refetch balance to show updated amount
        await getBalance();

        showToast({
          type: 'success',
          title: 'Balance Topped Up',
          message: `Successfully added £${(amountInPence / 100).toFixed(2)} to your balance`,
          duration: 3000,
        });

        // Close sheet after a short delay
        setTimeout(() => {
          onClose();
          setSelectedAmount(null);
          setCustomAmount('');
          setSelectedPaymentMethod(null);
          setIsProcessing(false);
        }, 1500);
      } else if (confirmedIntent?.status === 'RequiresAction') {
        // Payment requires additional action (e.g., 3D Secure)
        // The Stripe SDK should handle this automatically, but we'll show a message
        showToast({
          type: 'info',
          title: 'Payment Requires Action',
          message: 'Please complete the authentication step',
          duration: 3000,
        });
        setIsProcessing(false);
      } else {
        throw new Error(`Payment status: ${confirmedIntent?.status || 'unknown'}`);
      }
    } catch (error: any) {
      console.error('Error topping up balance:', error);
      const errorMessage = error?.message || 'Failed to top up balance. Please try again.';
      
      // If error is about missing card details or no payment method, offer to add a card
      if (errorMessage.includes('Card details not complete') || 
          errorMessage.includes('card') ||
          !paymentMethodToUse) {
        const methods = paymentMethodsData?.data || [];
        if (methods.length === 0) {
          // Open AddCardSheet instead of showing error
          setIsAddCardSheetVisible(true);
        } else {
          showToast({
            type: 'error',
            title: 'Top Up Failed',
            message: errorMessage,
            duration: 4000,
          });
        }
      } else {
        showToast({
          type: 'error',
          title: 'Top Up Failed',
          message: errorMessage,
          duration: 4000,
        });
      }
      setIsProcessing(false);
    }
  };

  const amountInPence = getAmountInPence();
  const displayAmount = amountInPence ? `£${(amountInPence / 100).toFixed(2)}` : '£0.00';
  const paymentMethods = paymentMethodsData?.data || [];

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.container}>
            <View style={[styles.header, { paddingTop: Math.max(insets.top - 8, 0) }]}>
              <Text style={styles.title}>Top Up Balance</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton} disabled={isProcessing}>
                <SvgXml xml={closeIconSVG} width={24} height={24} />
              </TouchableOpacity>
            </View>

          {isInputFocused ? (
            // Focused state - only show amount entry
            <View style={styles.focusedContainer}>
              <View style={styles.focusedContent}>
              {/* Active Amount Display - acts as input */}
              <TouchableOpacity
                style={styles.activeAmountDisplay}
                onPress={() => {
                  hiddenInputRef.current?.focus();
                }}
                activeOpacity={1}
              >
                <Text style={styles.activeAmountText}>
                  {customAmount ? `£${customAmount}` : '£0.00'}
                </Text>
              </TouchableOpacity>
              
              {/* Hidden Input Field - for keyboard input */}
              <TextInput
                ref={hiddenInputRef}
                style={styles.hiddenInput}
                value={customAmount}
                onChangeText={handleCustomAmountChange}
                keyboardType="decimal-pad"
                editable={!isProcessing}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                autoFocus
              />
              
              {/* Done Button */}
              <TouchableOpacity
                style={styles.doneButton}
                onPress={() => {
                  hiddenInputRef.current?.blur();
                  setIsInputFocused(false);
                }}
                disabled={isProcessing}
              >
                <Text style={styles.doneButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          // Normal state - show all content
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Amount Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Select Amount</Text>
              <View style={styles.amountGrid}>
                {PREDEFINED_AMOUNTS.map((amount) => (
                  <TouchableOpacity
                    key={amount.value}
                    style={[
                      styles.amountButton,
                      selectedAmount === amount.value && styles.amountButtonSelected,
                    ]}
                    onPress={() => handleAmountSelect(amount.value)}
                    disabled={isProcessing}
                  >
                    <Text
                      style={[
                        styles.amountButtonText,
                        selectedAmount === amount.value && styles.amountButtonTextSelected,
                      ]}
                    >
                      {amount.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <Text style={styles.orText}>or</Text>
              <View style={styles.customAmountContainer}>
                <Text style={styles.customAmountLabel}>Custom Amount</Text>
                
                <View style={styles.customAmountInputContainer}>
                  <Text style={styles.currencySymbol}>£</Text>
                  <TextInput
                    style={styles.customAmountInput}
                    placeholder="0.00"
                    placeholderTextColor="#9CA3AF"
                    value={customAmount}
                    onChangeText={handleCustomAmountChange}
                    keyboardType="decimal-pad"
                    editable={!isProcessing}
                    onFocus={() => setIsInputFocused(true)}
                    onBlur={() => setIsInputFocused(false)}
                  />
                </View>
              </View>
            </View>

            {/* Payment Method Selection */}
            {paymentMethods.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Payment Method</Text>
                <View style={styles.paymentMethodsList}>
                  {paymentMethods.map((method) => (
                    <TouchableOpacity
                      key={method.id}
                      style={[
                        styles.paymentMethodItem,
                        selectedPaymentMethod === method.id && styles.paymentMethodItemSelected,
                        method.is_default && !selectedPaymentMethod && styles.paymentMethodItemDefault,
                      ]}
                      onPress={() => setSelectedPaymentMethod(method.id)}
                      disabled={isProcessing}
                    >
                      <View style={styles.paymentMethodLeft}>
                        <Text style={styles.paymentMethodText}>
                          {method.type === 'apple_pay'
                            ? 'Apple Pay'
                            : method.last4
                            ? `... ${method.last4}`
                            : 'Card'}
                        </Text>
                        {method.is_default && !selectedPaymentMethod && (
                          <Text style={styles.defaultLabel}>(Default)</Text>
                        )}
                      </View>
                      <View
                        style={[
                          styles.radioButton,
                          (selectedPaymentMethod === method.id || (method.is_default && !selectedPaymentMethod)) &&
                            styles.radioButtonSelected,
                        ]}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                <TouchableOpacity
                  style={styles.addCardButton}
                  onPress={() => setIsAddCardSheetVisible(true)}
                  disabled={isProcessing}
                >
                  <Text style={styles.addCardButtonText}>+ Add New Card</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Top Up Button */}
            <TouchableOpacity
              style={[styles.topUpButton, (!amountInPence || isProcessing) && styles.topUpButtonDisabled]}
              onPress={handleTopUp}
              disabled={!amountInPence || isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.topUpButtonText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        )}
        </View>

          {/* Add Card Sheet */}
          <AddCardSheet
            isVisible={isAddCardSheetVisible}
            onClose={handleCloseAddCardSheet}
            onSuccess={handleCardAdded}
          />
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    flex: 1,
    textAlign: 'left',
  },
  closeButton: {
    marginLeft: 16,
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Archivo',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#094327',
    marginBottom: 16,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  amountButton: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  amountButtonSelected: {
    backgroundColor: '#F4FFF5',
    borderColor: '#094327',
  },
  amountButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
  amountButtonTextSelected: {
    color: '#094327',
  },
  orText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 16,
  },
  customAmountContainer: {
    marginBottom: 16,
  },
  customAmountLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#111827',
    marginBottom: 8,
  },
  focusedContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  focusedContent: {
    flex: 1,
    justifyContent: 'center',
    gap: 32,
    minHeight: 200,
  },
  activeAmountDisplay: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 32,
    borderWidth: 2,
    borderColor: '#094327',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 120,
  },
  activeAmountDisplayFocused: {
    backgroundColor: '#F0FDF4',
    borderColor: '#094327',
    borderWidth: 2,
  },
  activeAmountText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 48,
    lineHeight: 56,
    color: '#094327',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  customAmountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  customAmountInputContainerFocused: {
    borderColor: '#094327',
    backgroundColor: '#FAFFFA',
  },
  currencySymbol: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#094327',
    marginRight: 8,
  },
  customAmountInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    paddingVertical: 16,
  },
  paymentMethodsList: {
    gap: 12,
  },
  paymentMethodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  paymentMethodItemSelected: {
    backgroundColor: '#F4FFF5',
    borderColor: '#094327',
  },
  paymentMethodItemDefault: {
    borderColor: '#D1D5DB',
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentMethodText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
  },
  defaultLabel: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginLeft: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  radioButtonSelected: {
    borderColor: '#0B9E58',
    backgroundColor: '#0B9E58',
  },
  topUpButton: {
    backgroundColor: '#094327',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  topUpButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  topUpButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  addCardButton: {
    marginTop: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#094327',
    borderStyle: 'dashed',
    borderRadius: 12,
  },
  addCardButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#094327',
  },
  doneButton: {
    backgroundColor: '#094327',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
  },
  doneButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
  noPaymentMethodContainer: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FEE2E2',
  },
  noPaymentMethodText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#991B1B',
    textAlign: 'center',
    marginBottom: 16,
  },
  addCardButtonPrimary: {
    backgroundColor: '#094327',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 200,
  },
  addCardButtonPrimaryText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
});

