import { Stack, useRouter } from 'expo-router';
import { EventChefRequestScreen } from '@/components/ui/EventChefRequestScreen';

export default function EventChefRequestModal() {
  const router = useRouter();

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <>
      <Stack.Screen 
        options={{ 
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }} 
      />
      <EventChefRequestScreen onClose={handleClose} />
    </>
  );
}

