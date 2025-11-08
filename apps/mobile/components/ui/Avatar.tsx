import { BlurView } from 'expo-blur';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { Image, ImageProps } from 'expo-image';

export interface AvatarProps extends ImageProps {
  size?: 'sm' | 'md' | 'lg';
  glass?: boolean;
  elevated?: boolean;
}

const sizeStyles = {
  sm: { width: 40, height: 40 }, // w-10 h-10
  md: { width: 56, height: 56 }, // w-14 h-14
  lg: { width: 80, height: 80 }, // w-20 h-20
};

// Memoize the component to prevent unnecessary re-renders
const MemoizedAvatar: React.FC<AvatarProps> = React.memo(({ size = 'md', glass, elevated, style, source, ...props }) => {
  const hasGlass = !!glass;
  const hasElevation = !!elevated;
  const innerStyle = [glass ? { position: 'relative' as const } : undefined, style];
  return (
    <View style={style}>
      {hasGlass ? (
        Platform.OS === 'ios' ? (
          <BlurView intensity={24} tint="light" style={StyleSheet.absoluteFill} />
        ) : Platform.OS === 'android' ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.7)' }]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255,255,255,0.6)' }]} />
        )
      ) : null}
      {source ? (
        <Image
          accessibilityRole="image"
          style={[
            styles.base,
            sizeStyles[size],
            hasGlass && styles.glass,
            hasElevation && !hasGlass && styles.shadow,
            innerStyle,
          ]}
          source={source}
          {...props}
        />
      ) : (
        <View
          style={[
            styles.base,
            sizeStyles[size],
            hasGlass && styles.glass,
            hasElevation && !hasGlass && styles.shadow,
            innerStyle,
          ]}
        />
      )}
    </View>
  );
});

// Export the memoized component
export const Avatar = MemoizedAvatar;

const styles = StyleSheet.create({
  base: {
    borderRadius: 9999, // rounded-full
    backgroundColor: '#E5E7EB', // bg-gray-200
  },
  glass: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)', // bg-white/60
  },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 5,
  },
});
