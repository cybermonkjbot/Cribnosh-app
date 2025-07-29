import { CONFIG } from '@/constants/config';
import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

interface UseShakeDetectionOptions {
  threshold?: number; // Minimum acceleration to trigger shake
  cooldownMs?: number; // Time to wait before allowing another shake
  sensitivity?: 'low' | 'medium' | 'high';
  debug?: boolean; // Enable debug logging
  sustainedShakeDuration?: number; // Duration in ms for sustained shake detection
  interruptionGracePeriod?: number; // Time in ms to maintain progress when shaking stops
  enabled?: boolean; // Whether shake detection is enabled
}

interface UseShakeDetectionReturn {
  isShaking: boolean;
  shakeCount: number;
  resetShakeCount: () => void;
  sustainedShakeProgress: number; // Progress of sustained shake (0-1)
  isSustainedShaking: boolean; // Whether currently in sustained shake mode
}

export function useShakeDetection(
  onShake: () => void,
  options: UseShakeDetectionOptions = {}
): UseShakeDetectionReturn {
  // Early return if shake to eat is globally disabled
  if (!CONFIG.SHAKE_TO_EAT_ENABLED) {
    return {
      isShaking: false,
      shakeCount: 0,
      resetShakeCount: () => {},
      sustainedShakeProgress: 0,
      isSustainedShaking: false,
    };
  }

  const {
    threshold = 8, // Lower default threshold for better sensitivity
    cooldownMs = 2000,
    sensitivity = 'medium',
    debug = false, // Debug disabled by default for cleaner logs
    sustainedShakeDuration = 3000, // 3 seconds for sustained shake
    interruptionGracePeriod = 1000, // 1 second grace period for interruptions
    enabled = true, // Enable shake detection by default
  } = options;

  const [isShaking, setIsShaking] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const [sustainedShakeProgress, setSustainedShakeProgress] = useState(0);
  const [isSustainedShaking, setIsSustainedShaking] = useState(false);
  
  const lastShakeTime = useRef<number>(0);
  const accelerationHistory = useRef<number[]>([]);
  const isInitialized = useRef(false);
  const sustainedShakeStartTime = useRef<number>(0);
  const sustainedShakeTimeout = useRef<NodeJS.Timeout | null>(null);
  const lastSustainedShakeTime = useRef<number>(0);
  const lastShakeStopTime = useRef<number>(0);
  const interruptionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Adjust threshold based on sensitivity
  const adjustedThreshold = sensitivity === 'low' ? threshold * 1.5 : 
                           sensitivity === 'high' ? threshold * 0.6 : 
                           threshold;

  useEffect(() => {
    let subscription: any;

    const startAccelerometer = async () => {
      try {
        // Check if accelerometer is available
        const isAvailable = await Accelerometer.isAvailableAsync();
        if (!isAvailable) {
          console.warn('⚠️ Accelerometer is not available on this device');
          return;
        }

        if (debug) {
          console.log('🚀 Starting accelerometer with settings:', {
            threshold: adjustedThreshold,
            cooldownMs,
            sensitivity,
            sustainedShakeDuration,
          });
        }

        // Set update interval (30fps for better battery while still responsive)
        Accelerometer.setUpdateInterval(33);
        
        subscription = Accelerometer.addListener((accelerometerData) => {
          const { x, y, z } = accelerometerData;
          const currentTime = Date.now();

          // If shake detection is disabled, don't process any data
          if (!enabled) {
            // Reset states when disabled
            if (isShaking) {
              setIsShaking(false);
            }
            if (isSustainedShaking) {
              setIsSustainedShaking(false);
              setSustainedShakeProgress(0);
            }
            return;
          }

          if (!isInitialized.current) {
            isInitialized.current = true;
            return;
          }

          // Calculate total acceleration magnitude (including gravity)
          const totalAcceleration = Math.sqrt(x * x + y * y + z * z);
          
          // Keep a rolling history of recent accelerations
          accelerationHistory.current.push(totalAcceleration);
          if (accelerationHistory.current.length > 10) {
            accelerationHistory.current.shift();
          }

          // Need at least 5 readings to start detecting
          if (accelerationHistory.current.length < 5) {
            return;
          }

          // Calculate average acceleration over recent history
          const avgAcceleration = accelerationHistory.current.reduce((sum, acc) => sum + acc, 0) / accelerationHistory.current.length;
          
          // Look for sudden spikes in acceleration (shake pattern)
          const recentMax = Math.max(...accelerationHistory.current.slice(-3));
          const accelerationSpike = recentMax - avgAcceleration;

          if (debug && accelerationSpike > adjustedThreshold * 0.3) {
            console.log('📊 Shake detection values:', {
              totalAcceleration: totalAcceleration.toFixed(2),
              avgAcceleration: avgAcceleration.toFixed(2),
              accelerationSpike: accelerationSpike.toFixed(2),
              threshold: adjustedThreshold,
              recentMax: recentMax.toFixed(2),
              willTrigger: accelerationSpike > adjustedThreshold ? 'YES' : 'NO',
              percentOfThreshold: ((accelerationSpike / adjustedThreshold) * 100).toFixed(1) + '%'
            });
          }
          
          // Check if current acceleration exceeds threshold
          const isCurrentlyShaking = accelerationSpike > adjustedThreshold;
          
          // Handle sustained shake detection
          if (isCurrentlyShaking) {
            setIsShaking(true);
            
            // Clear any interruption timeout since we're shaking again
            if (interruptionTimeout.current) {
              clearTimeout(interruptionTimeout.current);
              interruptionTimeout.current = null;
            }
            
            // Start sustained shake timer if not already started
            if (!isSustainedShaking) {
              sustainedShakeStartTime.current = currentTime;
              setIsSustainedShaking(true);
              setSustainedShakeProgress(0);
              
              if (debug) {
                console.log('🔄 Starting sustained shake detection...');
              }
            }
            
            // Calculate progress of sustained shake
            const elapsed = currentTime - sustainedShakeStartTime.current;
            const progress = Math.min(elapsed / sustainedShakeDuration, 1);
            setSustainedShakeProgress(progress);
            
            // Check if sustained shake duration is reached
            if (elapsed >= sustainedShakeDuration && currentTime - lastSustainedShakeTime.current >= cooldownMs) {
              if (debug) {
                console.log('🎯 SUSTAINED SHAKE COMPLETED!', {
                  duration: elapsed,
                  requiredDuration: sustainedShakeDuration,
                  timeSinceLastShake: currentTime - lastSustainedShakeTime.current,
                });
              }

              setShakeCount(prev => prev + 1);
              lastSustainedShakeTime.current = currentTime;
              
              // Call the shake handler
              onShake();
              
              // Reset sustained shake state
              setIsSustainedShaking(false);
              setSustainedShakeProgress(0);
              
              // Clear acceleration history to prevent multiple triggers
              accelerationHistory.current = [];
            }
          } else {
            // Not currently shaking
            setIsShaking(false);
            
            // If we were in sustained shake mode, start grace period
            if (isSustainedShaking) {
              lastShakeStopTime.current = currentTime;
              
              // Set a timeout to reset progress after grace period
              if (!interruptionTimeout.current) {
                interruptionTimeout.current = setTimeout(() => {
                  if (debug) {
                    console.log('⏹️ Sustained shake interrupted after grace period');
                  }
                  setIsSustainedShaking(false);
                  setSustainedShakeProgress(0);
                  interruptionTimeout.current = null;
                }, interruptionGracePeriod);
              }
            }
          }
        });

        if (debug) {
          console.log('✅ Accelerometer listener added successfully');
        }
      } catch (error) {
        console.error('❌ Failed to start accelerometer:', error);
      }
    };

    startAccelerometer();

    return () => {
      if (subscription) {
        subscription.remove();
        if (debug) {
          console.log('🛑 Accelerometer listener removed');
        }
      }
      
      // Clear any pending timeouts
      if (sustainedShakeTimeout.current) {
        clearTimeout(sustainedShakeTimeout.current);
      }
      if (interruptionTimeout.current) {
        clearTimeout(interruptionTimeout.current);
      }
    };
  }, [onShake, adjustedThreshold, cooldownMs, debug, sustainedShakeDuration, enabled]);

  // Reset states when enabled changes
  useEffect(() => {
    if (!enabled) {
      if (debug) {
        console.log('🛑 Shake detection disabled');
      }
      setIsShaking(false);
      setIsSustainedShaking(false);
      setSustainedShakeProgress(0);
      // Clear any pending timeouts
      if (interruptionTimeout.current) {
        clearTimeout(interruptionTimeout.current);
        interruptionTimeout.current = null;
      }
    } else if (debug) {
      console.log('✅ Shake detection enabled');
    }
  }, [enabled, debug]);

  const resetShakeCount = () => {
    setShakeCount(0);
  };

  return {
    isShaking,
    shakeCount,
    resetShakeCount,
    sustainedShakeProgress,
    isSustainedShaking,
  };
} 