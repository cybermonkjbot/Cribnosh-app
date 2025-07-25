import type { FC } from 'react';
import { Pressable, PressableProps, Text, View } from 'react-native';
import { cn } from './utils';

export interface CheckboxProps extends Omit<PressableProps, 'onPress'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Checkbox: FC<CheckboxProps> = ({ checked, onChange, label, disabled, ...props }) => (
  <Pressable
    className={cn('flex-row items-center min-h-[44px] min-w-[44px] px-1', props.className)}
    onPress={() => !disabled && onChange(!checked)}
    disabled={disabled}
    accessibilityRole="checkbox"
    accessibilityState={{ checked, disabled }}
    hitSlop={8}
    {...props}
  >
    <View
      className={cn(
        'w-6 h-6 rounded-lg border border-gray-300 items-center justify-center mr-3',
        checked ? 'bg-gray-900' : 'bg-white',
        disabled && 'opacity-40'
      )}
    >
      {checked && <Text className="text-white text-lg">✓</Text>}
    </View>
    {label && <Text className="text-gray-900 text-base font-[System]">{label}</Text>}
  </Pressable>
);
