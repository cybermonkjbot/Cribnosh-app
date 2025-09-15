import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { ToastContainer, ToastProps } from '../app/components/Toast';

interface ToastContextType {
  showToast: (toast: Omit<ToastProps, 'id'>) => void;
  hideToast: (id: string) => void;
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showInfo: (title: string, message?: string, duration?: number) => void;
  showWarning: (title: string, message?: string, duration?: number) => void;
  showCopySuccess: (message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const showToast = useCallback((toast: Omit<ToastProps, 'id'>) => {
    const id = Date.now().toString();
    const newToast: ToastProps = {
      ...toast,
      id,
    };
    
    setToasts(prev => [...prev, newToast]);
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const showSuccess = useCallback((title: string, message?: string, duration?: number) => {
    showToast({
      type: 'success',
      title,
      message,
      duration,
    });
  }, [showToast]);

  const showError = useCallback((title: string, message?: string, duration?: number) => {
    showToast({
      type: 'error',
      title,
      message,
      duration,
    });
  }, [showToast]);

  const showInfo = useCallback((title: string, message?: string, duration?: number) => {
    showToast({
      type: 'info',
      title,
      message,
      duration,
    });
  }, [showToast]);

  const showWarning = useCallback((title: string, message?: string, duration?: number) => {
    showToast({
      type: 'warning',
      title,
      message,
      duration,
    });
  }, [showToast]);

  const showCopySuccess = useCallback((message?: string) => {
    showToast({
      type: 'success',
      title: 'Copied to Clipboard',
      message: message || 'The link has been copied to your clipboard',
      duration: 3000,
    });
  }, [showToast]);

  const value: ToastContextType = {
    showToast,
    hideToast,
    showSuccess,
    showError,
    showInfo,
    showWarning,
    showCopySuccess,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={hideToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
