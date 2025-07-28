import { Accelerometer } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

interface UseShakeDetectionOptions {
  threshold?: number; // Minimum acceleration to trigger shake
  cooldownMs?: number; // Time to wait before allowing another shake
  sensitivity?: 'low' | 'medium' | 'high';
  debug?: boolean; // Enable debug logging
}

interface UseShakeDetectionReturn {
  isShaking: boolean;
  shakeCount: number;
  resetShakeCount: () => void;
}

export function useShakeDetection(
  onShake: () => void,
  options: UseShakeDetectionOptions = {}
): UseShakeDetectionReturn {
  const {
    threshold = 8, // Lower default threshold for better sensitivity
    cooldownMs = 2000,
    sensitivity = 'medium',
    debug = false, // Debug disabled by default for cleaner logs
  } = options;

  const [isShaking, setIsShaking] = useState(false);
  const [shakeCount, setShakeCount] = useState(0);
  const lastShakeTime = useRef<number>(0);
  const accelerationHistory = useRef<number[]>([]);
  const isInitialized = useRef(false);

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
          });
        }

        // Set update interval (30fps for better battery while still responsive)
        Accelerometer.setUpdateInterval(33);
        
        subscription = Accelerometer.addListener((accelerometerData) => {
          const { x, y, z } = accelerometerData;
          const currentTime = Date.now();

          if (!isInitialized.current) {
            isInitialized.current = true;
            return;
          }

          // Skip if we're in cooldown period
          if (currentTime - lastShakeTime.current < cooldownMs) {
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
          
          // Trigger shake if acceleration spike exceeds threshold
          if (accelerationSpike > adjustedThreshold) {
            if (debug) {
              console.log('🎯 SHAKE DETECTED!', {
                accelerationSpike: accelerationSpike.toFixed(2),
                threshold: adjustedThreshold,
                timeSinceLastShake: currentTime - lastShakeTime.current,
              });
            }

            setIsShaking(true);
            setShakeCount(prev => prev + 1);
            lastShakeTime.current = currentTime;
            
            // Call the shake handler
            onShake();
            
            // Reset shaking state after a short delay
            setTimeout(() => {
              setIsShaking(false);
            }, 500);

            // Clear acceleration history to prevent multiple triggers
            accelerationHistory.current = [];
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
    };
  }, [onShake, adjustedThreshold, cooldownMs, debug]);

  const resetShakeCount = () => {
    setShakeCount(0);
  };

  return {
    isShaking,
    shakeCount,
    resetShakeCount,
  };
} 