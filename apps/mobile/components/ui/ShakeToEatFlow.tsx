import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  View
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedReaction,
  useDerivedValue,
  interpolate,
  withTiming,
  withSpring,
  withRepeat,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { useShakeDetection } from '@/hooks/useShakeDetection';
import { CONFIG } from '../../constants/config';
import { Mascot } from '../Mascot';

// Helper function to render mood/meal icon or emoji
const renderMoodIcon = (item: any, size: number = 40) => {
  if (item.icon) {
    return <Ionicons name={item.icon as any} size={size} color="#FF6B35" />;
  }
  if (item.emoji) {
    return <Text style={{ fontSize: size }}>{item.emoji}</Text>;
  }
  return null;
};

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Flow steps - enhanced with more emotional beats
type FlowStep = 'idle' | 'wake-up' | 'mood-reveal' | 'mood-locked' | 'energy-building' | 'food-discovery' | 'magic-moment' | 'taste-preview' | 'ai-launch';

// Redesigned moods with better visual hierarchy
const MOODS = [
{ id: 'hungry', icon: 'flame', label: 'Craving', gradient: ['#FF3B30', '#FF6B35'], description: 'Something bold' },
{ id: 'comfort', emoji: '🤗', label: 'Comfort', gradient: ['#094327', '#0B9E58'], description: 'Warm & cozy' },
{ id: 'adventure', emoji: '⚡', label: 'Adventure', gradient: ['#FF3B30', '#094327'], description: 'Try something new' },
{ id: 'fresh', emoji: '🌱', label: 'Fresh', gradient: ['#0B9E58', '#E6FFE8'], description: 'Light & healthy' },
{ id: 'indulgent', emoji: '✨', label: 'Treat', gradient: ['#FF6B35', '#FF3B30'], description: 'Something special' },
{ id: 'quick', emoji: '⏰', label: 'Quick', gradient: ['#094327', '#FF3B30'], description: 'Fast & easy' },
];

// Enhanced meals with more personality
const SAMPLE_MEALS = [
{ name: 'Jollof Supreme', emoji: '👑', origin: 'Nigerian Classic', vibe: 'Royal feast' },
{ name: 'Spiced Shawarma', emoji: '🌪️', origin: 'Middle Eastern', vibe: 'Street magic' },
{ name: 'Suya Fire', icon: 'flame', origin: 'Nigerian Street', vibe: 'Bold & spicy' },
{ name: 'Truffle Pasta', emoji: '🍝', origin: 'Italian Luxe', vibe: 'Sophisticated' },
{ name: 'Curry Storm', emoji: '🌶️', origin: 'Indian Fusion', vibe: 'Flavor explosion' },
{ name: 'Taco Fiesta', emoji: '🎉', origin: 'Mexican Street', vibe: 'Party vibes' },
];

interface ShakeToEatFlowProps {
onAIChatLaunch: (prompt: string) => void;
isVisible: boolean;
onClose: () => void;
onStart?: () => void;
}

export function ShakeToEatFlow({ onAIChatLaunch, isVisible, onClose, onStart }: ShakeToEatFlowProps) {
  const [currentStep, setCurrentStep] = useState<FlowStep>('idle');
  const [selectedMood, setSelectedMood] = useState<typeof MOODS[0] | null>(null);
  const [selectedMeal, setSelectedMeal] = useState<typeof SAMPLE_MEALS[0] | null>(null);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const cooldownTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Enhanced animation system with more states
  const masterOpacity = useSharedValue(0);
  const slideY = useSharedValue(50);
  const scale = useSharedValue(0.9);
  const pulseScale = useSharedValue(1);
  const rotateValue = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const particleOpacity = useSharedValue(0);
  const energyScale = useSharedValue(1);
  const sparkleOpacity = useSharedValue(0);
  const shakeOverlayOpacity = useSharedValue(0);
  const shakeIconScale = useSharedValue(1);

// Reset animations and state
const resetAnimations = () => {
  masterOpacity.value = 0;
  slideY.value = 50;
  scale.value = 0.9;
  pulseScale.value = 1;
  rotateValue.value = 0;
  glowOpacity.value = 0;
  particleOpacity.value = 0;
  energyScale.value = 1;
  sparkleOpacity.value = 0;
  shakeOverlayOpacity.value = 0;
  shakeIconScale.value = 1;
};

// Reset step when modal closes
useEffect(() => {
  if (!isVisible && currentStep !== 'idle') {
    setCurrentStep('idle');
    setSelectedMood(null);
    setSelectedMeal(null);
    resetAnimations();
  }
}, [isVisible, currentStep]);

// Cleanup cooldown timeout on unmount
useEffect(() => {
  return () => {
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current);
    }
  };
}, []);

