import { useShakeDetection } from '@/hooks/useShakeDetection';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CONFIG } from '../../constants/config';
import { Mascot } from '../Mascot';

export function ShakeDebugger() {
  const [shakeEvents, setShakeEvents] = useState<string[]>([]);

  const handleShake = () => {
    const timestamp = new Date().toLocaleTimeString();
    const event = `Shake at ${timestamp}`;
    console.log('🎯 DEBUG SHAKE:', event);
    setShakeEvents(prev => [event, ...prev.slice(0, 4)]);
  };

  const { isShaking, shakeCount, sustainedShakeProgress, isSustainedShaking } = useShakeDetection(handleShake, {
    debug: true,
    sensitivity: 'high',
    threshold: 0.2, // Lower threshold to match ShakeToEatFlow
    cooldownMs: 1000,
    sustainedShakeDuration: 3000,
    interruptionGracePeriod: 1500, // 1.5 seconds grace period for interruptions
    enabled: true // Always enabled for debugger
  });

  // Early return if debug mode is globally disabled
  if (!CONFIG.DEBUG_MODE) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Shake Debugger</Text>
      
      {/* Mascot with dynamic emotions */}
      <View style={styles.mascotContainer}>
        <Mascot 
          emotion={
            !isSustainedShaking ? 'default' :
            sustainedShakeProgress < 0.3 ? 'hungry' :
            sustainedShakeProgress < 0.7 ? 'excited' :
            'happy'
          }
          size={40}
        />
      </View>
      
      <View style={styles.statusRow}>
        <Text style={styles.label}>Is Shaking:</Text>
        <Text style={[styles.value, isShaking && styles.active]}>
          {isShaking ? 'YES' : 'NO'}
        </Text>
      </View>
      
      <View style={styles.statusRow}>
        <Text style={styles.label}>Sustained:</Text>
        <Text style={[styles.value, isSustainedShaking && styles.active]}>
          {isSustainedShaking ? 'YES' : 'NO'}
        </Text>
      </View>
      
      <View style={styles.statusRow}>
        <Text style={styles.label}>Progress:</Text>
        <Text style={styles.value}>
          {Math.round(sustainedShakeProgress * 100)}%
        </Text>
      </View>
      
      <View style={styles.statusRow}>
        <Text style={styles.label}>Count:</Text>
        <Text style={styles.value}>{shakeCount}</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${sustainedShakeProgress * 100}%` }
          ]} 
        />
      </View>

      {/* Recent Events */}
      <Text style={styles.eventsTitle}>Recent Events:</Text>
      {shakeEvents.map((event, index) => (
        <Text key={index} style={styles.eventText}>
          {event}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 150,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 15,
    borderRadius: 10,
    zIndex: 1000,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  mascotContainer: {
    alignItems: 'center',
    marginBottom: 10,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  label: {
    color: 'white',
    fontSize: 12,
  },
  value: {
    color: '#22c55e',
    fontSize: 12,
    fontWeight: 'bold',
  },
  active: {
    color: '#FF3B30',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#333',
    borderRadius: 2,
    marginVertical: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: 2,
  },
  eventsTitle: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 5,
  },
  eventText: {
    color: '#22c55e',
    fontSize: 10,
    marginBottom: 2,
  },
}); 