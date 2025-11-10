import { ConvexProvider } from 'convex/react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DriverErrorBoundary } from '../components/DriverErrorBoundary';
import { EnhancedDriverAuthProvider } from '../contexts/EnhancedDriverAuthContext';
import { convex } from '../lib/convex';

export default function RootLayout() {
  return (
    <DriverErrorBoundary>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ConvexProvider client={convex}>
          <EnhancedDriverAuthProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="auth-entry" />
              <Stack.Screen name="email-auth" />
              <Stack.Screen name="phone-auth" />
              <Stack.Screen name="otp-auth" />
              <Stack.Screen name="login" />
              <Stack.Screen name="register" />
              <Stack.Screen name="registration-success" />
              <Stack.Screen name="dashboard" />
              <Stack.Screen name="orders" />
              <Stack.Screen name="order-details" />
              <Stack.Screen name="active-order" />
              <Stack.Screen name="profile" />
              <Stack.Screen name="earnings" />
              <Stack.Screen name="withdrawals" />
              <Stack.Screen name="settings" />
            </Stack>
          </EnhancedDriverAuthProvider>
        </ConvexProvider>
      </GestureHandlerRootView>
    </DriverErrorBoundary>
  );
}
