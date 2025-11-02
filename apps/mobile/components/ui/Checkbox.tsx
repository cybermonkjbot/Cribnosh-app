import type { FC } from 'react';
import { Pressable, PressableProps, StyleSheet, Text, View } from 'react-native';

export interface CheckboxProps extends Omit<PressableProps, 'onPress'> {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
}

export const Checkbox: FC<CheckboxProps> = ({ checked, onChange, label, disabled, style, ...props }) => (
  <Pressable
    style={[
      styles.container,
      style,
    ]}
    onPress={() => !disabled && onChange(!checked)}
    disabled={disabled}
    accessibilityRole="checkbox"
    accessibilityState={{ checked, disabled }}
    hitSlop={8}
    {...props}
  >
    <View
      style={[
        styles.checkbox,
        checked && styles.checkboxChecked,
        disabled && styles.checkboxDisabled,
      ]}
    >
      {checked && <Text style={styles.checkmark}>✓</Text>}
    </View>
    {label && <Text style={styles.label}>{label}</Text>}
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', // flex-row
    alignItems: 'center', // items-center
    minHeight: 44, // min-h-[44px]
    minWidth: 44, // min-w-[44px]
    paddingHorizontal: 4, // px-1
  },
  checkbox: {
    width: 24, // w-6
    height: 24, // h-6
    borderRadius: 8, // rounded-lg
    borderWidth: 1, // border
    borderColor: '#D1D5DB', // border-gray-300
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
    marginRight: 12, // mr-3
    backgroundColor: '#FFFFFF', // bg-white
  },
  checkboxChecked: {
    backgroundColor: '#111827', // bg-gray-900
  },
  checkboxDisabled: {
    opacity: 0.4, // opacity-40
  },
  checkmark: {
    color: '#FFFFFF', // text-white
    fontSize: 18, // text-lg
  },
  label: {
    color: '#111827', // text-gray-900
    fontSize: 16, // text-base
  },
});
