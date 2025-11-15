// components/ui/SimpleToast.tsx
import { shadowPresets } from '@/utils/platformStyles';
import { useToastPosition } from '@/utils/positioning';
import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  View,
} from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface SimpleToastProps {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
  duration?: number;
  onDismiss: (id: string) => void;
}

const SimpleToast: React.FC<SimpleToastProps> = ({
  id,
  type,
  title,
  message,
  duration = 3000,
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const toastPosition = useToastPosition();

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(id);
    });
  }, [id, onDismiss, slideAnim, opacityAnim]);

  useEffect(() => {
    // Slide in animation - faster and more subtle
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, handleDismiss, slideAnim, opacityAnim]);

  // Compact TikTok-style: single line, no icon, minimal padding
  const displayText = message ? `${title} ${message}` : title;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: toastPosition,
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.toast}>
        <Text style={styles.text} numberOfLines={1}>
          {displayText}
        </Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999999,
    alignItems: 'center',
  },
  toast: {
    backgroundColor: '#000000',
    borderRadius: 24,
    marginBottom: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxWidth: screenWidth - 32,
    alignSelf: 'center',
    ...shadowPresets.xl(),
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    textAlign: 'center',
  },
});

export default SimpleToast;
