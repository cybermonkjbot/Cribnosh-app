import { Stack } from 'expo-router';

export default function CartLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: "card",
        animation: "slide_from_right",
        contentStyle: { backgroundColor: "white" },
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{ title: 'Cart' }} 
      />
      <Stack.Screen 
        name="sides" 
        options={{ title: 'Sides & Extras' }} 
      />
      <Stack.Screen 
        name="payment-method" 
        options={{ title: 'Payment Method' }} 
      />
      <Stack.Screen 
        name="payment" 
        options={{ title: 'Payment' }} 
      />
      <Stack.Screen 
        name="success" 
        options={{ title: 'Order Confirmed' }} 
      />
      <Stack.Screen 
        name="choose-friend" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
        }} 
      />
      <Stack.Screen 
        name="map" 
        options={{ 
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
        }} 
      />
    </Stack>
  );
}