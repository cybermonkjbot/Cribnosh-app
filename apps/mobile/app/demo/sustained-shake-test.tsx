import { useShakeDetection } from '@/hooks/useShakeDetection';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CONFIG } from '../../constants/config';

export default function SustainedShakeTest() {
  const [shakeEvents, setShakeEvents] = useState<string[]>([]);

  const handleShake = () => {
    const timestamp = new Date().toLocaleTimeString();
    const event = `Sustained shake completed at ${timestamp}`;
    console.log('🎯', event);
    setShakeEvents(prev => [event, ...prev.slice(0, 4)]); // Keep last 5 events
  };

  // Sustained shake detection test
  const { 
    isShaking, 
    shakeCount, 
    sustainedShakeProgress, 
    isSustainedShaking 
  } = useShakeDetection(handleShake, {
    debug: true,
    sensitivity: 'high',
    threshold: 5, // Very low threshold for testing
    cooldownMs: 1000,
    sustainedShakeDuration: 3000 // 3 seconds of sustained shaking required
  });

  // Early return if shake to eat is disabled
  if (!CONFIG.SHAKE_TO_EAT_ENABLED) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Sustained Shake Test</Text>
        <Text style={styles.statusText}>
          Shake to Eat Feature Disabled
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sustained Shake Test</Text>
      
      {/* Status Cards */}
      <View style={styles.statusGrid}>
        <View style={[styles.statusCard, isShaking && styles.activeCard]}>
          <Text style={styles.statusLabel}>Shaking</Text>
          <Text style={styles.statusValue}>{isShaking ? 'YES' : 'NO'}</Text>
        </View>
        
        <View style={[styles.statusCard, isSustainedShaking && styles.activeCard]}>
          <Text style={styles.statusLabel}>Sustained</Text>
          <Text style={styles.statusValue}>{isSustainedShaking ? 'YES' : 'NO'}</Text>
        </View>
        
        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Count</Text>
          <Text style={styles.statusValue}>{shakeCount}</Text>
        </View>
      </View>

      {/* Progress Section */}
      <View style={styles.progressSection}>
        <Text style={styles.progressLabel}>
          Sustained Shake Progress: {Math.round(sustainedShakeProgress * 100)}%
        </Text>
        
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${sustainedShakeProgress * 100}%`,
                  backgroundColor: sustainedShakeProgress === 1 ? '#22C55E' : '#3B82F6'
                }
              ]} 
            />
          </View>
        </View>
        
        {/* Progress Text */}
        <Text style={styles.progressText}>
          {sustainedShakeProgress === 0 && 'Start shaking to begin...'}
          {sustainedShakeProgress > 0 && sustainedShakeProgress < 1 && 'Keep shaking...'}
          {sustainedShakeProgress === 1 && 'Shake completed!'}
        </Text>
      </View>

      {/* Events Section */}
      <View style={styles.eventsContainer}>
        <Text style={styles.eventsTitle}>Recent Completed Shakes:</Text>
        {shakeEvents.length === 0 ? (
          <Text style={styles.noEvents}>No sustained shakes completed yet</Text>
        ) : (
          shakeEvents.map((event, index) => (
            <Text key={index} style={styles.eventText}>
              {event}
            </Text>
          ))
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>How to Test:</Text>
        <Text style={styles.instruction}>1. Start shaking your device</Text>
        <Text style={styles.instruction}>2. Keep shaking continuously for 3 seconds</Text>
        <Text style={styles.instruction}>3. Watch the progress bar fill up</Text>
        <Text style={styles.instruction}>4. Don&apos;t stop until it reaches 100%</Text>
        <Text style={styles.instruction}>5. If you stop, progress resets to 0%</Text>
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
    fontSize: 28,
    fontWeight: '700',
    color: '#11181C',
    textAlign: 'center',
    marginBottom: 30,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  statusCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginHorizontal: 5,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeCard: {
    backgroundColor: '#E6FFE8',
    borderColor: '#22C55E',
    borderWidth: 2,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#687076',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  statusValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#11181C',
  },
  progressSection: {
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
  progressLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 15,
    textAlign: 'center',
  },
  progressBarContainer: {
    marginBottom: 15,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E5E7EB',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 14,
    color: '#687076',
    textAlign: 'center',
    fontStyle: 'italic',
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
  statusText: { // Added new style for status text
    fontSize: 18,
    fontWeight: '600',
    color: '#687076',
    textAlign: 'center',
    marginTop: 20,
  },
}); 