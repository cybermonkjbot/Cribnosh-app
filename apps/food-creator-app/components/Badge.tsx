import { BlurEffect } from '@/utils/blurEffects';
import type { FC, ReactNode } from 'react';
import { StyleSheet, Text, View, ViewProps } from 'react-native';

export interface BadgeProps extends ViewProps {
  variant?: 'default' | 'secondary';
  children: ReactNode;
  glass?: boolean;
  elevated?: boolean;
}

const variantStyles = {
  default: { backgroundColor: '#111827' }, // bg-gray-900
  secondary: { backgroundColor: '#E5E7EB' }, // bg-gray-200
};

export const Badge: FC<BadgeProps> = ({ variant = 'default', children, glass, elevated, style, ...props }) => {
  const hasGlass = !!glass;
  const hasElevation = !!elevated;
  return (
    <View style={style} {...props}>
      {hasGlass && (
        <BlurEffect
          intensity={18}
          tint="light"
          useGradient={true}
          style={StyleSheet.absoluteFillObject}
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
      >
        {children !== undefined && children !== null ? (
          <Text style={[
            styles.text,
            variant === 'default' ? styles.textDefault : styles.textSecondary,
            { fontFamily: 'Poppins' },
          ]}>
            {children}
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 12, // px-3
    paddingVertical: 4, // py-1
    borderRadius: 9999, // rounded-full
    minHeight: 24, // min-h-[24px]
    minWidth: 24, // min-w-[24px]
    justifyContent: 'center', // justify-center
    alignItems: 'center', // items-center
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
  text: {
    fontSize: 12, // text-xs
    fontWeight: '600', // font-semibold
  },
  textDefault: {
    color: '#FFFFFF', // text-white
  },
  textSecondary: {
    color: '#111827', // text-gray-900
  },
});
