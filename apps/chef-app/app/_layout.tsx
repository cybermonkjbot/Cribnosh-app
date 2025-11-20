// react-native-reanimated must be imported FIRST
import 'react-native-reanimated';

import { ConvexProvider } from 'convex/react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getConvexReactClient } from '@/lib/convexClient';
import { ChefAuthProvider } from '@/contexts/ChefAuthContext';
import { ToastProvider } from '@/lib/ToastContext';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

const convex = getConvexReactClient();

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ConvexProvider client={convex}>
          <ToastProvider>
            <ChefAuthProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              </Stack>
            </ChefAuthProvider>
          </ToastProvider>
        </ConvexProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

