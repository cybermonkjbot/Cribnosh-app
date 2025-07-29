import { DeviceMotion } from 'expo-sensors';
import { useEffect, useRef, useState } from 'react';

interface DeviceMotionData {
  rotation: {
    alpha: number;
    beta: number;
    gamma: number;
  };
  acceleration: {
    x: number;
    y: number;
    z: number;
  } | null;
  accelerationIncludingGravity: {
    x: number;
    y: number;
    z: number;
  };
}

interface UseDeviceMotionOptions {
  updateInterval?: number;
  enabled?: boolean;
  sensitivity?: number;
}

export function useDeviceMotion({
  updateInterval = 16, // ~60fps
  enabled = true,
  sensitivity = 0.3,
}: UseDeviceMotionOptions = {}) {
  const [data, setData] = useState<DeviceMotionData | null>(null);
  const [isAvailable, setIsAvailable] = useState(false);
  const subscription = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const checkAvailability = async () => {
      try {
        const isAvailable = await DeviceMotion.isAvailableAsync();
        if (isMounted) {
          setIsAvailable(isAvailable);
        }
      } catch (error) {
        console.warn('Device motion not available:', error);
        if (isMounted) {
          setIsAvailable(false);
        }
      }
    };

    checkAvailability();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!enabled || !isAvailable) {
      if (subscription.current) {
        subscription.current.unsubscribe();
        subscription.current = null;
      }
      return;
    }

    const startMotionDetection = async () => {
      try {
        await DeviceMotion.setUpdateInterval(updateInterval);
        
        subscription.current = DeviceMotion.addListener((motionData) => {
          // Apply sensitivity filtering to reduce jitter
          const filteredData = {
            rotation: {
              alpha: motionData.rotation.alpha * sensitivity,
              beta: motionData.rotation.beta * sensitivity,
              gamma: motionData.rotation.gamma * sensitivity,
            },
            acceleration: motionData.acceleration,
            accelerationIncludingGravity: motionData.accelerationIncludingGravity,
          };
          
          setData(filteredData);
        });
      } catch (error) {
        console.warn('Failed to start device motion detection:', error);
      }
    };

    startMotionDetection();

    return () => {
      if (subscription.current) {
        subscription.current.unsubscribe();
        subscription.current = null;
      }
    };
  }, [enabled, isAvailable, updateInterval, sensitivity]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (subscription.current) {
        subscription.current.unsubscribe();
        subscription.current = null;
      }
    };
  }, []);

  return {
    data,
    isAvailable,
    enabled,
  };
} 