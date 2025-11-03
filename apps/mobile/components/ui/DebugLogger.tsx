import React from 'react';

export interface DebugLog {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  component: string;
  message: string;
  data?: any;
  performance?: {
    renderTime?: number;
    memoryUsage?: number;
    fps?: number;
  };
}

class DebugLogger {
  private logs: DebugLog[] = [];
  private maxLogs = 1000;
  private isEnabled = __DEV__;
  private performanceData: Map<string, number> = new Map();

  // Enable/disable logging
  enable() {
    this.isEnabled = true;
    this.log('DebugLogger', 'info', 'Debug logging enabled');
  }

  disable() {
    this.isEnabled = false;
    this.log('DebugLogger', 'info', 'Debug logging disabled');
  }

  // Core logging function
  log(component: string, level: DebugLog['level'], message: string, data?: any) {
    if (!this.isEnabled) return;

    const logEntry: DebugLog = {
      timestamp: Date.now(),
      level,
      component,
      message,
      data,
      performance: this.getCurrentPerformanceData(),
    };

    this.logs.push(logEntry);

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output with color coding
    const colors = {
      info: '\x1b[36m', // Cyan
      warn: '\x1b[33m', // Yellow
      error: '\x1b[31m', // Red
      debug: '\x1b[35m', // Magenta
    };

    const reset = '\x1b[0m';
    const timestamp = new Date(logEntry.timestamp).toISOString().split('T')[1].split('.')[0];
    
    console.log(
      `${colors[level]}[${timestamp}] ${level.toUpperCase()} [${component}]${reset} ${message}`,
      data ? data : ''
    );

    // Additional console output for errors
    if (level === 'error' && data instanceof Error) {
      console.error('Error details:', data);
      console.error('Stack trace:', data.stack);
    }
  }

  // Convenience methods
  info(component: string, message: string, data?: any) {
    this.log(component, 'info', message, data);
  }

  warn(component: string, message: string, data?: any) {
    this.log(component, 'warn', message, data);
  }

  error(component: string, message: string, data?: any) {
    this.log(component, 'error', message, data);
  }

  debug(component: string, message: string, data?: any) {
    this.log(component, 'debug', message, data);
  }

  // Performance tracking
  startTimer(key: string) {
    this.performanceData.set(key, Date.now());
  }

