import React from 'react';
import { View, TextInput, Text, StyleSheet } from 'react-native';

interface AmountInputProps {
  amount: string;
  setAmount: (val: string) => void;
}

const AmountInput: React.FC<AmountInputProps> = ({ amount, setAmount }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.currency}>£</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        keyboardType="numeric"
        placeholder="0"
        placeholderTextColor="#ccc"
        style={styles.input}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#5E685F', // Dark green
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    // paddingVertical: 30,
    height: 95,
    justifyContent: 'center',
    marginVertical: 20,
    marginHorizontal: 40,
  },
  currency: {
    fontSize: 40,
    fontWeight: '600',
    color: '#E6FFE8', // Soft white
    marginRight: 8,
  },
  input: {
    fontSize: 40,
    fontWeight: '600',
    color: '#E6FFE8',
    flex: 1,
    textAlign: 'center',


  },
});

export default AmountInput;
