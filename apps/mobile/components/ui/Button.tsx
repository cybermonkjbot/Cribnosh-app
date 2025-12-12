import { BlurEffect } from '@/utils/blurEffects';
import type { FC, ReactNode } from 'react';
import { useRef } from 'react';
import { ActivityIndicator, Animated, StyleSheet, Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';

export interface ButtonProps extends TouchableOpacityProps {
  variant?: 'default' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  children: ReactNode;
  glass?: boolean;
  elevated?: boolean;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  paddingVertical?: number;
  paddingHorizontal?: number;
  fontFamily?: string;
  fontWeight?: string | number;
  loading?: boolean;
}

const variantStyles = {
  default: {
    backgroundColor: '#111827', // bg-gray-900
  },
  outline: {
    borderWidth: 1,
    borderColor: '#D1D5DB', // border-gray-300
    backgroundColor: '#FFFFFF', // bg-white
  },
  ghost: {
    backgroundColor: 'transparent', // bg-transparent
  },
  danger: {
    backgroundColor: '#FF3B30', // bg-[#FF3B30]
  },
};

const sizeStyles = {
  sm: {
    height: 40, // h-10
    paddingHorizontal: 16, // px-4
  },
  md: {
    height: 48, // h-12
    paddingHorizontal: 20, // px-5
  },
  lg: {
    height: 56, // h-14
    paddingHorizontal: 24, // px-6
  },
};

const textStyles: Record<string, { color: string; fontSize: number; fontWeight: any }> = {
  default: {
    color: '#FFFFFF', // text-white
    fontSize: 16, // text-base
    fontWeight: '600', // font-semibold
  },
  outline: {
    color: '#111827', // text-gray-900
    fontSize: 16, // text-base
    fontWeight: '600', // font-semibold
  },
  ghost: {
    color: '#111827', // text-gray-900
    fontSize: 16, // text-base
    fontWeight: '600', // font-semibold
  },
  danger: {
    color: '#FFFFFF', // text-white
    fontSize: 16, // text-base
    fontWeight: '600', // font-semibold
  },
};

export const Button: FC<ButtonProps> = ({
  variant = 'default',
  size = 'md',
  disabled = false,
  children,
  glass = false,
  elevated = false,
  style,
  backgroundColor,
  textColor,
  borderRadius,
  paddingVertical,
  paddingHorizontal,
  fontFamily,
  fontWeight,
  loading = false,
  onPress,
  onPressIn,
  onPressOut,
  ...props
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const isDisabled = disabled || loading;

  const handlePressIn = (event: any) => {
    if (isDisabled) return;

    Animated.spring(scaleAnim, {
      toValue: 0.95,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();

    onPressIn?.(event);
  };

  const handlePressOut = (event: any) => {
    if (isDisabled) return;

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 300,
      friction: 10,
    }).start();

    onPressOut?.(event);
  };

  const buttonContent = (
    <View
      style={[
        styles.base,
        variantStyles[variant],
        sizeStyles[size],
        glass && styles.glass,
        elevated && !glass && styles.shadow,
        isDisabled && styles.disabled,
        {
          backgroundColor: backgroundColor,
          borderRadius: borderRadius,
          paddingVertical: paddingVertical,
          paddingHorizontal: paddingHorizontal,
          minWidth: 44,
          minHeight: 44,
        },
        style,
      ]}
    >
      {/* Glass effect background - positioned behind content with pointerEvents none */}
      {glass && (
        <BlurEffect
          intensity={24}
          tint="light"
          useGradient={true}
          style={[
            StyleSheet.absoluteFillObject,
            {
              zIndex: 0,
              pointerEvents: 'none'
            }
          ]}
        />
      )}

      {/* Button content - positioned above glass effect */}
      <View style={{ zIndex: 1, pointerEvents: 'none', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
        {loading ? (
          <ActivityIndicator
            size="small"
            color={textColor || (variant === 'outline' || variant === 'ghost' ? '#000000' : '#FFFFFF')}
          />
        ) : (
          children !== undefined && children !== null ? (
            <Text
              style={[
                textStyles[variant],
                {
                  textAlign: 'center',
                  lineHeight: 24,
                },
                textColor && { color: textColor },
                fontFamily && { fontFamily },
                fontWeight ? { fontWeight: fontWeight as any } : undefined,
              ]}
            >
              {children}
            </Text>
          ) : null
        )}
      </View>
    </View>
  );

  return (
    <TouchableOpacity
      activeOpacity={1}
      disabled={isDisabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled }}
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={{
        minWidth: 44,
        minHeight: 44,
      }}
      {...props}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        {buttonContent}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    borderRadius: 12, // rounded-xl
    minHeight: 44, // min-h-[44px]
    minWidth: 44, // min-w-[44px]
    position: 'relative',
    overflow: 'hidden',
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
  disabled: {
    opacity: 0.5, // opacity-50
  },
});
