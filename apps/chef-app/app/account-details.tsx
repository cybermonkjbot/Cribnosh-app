import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback } from 'react';
import { UserAccountDetailsScreen } from '../components/UserAccountDetailsScreen';
import { useChefAuth } from '@/contexts/ChefAuthContext';

export default function AccountDetailsScreen() {
  const { user, isAuthenticated, isLoading: authLoading } = useChefAuth();
  const router = useRouter();

  // Redirect to home when not authenticated
  useFocusEffect(
    useCallback(() => {
      if (!isAuthenticated && !authLoading) {
        router.replace('/(tabs)');
      }
    }, [isAuthenticated, authLoading, router])
  );

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          title: 'Account Details'
        }} 
      />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAFFFA' }}>
        <StatusBar barStyle="dark-content" backgroundColor="#FAFFFA" />
        <UserAccountDetailsScreen userName={user?.name} />
      </SafeAreaView>
    </>
  );
}
