import { useShakeDetection } from '@/hooks/useShakeDetection';
import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function SimpleShakeTest() {
  const [shakeEvents, setShakeEvents] = useState<string[]>([]);

  const handleShake = () => {
    const timestamp = new Date().toLocaleTimeString();
    const event = `Shake detected at ${timestamp}`;
    console.log('🎯', event);
    setShakeEvents(prev => [event, ...prev.slice(0, 4)]); // Keep last 5 events
  };

  // Simple shake detection test
  const { isShaking, shakeCount } = useShakeDetection(handleShake, {
    debug: true,
    sensitivity: 'high',
    threshold: 5, // Very low threshold for testing
    cooldownMs: 1000
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Simple Shake Test</Text>
      
      <View style={styles.statusContainer}>
        <Text style={styles.statusText}>
          Is Shaking: {isShaking ? 'YES' : 'NO'}
        </Text>
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
        <Text style={styles.instruction}>1. Shake your device</Text>
        <Text style={styles.instruction}>2. Watch the console for logs</Text>
        <Text style={styles.instruction}>3. Check if events appear above</Text>
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
}); 