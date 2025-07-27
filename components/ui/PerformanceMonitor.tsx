import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  renderTime: number;
  scrollPerformance: number;
  videoLoadTime: number;
  animationFrameTime: number;
}

interface PerformanceMonitorProps {
  isVisible?: boolean;
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
}

export function PerformanceMonitor({ 
  isVisible = false, 
  onMetricsUpdate 
}: PerformanceMonitorProps) {
  const insets = useSafeAreaInsets();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    memoryUsage: 0,
    renderTime: 0,
    scrollPerformance: 0,
    videoLoadTime: 0,
    animationFrameTime: 0,
  });
  
  const [isExpanded, setIsExpanded] = useState(false);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(Date.now());
  const animationFrameRef = useRef<number | null>(null);
  const renderStartTimeRef = useRef(0);
  const scrollEventCountRef = useRef(0);
  const lastScrollTimeRef = useRef(Date.now());
  const videoLoadTimesRef = useRef<number[]>([]);

  // FPS calculation
  const calculateFPS = () => {
    const now = Date.now();
    frameCountRef.current++;
    
    if (now - lastTimeRef.current >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / (now - lastTimeRef.current));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
      
      setMetrics(prev => ({ ...prev, fps }));
    }
    
    animationFrameRef.current = requestAnimationFrame(calculateFPS);
  };

  // Memory usage estimation (simplified)
  const estimateMemoryUsage = () => {
    // This is a simplified estimation - in a real app you'd use performance.memory or similar
    const estimatedMemory = Math.random() * 100 + 50; // Simulated memory usage
    setMetrics(prev => ({ ...prev, memoryUsage: Math.round(estimatedMemory) }));
  };

  // Render time measurement
  const measureRenderTime = () => {
    const renderTime = Date.now() - renderStartTimeRef.current;
    setMetrics(prev => ({ ...prev, renderTime }));
  };

  // Scroll performance measurement
  const measureScrollPerformance = () => {
    const now = Date.now();
    scrollEventCountRef.current++;
    
    if (now - lastScrollTimeRef.current >= 1000) {
      const scrollPerformance = scrollEventCountRef.current;
      scrollEventCountRef.current = 0;
      lastScrollTimeRef.current = now;
      
      setMetrics(prev => ({ ...prev, scrollPerformance }));
    }
  };

  // Video load time measurement
  const measureVideoLoadTime = (loadTime: number) => {
    videoLoadTimesRef.current.push(loadTime);
    if (videoLoadTimesRef.current.length > 10) {
      videoLoadTimesRef.current.shift();
    }
    
    const averageLoadTime = videoLoadTimesRef.current.reduce((a, b) => a + b, 0) / videoLoadTimesRef.current.length;
    setMetrics(prev => ({ ...prev, videoLoadTime: Math.round(averageLoadTime) }));
  };

  // Animation frame time measurement
  const measureAnimationFrameTime = () => {
    const startTime = Date.now();
    requestAnimationFrame(() => {
      const frameTime = Date.now() - startTime;
      setMetrics(prev => ({ ...prev, animationFrameTime: Math.round(frameTime) }));
    });
  };

  // Start monitoring
  useEffect(() => {
    if (isVisible) {
      renderStartTimeRef.current = Date.now();
      calculateFPS();
      
      const interval = setInterval(() => {
        estimateMemoryUsage();
        measureAnimationFrameTime();
        onMetricsUpdate?.(metrics);
      }, 1000);
      
      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        clearInterval(interval);
      };
    }
  }, [isVisible, onMetricsUpdate]);

  // Measure render time after each render
  useEffect(() => {
    if (isVisible) {
      measureRenderTime();
    }
  });

  // Expose measurement functions for external use
  const performanceRef = useRef<{
    measureScrollPerformance: () => void;
    measureVideoLoadTime: (loadTime: number) => void;
  }>({
    measureScrollPerformance,
    measureVideoLoadTime,
  });

  if (!isVisible) return null;

  const getPerformanceColor = (value: number, threshold: number) => {
    if (value <= threshold * 0.7) return '#4CAF50'; // Green - Good
    if (value <= threshold) return '#FF9800'; // Orange - Warning
    return '#F44336'; // Red - Poor
  };

  const getFPSColor = (fps: number) => getPerformanceColor(60 - fps, 20);
  const getRenderTimeColor = (time: number) => getPerformanceColor(time, 16);
  const getScrollPerformanceColor = (events: number) => getPerformanceColor(events, 60);

  return (
    <View style={[styles.container, { top: insets.top + 10 }]}>
      <Pressable 
        style={styles.header} 
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.headerText}>
          Performance Monitor {isExpanded ? '▼' : '▶'}
        </Text>
        <View style={[styles.fpsIndicator, { backgroundColor: getFPSColor(metrics.fps) }]}>
          <Text style={styles.fpsText}>{metrics.fps}</Text>
        </View>
      </Pressable>
      
      {isExpanded && (
        <View style={styles.metricsContainer}>
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>FPS:</Text>
            <Text style={[styles.metricValue, { color: getFPSColor(metrics.fps) }]}>
              {metrics.fps}
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Memory:</Text>
            <Text style={styles.metricValue}>{metrics.memoryUsage}MB</Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Render Time:</Text>
            <Text style={[styles.metricValue, { color: getRenderTimeColor(metrics.renderTime) }]}>
              {metrics.renderTime}ms
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Scroll Events:</Text>
            <Text style={[styles.metricValue, { color: getScrollPerformanceColor(metrics.scrollPerformance) }]}>
              {metrics.scrollPerformance}/s
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Video Load:</Text>
            <Text style={styles.metricValue}>{metrics.videoLoadTime}ms</Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Frame Time:</Text>
            <Text style={styles.metricValue}>{metrics.animationFrameTime}ms</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    right: 10,
    zIndex: 10000,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    minWidth: 200,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 8,
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  fpsIndicator: {
    width: 30,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fpsText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  metricsContainer: {
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  metricLabel: {
    color: '#CCCCCC',
    fontSize: 10,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
}); 