// Shake detection with enhanced feedback - now requires sustained shaking
// Only active when in 'idle' state to prevent multiple shake processes
const { isShaking, sustainedShakeProgress, isSustainedShaking } = useShakeDetection(() => {
  console.log('🎯 Sustained shake completed! Starting modern flow...');
  
  // Progressive haptic feedback
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 100);
  
  if (currentStep === 'idle') {
    // Automatically show the modal when sustained shake is completed
    setCurrentStep('wake-up');
    startWakeUpAnimation();
    onStart?.();
  }
}, { 
  cooldownMs: 3000,
  debug: true, // Enable debug to see what's happening
  sensitivity: 'high',
  threshold: 0.2, // Lower threshold to be more sensitive based on debug logs
  sustainedShakeDuration: 3000, // 3 seconds of sustained shaking required
  interruptionGracePeriod: 1500, // 1.5 seconds grace period for interruptions
  enabled: currentStep === 'idle' && !isInCooldown // Only enable shake detection when in idle state and not in cooldown
});

// Add haptic feedback during sustained shaking
useEffect(() => {
  if (isSustainedShaking && sustainedShakeProgress > 0) {
    // Light haptic feedback every 25% progress
    if (Math.floor(sustainedShakeProgress * 4) > Math.floor((sustainedShakeProgress - 0.01) * 4)) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }
}, [isSustainedShaking, sustainedShakeProgress]);

// Animate shake overlay
useEffect(() => {
  if (isSustainedShaking || isShaking) {
    // Show overlay with animation - concurrent updates
    shakeOverlayOpacity.value = withTiming(1, { duration: 300 });
    shakeIconScale.value = withSpring(1.1, {
      tension: 100,
      friction: 6,
    });
  } else {
    // Hide overlay with animation - concurrent updates
    shakeOverlayOpacity.value = withTiming(0, { duration: 200 });
    shakeIconScale.value = withSpring(1, {
      tension: 100,
      friction: 6,
    });
  }
}, [isSustainedShaking, isShaking]);

// Early return moved after all hooks

// Modern animation sequences
const startWakeUpAnimation = () => {
  resetAnimations();
  
  // Entrance animation - parallel updates
  masterOpacity.value = withTiming(1, {
    duration: 800,
    easing: Easing.out(Easing.cubic),
  });
  slideY.value = withSpring(0, {
    tension: 60,
    friction: 8,
  });
  scale.value = withSpring(1, {
    tension: 80,
    friction: 6,
  });
  
  // Glow effect - after entrance (using delay)
  glowOpacity.value = withDelay(800, withTiming(1, {
    duration: 1000,
    easing: Easing.inOut(Easing.sin),
  }));

  // Pulse animation loop
  pulseScale.value = withRepeat(
    withTiming(1.1, {
      duration: 1000,
      easing: Easing.inOut(Easing.sin),
    }, (finished) => {
      'worklet';
      if (finished) {
        pulseScale.value = withRepeat(
          withTiming(1, {
            duration: 1000,
            easing: Easing.inOut(Easing.sin),
          }),
          -1,
          true
        );
      }
    }),
    -1,
    true
  );

  // Auto-advance with dramatic timing
  setTimeout(() => {
    setCurrentStep('mood-reveal');
    startMoodRevealAnimation();
  }, 3000);
};

