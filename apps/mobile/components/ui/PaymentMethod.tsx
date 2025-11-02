import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function PaymentMethod() {
  return (
    <View style={styles.container}>
      <View>
        <Text>PaymentMethod</Text>
      </View>

      <Text style={styles.title}>Payment</Text>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Cribnosh balance</Text>
        <Text style={styles.balanceAmount}>N0</Text>
        <Text style={styles.balanceNote}>
          Cribnosh balance is not available with this payment method
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, // flex-1
    backgroundColor: '#F8F8F8', // bg-[#F8F8F8]
    padding: 20, // p-5
  },
  title: {
    color: '#031D11', // text-[#031D11]
    fontWeight: '800', // font-extrabold
    fontSize: 30, // text-3xl
  },
  balanceCard: {
    marginTop: 20, // mt-5
    borderRadius: 16, // rounded-2xl
    padding: 20, // p-5
    backgroundColor: '#F4FFF5', // bg-[#F4FFF5]
    gap: 16, // gap-y-4
  },
  balanceLabel: {
    fontSize: 18, // text-lg
  },
  balanceAmount: {
    fontWeight: '600', // font-semibold
    fontSize: 30, // text-3xl
  },
  balanceNote: {
    fontSize: 18, // text-lg
  },
});
