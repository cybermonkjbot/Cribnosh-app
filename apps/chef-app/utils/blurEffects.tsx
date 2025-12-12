import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';

export interface BlurEffectProps {
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  style?: ViewStyle | ViewStyle[];
  children?: React.ReactNode;
  /** Custom background color for Android fallback (overrides default) */
  backgroundColor?: string;
  /** Whether to use a gradient overlay on Android for better visual similarity */
  useGradient?: boolean;
}

/**
 * Unified blur component that provides consistent blur effects on iOS and Android
 * iOS: Uses native BlurView from expo-blur
 * Android: Uses a semi-transparent overlay with optional gradient for better visual similarity
 */
export function BlurEffect({
  intensity = 24,
  tint = 'light',
  style,
  children,
  backgroundColor,
  useGradient = false,
}: BlurEffectProps) {
  // On iOS, use native BlurView
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={intensity}
        tint={tint}
        style={[StyleSheet.absoluteFill, style]}
      >
        {children}
      </BlurView>
    );
  }

  // Android fallback
  const opacity = Math.min(intensity / 100, 0.85);

  // Determine background color based on tint if not explicitly provided
  let fallbackColor = backgroundColor;
  if (!fallbackColor) {
    switch (tint) {
      case 'dark':
        fallbackColor = `rgba(0, 0, 0, ${opacity * 0.7})`;
        break;
      case 'light':
      default:
        fallbackColor = `rgba(255, 255, 255, ${opacity})`;
        break;
    }
  }

  // Android with gradient overlay for better visual similarity
  if (useGradient) {
    const gradientColors =
      tint === 'dark'
        ? [`rgba(0, 0, 0, ${opacity * 0.8})`, `rgba(0, 0, 0, ${opacity * 0.6})`]
        : [`rgba(255, 255, 255, ${opacity})`, `rgba(255, 255, 255, ${opacity * 0.8})`];

    return (
      <LinearGradient
        colors={gradientColors as any}
        style={[StyleSheet.absoluteFill, style]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        {children}
      </LinearGradient>
    );
  }

  // Android with solid color fallback
  return (
    <View
      style={[
        StyleSheet.absoluteFill,
        { backgroundColor: fallbackColor },
        style,
      ]}
    >
      {children}
    </View>
  );
}

/**
 * Light blur preset (for cards, buttons, etc.)
 */
export function LightBlur(props: Omit<BlurEffectProps, 'intensity' | 'tint'>) {
  return <BlurEffect intensity={24} tint="light" {...props} />;
}

/**
 * Medium blur preset
 */
export function MediumBlur(props: Omit<BlurEffectProps, 'intensity' | 'tint'>) {
  return <BlurEffect intensity={40} tint="light" {...props} />;
}

/**
 * Heavy blur preset (for modals, overlays, etc.)
 */
export function HeavyBlur(props: Omit<BlurEffectProps, 'intensity' | 'tint'>) {
  return <BlurEffect intensity={80} tint="light" {...props} />;
}

/**
 * Dark blur preset
 */
export function DarkBlur(props: Omit<BlurEffectProps, 'intensity' | 'tint'>) {
  return <BlurEffect intensity={80} tint="dark" {...props} />;
}

