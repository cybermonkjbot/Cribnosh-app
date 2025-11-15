// react-native-reanimated must be imported FIRST, before any other imports
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import Constants from 'expo-constants';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useCallback, useEffect, useState } from 'react';
import { Platform, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { STRIPE_CONFIG } from '@/constants/api';
import { AuthProvider } from '@/contexts/AuthContext';
import { AddressSelectionProvider } from '@/contexts/AddressSelectionContext';
import { ModalSheetProvider } from '@/context/ModalSheetContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { store } from '@/store/index';
import { AppProvider } from '@/utils/AppContext';
import { EmotionsUIProvider } from '@/utils/EmotionsUIContext';
import { GlobalToastContainer } from '../components/ui/GlobalToastContainer';
import { ToastProvider } from '../lib/ToastContext';
import { handleDeepLink } from '../lib/deepLinkHandler';
import { logMockStatus } from '../utils/mockConfig';
import { ConvexProvider } from 'convex/react';
import { getConvexReactClient } from '@/lib/convexClient';

// Check if we're running in Expo Go (which doesn't support native modules like Stripe)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Conditionally import StripeProvider and initStripe - only available in development builds
let StripeProvider: any = null;
let initStripe: any = null;
if (!isExpoGo) {
  try {
    const stripeModule = require('@stripe/stripe-react-native');
    StripeProvider = stripeModule.StripeProvider;
    initStripe = stripeModule.initStripe;
  } catch (error) {
    console.warn('StripeProvider not available:', error);
  }
}

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    "Space Mono": require("../assets/fonts/SpaceMono-Regular.ttf"),
  });
  const [showSplash, setShowSplash] = useState(true);
  const colorScheme = useColorScheme();

  // Note: We use StripeProvider instead of initStripe
  // According to Stripe React Native docs, you should use one or the other, not both
  // StripeProvider is the recommended approach and handles initialization automatically

  // Check for updates on app load
  useEffect(() => {
    async function onFetchUpdateAsync() {
      try {
        // Skip updates in development mode or Expo Go
        if (__DEV__) {
          return;
        }

        // Check if Updates is available (not available in Expo Go)
        if (!Updates.isEnabled || !Updates.checkForUpdateAsync) {
          return;
        }

        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          await Updates.fetchUpdateAsync();
          // Reload the app to apply the update
          await Updates.reloadAsync();
        }
      } catch (error) {
        // Silently handle update errors - app should continue to work
        // This is expected in Expo Go where Updates is not available
        if (Constants.executionEnvironment !== 'storeClient') {
          console.warn('Error checking for updates:', error);
        }
      }
    }

    onFetchUpdateAsync();
  }, []);

  // Initialize deep link handler and log mock status
  useEffect(() => {
    const initializeDeepLinks = async () => {
      try {
        // Handle deep links when app is already running
        const subscription = Linking.addEventListener("url", handleDeepLink);

        // Handle deep links when app is opened from a closed state
        const initialUrl = await Linking.getInitialURL();
        if (
          initialUrl &&
          (initialUrl.includes("cribnoshapp://") ||
            initialUrl.includes("cribnosh.com"))
        ) {
          handleDeepLink({ url: initialUrl });
        }

        // Cleanup function
        return () => {
          subscription?.remove();
        };
      } catch (error) {
        console.error("Error initializing deep link handler:", error);
      }
    };

    initializeDeepLinks();

    // Log mock authentication status
    logMockStatus();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the default splash screen with error handling
      // On iOS, the native splash screen might not be registered yet, so we add a small delay
      const hideSplash = async () => {
        // Small delay to ensure native module is ready on iOS
        await new Promise(resolve => setTimeout(resolve, 100));
        try {
          await SplashScreen.hideAsync();
        } catch (error: any) {
          // Silently handle the error - the splash screen will auto-hide anyway
          // On iOS, this can happen when the view controller doesn't have splash screen registered
          // This is safe to ignore as the splash screen will auto-hide
          if (error?.message?.includes('No native splash screen registered')) {
            // Expected error on iOS when splash screen isn't registered for current view controller
            // This can happen with modals or certain navigation patterns
            return;
          }
          // Only log unexpected errors
          console.warn('SplashScreen.hideAsync error:', error);
        }
      };
      hideSplash().catch(() => {
        // Catch any unhandled promise rejections
        // This prevents the error from appearing in console
      });
    }
  }, [fontsLoaded, fontError]);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Show animated splash while fonts are loading
  if (!fontsLoaded && !fontError) {
    return <AnimatedSplashScreen onAnimationComplete={handleSplashComplete} />;
  }

  // Show animated splash for a bit even after fonts load for better UX
  if (showSplash) {
    return (
      <AnimatedSplashScreen
        onAnimationComplete={handleSplashComplete}
        duration={2000}
      />
    );
  }

  // Main app content JSX
  const appContent = (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <BottomSheetModalProvider>
          <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
            <Stack>
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen 
                name="shared-ordering" 
                options={{ 
                  headerShown: false,
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                  gestureEnabled: true,
                }} 
              />
              <Stack.Screen name="shared-link" options={{ headerShown: false }} />
              <Stack.Screen 
                name="sign-in" 
                options={{ 
                  headerShown: false,
                  presentation: 'modal',
                  animationTypeForReplace: 'push'
                }} 
              />
              <Stack.Screen 
                name="event-chef-request" 
                options={{ 
                  headerShown: false,
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                }} 
              />
              <Stack.Screen 
                name="nosh-heaven" 
                options={{ 
                  headerShown: false,
                  presentation: 'fullScreenModal',
                  animation: 'slide_from_bottom',
                  gestureEnabled: true,
                }} 
              />
              <Stack.Screen 
                name="claim-offer" 
                options={{ 
                  headerShown: false,
                  presentation: 'fullScreenModal',
                  animation: 'slide_from_bottom',
                  gestureEnabled: true,
                }} 
              />
              <Stack.Screen 
                name="payment-settings" 
                options={{ 
                  headerShown: false,
                }} 
              />
              <Stack.Screen 
                name="select-address" 
                options={{ 
                  headerShown: false,
                  presentation: 'modal',
                  animation: 'slide_from_bottom',
                  gestureEnabled: true,
                }} 
              />
              <Stack.Screen name="+not-found" />
            </Stack>
            <StatusBar 
              translucent={Platform.OS === 'android' ? true : undefined}
              backgroundColor={Platform.OS === 'android' ? 'transparent' : undefined}
              barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} 
            />
          </ThemeProvider>
        </BottomSheetModalProvider>
        <GlobalToastContainer />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );

  // Wrap in StripeProvider only if available (not in Expo Go)
  // Debug: Log Stripe configuration
  if (__DEV__) {
    console.log('Stripe Configuration:', {
      hasStripeProvider: !!StripeProvider,
      publishableKey: STRIPE_CONFIG.publishableKey ? `${STRIPE_CONFIG.publishableKey.substring(0, 20)}...` : 'MISSING',
      publishableKeyLength: STRIPE_CONFIG.publishableKey?.length || 0,
      isExpoGo,
      willWrap: !!(StripeProvider && STRIPE_CONFIG.publishableKey),
    });
    
    if (!STRIPE_CONFIG.publishableKey) {
      console.error('❌ STRIPE_CONFIG.publishableKey is empty! Stripe features will not work.');
      console.error('   Check: apps/mobile/.env has EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY set');
    }
  }

  // Ensure publishable key is valid before wrapping
  const isValidKey = STRIPE_CONFIG.publishableKey && 
    (STRIPE_CONFIG.publishableKey.startsWith('pk_test_') || STRIPE_CONFIG.publishableKey.startsWith('pk_live_'));
  
  const wrappedContent = StripeProvider && isValidKey ? (
    <StripeProvider 
      publishableKey={STRIPE_CONFIG.publishableKey}
      merchantIdentifier="merchant.com.cribnosh.co.uk"
      urlScheme="cribnosh" // Required for 3D Secure and redirects
      threeDSecureParams={{
        timeout: 5,
      }}
    >
      {appContent}
    </StripeProvider>
  ) : (
    appContent
  );
  
  // Log warning if StripeProvider is not wrapping content
  if (__DEV__ && (!StripeProvider || !isValidKey)) {
    if (!StripeProvider) {
      console.warn('⚠️ StripeProvider is not available. Stripe features will not work.');
    }
    if (!isValidKey) {
      console.warn('⚠️ Stripe publishable key is invalid or missing. StripeProvider will not wrap content.');
      console.warn('   Key:', STRIPE_CONFIG.publishableKey ? `${STRIPE_CONFIG.publishableKey.substring(0, 30)}...` : 'MISSING');
    }
  }

  const convexClient = getConvexReactClient();

  return (
    <Provider store={store}>
      <ConvexProvider client={convexClient}>
        <AuthProvider>
          <EmotionsUIProvider>
            <AppProvider>
              <AddressSelectionProvider>
                <ModalSheetProvider>
                  <ToastProvider>
                    {wrappedContent}
                  </ToastProvider>
                </ModalSheetProvider>
              </AddressSelectionProvider>
            </AppProvider>
          </EmotionsUIProvider>
        </AuthProvider>
      </ConvexProvider>
    </Provider>
  );
}