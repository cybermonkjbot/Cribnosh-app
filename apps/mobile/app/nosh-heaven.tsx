import { Stack, useRouter } from 'expo-router';
import { NoshHeavenModal } from '@/components/ui/NoshHeavenModal';

export default function NoshHeavenModalScreen() {
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
          presentation: 'fullScreenModal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
        }}
      />
      <NoshHeavenModal onClose={handleClose} />
    </>
  );
}

