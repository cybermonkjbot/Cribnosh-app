import type { FC, ReactNode } from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';
import { BlurEffect } from '@/utils/blurEffects';

export interface AlertProps extends ViewProps {
  variant?: 'default' | 'error' | 'success' | 'warning';
  title?: string;
  children?: ReactNode;
  glass?: boolean;
  elevated?: boolean;
}

const variantStyles = {
  default: {
    backgroundColor: '#F3F4F6', // bg-gray-100
    borderColor: '#E5E7EB', // border-gray-200
  },
  error: {
    backgroundColor: '#FEE2E2', // bg-red-100
    borderColor: '#FECACA', // border-red-200
  },
  success: {
    backgroundColor: '#D1FAE5', // bg-green-100
    borderColor: '#A7F3D0', // border-green-200
  },
  warning: {
    backgroundColor: '#FEF3C7', // bg-yellow-100
    borderColor: '#FDE68A', // border-yellow-200
  },
};

export const Alert: FC<AlertProps> = ({ variant = 'default', title, children, glass, elevated, style, ...props }) => {
  const hasGlass = !!glass;
  const hasElevation = !!elevated;
  return (
    <View style={style} {...props}>
      {hasGlass && (
        <BlurEffect
          intensity={24}
          tint="light"
          useGradient={true}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View
        style={[
          styles.base,
          variantStyles[variant],
          hasGlass && styles.glass,
          hasElevation && !hasGlass && styles.shadow,
          glass && { position: 'relative' as const },
        ]}
        accessibilityRole="alert"
      >
        {title ? (
          <Text style={[styles.title, { fontFamily: 'Poppins' }]}>
            {title}
          </Text>
        ) : null}
        {children !== undefined && children !== null ? (
          <Text style={[styles.content, { fontFamily: 'Poppins' }]}>
            {children}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    borderWidth: 1, // border
    borderRadius: 16, // rounded-2xl
    padding: 16, // p-4
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
  title: {
    fontWeight: '600', // font-semibold
    marginBottom: 8, // mb-2
    fontSize: 18, // text-lg
  },
  content: {
    fontSize: 16, // text-base
    color: '#374151', // text-gray-700
  },
});
