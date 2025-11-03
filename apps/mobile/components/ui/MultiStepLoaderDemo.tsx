import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MultiStepLoader } from './MultiStepLoader';

export const MultiStepLoaderDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const loadingStates = [
    { 
      text: 'Finding the best meals for you...',
      emotion: 'excited' as const
    },
    { 
      text: 'Preparing your fresh experience...',
      emotion: 'hungry' as const
    },
    { 
      text: 'Ready to serve!',
      emotion: 'satisfied' as const
    },
  ];

  const simulateLoading = async () => {
    setIsLoading(true);
    
    // The loader will automatically progress through states
    // We can stop it after a certain time or let it loop
    setTimeout(() => {
      setIsLoading(false);
    }, 8000); // 8 seconds total (3 steps × 2 seconds + 2 seconds buffer)
  };

  const handleStartLoading = () => {
    if (!isLoading) {
      simulateLoading();
    }
  };

  const handleStopLoading = () => {
    setIsLoading(false);
  };

  return (
    <ScrollView style={styles.scrollView}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.title}>
            Cribnosh Multi-Step Loader
          </Text>
          <Text style={styles.subtitle}>
            Polished loading experience with mascot and Cribnosh branding
          </Text>
        </View>

        {/* Current Status */}
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>
            Current Status
          </Text>
          <Text style={styles.statusValue}>
            {isLoading ? 'Loading in progress...' : 'Ready to start'}
          </Text>
          {isLoading && (
            <Text style={styles.statusNote}>
              The loader will automatically progress through {loadingStates.length} states
            </Text>
          )}
        </View>

        {/* Loading States Preview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Loading States
          </Text>
          <View style={styles.statesContainer}>
            {loadingStates.map((state, index) => (
              <View
                key={index}
                style={styles.stateCard}
              >
                <Text style={styles.stateText}>
                  {index + 1}. {state.text}
                </Text>
                <Text style={styles.stateEmotion}>
                  Mascot emotion: {state.emotion}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Controls */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Controls
          </Text>
          
          {/* Start Loading Button */}
          <TouchableOpacity
            onPress={handleStartLoading}
            disabled={isLoading}
            style={[
              styles.button,
              styles.buttonStart,
              isLoading && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Loading...' : 'Start Loading'}
            </Text>
          </TouchableOpacity>

          {/* Stop Loading Button */}
          <TouchableOpacity
            onPress={handleStopLoading}
            disabled={!isLoading}
            style={[
              styles.button,
              styles.buttonStop,
              !isLoading && styles.buttonDisabled,
            ]}
          >
            <Text style={styles.buttonText}>
              Stop Loading
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Features
          </Text>
          <View style={styles.featuresContainer}>
            <Text style={styles.featureText}>
              • 3 polished loading states with Cribnosh branding
            </Text>
            <Text style={styles.featureText}>
              • Animated mascot that changes emotion for each step
            </Text>
            <Text style={styles.featureText}>
              • Cribnosh orange-red color scheme (#FF3B30)
            </Text>
            <Text style={styles.featureText}>
              • Glassmorphism backdrop with blur effect
            </Text>
            <Text style={styles.featureText}>
              • Smooth animations and transitions
            </Text>
            <Text style={styles.featureText}>
              • Each step takes 2 seconds to complete
            </Text>
          </View>
        </View>
      </View>

      {/* The MultiStepLoader component */}
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={isLoading}
        duration={2000}
        loop={true}
      />
    </ScrollView>
  );
}; 

const styles = StyleSheet.create({
  scrollView: {
    flex: 1, // flex-1
    backgroundColor: '#FFFFFF', // bg-white
    padding: 16, // p-4
  },
  container: {
    gap: 24, // space-y-6
  },
  headerSection: {
    gap: 8, // space-y-2
  },
  title: {
    fontSize: 24, // text-2xl
    fontWeight: '700', // font-bold
    color: '#111827', // text-gray-900
  },
  subtitle: {
    fontSize: 16, // text-base (default)
    color: '#4B5563', // text-gray-600
  },
  statusCard: {
    backgroundColor: '#F9FAFB', // bg-gray-50
    padding: 16, // p-4
    borderRadius: 8, // rounded-lg
  },
  statusLabel: {
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
    color: '#374151', // text-gray-700
    marginBottom: 8, // mb-2
  },
  statusValue: {
    fontSize: 18, // text-lg
    fontWeight: '600', // font-semibold
    color: '#111827', // text-gray-900
  },
  statusNote: {
    fontSize: 14, // text-sm
    color: '#FF3B30', // text-[#FF3B30]
    marginTop: 4, // mt-1
  },
  section: {
    gap: 12, // space-y-3
  },
  sectionTitle: {
    fontSize: 14, // text-sm
    fontWeight: '500', // font-medium
    color: '#374151', // text-gray-700
  },
  statesContainer: {
    gap: 8, // space-y-2
  },
  stateCard: {
    padding: 12, // p-3
    borderRadius: 8, // rounded-lg
    borderWidth: 1, // border
    borderColor: '#E5E7EB', // border-gray-200
    backgroundColor: '#F9FAFB', // bg-gray-50
  },
  stateText: {
    color: '#374151', // text-gray-700
    fontWeight: '500', // font-medium
  },
  stateEmotion: {
    fontSize: 14, // text-sm
    color: '#6B7280', // text-gray-500
    marginTop: 4, // mt-1
  },
  button: {
    padding: 16, // p-4
    borderRadius: 8, // rounded-lg
    alignItems: 'center', // items-center
  },
  buttonStart: {
    backgroundColor: '#FF3B30', // bg-[#FF3B30]
  },
  buttonStop: {
    backgroundColor: '#6B7280', // bg-gray-500
  },
  buttonDisabled: {
    opacity: 0.5, // opacity-50
  },
  buttonText: {
    color: '#FFFFFF', // text-white
    fontWeight: '600', // font-semibold
  },
  featuresContainer: {
    gap: 8, // space-y-2
  },
  featureText: {
    fontSize: 14, // text-sm
    color: '#4B5563', // text-gray-600
  },
}); 