// components/ui/GlobalToastContainer.tsx
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { globalToastManager } from '../../lib/GlobalToastManager';
import SimpleToast from './SimpleToast';

interface ToastData {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
}

export const GlobalToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    // Register this container with the global manager
    globalToastManager.setToastContainer(setToasts);

    // Subscribe to toast changes
    const unsubscribe = globalToastManager.subscribe((newToasts) => {
      setToasts(newToasts);
    });

    return unsubscribe;
  }, []);

  const handleDismiss = (id: string) => {
    globalToastManager.hideToast(id);
  };

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 99999 }}>
      {toasts.map((toast) => (
        <SimpleToast
          key={toast.id}
          {...toast}
          onDismiss={handleDismiss}
        />
      ))}
    </View>
  );
};
