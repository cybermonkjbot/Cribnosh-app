import ChooseFriend from '@/components/ui/ChooseFriend';
import { Stack, useRouter } from 'expo-router';
import React from 'react';

export default function ChooseFriendModal() {
  const router = useRouter();

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback if we can't go back
      router.replace('/orders/cart');
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <ChooseFriend isOpen={true} onClick={handleClose} />
    </>
  );
}

