// react-native-reanimated must be imported FIRST
import 'react-native-reanimated';

import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { ChefAuthProvider } from '@/contexts/ChefAuthContext';
import { getConvexReactClient } from '@/lib/convexClient';
import { ToastProvider } from '@/lib/ToastContext';
import { ConvexProvider } from 'convex/react';
import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Updates from 'expo-updates';
import { useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { LocationTracker } from '@/components/LocationTracker';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const convex = getConvexReactClient();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);

  // Handle updates with proper error handling to prevent crashes
  useEffect(() => {
    let isMounted = true;

    async function initializeApp() {
      try {
        // Wait a bit to ensure app is fully initialized before checking updates
        await new Promise(resolve => setTimeout(resolve, 2000));

        if (!isMounted) {
          return;
        }

        // Only check for updates in production builds, not in development or Expo Go
        if (__DEV__ || Constants.executionEnvironment === 'storeClient') {
          setIsReady(true);
          return;
        }

        // Check if Updates is available and enabled
        if (!Updates.isEnabled || typeof Updates.checkForUpdateAsync !== 'function') {
          setIsReady(true);
          return;
        }

        // Check for updates with error handling
        try {
          const update = await Updates.checkForUpdateAsync();

          if (!isMounted) {
            return;
          }

          if (update.isAvailable) {
            // Fetch update in background - don't block app startup
            Updates.fetchUpdateAsync().catch((error) => {
              // Silently handle fetch errors - app should continue to work
              console.warn('Update fetch failed, will retry later:', error);
            });
          }
        } catch (error) {
          // Silently handle update check errors - app should continue to work
          // This prevents crashes if update service is unavailable
          console.warn('Update check failed, continuing without update:', error);
        }
      } catch (error) {
        // Catch any unexpected errors during initialization
        console.warn('App initialization error:', error);
      } finally {
        if (isMounted) {
          setIsReady(true);
        }
      }
    }

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, []);

  // Hide splash screen once ready
  useEffect(() => {
    if (isReady) {
      const hideSplash = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 100));
          await SplashScreen.hideAsync();
        } catch (error: any) {
          // Silently handle splash screen errors
          if (error?.message?.includes('No native splash screen registered')) {
            return;
          }
          console.warn('SplashScreen.hideAsync error:', error);
        }
      };
      hideSplash();
    }
  }, [isReady]);

  return (
    <ErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <ConvexProvider client={convex}>
            <ToastProvider>
              <ChefAuthProvider>
                <LocationTracker />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                </Stack>
              </ChefAuthProvider>
            </ToastProvider>
          </ConvexProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

