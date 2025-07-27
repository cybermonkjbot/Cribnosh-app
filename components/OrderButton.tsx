import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface OrderButtonProps {
  onPress?: () => void;
  label?: string;
}

export const OrderButton: React.FC<OrderButtonProps> = ({ onPress, label = 'Order' }) => {
  return (
    <Pressable style={styles.container} onPress={onPress}>
      <View style={styles.buttonLeft} />
      <Text style={styles.label}>{label}</Text>
      <View style={styles.buttonRight} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 79,
    height: 36,
    left: 257,
    top: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  buttonLeft: {
    position: 'absolute',
    width: 7,
    height: 30,
    left: 12,
    top: 4,
    // Placeholder for left icon or decoration
  },
  label: {
    position: 'absolute',
    width: 44,
    height: 24,
    left: 17,
    top: 6,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#000000',
    textAlign: 'center',
  },
  buttonRight: {
    position: 'absolute',
    width: 13,
    height: 30,
    left: 53,
    top: 4,
    // Placeholder for right icon or decoration
  },
});

export default OrderButton;
