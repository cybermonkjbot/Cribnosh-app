import { Stack } from 'expo-router';

export default function SharedLinkLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="lets-fix-that" options={{ headerShown: false }} />
      <Stack.Screen name="Try-something-new" options={{ headerShown: false }} />
    </Stack>
  );
}
