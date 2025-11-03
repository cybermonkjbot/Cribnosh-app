import { useFonts as useExpoFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback } from 'react';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export function useFonts() {
  const [fontsLoaded, fontError] = useExpoFonts({
    'Protest Strike': require('../assets/fonts/ProtestStrike-Regular.ttf'),
    'Poppins': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
    'SF Pro': require('../assets/fonts/SFPro-Regular.ttf'),
    'SF Pro-Medium': require('../assets/fonts/SFPro-Medium.ttf'),
    'SF Pro-SemiBold': require('../assets/fonts/SFPro-SemiBold.ttf'),
    'SF Pro-Bold': require('../assets/fonts/SFPro-Bold.ttf'),
    'ADLaM Display': require('../assets/fonts/ADLaMDisplay-Regular.ttf'),
    'Lato': require('../assets/fonts/Lato-Regular.ttf'),
    'Space Mono': require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Mukta': require('../assets/fonts/Mukta-Regular.ttf'),
    'Mukta-Bold': require('../assets/fonts/Mukta-Bold.ttf'),
    'Mukta-ExtraBold': require('../assets/fonts/Mukta-ExtraBold.ttf'),
    'Inter': require('../assets/fonts/Inter-Regular.ttf'),
    'Inter-Bold': require('../assets/fonts/Inter-Bold.ttf'),
  });

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  return { fontsLoaded, fontError, onLayoutRootView };
} 