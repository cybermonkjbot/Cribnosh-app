import { Stack } from 'expo-router';
import { SafeAreaView, StatusBar } from 'react-native';
import { UserAccountDetailsScreen } from '../components/UserAccountDetailsScreen';

export default function AccountDetailsScreen() {
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
        <UserAccountDetailsScreen userName="Joshua Anop" />
      </SafeAreaView>
    </>
  );
}
