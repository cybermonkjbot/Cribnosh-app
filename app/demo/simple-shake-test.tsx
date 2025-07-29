import { Mascot } from '@/components/Mascot';
import { CONFIG } from '@/constants/config';
import { useShakeDetection } from '@/hooks/useShakeDetection';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SimpleShakeTest() {
  // Early return if shake to eat is disabled
  if (!CONFIG.SHAKE_TO_EAT_ENABLED) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Shake to Eat Feature Disabled</Text>
        <Text style={styles.statusText}>
          This feature is currently disabled in the configuration.
        </Text>
      </View>
    );
  }

  const [shakeEvents, setShakeEvents] = useState<string[]>([]);

  const handleShake = () => {
    const timestamp = new Date().toLocaleTimeString();
    const event = `Shake detected at ${timestamp}`;
    console.log('🎯', event);
    setShakeEvents(prev => [event, ...prev.slice(0, 4)]); // Keep last 5 events
  };

  // Sustained shake detection test
  const { isShaking, shakeCount, sustainedShakeProgress, isSustainedShaking } = useShakeDetection(handleShake, {
    debug: true,
    sensitivity: 'high',
    threshold: 5, // Very low threshold for testing
    cooldownMs: 1000,
    sustainedShakeDuration: 3000, // 3 seconds of sustained shaking required
    enabled: true // Always enabled for testing
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Shake Test</Text>
      
      {/* Mascot with dynamic emotions */}
      <View style={styles.mascotContainer}>
        <Mascot 
          emotion={
            !isSustainedShaking ? 'default' :
            sustainedShakeProgress < 0.3 ? 'hungry' :
            sustainedShakeProgress < 0.7 ? 'excited' :
            'happy'
          }
          size={80}
        />
      </View>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Is Shaking: {isShaking ? 'YES' : 'NO'}
        </Text>
        <Text style={styles.statusText}>
          Sustained Shaking: {isSustainedShaking ? 'YES' : 'NO'}
        </Text>
        <Text style={styles.statusText}>
          Progress: {Math.round(sustainedShakeProgress * 100)}%
        </Text>
        
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${sustainedShakeProgress * 100}%` }
              ]} 
            />
          </View>
        </View>
        
        <Text style={styles.statusText}>
          Shake Count: {shakeCount}
        </Text>
      </View>

      <View style={styles.eventsContainer}>
        <Text style={styles.eventsTitle}>Recent Shake Events:</Text>
        {shakeEvents.length === 0 ? (
          <Text style={styles.noEvents}>No shakes detected yet</Text>
        ) : (
          shakeEvents.map((event, index) => (
            <Text key={index} style={styles.eventText}>
              {event}
            </Text>
          ))
        )}
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>Instructions:</Text>
        <Text style={styles.instruction}>1. Shake your device continuously for 3 seconds</Text>
        <Text style={styles.instruction}>2. Watch the progress indicator</Text>
        <Text style={styles.instruction}>3. Keep shaking until progress reaches 100%</Text>
        <Text style={styles.instruction}>4. Check if events appear above</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#11181C',
    textAlign: 'center',
    marginBottom: 30,
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  statusContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  eventsContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 10,
  },
  noEvents: {
    fontSize: 14,
    color: '#687076',
    fontStyle: 'italic',
  },
  eventText: {
    fontSize: 14,
    color: '#22c55e',
    marginBottom: 4,
  },
  instructions: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 10,
  },
  instruction: {
    fontSize: 14,
    color: '#687076',
    marginBottom: 6,
  },
  progressBarContainer: {
    marginVertical: 10,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22C55E',
    borderRadius: 4,
  },
}); 