import type { FC } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { cn } from './utils';

export interface InputProps extends TextInputProps {
  size?: 'sm' | 'md' | 'lg';
}

const base = 'border border-gray-300 rounded-xl px-4 py-2 bg-white text-gray-900 font-[System]';
const sizes = {
  sm: 'h-10 text-base',
  md: 'h-12 text-lg',
  lg: 'h-14 text-xl',
};

export const Input: FC<InputProps> = ({ size = 'md', ...props }) => (
  <TextInput
    className={cn(base, sizes[size], props.className)}
    placeholderTextColor="#A3A3A3"
    accessibilityRole="search"
    {...props}
  />
);
