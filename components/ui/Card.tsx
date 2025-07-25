import { BlurView } from 'expo-blur';
import type { FC, ReactNode } from 'react';
import { Platform, StyleSheet, View, ViewProps } from 'react-native';
import { cn } from './utils';

export interface CardProps extends ViewProps {
  children: ReactNode;
  glass?: boolean;
  elevated?: boolean;
}

export const Card: FC<CardProps> = ({ children, glass, elevated, style, ...props }) => {
  // Always render children, even if null/undefined/empty
  const hasGlass = !!glass;
  const hasElevation = !!elevated;
  // Avoid double shadow if glass and elevated are both true
  const shadowClass = hasElevation && !hasGlass ? 'shadow-lg' : '';
  // Merge custom style with position for glass
  const innerStyle = [glass ? { position: "relative" as const } : undefined, style];
  return (
    <View style={style} {...props}>
      {hasGlass ? (
        Platform.OS === 'ios' ? (
          <BlurView intensity={24} tint="light" style={StyleSheet.absoluteFill} />
        ) : Platform.OS === 'android' ? (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(255,255,255,0.7)' }]} />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255,255,255,0.6)' }]} />
        )
      ) : null}
      <View
        className={cn(
          'rounded-2xl border border-gray-200 bg-white/80 p-5',
          hasGlass && 'bg-white/60',
          shadowClass,
          props.className
        )}
        style={innerStyle}
      >
        {children}
      </View>
    </View>
  );
};
