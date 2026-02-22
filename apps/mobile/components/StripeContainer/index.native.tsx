import { STRIPE_CONFIG } from '@/constants/api';
import { StripeProvider } from '@stripe/stripe-react-native';
import Constants from 'expo-constants';
import React from 'react';

// Check if we're running in Expo Go
const isExpoGo = Constants.executionEnvironment === 'storeClient';

interface StripeContainerProps {
    children: React.ReactElement | React.ReactElement[];
}

export function StripeContainer({ children }: StripeContainerProps) {
    // Don't render StripeProvider in Expo Go or if key is missing/invalid
    const isValidKey = STRIPE_CONFIG.publishableKey &&
        (STRIPE_CONFIG.publishableKey.startsWith('pk_test_') || STRIPE_CONFIG.publishableKey.startsWith('pk_live_'));

    if (isExpoGo || !isValidKey) {
        if (__DEV__ && !isValidKey && !isExpoGo) {
            console.warn('⚠️ Stripe publishable key is invalid or missing. StripeProvider will not wrap content.');
        }
        return <>{children}</>;
    }

    return (
        <StripeProvider
            publishableKey={STRIPE_CONFIG.publishableKey!}
            merchantIdentifier="merchant.com.cribnosh.co.uk"
            urlScheme="cribnoshapp"
            threeDSecureParams={{
                timeout: 5,
            }}
        >
            {children}
        </StripeProvider>
    );
}
