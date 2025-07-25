import type { FC } from 'react';
import { TextInput, TextInputProps } from 'react-native';
import { cn } from './utils';

export interface TextareaProps extends TextInputProps {
  size?: 'sm' | 'md' | 'lg';
}

const base = 'border border-gray-300 rounded-xl px-4 py-3 min-h-[100px] bg-white text-gray-900 font-[System]';
const sizes = {
  sm: 'text-base',
  md: 'text-lg',
  lg: 'text-xl',
};

export const Textarea: FC<TextareaProps> = ({ size = 'md', ...props }) => (
  <TextInput
    className={cn(base, sizes[size], props.className)}
    multiline
    placeholderTextColor="#A3A3A3"
    accessibilityRole="text"
    {...props}
  />
);