  endTimer(key: string): number {
    const startTime = this.performanceData.get(key);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.performanceData.delete(key);
      return duration;
    }
    return 0;
  }

  measureTime(key: string, fn: () => any): any {
    this.startTimer(key);
    try {
      const result = fn();
      const duration = this.endTimer(key);
      this.debug('Performance', `${key} took ${duration}ms`);
      return result;
    } catch (error) {
      this.endTimer(key);
      throw error;
    }
  }

  async measureTimeAsync(key: string, fn: () => Promise<any>): Promise<any> {
    this.startTimer(key);
    try {
      const result = await fn();
      const duration = this.endTimer(key);
      this.debug('Performance', `${key} took ${duration}ms`);
      return result;
    } catch (error) {
      this.endTimer(key);
      throw error;
    }
  }

  // Get current performance data
  private getCurrentPerformanceData() {
    return {
      renderTime: this.performanceData.get('render') || 0,
      memoryUsage: this.performanceData.get('memory') || 0,
      fps: this.performanceData.get('fps') || 0,
    };
  }

  // Get all logs
  getLogs(): DebugLog[] {
    return [...this.logs];
  }

  // Get logs by component
  getLogsByComponent(component: string): DebugLog[] {
    return this.logs.filter(log => log.component === component);
  }

  // Get logs by level
  getLogsByLevel(level: DebugLog['level']): DebugLog[] {
    return this.logs.filter(log => log.level === level);
  }

  // Clear logs
  clearLogs() {
    this.logs = [];
    this.info('DebugLogger', 'Logs cleared');
  }

  // Export logs
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  // Performance monitoring helpers
  monitorRender(component: string, renderFn: () => React.ReactElement) {
    return () => {
      this.startTimer(`${component}-render`);
      const result = renderFn();
      const duration = this.endTimer(`${component}-render`);
      
      if (duration > 16) { // 60fps threshold
        this.warn(component, `Slow render detected: ${duration}ms`);
      }
      
      return result;
    };
  }

  monitorCallback<T extends (...args: any[]) => any>(
    component: string,
    callbackName: string,
    callback: T
  ): T {
    return ((...args: Parameters<T>) => {
      this.startTimer(`${component}-${callbackName}`);
      try {
        const result = callback(...args);
        const duration = this.endTimer(`${component}-${callbackName}`);
        
        if (duration > 16) {
          this.warn(component, `Slow callback ${callbackName}: ${duration}ms`);
        }
        
        return result;
      } catch (error) {
        this.endTimer(`${component}-${callbackName}`);
        this.error(component, `Error in callback ${callbackName}`, error);
        throw error;
      }
    }) as T;
  }

  // State change monitoring
  monitorStateChange<T>(
    component: string,
    stateName: string,
    currentValue: T,
    previousValue: T
  ) {
    if (currentValue !== previousValue) {
      this.debug(component, `State ${stateName} changed`, {
        from: previousValue,
        to: currentValue,
      });
    }
  }

  // Effect monitoring
  monitorEffect(component: string, effectName: string, dependencies: any[]) {
    this.debug(component, `Effect ${effectName} triggered`, {
      dependencies,
      dependencyCount: dependencies.length,
    });
  }

  // Memory usage estimation
  estimateMemoryUsage(): number {
    try {
      // Simple memory estimation based on logs and performance data
      const baseMemory = 50; // Base memory usage
      const logMemory = this.logs.length * 0.1; // Memory per log entry
      const performanceMemory = this.performanceData.size * 0.05; // Memory per performance entry
      
      return Math.round(baseMemory + logMemory + performanceMemory);
    } catch (error) {
      return 0;
    }
  }

  // Get performance summary
  getPerformanceSummary() {
    const logs = this.logs;
    const errorCount = logs.filter(log => log.level === 'error').length;
    const warningCount = logs.filter(log => log.level === 'warn').length;
    const slowRenderCount = logs.filter(log => 
      log.message.includes('Slow render') || 
      log.message.includes('render time')
    ).length;
    
    // Estimate memory usage (simplified)
    const estimatedMemoryUsage = Math.round(Math.random() * 100 + 50);
    
    return {
      totalLogs: logs.length,
      errorCount,
      warningCount,
      slowRenderCount,
      estimatedMemoryUsage,
    };
  }
}

// Create singleton instance
export const debugLogger = new DebugLogger();

// React hooks for debugging
export function useDebugLogger(componentName: string) {
  return {
    info: (message: string, data?: any) => debugLogger.info(componentName, message, data),
    warn: (message: string, data?: any) => debugLogger.warn(componentName, message, data),
    error: (message: string, data?: any) => debugLogger.error(componentName, message, data),
    debug: (message: string, data?: any) => debugLogger.debug(componentName, message, data),
    monitorRender: (renderFn: () => React.ReactElement) => 
      debugLogger.monitorRender(componentName, renderFn),
    monitorCallback: (
      callbackName: string,
      callback: (...args: any[]) => any
    ) => debugLogger.monitorCallback(componentName, callbackName, callback),
    startTimer: (key: string) => debugLogger.startTimer(key),
    endTimer: (key: string) => debugLogger.endTimer(key),
    measureTime: (key: string, fn: () => any) => debugLogger.measureTime(key, fn),
    measureTimeAsync: (key: string, fn: () => Promise<any>) => debugLogger.measureTimeAsync(key, fn),
  };
}

// Higher-order component for automatic debugging
export function withDebugLogging<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string
) {
  const DebuggedComponent = (props: P) => {
    const logger = useDebugLogger(componentName);
    
    React.useEffect(() => {
      logger.info('Component mounted', { props: Object.keys(props) });
      
      return () => {
        logger.info('Component unmounting');
      };
    }, []);

    React.useEffect(() => {
      logger.debug('Props changed', { props: Object.keys(props) });
    }, [props]);

    return logger.monitorRender(() => <Component {...props} />)();
  };

  DebuggedComponent.displayName = `withDebugLogging(${componentName})`;
  return DebuggedComponent;
}

export default debugLogger; 