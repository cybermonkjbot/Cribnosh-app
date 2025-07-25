import type { FC } from 'react';
import { Text, TextProps } from 'react-native';
import { cn } from './utils';

export interface LabelProps extends TextProps {
  children: React.ReactNode;
}

export const Label: FC<LabelProps> = ({ children, ...props }) => (
  <Text
    className={cn('text-base font-semibold text-gray-800 mb-1', props.className)}
    accessibilityRole="text"
    style={[{ fontFamily: 'Poppins' }, props.style]}
    {...props}
  >
    {children}
  </Text>
);
