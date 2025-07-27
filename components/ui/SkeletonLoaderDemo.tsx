import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { MealVideoCardSkeleton } from './MealVideoCardSkeleton';

export function SkeletonLoaderDemo() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading for 3 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const resetLoading = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Skeleton Loader Demo</Text>
      <Text style={styles.subtitle}>
        {isLoading ? 'Loading...' : 'Content Loaded!'}
      </Text>
      
      <View style={styles.skeletonContainer}>
        <MealVideoCardSkeleton isVisible={isLoading} />
      </View>
      
      <Pressable style={styles.button} onPress={resetLoading}>
        <Text style={styles.buttonText}>Reset Loading</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 20,
  },
  skeletonContainer: {
    width: '100%',
    height: '70%',
    position: 'relative',
  },
  button: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 