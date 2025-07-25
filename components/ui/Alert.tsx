import { BlurView } from 'expo-blur';
import type { FC, ReactNode } from 'react';
import { Platform, Text, View, ViewProps } from 'react-native';
import { cn } from './utils';

export interface AlertProps extends ViewProps {
  variant?: 'default' | 'error' | 'success' | 'warning';
  title?: string;
  children?: ReactNode;
  glass?: boolean;
  elevated?: boolean;
}

const variants = {
  default: 'bg-gray-100 border-gray-200',
  error: 'bg-red-100 border-red-200',
  success: 'bg-green-100 border-green-200',
  warning: 'bg-yellow-100 border-yellow-200',
};

export const Alert: FC<AlertProps> = ({ variant = 'default', title, children, glass, elevated, style, ...props }) => {
  const hasGlass = !!glass;
  const hasElevation = !!elevated;
  const shadowClass = hasElevation && !hasGlass ? 'shadow-lg' : '';
  return (
    <View className={props.className} style={style} {...props}>
      {hasGlass ? (
        Platform.OS === 'ios' ? (
          <BlurView intensity={24} tint="light" className="absolute inset-0" />
        ) : Platform.OS === 'android' ? (
          <View className="absolute inset-0" style={{ backgroundColor: 'rgba(255,255,255,0.7)' }} />
        ) : (
          <View className="absolute inset-0" style={{ backdropFilter: 'blur(8px)', backgroundColor: 'rgba(255,255,255,0.6)' }} />
        )
      ) : null}
      <View
        className={cn(
          'border rounded-2xl p-4',
          variants[variant],
          hasGlass && 'bg-white/60',
          shadowClass,
          props.className
        )}
        style={glass ? { position: 'relative' } : undefined}
        accessibilityRole="alert"
      >
        {title ? <Text className="font-semibold mb-2 text-lg" style={{ fontFamily: 'Poppins' }}>{title}</Text> : null}
        {children !== undefined && children !== null ? (
          <Text className="text-base text-gray-700" style={{ fontFamily: 'Poppins' }}>{children}</Text>
        ) : null}
      </View>
    </View>
  );
};
