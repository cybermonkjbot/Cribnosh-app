import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useToastPosition } from '@/utils/positioning';
import { shadowPresets } from '@/utils/platformStyles';

const { width: screenWidth } = Dimensions.get('window');

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
  onDismiss?: (id: string) => void;
  action?: {
    label: string;
    onPress: () => void;
  };
}

interface ToastComponentProps extends ToastProps {
  onDismiss: (id: string) => void;
}

const ToastComponent: React.FC<ToastComponentProps> = ({
  id,
  type,
  title,
  message,
  duration = 3000,
  onDismiss,
  action,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

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
      setIsVisible(false);
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

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return '#000000';
      case 'error':
        return '#000000';
      case 'warning':
        return '#000000';
      case 'info':
        return '#000000';
      default:
        return '#000000';
    }
  };

  if (!isVisible) return null;

  // Compact TikTok-style: single line, no icon, minimal padding
  const displayText = message ? `${title} ${message}` : title;

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          transform: [{ translateY: slideAnim }],
          opacity: opacityAnim,
          backgroundColor: getBackgroundColor(),
        },
      ]}
    >
      <Text style={styles.text} numberOfLines={1}>
        {displayText}
      </Text>
      {action && (
        <TouchableOpacity style={styles.actionButton} onPress={action.onPress}>
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

// Toast Container Component
interface ToastContainerProps {
  toasts: ToastProps[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  const toastPosition = useToastPosition();
  
  return (
    <View style={[styles.container, { top: toastPosition }]}>
      {toasts.map((toast) => (
        <ToastComponent
          key={toast.id}
          {...toast}
          onDismiss={onDismiss}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 99999,
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
  actionButton: {
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'center',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ToastComponent;
