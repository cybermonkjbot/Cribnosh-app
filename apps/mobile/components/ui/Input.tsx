import type { FC, ReactNode } from 'react';
import { StyleSheet, TextInput, TextInputProps, View } from 'react-native';

export interface InputProps extends TextInputProps {
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
}

const getSizeStyles = (size: 'sm' | 'md' | 'lg') => {
  switch (size) {
    case 'sm':
      return {
        height: 40,
        fontSize: 16,
        paddingHorizontal: 12,
      };
    case 'md':
      return {
        height: 48,
        fontSize: 18,
        paddingHorizontal: 16,
      };
    case 'lg':
      return {
        height: 56,
        fontSize: 20,
        paddingHorizontal: 16,
      };
  }
};

export const Input: FC<InputProps> = ({ size = 'md', leftIcon, style, ...props }) => {
  const sizeStyles = getSizeStyles(size);
  
  return (
    <View
      style={[
        styles.container,
        {
          height: sizeStyles.height,
          paddingLeft: leftIcon ? 8 : sizeStyles.paddingHorizontal,
          paddingRight: sizeStyles.paddingHorizontal,
        },
        style,
      ]}
    >
      {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}

      <TextInput
        style={[
          styles.input,
          {
            fontSize: sizeStyles.fontSize,
          },
        ]}
        placeholderTextColor="#E6FFE8"
        placeholder={props.placeholder}
        accessibilityRole="search"
        {...props}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: '#4B5563',
    borderRadius: 12,
    backgroundColor: '#4A4A4A',
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontFamily: 'System',
  },
});
