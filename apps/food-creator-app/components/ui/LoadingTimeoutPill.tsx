import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface LoadingTimeoutPillProps {
  /**
   * Whether to show the pill
   */
  visible: boolean;
  /**
   * Custom message to display
   * Default: "Taking longer than usual"
   */
  message?: string;
  /**
   * Style for the container
   */
  style?: any;
}

/**
 * Pill component that displays "Taking longer than usual" message
 * Should be shown when loading takes longer than expected
 */
export function LoadingTimeoutPill({ 
  visible, 
  message = 'Taking longer than usual',
  style 
}: LoadingTimeoutPillProps) {
  if (!visible) {
    return null;
  }

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    backgroundColor: 'rgba(156, 163, 175, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
    marginBottom: 8,
  },
  text: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
});

