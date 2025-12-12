import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { ClaimOfferModal } from '@/components/ui/ClaimOfferModal';
import { useEffect, useState } from 'react';

import { useOffersAndTreats } from '@/hooks/useOffersAndTreats';

export default function ClaimOfferScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { getActiveOffers } = useOffersAndTreats();
  const [offer, setOffer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadOffer = async () => {
      try {
        const offerId = params.offerId as string;
        if (!offerId) {
          router.back();
          return;
        }

        const result = await getActiveOffers('all');
        if (result.success && result.data?.offers) {
          const foundOffer = result.data.offers.find(
            (o: any) => o.offer_id === offerId
          );
          if (foundOffer) {
            setOffer(foundOffer);
          } else {
            router.back();
          }
        } else {
          router.back();
        }
      } catch (error) {
        console.error('Error loading offer:', error);
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    loadOffer();
  }, [params.offerId, getActiveOffers, router]);

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  if (isLoading || !offer) {
    return null;
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: true,
        }}
      />
      <ClaimOfferModal onClose={handleClose} offer={offer} />
    </>
  );
}

