import { ShakeToEatFlow } from '@/components/ui/ShakeToEatFlow';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function ShakeToEatDemo() {
  const [isShakeToEatVisible, setIsShakeToEatVisible] = useState(false);

  // Add logging to verify component is mounting
  useEffect(() => {
    console.log('🚀 ShakeToEatDemo component mounted');
  }, []);

  const handleAIChatLaunch = (prompt: string) => {
    console.log('AI Chat Prompt:', prompt);
    // Here you would typically launch your AI chat component
    // For demo purposes, we'll just log the prompt
    alert(`AI Chat would launch with: "${prompt}"`);
  };

  const handleOpenShakeToEat = () => {
    console.log('🎯 Opening Shake to Eat flow...');
    setIsShakeToEatVisible(true);
  };

  const handleCloseShakeToEat = () => {
    console.log('❌ Closing Shake to Eat flow...');
    setIsShakeToEatVisible(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF5F5', '#FFE8D6']}
        style={styles.gradientBackground}
      >
        <View style={styles.content}>
          <Text style={styles.title}>🍽️ Shake to Eat Demo</Text>
          <Text style={styles.subtitle}>
            Experience the magical Duolingo-style food discovery!
          </Text>

          <View style={styles.featureList}>
            <Text style={styles.featureTitle}>✨ Features:</Text>
            <Text style={styles.featureItem}>• Shake detection with haptic feedback</Text>
            <Text style={styles.featureItem}>• Animated mood picker with emotions</Text>
            <Text style={styles.featureItem}>• Gacha-style meal spinner</Text>
            <Text style={styles.featureItem}>• Magic portal transition</Text>
            <Text style={styles.featureItem}>• AI chat integration</Text>
          </View>

          <Pressable
            style={styles.demoButton}
            onPress={handleOpenShakeToEat}
          >
            <LinearGradient
              colors={['#FF3B30', '#FF6B6B']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>🎯 Start Shake to Eat</Text>
            </LinearGradient>
          </Pressable>

          <Text style={styles.instructions}>
            Tap the button above or shake your device to start the experience!
          </Text>

          {/* Debug info */}
          <View style={styles.debugInfo}>
            <Text style={styles.debugText}>
              Debug: ShakeToEat visible: {isShakeToEatVisible ? 'Yes' : 'No'}
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ShakeToEatFlow
        isVisible={isShakeToEatVisible}
        onClose={handleCloseShakeToEat}
        onAIChatLaunch={handleAIChatLaunch}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#11181C',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#687076',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  featureList: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    width: '100%',
    maxWidth: 350,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 12,
  },
  featureItem: {
    fontSize: 16,
    color: '#687076',
    marginBottom: 8,
    lineHeight: 22,
  },
  demoButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  instructions: {
    fontSize: 14,
    color: '#687076',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  debugInfo: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#687076',
    textAlign: 'center',
  },
}); 