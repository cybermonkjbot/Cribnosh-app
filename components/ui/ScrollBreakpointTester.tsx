import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    withTiming
} from 'react-native-reanimated';

interface ScrollBreakpointTesterProps {
  scrollY: Animated.SharedValue<number>;
  resistanceProgress: Animated.SharedValue<number>;
  isExpanded: Animated.SharedValue<boolean>;
  onManualExpand?: () => void;
}

export const ScrollBreakpointTester: React.FC<ScrollBreakpointTesterProps> = ({
  scrollY,
  resistanceProgress,
  isExpanded,
  onManualExpand,
}) => {
  const [showDebug, setShowDebug] = useState(true);
  const [displayValues, setDisplayValues] = useState({
    scrollY: '0px',
    resistance: '0%',
    expanded: 'No',
    gestureActive: 'No'
  });

  // Use derived values to safely access shared values
  const scrollYDisplay = useDerivedValue(() => {
    'worklet';
    return `${Math.round(scrollY.value)}px`;
  });

  const resistanceDisplay = useDerivedValue(() => {
    'worklet';
    return `${Math.round(resistanceProgress.value * 100)}%`;
  });

  const expandedDisplay = useDerivedValue(() => {
    'worklet';
    return isExpanded.value ? 'Yes' : 'No';
  });

  // Update display values using runOnJS
  const updateDisplayValues = (scrollYStr: string, resistanceStr: string, expandedStr: string) => {
    setDisplayValues({
      scrollY: scrollYStr,
      resistance: resistanceStr,
      expanded: expandedStr,
      gestureActive: 'No'
    });
  };

  // Use derived value to trigger updates
  useDerivedValue(() => {
    'worklet';
    runOnJS(updateDisplayValues)(
      scrollYDisplay.value,
      resistanceDisplay.value,
      expandedDisplay.value
    );
  });

  const debugAnimatedStyle = useAnimatedStyle(() => ({
    opacity: withTiming(showDebug ? 1 : 0, { duration: 200 }),
  }));

  // Derived values for safe access in animated styles
  const progressBarWidth = useDerivedValue(() => {
    'worklet';
    const progress = Math.max(0, Math.min(100, resistanceProgress.value * 100));
    return progress;
  });

  const scrollIndicatorTranslateX = useDerivedValue(() => {
    'worklet';
    const scrollPosition = Math.min(scrollY.value / 2, 200);
    return Math.max(0, scrollPosition);
  });

  const progressBarStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      width: `${progressBarWidth.value}%`,
    };
  });

  const scrollIndicatorStyle = useAnimatedStyle(() => {
    'worklet';
    return {
      transform: [{ translateX: scrollIndicatorTranslateX.value }],
    };
  });

  const toggleDebug = () => {
    setShowDebug(!showDebug);
  };

  const testHaptics = () => {
    Alert.alert('Haptic Test', 'Testing haptic feedback...');
  };

  const testBreakpoint = () => {
    Alert.alert('Breakpoint Test', 'Current scroll position and resistance progress logged to console');
    // Use derived values to safely log values
    runOnJS(() => {
      console.log('Scroll Y:', scrollYDisplay.value);
      console.log('Resistance Progress:', resistanceDisplay.value);
      console.log('Is Expanded:', expandedDisplay.value);
    })();
  };

  const handleManualExpand = () => {
    if (onManualExpand) {
      try {
        onManualExpand();
      } catch (error) {
        console.log('Manual expand error:', error);
        Alert.alert('Error', 'Manual expand failed. Check console for details.');
      }
    }
  };

  const logDebugValues = () => {
    runOnJS(() => {
      console.log('Current values:');
      console.log('Scroll Y:', scrollYDisplay.value);
      console.log('Resistance Progress:', resistanceDisplay.value);
      console.log('Is Expanded:', expandedDisplay.value);
      console.log('Is Gesture Active:', 'No');
      console.log('Is Animating:', false);
    })();
  };

  return (
    <Animated.View style={[styles.container, debugAnimatedStyle]}>
      <View style={styles.header}>
        <Text style={styles.title}>Scroll Breakpoint Debug</Text>
        <Text style={styles.subtitle} onPress={toggleDebug}>Tap to hide</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Scroll Position</Text>
        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, scrollIndicatorStyle]} />
        </View>
        <Text style={styles.value}>{displayValues.scrollY}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Resistance Progress</Text>
        <View style={styles.progressContainer}>
          <Animated.View style={[styles.progressBar, progressBarStyle]} />
        </View>
        <Text style={styles.value}>{displayValues.resistance}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Expanded State</Text>
        <Text style={styles.value}>{displayValues.expanded}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Gesture Active</Text>
        <Text style={styles.value}>{displayValues.gestureActive}</Text>
      </View>

      <View style={styles.buttonContainer}>
        <Text style={styles.button} onPress={testHaptics}>
          Test Haptics
        </Text>
        <Text style={styles.button} onPress={testBreakpoint}>
          Test Breakpoint
        </Text>
      </View>

      {onManualExpand && (
        <View style={styles.buttonContainer}>
          <Text style={styles.button} onPress={handleManualExpand}>
            Manual Expand
          </Text>
        </View>
      )}

      <View style={styles.buttonContainer}>
        <Text style={styles.button} onPress={logDebugValues}>
          Debug Values
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <Text style={styles.button} onPress={() => {
          console.log('Manual gesture test - setting gesture active');
          // isGestureActive.value = true; // isGestureActive is removed
          setTimeout(() => {
            console.log('Manual gesture test - setting gesture inactive');
            // isGestureActive.value = false; // isGestureActive is removed
          }, 1000);
        }}>
          Test Gesture State
        </Text>
      </View>

      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>How to Test:</Text>
        <Text style={styles.instruction}>1. Scroll down to 200px</Text>
        <Text style={styles.instruction}>2. Feel the resistance increase</Text>
        <Text style={styles.instruction}>3. Pull up to expand stats</Text>
        <Text style={styles.instruction}>4. Check haptic feedback</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 12,
    padding: 16,
    width: 200,
    zIndex: 1000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.7,
  },
  section: {
    marginBottom: 12,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 4,
  },
  progressContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FF6B00',
    borderRadius: 2,
  },
  value: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    color: '#FF6B00',
    fontSize: 12,
    fontWeight: 'bold',
  },
  instructions: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    paddingTop: 12,
  },
  instructionTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  instruction: {
    color: '#FFFFFF',
    fontSize: 10,
    opacity: 0.8,
    marginBottom: 2,
  },
}); 