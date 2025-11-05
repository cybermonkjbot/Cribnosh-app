/**
 * Example usage of AddressSelectionSheet component
 * 
 * This component provides a full-featured address selection interface
 * similar to Apple Maps, with saved places, recent addresses, and search.
 */

import { CustomerAddress } from '@/types/customer';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AddressSelectionSheet } from './AddressSelectionSheet';

export function AddressSelectionExample() {
  const [isAddressSheetVisible, setIsAddressSheetVisible] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | undefined>();

  const handleSelectAddress = (address: CustomerAddress) => {
    setSelectedAddress(address);
    console.log('Selected address:', address);
    // You can now use this address for delivery, checkout, etc.
  };

  return (
    <View style={styles.container}>
      {/* Trigger button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setIsAddressSheetVisible(true)}
      >
        <Text style={styles.buttonText}>
          {selectedAddress 
            ? `${selectedAddress.street}, ${selectedAddress.city}` 
            : 'Select Delivery Address'}
        </Text>
      </TouchableOpacity>

      {/* Address Selection Sheet */}
      <AddressSelectionSheet
        isVisible={isAddressSheetVisible}
        onClose={() => setIsAddressSheetVisible(false)}
        onSelectAddress={handleSelectAddress}
        selectedAddress={selectedAddress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  button: {
    backgroundColor: '#3B82F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

