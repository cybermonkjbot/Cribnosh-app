import React from 'react';
import { StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle } from 'react-native';
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
      style={[
        styles.container,
        { backgroundColor },
        style,
      ]}
    >
      <View style={styles.countBadge}>
        <Text style={[styles.countText, { color: '#FF3B30', fontFamily: 'Poppins' }]}>
          {count}
        </Text>
      </View>
      <Text style={[styles.label, { color: textColor, fontFamily: 'Poppins' }, labelStyle]}>
        {label}
      </Text>
      <View style={styles.iconContainer}>
        <CartSvg width={24} height={24} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', // flex-row
    alignItems: 'center', // items-center
    justifyContent: 'space-between', // justify-between
    borderRadius: 16, // rounded-2xl
    paddingHorizontal: 24, // px-6
    paddingVertical: 12, // py-3
    width: '100%', // w-full
    minHeight: 58, // min-h-[58px]
    marginVertical: 8, // my-2
    gap: 12, // gap-3
  },
  countBadge: {
    width: 32, // w-8
    height: 32, // h-8
    borderRadius: 9999, // rounded-full
    backgroundColor: '#E6FFE8', // bg-[#E6FFE8]
    alignItems: 'center', // items-center
    justifyContent: 'center', // justify-center
  },
  countText: {
    textAlign: 'center', // text-center
    fontSize: 18, // text-[18px]
    fontWeight: '800', // font-extrabold
  },
  label: {
    flex: 1, // flex-1
    textAlign: 'center', // text-center
    fontSize: 18, // text-[18px]
    fontWeight: '600', // font-semibold
  },
  iconContainer: {
    marginLeft: 8, // ml-2
  },
});


export default CartBar;
