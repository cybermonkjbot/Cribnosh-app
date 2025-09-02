import { BlurView } from 'expo-blur';
import React from 'react';
import { Image, ImageProps, Platform, StyleSheet, View } from 'react-native';
import { cn } from './utils';

export interface AvatarProps extends ImageProps {
  size?: 'sm' | 'md' | 'lg';
  glass?: boolean;
  elevated?: boolean;
}

const sizes = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
};

// Memoize the component to prevent unnecessary re-renders
const MemoizedAvatar: React.FC<AvatarProps> = React.memo(({ size = 'md', glass, elevated, style, ...props }) => {
  const hasGlass = !!glass;
  const hasElevation = !!elevated;
  const shadowClass = hasElevation && !hasGlass ? 'shadow-lg' : '';
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
      <Image
        className={cn('rounded-full bg-gray-200', sizes[size], hasGlass && 'bg-white/60', shadowClass, props.className)}
        accessibilityRole="image"
        style={innerStyle}
        {...props}
      />
    </View>
  );
});

// Export the memoized component
export const Avatar = MemoizedAvatar;