const startMoodRevealAnimation = () => {
  // Smooth transition - concurrent updates
  slideY.value = withTiming(0, {
    duration: 600,
    easing: Easing.out(Easing.cubic),
  });
  masterOpacity.value = withTiming(1, {
    duration: 600,
    easing: Easing.out(Easing.quad),
  });
  particleOpacity.value = withTiming(1, {
    duration: 800,
    easing: Easing.out(Easing.quad),
  });
};

const handleMoodSelect = (mood: typeof MOODS[0]) => {
  setSelectedMood(mood);
  
  // Satisfying selection feedback
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 200);
  
  // Show mood locked confirmation
  setTimeout(() => {
    setCurrentStep('mood-locked');
    startMoodLockedAnimation();
  }, 800);
};

const startMoodLockedAnimation = () => {
  // Confirmation animation - concurrent updates
  scale.value = withSpring(1.1, {
    tension: 120,
    friction: 4,
  }, (finished) => {
    'worklet';
    if (finished) {
      scale.value = withSpring(1, {
        tension: 100,
        friction: 6,
      });
    }
  });
  glowOpacity.value = withTiming(1, { duration: 800 });

  // Success haptic
  setTimeout(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, 400);

  setTimeout(() => {
    setCurrentStep('energy-building');
    startEnergyBuildingAnimation();
  }, 2000);
};

const startEnergyBuildingAnimation = () => {
  resetAnimations();
  
  // Energy buildup animation - repeating 3 times
  energyScale.value = withRepeat(
    withTiming(1.3, {
      duration: 1500,
      easing: Easing.inOut(Easing.sin),
    }, (finished) => {
      'worklet';
      if (finished) {
        energyScale.value = withTiming(1, {
          duration: 1500,
          easing: Easing.inOut(Easing.sin),
        });
      }
    }),
    3,
    true
  );

  // Concurrent updates
  masterOpacity.value = withTiming(1, { duration: 800 });
  particleOpacity.value = withTiming(1, { duration: 1000 });

  setTimeout(() => {
    setCurrentStep('food-discovery');
    startFoodDiscoveryAnimation();
  }, 5000);
};

const startFoodDiscoveryAnimation = () => {
  resetAnimations();
  
  // Spinning wheel effect
  rotateValue.value = 0;
  rotateValue.value = withTiming(1, {
    duration: 4000,
    easing: Easing.out(Easing.cubic),
  }, (finished) => {
    'worklet';
    if (finished) {
      // Select meal after spin
      const randomMeal = SAMPLE_MEALS[Math.floor(Math.random() * SAMPLE_MEALS.length)];
      runOnJS(setSelectedMeal)(randomMeal);
      
      setTimeout(() => {
        runOnJS(setCurrentStep)('magic-moment');
        runOnJS(startMagicMomentAnimation)();
      }, 800);
    }
  });

  // Concurrent updates
  masterOpacity.value = withTiming(1, { duration: 600 });
  scale.value = withSpring(1, {
    tension: 100,
    friction: 8,
  });
};

const startMagicMomentAnimation = () => {
  // Celebration animation - sequence
  scale.value = withSpring(1.2, {
    tension: 150,
    friction: 3,
  }, (finished) => {
    'worklet';
    if (finished) {
      scale.value = withSpring(1, {
        tension: 100,
        friction: 6,
      });
    }
  });
  glowOpacity.value = withTiming(1, { duration: 800 });
  particleOpacity.value = withTiming(1, { duration: 600 });

  // Success haptics
  setTimeout(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, 400);

  setTimeout(() => {
    setCurrentStep('ai-launch');
    startAILaunchAnimation();
  }, 2500);
};

