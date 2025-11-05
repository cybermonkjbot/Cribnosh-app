import { useToast } from '@/lib/ToastContext';
import { useAddPaymentMethodMutation, useCreateSetupIntentMutation, useGetPaymentMethodsQuery } from '@/store/customerApi';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BottomSheetBase } from '../BottomSheetBase';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface AddCardSheetProps {
  isVisible: boolean;
  onClose: () => void;
}

export function AddCardSheet({
  isVisible,
  onClose,
}: AddCardSheetProps) {
  const snapPoints = useMemo(() => ['90%'], []);
  const { showToast } = useToast();
  const { confirmSetupIntent } = useStripe();
  const [isProcessing, setIsProcessing] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [cardDetailsComplete, setCardDetailsComplete] = useState(false);

  const [createSetupIntent] = useCreateSetupIntentMutation();
  const [addPaymentMethod] = useAddPaymentMethodMutation();
  const { refetch: refetchPaymentMethods } = useGetPaymentMethodsQuery(undefined, { skip: !isVisible });

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      onClose();
      // Reset state when closing
      setIsProcessing(false);
      setSetAsDefault(false);
      setCardDetailsComplete(false);
    }
  }, [onClose]);

  const handleAddCard = async () => {
    if (!cardDetailsComplete) {
      showToast({
        type: 'error',
        title: 'Invalid Card Details',
        message: 'Please enter valid card details',
        duration: 3000,
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Create setup intent
      const setupIntentResult = await createSetupIntent().unwrap();

      if (!setupIntentResult.success || !setupIntentResult.data?.clientSecret) {
        throw new Error('Failed to create setup intent');
      }

      const { clientSecret } = setupIntentResult.data;

      // Step 2: Confirm setup intent with card details
      const { error: stripeError, setupIntent } = await confirmSetupIntent(
        clientSecret,
        {
          paymentMethodType: 'Card',
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message || 'Failed to confirm setup intent');
      }

      if (!setupIntent?.paymentMethodId) {
        throw new Error('Payment method ID not found in setup intent');
      }

      // Step 3: Add payment method to backend
      const addResult = await addPaymentMethod({
        payment_method_id: setupIntent.paymentMethodId,
        type: 'card',
        set_as_default: setAsDefault,
      }).unwrap();

      if (!addResult.success) {
        throw new Error(addResult.message || 'Failed to add payment method');
      }

      // Refetch payment methods to show the new card
      await refetchPaymentMethods();

      showToast({
        type: 'success',
        title: 'Card Added',
        message: 'Your payment card has been added successfully',
        duration: 3000,
      });

      // Close sheet after a short delay
      setTimeout(() => {
        onClose();
        setIsProcessing(false);
        setSetAsDefault(false);
        setCardDetailsComplete(false);
      }, 1500);
    } catch (error: any) {
      console.error('Error adding card:', error);
      const errorMessage = 
        error?.data?.error?.message ||
        error?.data?.message ||
        error?.message ||
        'Failed to add card. Please try again.';
      showToast({
        type: 'error',
        title: 'Add Card Failed',
        message: errorMessage,
        duration: 4000,
      });
      setIsProcessing(false);
    }
  };

  if (!isVisible) {
    return null;
  }

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
          <Text style={styles.title}>Add Card</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} disabled={isProcessing}>
            <SvgXml xml={closeIconSVG} width={24} height={24} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Card Details Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Card Details</Text>
            <View style={styles.cardFieldContainer}>
              <CardField
                postalCodeEnabled={false}
                placeholders={{
                  number: '4242 4242 4242 4242',
                }}
                cardStyle={{
                  backgroundColor: '#FFFFFF',
                  textColor: '#111827',
                  borderWidth: 2,
                  borderColor: '#E5E7EB',
                  borderRadius: 12,
                  fontSize: 16,
                  fontFamily: 'Inter',
                }}
                style={styles.cardField}
                onCardChange={(cardDetails) => {
                  setCardDetailsComplete(cardDetails.complete);
                }}
              />
            </View>
            <Text style={styles.hintText}>
              Enter your card details securely. We use Stripe to process your payment information.
            </Text>
          </View>

          {/* Set as Default Section */}
          <View style={styles.section}>
            <View style={styles.setDefaultContainer}>
              <View style={styles.setDefaultLeft}>
                <Text style={styles.setDefaultTitle}>Set as default payment method</Text>
                <Text style={styles.setDefaultSubtitle}>
                  This card will be used by default for future payments
                </Text>
              </View>
              <Switch
                value={setAsDefault}
                onValueChange={setSetAsDefault}
                disabled={isProcessing}
                trackColor={{ false: '#E5E7EB', true: '#094327' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>

          {/* Add Card Button */}
          <TouchableOpacity
            style={[styles.addCardButton, (!cardDetailsComplete || isProcessing) && styles.addCardButtonDisabled]}
            onPress={handleAddCard}
            disabled={!cardDetailsComplete || isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.addCardButtonText}>Add Card</Text>
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
  cardFieldContainer: {
    marginBottom: 12,
  },
  cardField: {
    width: '100%',
    height: 50,
    marginVertical: 30,
  },
  hintText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
    marginTop: 8,
  },
  setDefaultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  setDefaultLeft: {
    flex: 1,
    marginRight: 16,
  },
  setDefaultTitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#111827',
    marginBottom: 4,
  },
  setDefaultSubtitle: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#6B7280',
  },
  addCardButton: {
    backgroundColor: '#094327',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 32,
  },
  addCardButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  addCardButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#FFFFFF',
  },
});

