import { useToast } from '@/lib/ToastContext';
import { usePayments } from '@/hooks/usePayments';
import { CardField, useStripe } from '@stripe/stripe-react-native';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { SvgXml } from 'react-native-svg';
import { BottomSheetBase } from '../BottomSheetBase';
import { STRIPE_CONFIG } from '@/constants/api';

// Close icon SVG
const closeIconSVG = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M18 6L6 18M6 6L18 18" stroke="#111827" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

interface AddCardSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddCardSheet({
  isVisible,
  onClose,
  onSuccess,
}: AddCardSheetProps) {
  const snapPoints = useMemo(() => ['90%'], []);
  const { showToast } = useToast();
  const stripe = useStripe();
  const { confirmSetupIntent, isApplePaySupported, isGooglePaySupported } = stripe || {};
  const [isProcessing, setIsProcessing] = useState(false);
  const [setAsDefault, setSetAsDefault] = useState(false);
  const [cardDetailsComplete, setCardDetailsComplete] = useState(false);

  const { addPaymentMethod, getPaymentMethods, createSetupIntent } = usePayments();

  // Debug: Log Stripe initialization status
  if (__DEV__) {
    console.log('AddCardSheet - Stripe Status:', {
      hasStripe: !!stripe,
      hasConfirmSetupIntent: !!confirmSetupIntent,
      publishableKeySet: !!STRIPE_CONFIG.publishableKey,
      publishableKeyLength: STRIPE_CONFIG.publishableKey?.length || 0,
      publishableKeyPrefix: STRIPE_CONFIG.publishableKey?.substring(0, 20) || 'MISSING',
      isApplePaySupported,
      isGooglePaySupported,
      // Check if stripe object has the publishable key internally
      stripeInitialized: stripe !== null,
    });
  }

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

    // Check if Stripe is initialized
    if (!stripe || !confirmSetupIntent) {
      showToast({
        type: 'error',
        title: 'Stripe Not Initialized',
        message: 'Stripe is not properly configured. Please check your environment variables and restart the app.',
        duration: 5000,
      });
      console.error('Stripe not initialized:', { 
        stripe, 
        confirmSetupIntent,
        publishableKey: STRIPE_CONFIG.publishableKey ? `${STRIPE_CONFIG.publishableKey.substring(0, 20)}...` : 'MISSING',
        publishableKeyLength: STRIPE_CONFIG.publishableKey?.length || 0,
      });
      return;
    }

    // Validate publishable key is set
    if (!STRIPE_CONFIG.publishableKey || STRIPE_CONFIG.publishableKey.length === 0) {
      showToast({
        type: 'error',
        title: 'Stripe Configuration Error',
        message: 'Stripe publishable key is missing. Please check your environment variables.',
        duration: 5000,
      });
      console.error('Stripe publishable key is missing:', {
        fromEnv: !!process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        configKey: STRIPE_CONFIG.publishableKey,
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Step 1: Create setup intent
      const setupIntentResult = await createSetupIntent();

      if (!setupIntentResult || !setupIntentResult.success || !setupIntentResult.data?.clientSecret) {
        const errorMsg = setupIntentResult?.data?.error || 'Failed to create setup intent';
        console.error('Setup Intent Creation Failed:', {
          result: setupIntentResult,
          error: errorMsg,
        });
        throw new Error(errorMsg);
      }

      const { clientSecret } = setupIntentResult.data;

      // Debug: Log setup intent details and verify account match
      if (__DEV__) {
        // Extract account ID from publishable key (format: pk_test_ACCOUNTID...)
        const publishableKeyAccountId = STRIPE_CONFIG.publishableKey?.substring(8, 24) || 'N/A';
        // Extract account ID from client secret (format: seti_ACCOUNTID...)
        const clientSecretAccountId = clientSecret?.substring(5, 21) || 'N/A';
        const accountsMatch = publishableKeyAccountId === clientSecretAccountId;
        
        console.log('Setup Intent Details:', {
          hasClientSecret: !!clientSecret,
          clientSecretPrefix: clientSecret?.substring(0, 30) || 'N/A',
          clientSecretLength: clientSecret?.length || 0,
          publishableKeyPrefix: STRIPE_CONFIG.publishableKey?.substring(0, 20) || 'N/A',
          publishableKeyLength: STRIPE_CONFIG.publishableKey?.length || 0,
          publishableKeyAccountId,
          clientSecretAccountId,
          accountsMatch,
        });
        
        if (!accountsMatch) {
          console.error('⚠️ ACCOUNT MISMATCH: Publishable key and setup intent are from different Stripe accounts!');
          console.error('   This will cause "API key" errors. Ensure both keys are from the same account.');
        }
      }

      // Validate clientSecret format
      if (!clientSecret || !clientSecret.startsWith('seti_')) {
        console.error('Invalid clientSecret format:', {
          clientSecret: clientSecret?.substring(0, 50),
          expectedPrefix: 'seti_',
        });
        throw new Error('Invalid setup intent client secret received from server');
      }

      // Step 2: Confirm setup intent with card details
      // Must use the hook version to ensure publishable key is available
      if (!confirmSetupIntent) {
        throw new Error('Stripe confirmSetupIntent is not available. Please ensure StripeProvider is properly configured with a valid publishable key.');
      }
      
      if (__DEV__) {
        console.log('Confirming Setup Intent:', {
          hasConfirmSetupIntent: !!confirmSetupIntent,
          clientSecretPrefix: clientSecret.substring(0, 20),
          publishableKeySet: !!STRIPE_CONFIG.publishableKey,
        });
      }
      
      const { error: stripeError, setupIntent } = await confirmSetupIntent(
        clientSecret,
        {
          paymentMethodType: 'Card' as const,
        }
      );

      if (stripeError) {
        console.error('Stripe Confirmation Error:', {
          error: stripeError,
          code: stripeError.code,
          message: stripeError.message,
          type: stripeError.type,
        });
        throw new Error(stripeError.message || 'Failed to confirm setup intent');
      }

      if (!setupIntent?.paymentMethodId) {
        throw new Error('Payment method ID not found in setup intent');
      }

      // Step 3: Add payment method to backend
      const paymentMethod = await addPaymentMethod({
        payment_method_id: setupIntent.paymentMethodId,
        type: 'card',
        set_as_default: setAsDefault,
      });

      if (!paymentMethod) {
        throw new Error('Failed to add payment method');
      }

      // Refetch payment methods to show the new card
      await getPaymentMethods();

      showToast({
        type: 'success',
        title: 'Card Added',
        message: 'Your payment card has been added successfully',
        duration: 3000,
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

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
    paddingHorizontal: 16,
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

