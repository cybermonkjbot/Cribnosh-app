import { BlurEffect } from '@/utils/blurEffects';
import type { FC, ReactNode } from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
  children: ReactNode;
  glass?: boolean;
  elevated?: boolean;
}

export const Card: FC<CardProps> = ({ children, glass, elevated, style, ...props }) => {
  // Always render children, even if null/undefined/empty
  const hasGlass = !!glass;
  const hasElevation = !!elevated;
  // Merge custom style with position for glass
  const innerStyle = [glass ? { position: "relative" as const } : undefined, style];
  return (
    <View style={style} {...props}>
      {hasGlass && (
        <BlurEffect
          intensity={24}
          tint="light"
          useGradient={true}
          style={StyleSheet.absoluteFillObject}
        />
      )}
      <View
        style={[
          styles.base,
          hasGlass && styles.glass,
          hasElevation && !hasGlass && styles.shadow,
          innerStyle,
        ]}
      >
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 16, // rounded-2xl
    borderWidth: 1, // border
    borderColor: '#E5E7EB', // border-gray-200
    backgroundColor: 'rgba(255, 255, 255, 0.8)', // bg-white/80
    padding: 20, // p-5
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