const startAILaunchAnimation = () => {
  masterOpacity.value = withTiming(1, {
    duration: 600,
    easing: Easing.out(Easing.quad),
  }, (finished) => {
    'worklet';
    if (finished) {
      // Generate enhanced AI prompt
      const prompt = `I'm in a ${selectedMood?.label.toLowerCase()} mood (${selectedMood?.description}) and discovered ${selectedMeal?.name} - ${selectedMeal?.vibe}. Create an amazing personalized food experience!`;
      
      setTimeout(() => {
        runOnJS(onAIChatLaunch)(prompt);
        runOnJS(resetFlow)();
      }, 2000);
    }
  });
};

const startCooldown = () => {
  console.log('⏰ Starting 20-second cooldown...');
  setIsInCooldown(true);
  
  // Clear any existing timeout
  if (cooldownTimeoutRef.current) {
    clearTimeout(cooldownTimeoutRef.current);
  }
  
  // Set 20-second cooldown
  cooldownTimeoutRef.current = setTimeout(() => {
    console.log('✅ Cooldown finished, shake detection re-enabled');
    setIsInCooldown(false);
    cooldownTimeoutRef.current = null;
  }, 20000); // 20 seconds
};

const resetFlow = () => {
  setCurrentStep('idle');
  onClose();
  // Start cooldown when flow completes
  startCooldown();
};

const handleClose = () => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  resetFlow();
};

