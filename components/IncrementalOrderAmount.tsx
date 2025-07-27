import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface IncrementalOrderAmountProps {
  initialValue?: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
}

const IncrementalOrderAmount: React.FC<IncrementalOrderAmountProps> = ({
  initialValue = 1,
  min = 1,
  max = 99,
  onChange,
}) => {
  const [value, setValue] = useState(initialValue);

  const handleDecrement = () => {
    if (value > min) {
      setValue(prev => {
        const newValue = prev - 1;
        onChange && onChange(newValue);
        return newValue;
      });
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      setValue(prev => {
        const newValue = prev + 1;
        onChange && onChange(newValue);
        return newValue;
      });
    }
  };

  return (
    <View style={styles.container}>
      <Pressable style={styles.button} onPress={handleDecrement}>
        <Text style={styles.buttonText}>-</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable style={styles.button} onPress={handleIncrement}>
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
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
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  button: {
    width: 24,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 20,
    color: '#000',
    fontWeight: '500',
  },
  value: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 24,
    color: '#000',
    textAlign: 'center',
    width: 24,
  },
});

export default IncrementalOrderAmount;
