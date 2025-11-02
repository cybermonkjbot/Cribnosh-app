import { AnimatedSplashScreen } from '@/components/AnimatedSplashScreen';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function AnimatedSplashDemo() {
  const [showSplash, setShowSplash] = useState(false);

  const handleShowSplash = () => {
    setShowSplash(true);
  };

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return (
      <AnimatedSplashScreen 
        onAnimationComplete={handleSplashComplete}
        duration={4000}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Animated Splash Screen Demo</Text>
      <Text style={styles.description}>
        This demo shows the animated splash screen that cycles through three background colors:
        {'\n'}• White (#FFFFFF)
        {'\n'}• Dark Charcoal (#2C2C2C) 
        {'\n'}• Red (#DC2626)
      </Text>
      <TouchableOpacity style={styles.button} onPress={handleShowSplash}>
        <Text style={styles.buttonText}>Show Animated Splash</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#24A645',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
