import { CustomerAddress } from '@/types/customer';
import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface AddressSelectionContextType {
  onSelectAddress: ((address: CustomerAddress) => void) | null;
  setOnSelectAddress: (callback: ((address: CustomerAddress) => void) | null) => void;
  selectedAddress: CustomerAddress | null;
  setSelectedAddress: (address: CustomerAddress | null) => void;
}

const AddressSelectionContext = createContext<AddressSelectionContextType | undefined>(undefined);

export function AddressSelectionProvider({ children }: { children: ReactNode }) {
  const [onSelectAddress, setOnSelectAddress] = useState<((address: CustomerAddress) => void) | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);

  return (
    <AddressSelectionContext.Provider
      value={{
        onSelectAddress,
        setOnSelectAddress,
        selectedAddress,
        setSelectedAddress,
      }}
    >
      {children}
    </AddressSelectionContext.Provider>
  );
}

export function useAddressSelection() {
  const context = useContext(AddressSelectionContext);
  if (context === undefined) {
    throw new Error('useAddressSelection must be used within an AddressSelectionProvider');
  }
  return context;
}

