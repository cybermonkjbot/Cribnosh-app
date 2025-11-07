// components/ui/SimpleToast.tsx
import { BlurEffect } from '@/utils/blurEffects';
import { shadowPresets } from '@/utils/platformStyles';
import { useToastPosition } from '@/utils/positioning';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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
  duration = 4000,
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;
  const toastPosition = useToastPosition();

  useEffect(() => {
    // Smooth slide down animation from top
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: duration,
      useNativeDriver: true,
    }).start();

    // Auto dismiss
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss(id);
    });
  };

  const getToastConfig = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#0B9E58',
          icon: '✓',
          iconColor: '#FFFFFF',
          borderColor: 'rgba(11, 158, 88, 0.4)',
          gradient: ['#0B9E58', '#0A8A4F'],
          backgroundTint: 'rgba(11, 158, 88, 0.3)', // More visible green tint
        };
      case 'error':
        return {
          backgroundColor: '#FF3B30',
          icon: '✕',
          iconColor: '#FFFFFF',
          borderColor: 'rgba(255, 59, 48, 0.4)',
          gradient: ['#FF3B30', '#E6342A'],
          backgroundTint: 'rgba(255, 59, 48, 0.3)', // More visible red tint
        };
      case 'info':
        return {
          backgroundColor: '#094327',
          icon: 'ℹ',
          iconColor: '#FFFFFF',
          borderColor: 'rgba(9, 67, 39, 0.4)',
          gradient: ['#094327', '#073A1F'],
          backgroundTint: 'rgba(9, 67, 39, 0.3)', // More visible dark green tint
        };
      case 'warning':
        return {
          backgroundColor: '#FF6B35',
          icon: '⚠',
          iconColor: '#FFFFFF',
          borderColor: 'rgba(255, 107, 53, 0.4)',
          gradient: ['#FF6B35', '#E55A2B'],
          backgroundTint: 'rgba(255, 107, 53, 0.3)', // More visible orange tint
        };
      default:
        return {
          backgroundColor: '#094327',
          icon: 'ℹ',
          iconColor: '#FFFFFF',
          borderColor: 'rgba(9, 67, 39, 0.4)',
          gradient: ['#094327', '#073A1F'],
          backgroundTint: 'rgba(9, 67, 39, 0.3)', // More visible dark green tint
        };
    }
  };

  const config = getToastConfig();

  return (
    <Animated.View style={[
      styles.container,
      {
        top: toastPosition,
        transform: [
          { translateY: slideAnim }
        ],
        opacity: opacityAnim,
      }
    ]}>
      <BlurEffect
        intensity={80}
        tint="dark"
        backgroundColor={config.backgroundTint}
        useGradient={true}
        style={[
          styles.blurContainer,
          {
            borderColor: config.borderColor,
          }
        ]}
      >
        {/* Left Icon */}
        <View style={[styles.iconContainer, { backgroundColor: config.iconColor }]}>
          <Text style={[styles.icon, { color: config.backgroundColor }]}>
            {config.icon}
          </Text>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {title}
          </Text>
          {message && (
            <Text style={styles.message} numberOfLines={3} ellipsizeMode="tail">
              {message}
            </Text>
          )}
        </View>
        
        {/* Dismiss Button */}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          activeOpacity={0.7}
        >
          <Text style={styles.dismissText}>×</Text>
        </TouchableOpacity>

        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <Animated.View 
            style={[
              styles.progressBar,
              {
                backgroundColor: config.iconColor,
                transform: [{
                  scaleX: progressAnim
                }]
              }
            ]} 
          />
        </View>
      </BlurEffect>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16, // Left margin
    right: 16, // Right margin - ensures equal margins on both sides
    zIndex: 99999,
    paddingTop: 0,
    paddingBottom: 0,
  },
  blurContainer: {
    width: '100%', // Take full width of container (which has left/right margins)
    minHeight: 64, // Minimum height for natural look
    borderRadius: 16, // Rounded corners on all sides
    paddingHorizontal: 16,
    paddingVertical: 14, // Comfortable padding
    flexDirection: 'row',
    alignItems: 'center', // Center align items vertically
    justifyContent: 'flex-start', // Align content to start
    borderWidth: 0, // No border for cleaner look
    overflow: 'hidden', // Prevent content overflow
    ...shadowPresets.lg(),
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    ...shadowPresets.sm(),
  },
  icon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingRight: 8,
    justifyContent: 'center', // Center content vertically
    flexDirection: 'column', // Ensure vertical layout
    alignItems: 'flex-start', // Align text to left
  },
  title: {
    color: 'white',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
    letterSpacing: 0.1,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    lineHeight: 20,
  },
  message: {
    color: 'white',
    fontSize: 13,
    opacity: 0.9,
    fontWeight: '400',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    marginTop: 2,
  },
  dismissButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    borderWidth: 0,
    ...shadowPresets.sm(),
  },
  dismissText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '300',
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
});

export default SimpleToast;
