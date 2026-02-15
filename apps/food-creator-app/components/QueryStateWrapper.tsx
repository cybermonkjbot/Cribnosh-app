import React from 'react';
import { EmptyState } from './EmptyState';
import { SkeletonWithTimeout } from './ui/SkeletonWithTimeout';

interface QueryStateWrapperProps {
  isLoading: boolean;
  error: unknown;
  isEmpty?: boolean;
  skeleton: React.ReactNode;
  errorTitle?: string;
  errorSubtitle?: string;
  onRetry?: () => void;
  children: React.ReactNode;
}

/**
 * Reusable component for handling loading/error/success states in API queries
 * Reduces nested ternary operators and improves readability
 */
export function QueryStateWrapper({
  isLoading,
  error,
  isEmpty = false,
  skeleton,
  errorTitle = 'Unable to Load Data',
  errorSubtitle = 'Failed to load data. Please try again.',
  onRetry,
  children,
}: QueryStateWrapperProps) {
  if (isLoading) {
    return (
      <SkeletonWithTimeout isLoading={isLoading}>
        {skeleton}
      </SkeletonWithTimeout>
    );
  }

  if (error) {
    return (
      <EmptyState
        title={errorTitle}
        subtitle={errorSubtitle}
        icon="alert-circle-outline"
        titleColor="#FFFFFF"
        subtitleColor="rgba(255, 255, 255, 0.8)"
        iconColor="#FFFFFF"
        actionButton={
          onRetry
            ? {
              label: 'Retry',
              onPress: onRetry,
            }
            : undefined
        }
      />
    );
  }

  if (isEmpty) {
    return null;
  }

  return <>{children}</>;
}

