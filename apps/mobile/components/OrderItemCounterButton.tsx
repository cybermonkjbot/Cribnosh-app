import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import IncrementalOrderAmount from './IncrementalOrderAmount';

interface OrderItemCounterButtonProps {
  onChange?: (value: number) => void;
  min?: number;
  max?: number;
}

const OrderItemCounterButton: React.FC<OrderItemCounterButtonProps> = ({
  onChange,
  min = 1,
  max = 99,
}) => {
  const [showCounter, setShowCounter] = useState(false);

  const handleOrderPress = () => {
    setShowCounter(true);
    onChange && onChange(1);
  };

  const handleCounterChange = (value: number) => {
    if (value < min) {
      setShowCounter(false);
      onChange && onChange(0);
    } else {
      onChange && onChange(value);
    }
  };

  return (
    <View style={styles.container}>
      {showCounter ? (
        <IncrementalOrderAmount
          initialValue={1}
          min={min}
          max={max}
          onChange={handleCounterChange}
        />
      ) : (
        <Pressable style={styles.orderButton} onPress={handleOrderPress}>
          <Text style={styles.orderText}>Order</Text>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 79,
    height: 36,
    // Remove absolute positioning so it stays in flow
  },
  orderButton: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#000',
  },
});

export default OrderItemCounterButton;