// Render methods for each step
const renderWakeUp = () => {
  const spinInterpolate = useDerivedValue(() => {
    return `${interpolate(rotateValue.value, [0, 1], [0, 360])}deg`;
  });

  const particleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: particleOpacity.value,
    };
  });

  const masterAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: masterOpacity.value,
      transform: [
        { translateY: slideY.value },
        { scale: scale.value },
      ],
    };
  });

  const pulseAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: pulseScale.value }],
    };
  });

  const spinAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: spinInterpolate.value }],
    };
  });

  const progressDotAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(pulseScale.value, [1, 1.1], [0.3, 1]),
      transform: [{
        scale: interpolate(pulseScale.value, [1, 1.1], [1, 1.5]),
      }],
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#094327' }}>
      <StatusBar barStyle="light-content" backgroundColor="#094327" />
      
      {/* Particle background */}
      <Animated.View style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
        particleAnimatedStyle,
      ]}>
        {[...Array(20)].map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#E6FFE8',
              top: Math.random() * screenHeight,
              left: Math.random() * screenWidth,
              opacity: 0.6,
            }}
          />
        ))}
      </Animated.View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
        <Animated.View style={[
          { alignItems: 'center' },
          masterAnimatedStyle,
        ]}>
          {/* Main icon with glow */}
          <Animated.View style={[
            {
              width: 180,
              height: 180,
              borderRadius: 90,
              backgroundColor: '#FF3B30',
              justifyContent: 'center',
              alignItems: 'center',
              marginBottom: 60,
              shadowColor: '#FF3B30',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.8,
              shadowRadius: 30,
              elevation: 20,
            },
            pulseAnimatedStyle,
          ]}>
            <Animated.View style={spinAnimatedStyle}>
              <Text style={{ fontSize: 72, color: 'white' }}>⚡</Text>
            </Animated.View>
          </Animated.View>

          {/* Title */}
          <Text style={{
            fontSize: 36,
            fontWeight: '800',
            color: '#E6FFE8',
            textAlign: 'center',
            marginBottom: 20,
            letterSpacing: -1,
          }}>
            AWAKENED
          </Text>

          <Text style={{
            fontSize: 18,
            color: '#E6FFE8',
            textAlign: 'center',
            opacity: 0.8,
            lineHeight: 26,
            fontWeight: '400',
          }}>
            Your culinary journey begins...
          </Text>

          {/* Progress indicator */}
          <View style={{
            flexDirection: 'row',
            marginTop: 50,
            alignItems: 'center',
          }}>
            {[...Array(3)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  {
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#E6FFE8',
                    marginHorizontal: 4,
                  },
                  progressDotAnimatedStyle,
                ]}
              />
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const renderMoodReveal = () => {
  const moodRevealAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: masterOpacity.value,
      transform: [{ translateY: slideY.value }],
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: 'white' }}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <Animated.View style={[
        {
          paddingTop: 80,
          paddingHorizontal: 30,
          marginBottom: 40,
        },
        moodRevealAnimatedStyle,
      ]}>
        <Text style={{
          fontSize: 32,
          fontWeight: '800',
          color: '#094327',
          textAlign: 'center',
          marginBottom: 12,
          letterSpacing: -1,
        }}>
          What&apos;s Your Vibe?
        </Text>
        <Text style={{
          fontSize: 16,
          color: '#FF3B30',
          textAlign: 'center',
          fontWeight: '500',
        }}>
          Choose the energy that matches your moment
        </Text>
      </Animated.View>

      {/* Mood grid */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingBottom: 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={moodRevealAnimatedStyle}>
          {MOODS.reduce((rows: any[], mood, index) => {
            if (index % 2 === 0) rows.push([mood]);
            else rows[rows.length - 1].push(mood);
            return rows;
          }, []).map((row: any[], rowIndex: number) => (
            <View key={rowIndex} style={{
              flexDirection: 'row',
              marginBottom: 20,
              justifyContent: 'space-between',
            }}>
              {row.map((mood: typeof MOODS[0]) => (
                <Pressable
                  key={mood.id}
                  style={{
                    width: (screenWidth - 60) / 2,
                    height: 160,
                    borderRadius: 24,
                    padding: 24,
                    justifyContent: 'space-between',
                    backgroundColor: selectedMood?.id === mood.id ? mood.gradient[0] : 'white',
                    borderWidth: 2,
                    borderColor: selectedMood?.id === mood.id ? mood.gradient[0] : '#E6FFE8',
                    shadowColor: selectedMood?.id === mood.id ? mood.gradient[0] : '#094327',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: selectedMood?.id === mood.id ? 0.3 : 0.1,
                    shadowRadius: 16,
                    elevation: selectedMood?.id === mood.id ? 12 : 4,
                    transform: [{ 
                      scale: selectedMood?.id === mood.id ? 1.02 : 1 
                    }],
                  }}
                  onPress={() => handleMoodSelect(mood)}
                >
                  <View style={{ 
                    alignSelf: 'flex-start',
                  }}>
                    {renderMoodIcon(mood, 40)}
                  </View>
                  
                  <View>
                    <Text style={{
                      fontSize: 18,
                      fontWeight: '700',
                      color: selectedMood?.id === mood.id ? 'white' : '#094327',
                      marginBottom: 4,
                    }}>
                      {mood.label}
                    </Text>
                    <Text style={{
                      fontSize: 13,
                      color: selectedMood?.id === mood.id ? 'rgba(255,255,255,0.8)' : '#FF3B30',
                      fontWeight: '500',
                    }}>
                      {mood.description}
                    </Text>
                  </View>
                </Pressable>
              ))}
            </View>
          ))}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const renderFoodDiscovery = () => {
  const spinInterpolate = useDerivedValue(() => {
    return `${interpolate(rotateValue.value, [0, 1], [0, 1800])}deg`; // 5 full rotations
  });

  const foodDiscoveryAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: masterOpacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  const spinAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ rotate: spinInterpolate.value }],
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#094327' }}>
      <StatusBar barStyle="light-content" backgroundColor="#094327" />
      
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
        <Animated.View style={[
          { alignItems: 'center' },
          foodDiscoveryAnimatedStyle,
        ]}>
          <Text style={{
            fontSize: 28,
            fontWeight: '800',
            color: '#E6FFE8',
            textAlign: 'center',
            marginBottom: 60,
            letterSpacing: -0.5,
          }}>
            Discovering Your{'\n'}Perfect Match
          </Text>

          {/* Spinning wheel */}
          <View style={{
            width: 280,
            height: 280,
            borderRadius: 140,
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#FF3B30',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.6,
            shadowRadius: 40,
            elevation: 20,
            marginBottom: 50,
          }}>
            <Animated.View style={[
              {
                width: 200,
                height: 200,
                borderRadius: 100,
                backgroundColor: selectedMood?.gradient[0] || '#FF3B30',
                justifyContent: 'center',
                alignItems: 'center',
              },
              spinAnimatedStyle,
            ]}>
              <View style={{ justifyContent: 'center', alignItems: 'center' }}>
                {selectedMeal ? renderMoodIcon(selectedMeal, 64) : <Text style={{ fontSize: 64, color: 'white' }}>🎲</Text>}
              </View>
            </Animated.View>
          </View>

          <Text style={{
            fontSize: 16,
            color: '#E6FFE8',
            textAlign: 'center',
            opacity: 0.8,
            fontWeight: '500',
          }}>
            {selectedMeal ? `${selectedMeal.name} - ${selectedMeal.vibe}` : 'Spinning the wheel of flavor...'}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const renderMagicMoment = () => {
  const magicParticleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: particleOpacity.value,
    };
  });

  const magicMomentAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
      opacity: masterOpacity.value,
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#FF3B30' }}>
      <StatusBar barStyle="light-content" backgroundColor="#FF3B30" />
      
      {/* Celebration particles */}
      <Animated.View style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        },
        magicParticleAnimatedStyle,
      ]}>
        {[...Array(30)].map((_, i) => (
          <View
            key={i}
            style={{
              position: 'absolute',
              width: 6,
              height: 6,
              borderRadius: 3,
              backgroundColor: i % 2 === 0 ? '#E6FFE8' : 'white',
              top: Math.random() * screenHeight,
              left: Math.random() * screenWidth,
              opacity: 0.8,
            }}
          />
        ))}
      </Animated.View>

      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
        <Animated.View style={[
          { alignItems: 'center' },
          magicMomentAnimatedStyle,
        ]}>
          {/* Success badge */}
          <Animated.View style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 40,
            shadowColor: '#094327',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: glowOpacity,
            shadowRadius: 30,
            elevation: 20,
          }}>
            <View style={{ marginBottom: 8 }}>
              {selectedMeal ? renderMoodIcon(selectedMeal, 72) : null}
            </View>
            <Text style={{
              fontSize: 14,
              fontWeight: '700',
              color: '#094327',
              letterSpacing: 1,
            }}>
              DISCOVERED
            </Text>
          </Animated.View>

          <Text style={{
            fontSize: 32,
            fontWeight: '800',
            color: 'white',
            textAlign: 'center',
            marginBottom: 16,
            letterSpacing: -1,
          }}>
            {selectedMeal?.name}
          </Text>

          <Text style={{
            fontSize: 18,
            color: 'rgba(255,255,255,0.9)',
            textAlign: 'center',
            marginBottom: 8,
            fontWeight: '600',
          }}>
            {selectedMeal?.vibe}
          </Text>

          <Text style={{
            fontSize: 14,
            color: 'rgba(255,255,255,0.7)',
            textAlign: 'center',
            fontWeight: '500',
          }}>
            {selectedMeal?.origin}
          </Text>
        </Animated.View>
      </View>
    </View>
  );
};

