import { ForkPrintScoreCard } from '@/components/ui/ForkPrintScoreCard';
import React from 'react';
import { SafeAreaView, StyleSheet, View } from 'react-native';

export default function ForkPrintScoreDemo() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <ForkPrintScoreCard 
          score={799}
          status="Tastemaker"
          pointsToNext={3}
          nextLevel="Food Influencer"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
}); 