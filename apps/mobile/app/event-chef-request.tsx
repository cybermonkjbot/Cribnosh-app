import { Stack, useRouter } from 'expo-router';
import { EventFoodCreatorRequestScreen } from '@/components/ui/EventFoodCreatorRequestScreen';

export default function EventFoodCreatorRequestModal() {
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
      <EventFoodCreatorRequestScreen onClose={handleClose} />
    </>
  );
}

