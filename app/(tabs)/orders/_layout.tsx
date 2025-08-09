import { Stack } from 'expo-router';

export default function OrdersLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Orders' }} 
      />
      <Stack.Screen 
        name="group" 
        options={{ title: 'Group Orders' }} 
      />
      <Stack.Screen 
        name="cart" 
        options={{ title: 'Cart' }} 
      />
    </Stack>
  );
}