import React from 'react';
import { Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
import CartSvg from './CartSvg';

interface CartBarProps {
  count: number;
  label?: string;
  onPress?: () => void;
  backgroundColor?: string;
  textColor?: string;
  style?: ViewStyle;
  labelStyle?: TextStyle;
}

export const CartBar: React.FC<CartBarProps> = ({
  count,
  label = 'Items in cart',
  onPress,
  backgroundColor = '#FF3B30',
  textColor = '#FAFFFA',
  style,
  labelStyle,
}) => {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      className="flex-row items-center justify-between rounded-2xl px-6 py-3 w-full min-h-[58px] my-2 gap-3"
      style={[{ backgroundColor }, style]}
    >
      <View className="w-8 h-8 rounded-full bg-[#E6FFE8] items-center justify-center">
        <Text className="text-center text-[18px] font-extrabold" style={{ color: '#FF3B30', fontFamily: 'Poppins' }}>{count}</Text>
      </View>
      <Text className="flex-1 text-center text-[18px] font-semibold" style={[{ color: textColor, fontFamily: 'Poppins' }, labelStyle]}>{label}</Text>
      <CartSvg width={24} height={24} className="ml-2" />
    </TouchableOpacity>
  );
};


export default CartBar;
