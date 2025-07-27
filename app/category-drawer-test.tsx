import { CategoryDrawerDemo } from '@/components/ui';
import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CategoryDrawerTest() {
  return (
    <SafeAreaView style={styles.container}>
      <CategoryDrawerDemo />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFFFA',
  },
}); 