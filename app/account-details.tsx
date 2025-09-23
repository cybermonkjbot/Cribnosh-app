import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { UserAccountDetailsScreen } from '../components/UserAccountDetailsScreen';
import { useAuthContext } from '@/contexts/AuthContext';

export default function AccountDetailsScreen() {
  const { user } = useAuthContext();
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
