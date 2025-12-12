import React, { createContext, ReactNode, useCallback, useContext, useRef, useState } from 'react';
import { ToastContainer, ToastProps, ToastType } from '../app/components/Toast';

interface ToastContextType {
  showToast: {
    (toast: Omit<ToastProps, 'id'>): void;
    (message: string, type?: ToastType): void;
  };
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
  const idCounterRef = useRef(0);

  const showToast = useCallback((arg1: Omit<ToastProps, 'id'> | string, arg2?: ToastType) => {
    idCounterRef.current += 1;
    const id = `${Date.now()}-${idCounterRef.current}`;

    let newToast: ToastProps;

    if (typeof arg1 === 'string') {
      // Handle overload: showToast(message, type)
      newToast = {
        id,
        type: arg2 || 'info', // Default to info if type not provided
        title: arg2 ? arg2.charAt(0).toUpperCase() + arg2.slice(1) : 'Info',
        message: arg1,
      };
    } else {
      // Handle default: showToast(toastObject)
      newToast = {
        ...arg1,
        id,
      };
    }

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
