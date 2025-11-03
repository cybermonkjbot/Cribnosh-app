import React, { useCallback, useEffect, useRef } from 'react';
import { Dimensions, Platform } from 'react-native';

interface PerformanceMetrics {
  fps: number;
  frameDrops: number;
  memoryUsage: number;
  isLowPerformanceDevice: boolean;
  adaptiveQuality: 'high' | 'medium' | 'low';
}

interface PerformanceMonitorProps {
  onMetricsUpdate: (metrics: PerformanceMetrics) => void;
  onPerformanceIssue: (issue: string) => void;
  isActive?: boolean;
  sampleInterval?: number;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Device performance classification
const getDevicePerformanceClass = (): 'high' | 'medium' | 'low' => {
  const screenArea = SCREEN_WIDTH * SCREEN_HEIGHT;
  
  // Basic heuristics for device performance
  if (Platform.OS === 'ios') {
    // iOS devices generally have better performance
    if (screenArea > 2000000) return 'high'; // iPhone 12 Pro and above
    if (screenArea > 1500000) return 'medium'; // iPhone 11 and above
    return 'low';
  } else {
    // Android performance varies widely
    if (screenArea > 2500000) return 'high'; // High-end Android
    if (screenArea > 1800000) return 'medium'; // Mid-range Android
    return 'low';
  }
};

export function PerformanceMonitor({
  onMetricsUpdate,
  onPerformanceIssue,
  isActive = true,
  sampleInterval = 1000, // 1 second
}: PerformanceMonitorProps) {
  const frameCountRef = useRef(0);
  const lastFrameTimeRef = useRef(performance.now());
  const frameDropsRef = useRef(0);
  const metricsIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const performanceClassRef = useRef(getDevicePerformanceClass());

  // Frame counting function
  const countFrame = useCallback(() => {
    if (!isActive) return;

    const now = performance.now();
    const deltaTime = now - lastFrameTimeRef.current;
    
    frameCountRef.current++;
    
    // Detect frame drops (> 16.67ms for 60fps)
    if (deltaTime > 20 && frameCountRef.current > 10) { // Allow initial frames to settle
      frameDropsRef.current++;
      
      // Report significant frame drops
      if (deltaTime > 50) {
        onPerformanceIssue(`Severe frame drop detected: ${deltaTime.toFixed(1)}ms`);
      }
    }
    
    lastFrameTimeRef.current = now;
    
    // Continue counting frames
    rafIdRef.current = requestAnimationFrame(countFrame);
  }, [isActive, onPerformanceIssue]);

  // Memory usage estimation (rough approximation)
  const getMemoryUsage = useCallback((): number => {
    if (Platform.OS === 'web' && 'memory' in performance) {
      // @ts-ignore - performance.memory is available in Chrome
      return performance.memory?.usedJSHeapSize || 0;
    }
    
    // For native platforms, we can't directly measure memory
    // Return a rough estimate based on component complexity
    return 0;
  }, []);

  // Calculate adaptive quality based on performance
  const getAdaptiveQuality = useCallback((fps: number, frameDrops: number): 'high' | 'medium' | 'low' => {
    const performanceClass = performanceClassRef.current;
    
    // High performance: 55+ fps, minimal drops
    if (fps >= 55 && frameDrops < 5 && performanceClass === 'high') {
      return 'high';
    }
    
    // Medium performance: 40+ fps, some drops acceptable
    if (fps >= 40 && frameDrops < 15) {
      return 'medium';
    }
    
    // Low performance: anything below medium thresholds
    return 'low';
  }, []);

  // Metrics calculation and reporting
  const calculateMetrics = useCallback(() => {
    if (!isActive) return;

    const fps = frameCountRef.current;
    const frameDrops = frameDropsRef.current;
    const memoryUsage = getMemoryUsage();
    const isLowPerformanceDevice = performanceClassRef.current === 'low';
    const adaptiveQuality = getAdaptiveQuality(fps, frameDrops);

    const metrics: PerformanceMetrics = {
      fps,
      frameDrops,
      memoryUsage,
      isLowPerformanceDevice,
      adaptiveQuality,
    };

    onMetricsUpdate(metrics);

    // Performance issue detection
    if (fps < 30) {
      onPerformanceIssue(`Low FPS detected: ${fps} fps`);
    }
    
    if (frameDrops > 20) {
      onPerformanceIssue(`High frame drop rate: ${frameDrops} drops in ${sampleInterval}ms`);
    }

    // Reset counters for next interval
    frameCountRef.current = 0;
    frameDropsRef.current = 0;
  }, [isActive, sampleInterval, getMemoryUsage, getAdaptiveQuality, onMetricsUpdate, onPerformanceIssue]);

  // Start monitoring
  useEffect(() => {
    if (!isActive) return;

    // Start frame counting
    rafIdRef.current = requestAnimationFrame(countFrame);

    // Start metrics calculation
    metricsIntervalRef.current = setInterval(calculateMetrics, sampleInterval);

    return () => {
      // Cleanup
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      
      if (metricsIntervalRef.current) {
        clearInterval(metricsIntervalRef.current);
        metricsIntervalRef.current = null;
      }
    };
  }, [isActive, countFrame, calculateMetrics, sampleInterval]);

  // Component doesn't render anything
  return null;
}

// Performance optimization hooks
export function usePerformanceOptimizations() {
  const performanceMetricsRef = useRef<PerformanceMetrics>({
    fps: 60,
    frameDrops: 0,
    memoryUsage: 0,
    isLowPerformanceDevice: false,
    adaptiveQuality: 'high',
  });

  const handleMetricsUpdate = useCallback((metrics: PerformanceMetrics) => {
    performanceMetricsRef.current = metrics;
  }, []);

  const handlePerformanceIssue = useCallback((issue: string) => {
    console.warn('Performance Issue:', issue);
    // Could integrate with analytics or crash reporting here
  }, []);

  // Get current performance recommendations
  const getPerformanceConfig = useCallback(() => {
    const metrics = performanceMetricsRef.current;
    
    return {
      // Video player optimizations
      maxPreloadedVideos: metrics.adaptiveQuality === 'high' ? 3 : metrics.adaptiveQuality === 'medium' ? 2 : 1,
      videoQuality: metrics.adaptiveQuality,
      
      // Animation optimizations
      useNativeDriver: metrics.fps > 45,
      reducedMotion: metrics.fps < 30,
      
      // FlatList optimizations
      windowSize: metrics.adaptiveQuality === 'high' ? 5 : 3,
      maxToRenderPerBatch: metrics.adaptiveQuality === 'high' ? 3 : 1,
      removeClippedSubviews: metrics.adaptiveQuality !== 'high',
      
      // Render optimizations
      shouldOptimizeRenders: metrics.frameDrops > 10,
      shouldReduceEffects: metrics.fps < 40,
    };
  }, []);

  return {
    PerformanceMonitor: (props: Omit<PerformanceMonitorProps, 'onMetricsUpdate' | 'onPerformanceIssue'>) => (
      <PerformanceMonitor
        {...props}
        onMetricsUpdate={handleMetricsUpdate}
        onPerformanceIssue={handlePerformanceIssue}
      />
    ),
    getPerformanceConfig,
    currentMetrics: performanceMetricsRef.current,
  };
}

// Higher-order component for performance-aware components
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  const PerformanceAwareComponent = (props: P) => {
    const { PerformanceMonitor } = usePerformanceOptimizations();

    return (
      <>
        <PerformanceMonitor isActive={true} />
        <Component {...props} />
      </>
    );
  };

  PerformanceAwareComponent.displayName = `withPerformanceMonitoring(${componentName})`;
  
  return PerformanceAwareComponent;
} 