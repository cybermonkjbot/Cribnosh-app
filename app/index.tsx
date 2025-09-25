import { useAuthContext } from '@/contexts/AuthContext';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuthContext();
  const router = useRouter();

  console.log("Index component rendered - isAuthenticated:", isAuthenticated, "isLoading:", isLoading);

  useEffect(() => {
    if (!isLoading) {
      console.log("Index: Auth loading complete, navigating to /(tabs)");
      router.replace("/(tabs)");
    }
  }, [isLoading, router]);

  // Also navigate immediately if user is already authenticated
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      console.log("Index: User already authenticated, navigating to /(tabs)");
      router.replace("/(tabs)");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading while checking auth state
  if (isLoading) {
    console.log("Index: Still loading, showing loading screen");
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#02120A' }}>
        <Text style={{ color: 'white' }}>Loading...</Text>
      </View>
    );
  }

  // Show loading screen while navigation happens
  console.log("Index: Showing loading screen while navigating");
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#02120A' }}>
      <Text style={{ color: 'white' }}>Redirecting...</Text>
    </View>
  );
}