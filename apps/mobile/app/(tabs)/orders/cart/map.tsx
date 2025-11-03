import DeliveryMapScreen from '@/components/ui/DeliveryMapScreen';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';

export default function MapModal() {
  const router = useRouter();
  const { order_id } = useLocalSearchParams<{ order_id?: string }>();
  const orderId = typeof order_id === 'string' ? order_id : undefined;

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      // Fallback if we can't go back
      if (orderId) {
        router.replace(`/orders/cart/on-the-way?order_id=${orderId}`);
      } else {
        router.replace('/orders/cart/on-the-way');
      }
    }
  };

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <DeliveryMapScreen onClose={handleClose} orderId={orderId} />
    </>
  );
}

