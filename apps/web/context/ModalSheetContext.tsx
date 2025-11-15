"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';

interface ModalSheetContextType {
  isAnyModalOpen: boolean;
  setAnyModalOpen: (open: boolean) => void;
}

const ModalSheetContext = createContext<ModalSheetContextType | undefined>(undefined);

export function ModalSheetProvider({ children }: { children: ReactNode }) {
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);

  const setAnyModalOpen = useCallback((open: boolean) => {
    setIsAnyModalOpen(open);
  }, []);

  // Detect Radix UI dialogs and other modals via DOM observation
  useEffect(() => {
    const observer = new MutationObserver(() => {
      // Check for Radix UI dialog overlays
      const hasDialogOverlay = document.querySelector('[data-slot="dialog-overlay"]');
      // Check for other common modal patterns
      const hasModal = document.querySelector('[role="dialog"]') || 
                      document.querySelector('[aria-modal="true"]') ||
                      document.body.style.overflow === 'hidden';
      
      setIsAnyModalOpen(!!(hasDialogOverlay || hasModal));
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['style', 'role', 'aria-modal', 'data-slot'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <ModalSheetContext.Provider
      value={{
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

