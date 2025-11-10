import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../constants/Colors';

interface LoadingScreenProps {
  message?: string;
  showSpinner?: boolean;
  size?: 'small' | 'large';
}

export function LoadingScreen({ 
  message = 'Loading...', 
  showSpinner = true,
  size = 'large',
}: LoadingScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {showSpinner && (
          <ActivityIndicator 
            size={size} 
            color={Colors.light.primary} 
            style={styles.spinner}
          />
        )}
        <Text style={styles.message}>{message}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  spinner: {
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: Colors.light.icon,
    textAlign: 'center',
  },
});
