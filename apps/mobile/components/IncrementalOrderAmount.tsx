import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface IncrementalOrderAmountProps {
  initialValue?: number;
  min?: number;
  max?: number;
  onChange?: (value: number) => void;
  onOrder?: () => void;
  isOrdered?: boolean;
  buttonText?: string; // Custom text for the initial button (default: "Order")
}

const IncrementalOrderAmount: React.FC<IncrementalOrderAmountProps> = ({
  initialValue = 1,
  min = 1,
  max = 99,
  onChange,
  onOrder,
  isOrdered: externalIsOrdered,
  buttonText = "Order",
}) => {
  const [value, setValue] = useState(initialValue);
  const [internalIsOrdered, setInternalIsOrdered] = useState(false);
  
  // Use external isOrdered if provided, otherwise use internal state
  const isOrdered = externalIsOrdered !== undefined ? externalIsOrdered : internalIsOrdered;

  const handleOrderClick = (e?: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (onOrder) {
      onOrder();
    } else {
      setInternalIsOrdered(true);
      onChange && onChange(value);
    }
  };

  const handleDecrement = () => {
    if (value > min) {
      const newValue = value - 1;
      setValue(newValue);
      // Call onChange directly - the parent should handle async operations
      onChange?.(newValue);
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      const newValue = value + 1;
      setValue(newValue);
      // Call onChange directly - the parent should handle async operations
      onChange?.(newValue);
    }
  };
  
  // Sync value with external isOrdered state
  useEffect(() => {
    if (externalIsOrdered !== undefined && externalIsOrdered && !internalIsOrdered) {
      setInternalIsOrdered(true);
    }
  }, [externalIsOrdered, internalIsOrdered]);

  // Sync value when initialValue changes
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Show button initially (with custom text or "Order" default)
  if (!isOrdered) {
    return (
      <Pressable style={styles.orderButton} onPress={handleOrderClick}>
        <Text style={styles.orderButtonText}>{buttonText}</Text>
      </Pressable>
    );
  }

  // Show quantity controls after order is clicked
  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.button} 
        onPress={handleDecrement}
      >
        <Text style={styles.buttonText}>-</Text>
      </Pressable>
      <Text style={styles.value}>{value}</Text>
      <Pressable 
        style={styles.button} 
        onPress={handleIncrement}
      >
        <Text style={styles.buttonText}>+</Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 79,
    height: 36,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    overflow: 'hidden',
  },
  orderButton: {
    width: 79,
    height: 36,
    backgroundColor: '#094327',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orderButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    textAlign: 'center',
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
