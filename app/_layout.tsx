import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// import 'react-native-reanimated';
import * as Linking from 'expo-linking';
import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { useColorScheme } from '@/hooks/useColorScheme';
import { AppProvider } from '@/utils/AppContext';
import { EmotionsUIProvider } from '@/utils/EmotionsUIContext';
import { ToastProvider } from '../lib/ToastContext';
import { handleDeepLink } from '../lib/deepLinkHandler';

// Disable Reanimated strict mode warnings
configureReanimatedLogger({
  level: ReanimatedLogLevel.error,
  strict: false,
});

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fontsLoaded, fontError] = useFonts({
    'Space Mono': require('../assets/fonts/SpaceMono-Regular.ttf'),
  });
  const [showSplash, setShowSplash] = useState(true);

  // Initialize deep link handler
  useEffect(() => {
    const initializeDeepLinks = async () => {
      try {
        // Handle deep links when app is already running
        const subscription = Linking.addEventListener("url", handleDeepLink);

        // Handle deep links when app is opened from a closed state
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl && (initialUrl.includes('cribnoshapp://') || initialUrl.includes('cribnosh.com'))) {
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
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide the default splash screen
      SplashScreen.hideAsync();
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
    return <AnimatedSplashScreen onAnimationComplete={handleSplashComplete} duration={2000} />;
  }

  return (
    <EmotionsUIProvider>
      <AppProvider>
        <ToastProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack>
                  <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                  <Stack.Screen name="shared-ordering" options={{ headerShown: false }} />
                  <Stack.Screen name="shared-link" options={{ headerShown: false }} />
                  <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </ToastProvider>
      </AppProvider>
    </EmotionsUIProvider>
  );
}