const renderAILaunch = () => {
  const aiLaunchAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: masterOpacity.value,
    };
  });

  const sparkleAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: sparkleOpacity.value,
      transform: [{
        scale: interpolate(sparkleOpacity.value, [0, 1], [0.8, 1.2]),
      }],
    };
  });

  return (
    <View style={{ flex: 1, backgroundColor: '#094327' }}>
      <StatusBar barStyle="light-content" backgroundColor="#094327" />
      
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 40 }}>
        <Animated.View style={[
          { alignItems: 'center' },
          aiLaunchAnimatedStyle,
        ]}>
          {/* AI Portal */}
          <View style={{
            width: 160,
            height: 160,
            borderRadius: 80,
            backgroundColor: 'white',
            justifyContent: 'center',
            alignItems: 'center',
            marginBottom: 50,
            shadowColor: '#E6FFE8',
            shadowOffset: { width: 0, height: 0 },
            shadowOpacity: 0.8,
            shadowRadius: 25,
            elevation: 15,
          }}>
            <Text style={{ fontSize: 64 }}>🤖</Text>
          </View>

          <Text style={{
            fontSize: 28,
            fontWeight: '800',
            color: '#E6FFE8',
            textAlign: 'center',
            marginBottom: 20,
            letterSpacing: -0.5,
          }}>
            Launching Your{'\n'}Culinary Assistant
          </Text>

          <Text style={{
            fontSize: 16,
            color: 'rgba(230,255,232,0.8)',
            textAlign: 'center',
            lineHeight: 24,
            fontWeight: '500',
          }}>
            Preparing personalized recommendations for your {selectedMood?.label.toLowerCase()} mood and {selectedMeal?.name} discovery...
          </Text>

          {/* Loading indicator */}
          <View style={{
            flexDirection: 'row',
            marginTop: 40,
            alignItems: 'center',
          }}>
            {[0, 1, 2].map((i) => {
              const loadingDotAnimatedStyle = useAnimatedStyle(() => {
                return {
                  opacity: interpolate(pulseScale.value, [1, 1.1], [0.3, 1]),
                  transform: [{
                    scale: interpolate(pulseScale.value, [1, 1.1], [1, 1.5]),
                  }],
                };
              });
              
              return (
                <Animated.View
                  key={i}
                  style={[
                    {
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: '#E6FFE8',
                      marginHorizontal: 6,
                    },
                    loadingDotAnimatedStyle,
                  ]}
                />
              );
            })}
          </View>
        </Animated.View>
      </View>
    </View>
  );
};

