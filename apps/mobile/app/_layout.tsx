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
import { useCallback, useEffect, useState } from 'react';
import { Platform, StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { STRIPE_CONFIG } from '@/constants/api';
import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { store } from '@/store/index';
import { AppProvider } from '@/utils/AppContext';
import { EmotionsUIProvider } from '@/utils/EmotionsUIContext';
import { GlobalToastContainer } from '../components/ui/GlobalToastContainer';
import { ToastProvider } from '../lib/ToastContext';
import { handleDeepLink } from '../lib/deepLinkHandler';
import { logMockStatus } from '../utils/mockConfig';

// Check if we're running in Expo Go (which doesn't support native modules like Stripe)
const isExpoGo = Constants.executionEnvironment === 'storeClient';

// Conditionally import StripeProvider - only available in development builds
let StripeProvider: any = null;
if (!isExpoGo) {
  try {
    StripeProvider = require('@stripe/stripe-react-native').StripeProvider;
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
        } catch (error) {
          // Silently handle the error - the splash screen will auto-hide anyway
          console.warn('SplashScreen.hideAsync error:', error);
        }
      };
      hideSplash();
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
                name="payment-settings" 
                options={{ 
                  headerShown: false,
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
  const wrappedContent = StripeProvider && STRIPE_CONFIG.publishableKey ? (
    <StripeProvider publishableKey={STRIPE_CONFIG.publishableKey}>
      {appContent}
    </StripeProvider>
  ) : (
    appContent
  );

  return (
    <Provider store={store}>
      <AuthProvider>
        <EmotionsUIProvider>
          <AppProvider>
            <ToastProvider>
              {wrappedContent}
            </ToastProvider>
          </AppProvider>
        </EmotionsUIProvider>
      </AuthProvider>
    </Provider>
  );
}