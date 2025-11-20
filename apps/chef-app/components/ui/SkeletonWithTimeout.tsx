import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useLoadingTimeout } from '../../hooks/useLoadingTimeout';
import { LoadingTimeoutPill } from './LoadingTimeoutPill';

interface SkeletonWithTimeoutProps {
  /**
   * Whether the loading state is active
   */
  isLoading: boolean;
  /**
   * The skeleton component to render
   */
  children: React.ReactNode;
  /**
   * Time in milliseconds before showing the "taking longer" message
   * Default: 3000ms (3 seconds)
   */
  timeout?: number;
  /**
   * Custom message for the timeout pill
   */
  timeoutMessage?: string;
  /**
   * Style for the container
   */
  style?: ViewStyle;
  /**
   * Whether to show the pill above or below the skeleton
   * Default: 'below'
   */
  pillPosition?: 'above' | 'below';
}

/**
 * Wrapper component that shows a "Taking longer than usual" pill
 * when loading takes longer than the specified timeout
 */
export function SkeletonWithTimeout({
  isLoading,
  children,
  timeout = 3000,
  timeoutMessage,
  style,
  pillPosition = 'below',
}: SkeletonWithTimeoutProps) {
  const showTimeoutMessage = useLoadingTimeout({ isLoading, timeout });

  return (
    <View style={style}>
      {pillPosition === 'above' && (
        <LoadingTimeoutPill visible={showTimeoutMessage} message={timeoutMessage} />
      )}
      {children}
      {pillPosition === 'below' && (
        <LoadingTimeoutPill visible={showTimeoutMessage} message={timeoutMessage} />
      )}
    </View>
  );
}

