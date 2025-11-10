'use client';

import React, { useState } from 'react';
import AlertDialog from './alert-dialog';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'error' | 'info';
  isLoading?: boolean;
}

/**
 * Reusable confirmation dialog component for delete/action confirmations.
 * Provides consistent UX for confirmation dialogs across the application.
 */
export function ConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'warning',
  isLoading = false,
}: ConfirmationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (isSubmitting || isLoading) return;
    
    setIsSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      // Error handling is done by the caller
      console.error('Confirmation action failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleConfirm}
      onCancel={onClose}
      title={title}
      message={message}
      type={type}
      confirmText={isSubmitting || isLoading ? 'Processing...' : confirmText}
      cancelText={cancelText}
      showCancel={true}
    />
  );
}

