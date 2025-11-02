import { Stack } from 'expo-router';

export default function SharedOrderingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        presentation: 'card',
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen 
        name="index" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="setup" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="its-on-you" 
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen 
        name="choose-friends" 
        options={{
          headerShown: false,
        }}
      />
    </Stack>
  );
}
