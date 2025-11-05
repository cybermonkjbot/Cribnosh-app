import { useState, useCallback } from 'react';

interface AlertDialogConfig {
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
}

interface AlertDialogState extends AlertDialogConfig {
  isOpen: boolean;
}

export const useAlertDialog = () => {
  const [alertState, setAlertState] = useState<AlertDialogState>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false,
  });

  const showAlert = useCallback((config: AlertDialogConfig) => {
    setAlertState({
      ...config,
      isOpen: true,
    });
  }, []);

  const hideAlert = useCallback(() => {
    setAlertState(prev => ({
      ...prev,
      isOpen: false,
    }));
  }, []);

  const showInfo = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      title,
      message,
      type: 'info',
      onConfirm,
    });
  }, [showAlert]);

  const showSuccess = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      title,
      message,
      type: 'success',
      onConfirm,
    });
  }, [showAlert]);

  const showWarning = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      title,
      message,
      type: 'warning',
      onConfirm,
    });
  }, [showAlert]);

  const showError = useCallback((title: string, message: string, onConfirm?: () => void) => {
    showAlert({
      title,
      message,
      type: 'error',
      onConfirm,
    });
  }, [showAlert]);

  const showConfirm = useCallback((
    title: string, 
    message: string, 
    onConfirm?: () => void, 
    onCancel?: () => void
  ) => {
    showAlert({
      title,
      message,
      type: 'info',
      showCancel: true,
      onConfirm,
      onCancel,
    });
  }, [showAlert]);

  return {
    alertState,
    showAlert,
    hideAlert,
    showInfo,
    showSuccess,
    showWarning,
    showError,
    showConfirm,
  };
};
