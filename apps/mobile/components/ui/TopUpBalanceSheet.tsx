import { useToast } from '@/lib/ToastContext';
import { useGetCribnoshBalanceQuery, useGetPaymentMethodsQuery, useTopUpBalanceMutation } from '@/store/customerApi';
import { useStripe } from '@stripe/stripe-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BottomSheetBase } from '../BottomSheetBase';

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
  const snapPoints = useMemo(() => ['90%'], []);
  const { showToast } = useToast();
  const { confirmPayment } = useStripe();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [topUpBalance] = useTopUpBalanceMutation();
  const { refetch: refetchBalance } = useGetCribnoshBalanceQuery(undefined, { skip: !isVisible });
  const { data: paymentMethodsData } = useGetPaymentMethodsQuery(undefined, { skip: !isVisible });

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
      // Reset state when closing
      setSelectedAmount(null);
      setCustomAmount('');
      setSelectedPaymentMethod(null);
      setIsProcessing(false);
    }
  }, [onClose]);

  const handleAmountSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount('');
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

    // Get default payment method if none selected
    const paymentMethodToUse = selectedPaymentMethod || 
      paymentMethodsData?.data?.find(m => m.is_default)?.id || 
      null;

    setIsProcessing(true);
    try {
      // Create payment intent (with or without payment method)
      const result = await topUpBalance({
        amount: amountInPence,
        ...(paymentMethodToUse ? { payment_method_id: paymentMethodToUse } : {}),
      }).unwrap();

      if (!result.success || !result.data?.clientSecret) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm payment using Stripe SDK
      // If payment method was provided and payment intent was already confirmed server-side,
      // this will just verify the status. Otherwise, it will collect payment method.
      const { error: stripeError, paymentIntent } = await confirmPayment(
        result.data.clientSecret,
        {
          paymentMethodType: 'Card',
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message || 'Payment confirmation failed');
      }

      if (paymentIntent?.status === 'Succeeded') {
        // Refetch balance to show updated amount
        await refetchBalance();

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
      } else {
        throw new Error('Payment was not completed successfully');
      }
    } catch (error: any) {
      console.error('Error topping up balance:', error);
      const errorMessage = 
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        'Failed to top up balance. Please try again.';
      showToast({
        type: 'error',
        title: 'Top Up Failed',
        message: errorMessage,
        duration: 4000,
      });
      setIsProcessing(false);
    }
  };

  if (!isVisible) {
    return null;
  }

  const amountInPence = getAmountInPence();
  const displayAmount = amountInPence ? `£${(amountInPence / 100).toFixed(2)}` : '£0.00';
  const paymentMethods = paymentMethodsData?.data || [];

  return (
    <BottomSheetBase
      snapPoints={snapPoints}
      index={0}
      onChange={handleSheetChanges}
      enablePanDownToClose={!isProcessing}
      backgroundStyle={{
        backgroundColor: '#FAFFFA',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Top Up Balance</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={isProcessing}>
            <SvgXml xml={closeIconSVG} width={24} height={24} />
          </TouchableOpacity>
        </View>

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
            </View>
          )}

          {/* Top Up Button */}
          <TouchableOpacity
            style={[styles.topUpButton, (!amountInPence || isProcessing) && styles.topUpButtonDisabled]}
            onPress={handleTopUp}
            disabled={!amountInPence || isProcessing || paymentMethods.length === 0}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.topUpButtonText}>Confirm</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </View>
    </BottomSheetBase>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: 'Archivo',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    flex: 1,
    marginRight: 16,
  },
  closeButton: {
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
  customAmountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
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
});

