import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { AddressSelectionModal } from '@/components/ui/AddressSelectionModal';
import { useAddressSelection } from '@/contexts/AddressSelectionContext';
import { CustomerAddress } from '@/types/customer';

export default function SelectAddressModalScreen() {
  const router = useRouter();
  const { onSelectAddress, setSelectedAddress } = useAddressSelection();
  const params = useLocalSearchParams<{
    addressLabel?: 'home' | 'work' | 'custom';
    selectedStreet?: string;
    selectedCity?: string;
    mode?: 'add' | 'select';
  }>();

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSelectAddress = (address: CustomerAddress) => {
    // Store the selected address in context
    setSelectedAddress(address);
    // Call the callback if it exists
    if (onSelectAddress) {
      onSelectAddress(address);
    }
    // Navigate back
    router.back();
  };

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
      <AddressSelectionModal
        onClose={handleClose}
        onSelectAddress={handleSelectAddress}
        addressLabel={params.addressLabel}
        mode={params.mode || (params.addressLabel ? 'add' : 'select')}
        selectedAddress={
          params.selectedStreet && params.selectedCity
            ? {
                street: params.selectedStreet,
                city: params.selectedCity,
              }
            : undefined
        }
      />
    </>
  );
}

