import { ProgressGauge } from '@/components/ui/ProgressGauge';
import React, { useEffect, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ProgressGaugeDemo() {
  const [progress, setProgress] = useState(67.2);
  const [animatedProgress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const updateProgress = () => {
    const newProgress = Math.random() * 100;
    setProgress(newProgress);
  };

  const getMessageForProgress = (progressValue: number) => {
    if (progressValue < 20) return "Keep going! You're just getting started";
    if (progressValue < 40) return "You're making good progress";
    if (progressValue < 60) return "Halfway there! Keep it up";
    if (progressValue < 80) return "Almost there! You're doing great";
    if (progressValue < 95) return "You should treat yourself a nice dinner";
    return "Amazing! You've reached your goal!";
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Progress Gauge Demo</Text>
        <Text style={styles.subtitle}>
          Semi-circular progress indicator with 15 segments
        </Text>
      </View>

      <View style={styles.demoSection}>
        <Text style={styles.sectionTitle}>Default Configuration</Text>
        <View style={styles.gaugeContainer}>
          <ProgressGauge 
            progress={67.2}
            percentage={67.2}
            message="You should treat yourself a nice dinner"
          />
        </View>
      </View>

      <View style={styles.demoSection}>
        <Text style={styles.sectionTitle}>Interactive Progress</Text>
        <View style={styles.gaugeContainer}>
          <ProgressGauge 
            progress={progress}
            percentage={progress}
            message={getMessageForProgress(progress)}
          />
        </View>
        <TouchableOpacity style={styles.button} onPress={updateProgress}>
          <Text style={styles.buttonText}>Randomize Progress</Text>
        </TouchableOpacity>
        <Text style={styles.progressText}>
          Current Progress: {progress.toFixed(1)}%
        </Text>
      </View>

      <View style={styles.demoSection}>
        <Text style={styles.sectionTitle}>Low Progress</Text>
        <View style={styles.gaugeContainer}>
          <ProgressGauge 
            progress={15}
            percentage={15}
            message="Keep going! You're just getting started"
          />
        </View>
      </View>

      <View style={styles.demoSection}>
        <Text style={styles.sectionTitle}>High Progress</Text>
        <View style={styles.gaugeContainer}>
          <ProgressGauge 
            progress={95}
            percentage={95}
            message="Amazing! You've reached your goal!"
          />
        </View>
      </View>

      <View style={styles.demoSection}>
        <Text style={styles.sectionTitle}>Custom Size</Text>
        <View style={styles.gaugeContainer}>
          <ProgressGauge 
            progress={50}
            percentage={50}
            message="Halfway there! Keep it up"
            size={200}
          />
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>Component Features:</Text>
        <Text style={styles.infoText}>• Semi-circular gauge with 15 segments</Text>
        <Text style={styles.infoText}>• Filled segments in dark green (#094327)</Text>
        <Text style={styles.infoText}>• Unfilled segments in white (#F6F6F6)</Text>
        <Text style={styles.infoText}>• Large percentage display in white</Text>
        <Text style={styles.infoText}>• Customizable motivational message</Text>
        <Text style={styles.infoText}>• Responsive sizing</Text>
        <Text style={styles.infoText}>• SVG-based rendering for crisp graphics</Text>
        <Text style={styles.infoText}>• Absolute positioning as per design specs</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  header: {
    marginBottom: 30,
    marginTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E6FFE8',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#cccccc',
    lineHeight: 22,
  },
  demoSection: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E6FFE8',
    marginBottom: 15,
  },
  gaugeContainer: {
    height: 200,
    marginBottom: 15,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  button: {
    backgroundColor: '#EBA10F',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#000000',
    fontWeight: '600',
    fontSize: 16,
  },
  progressText: {
    textAlign: 'center',
    color: '#cccccc',
    fontSize: 14,
  },
  infoSection: {
    backgroundColor: 'rgba(9, 67, 39, 0.2)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 40,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E6FFE8',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: '#cccccc',
    marginBottom: 5,
    lineHeight: 20,
  },
}); 