const renderContent = () => {
  switch (currentStep) {
    case 'wake-up':
      return renderWakeUp();
    case 'mood-reveal':
      return renderMoodReveal();
    case 'food-discovery':
      return renderFoodDiscovery();
    case 'magic-moment':
      return renderMagicMoment();
    case 'ai-launch':
      return renderAILaunch();
    default:
      return null;
  }
};

// Early return if shake to eat is globally disabled
if (!CONFIG.SHAKE_TO_EAT_ENABLED) {
  return null;
}

// Component is always rendered to keep shake detection active
return (
  <>
    {/* Always render shake detection */}
    <View style={{ position: 'absolute', width: 0, height: 0 }} />

    {/* Cooldown Overlay - Shows when shake detection is disabled after flow completion */}
    {isInCooldown && (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 9998,
      }}>
        <View style={{
          backgroundColor: 'white',
          borderRadius: 20,
          padding: 30,
          alignItems: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.3,
          shadowRadius: 20,
          elevation: 10,
        }}>
          {/* Mascot in satisfied state */}
          <View style={{ marginBottom: 20 }}>
            <Mascot emotion="satisfied" size={60} />
          </View>
          
          {/* Cooldown Text */}
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#094327',
            marginBottom: 15,
            textAlign: 'center',
          }}>
            Take a moment to enjoy your discovery! 🎉
          </Text>
          
          <Text style={{
            fontSize: 14,
            color: '#687076',
            textAlign: 'center',
            marginBottom: 10,
          }}>
            Shake detection will be available again soon...
          </Text>
          
          {/* Timer indicator */}
          <View style={{
            width: 200,
            height: 6,
            backgroundColor: '#E5E7EB',
            borderRadius: 3,
            overflow: 'hidden',
          }}>
            <View 
              style={{
                height: '100%',
                backgroundColor: '#FF6B35',
                borderRadius: 3,
                width: '100%', // Will animate to show progress
              }} 
            />
          </View>
        </View>
      </View>
    )}

        {/* Shake Progress Overlay - Shows during sustained shaking */}
    {(isSustainedShaking || isShaking) && (() => {
      const shakeOverlayAnimatedStyle = useAnimatedStyle(() => {
        return {
          opacity: shakeOverlayOpacity.value,
        };
      });

      const shakeIconAnimatedStyle = useAnimatedStyle(() => {
        return {
          transform: [{ scale: shakeIconScale.value }],
        };
      });

      return (
        <Animated.View style={[
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          },
          shakeOverlayAnimatedStyle,
        ]}>
          <Animated.View style={[
            {
              backgroundColor: 'white',
              borderRadius: 20,
              padding: 30,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.3,
              shadowRadius: 20,
              elevation: 10,
            },
            shakeIconAnimatedStyle,
          ]}>
            {/* Mascot with dynamic emotions */}
            <Animated.View style={[
              { marginBottom: 20 },
              shakeIconAnimatedStyle,
            ]}>
            <Mascot 
              emotion={
                !isSustainedShaking ? 'default' :
                sustainedShakeProgress < 0.3 ? 'hungry' :
                sustainedShakeProgress < 0.7 ? 'excited' :
                'happy'
              }
              size={60}
            />
          </Animated.View>
          
          {/* Progress Text */}
          <Text style={{
            fontSize: 18,
            fontWeight: '600',
            color: '#094327',
            marginBottom: 15,
            textAlign: 'center',
          }}>
            {isSustainedShaking ? 'Keep Shaking!' : 'Start Shaking!'}
          </Text>
          
          {/* Grace Period Indicator */}
          {isSustainedShaking && !isShaking && (
            <Text style={{
              fontSize: 14,
              color: '#FF6B35',
              textAlign: 'center',
              marginBottom: 10,
              fontStyle: 'italic',
            }}>
              ⏰ Resume shaking within 1.5s to continue...
            </Text>
          )}
          
          {/* Progress Bar */}
          <View style={{
            width: 200,
            height: 8,
            backgroundColor: '#E5E7EB',
            borderRadius: 4,
            overflow: 'hidden',
            marginBottom: 10,
          }}>
            <View 
              style={{
                height: '100%',
                backgroundColor: '#22C55E',
                borderRadius: 4,
                width: `${sustainedShakeProgress * 100}%`,
              }} 
            />
          </View>
          
          {/* Progress Percentage */}
          <Text style={{
            fontSize: 14,
            color: '#687076',
            fontWeight: '500',
          }}>
            {Math.round(sustainedShakeProgress * 100)}% Complete
          </Text>
          
          {/* Instructions */}
          <Text style={{
            fontSize: 12,
            color: '#9CA3AF',
            textAlign: 'center',
            marginTop: 10,
            lineHeight: 16,
          }}>
            Shake continuously for 3 seconds{'\n'}to discover your perfect meal
          </Text>
          </Animated.View>
        </Animated.View>
      );
    })()}

    {/* Modal with enhanced presentation */}
    <Modal
      visible={currentStep !== 'idle'}
      animationType="fade"
      transparent={false}
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <View style={{ flex: 1 }}>
        {renderContent()}
        
        {/* Modern close button - only on mood selection */}
        {currentStep === 'mood-reveal' && (
          <Pressable
            style={{
              position: 'absolute',
              top: 50,
              right: 30,
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: 'rgba(255, 59, 48, 0.1)',
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(255, 59, 48, 0.2)',
            }}
            onPress={handleClose}
          >
            <Text style={{ 
              color: '#FF3B30', 
              fontSize: 20, 
              fontWeight: '600',
              lineHeight: 20,
            }}>
              ×
            </Text>
          </Pressable>
        )}
      </View>
    </Modal>
  </>
);
}