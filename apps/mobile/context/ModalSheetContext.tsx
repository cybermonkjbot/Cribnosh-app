import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface ModalSheetContextType {
  isSearchDrawerExpanded: boolean;
  setSearchDrawerExpanded: (expanded: boolean) => void;
  isAnySheetOpen: boolean;
  setAnySheetOpen: (open: boolean) => void;
  isAnyModalOpen: boolean;
  setAnyModalOpen: (open: boolean) => void;
}

const ModalSheetContext = createContext<ModalSheetContextType | undefined>(undefined);

export function ModalSheetProvider({ children }: { children: ReactNode }) {
  const [isSearchDrawerExpanded, setIsSearchDrawerExpanded] = useState(false);
  const [isAnySheetOpen, setIsAnySheetOpen] = useState(false);
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);

  const setSearchDrawerExpanded = useCallback((expanded: boolean) => {
    setIsSearchDrawerExpanded(expanded);
  }, []);

  const setAnySheetOpen = useCallback((open: boolean) => {
    setIsAnySheetOpen(open);
  }, []);

  const setAnyModalOpen = useCallback((open: boolean) => {
    setIsAnyModalOpen(open);
  }, []);

  return (
    <ModalSheetContext.Provider
      value={{
        isSearchDrawerExpanded,
        setSearchDrawerExpanded,
        isAnySheetOpen,
        setAnySheetOpen,
        isAnyModalOpen,
        setAnyModalOpen,
      }}
    >
      {children}
    </ModalSheetContext.Provider>
  );
}

export function useModalSheet() {
  const context = useContext(ModalSheetContext);
  if (context === undefined) {
    throw new Error('useModalSheet must be used within a ModalSheetProvider');
  }
  return context;
}

