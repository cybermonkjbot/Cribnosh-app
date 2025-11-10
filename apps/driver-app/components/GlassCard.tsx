import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { Colors } from '../constants/Colors';

interface GlassCardProps {
  children: React.ReactNode;
  intensity?: number;
  tint?: 'light' | 'dark';
  style?: ViewStyle;
}

export function GlassCard({ children, intensity = 20, tint = 'light', style }: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView
        intensity={intensity}
        tint={tint}
        style={styles.blurView}
      >
        {children}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.glassBorder,
    shadowColor: Colors.light.glassShadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  blurView: {
    flex: 1,
    backgroundColor: Colors.light.glassBackground,
  },
});

