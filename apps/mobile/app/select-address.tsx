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
    returnPath?: string;
  }>();

  const handleClose = () => {
    // If a return path is provided, navigate to it explicitly
    // Otherwise, try to go back, or fall back to home
    if (params.returnPath) {
      router.replace(params.returnPath as any);
    } else if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)');
    }
  };

  const handleSelectAddress = (address: CustomerAddress) => {
    // Store the selected address in context
    setSelectedAddress(address);
    // Call the callback if it exists and is a function - this will save the address
    // The callback should NOT navigate, just save the address
    if (onSelectAddress && typeof onSelectAddress === 'function') {
      onSelectAddress(address);
    }
    // Note: Don't navigate here - AddressSelectionModal will call onClose() after onSelectAddress
    // which will handle the navigation back to the previous screen
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
                state: '',
                postal_code: '',
                country: '',
              }
            : undefined
        }
      />
    </>
  );
}
