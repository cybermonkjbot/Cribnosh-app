// react-native-reanimated must be imported FIRST, before any other imports
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';

import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { AuthProvider } from '@/contexts/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { store } from '@/store/index';
import { AppProvider } from '@/utils/AppContext';
import { EmotionsUIProvider } from '@/utils/EmotionsUIContext';
import { GlobalToastContainer } from '../components/ui/GlobalToastContainer';
import { handleDeepLink } from '../lib/deepLinkHandler';
import { ToastProvider } from '../lib/ToastContext';
import { logMockStatus } from '../utils/mockConfig';

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
    return (
      <AnimatedSplashScreen
        onAnimationComplete={handleSplashComplete}
        duration={2000}
      />
    );
  }

  return (
    <Provider store={store}>
      <AuthProvider>
        <EmotionsUIProvider>
          <AppProvider>
            <ToastProvider>
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
                        <Stack.Screen name="+not-found" />
                      </Stack>
                      <StatusBar translucent backgroundColor="transparent" barStyle={colorScheme === 'dark' ? 'light-content' : 'dark-content'} />
                    </ThemeProvider>
                  </BottomSheetModalProvider>
                  <GlobalToastContainer />
                </SafeAreaProvider>
              </GestureHandlerRootView>
            </ToastProvider>
          </AppProvider>
        </EmotionsUIProvider>
      </AuthProvider>
    </Provider>
  );
}