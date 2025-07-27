import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { debugLogger } from './DebugLogger';

interface DebugPanelProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export function DebugPanel({ isVisible = false, onToggle }: DebugPanelProps) {
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(false);
  const [performanceSummary, setPerformanceSummary] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);

  // Update performance summary and logs periodically
  useEffect(() => {
    if (!isVisible) return;

    const updateData = () => {
      const summary = debugLogger.getPerformanceSummary();
      const logs = debugLogger.getLogs().slice(-10); // Get last 10 logs
      
      setPerformanceSummary(summary);
      setRecentLogs(logs);
    };

    updateData();
    const interval = setInterval(updateData, 1000);

    return () => clearInterval(interval);
  }, [isVisible]);

  if (!isVisible) return null;

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error': return '#F44336';
      case 'warn': return '#FF9800';
      case 'info': return '#2196F3';
      case 'debug': return '#9C27B0';
      default: return '#757575';
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  return (
    <View style={[styles.container, { top: insets.top + 10 }]}>
      {/* Header */}
      <Pressable 
        style={styles.header} 
        onPress={() => setIsExpanded(!isExpanded)}
      >
        <Text style={styles.headerText}>
          Debug Panel {isExpanded ? '▼' : '▶'}
        </Text>
        <View style={styles.statusIndicator}>
          <Text style={styles.statusText}>
            {performanceSummary?.errorCount || 0}E
          </Text>
        </View>
      </Pressable>
      
      {isExpanded && (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Performance Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Performance Summary</Text>
            {performanceSummary && (
              <View style={styles.metricsGrid}>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Total Logs</Text>
                  <Text style={styles.metricValue}>{performanceSummary.totalLogs}</Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Errors</Text>
                  <Text style={[styles.metricValue, { color: '#F44336' }]}>
                    {performanceSummary.errorCount}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Warnings</Text>
                  <Text style={[styles.metricValue, { color: '#FF9800' }]}>
                    {performanceSummary.warningCount}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Slow Renders</Text>
                  <Text style={[styles.metricValue, { color: '#FF9800' }]}>
                    {performanceSummary.slowRenderCount}
                  </Text>
                </View>
                <View style={styles.metric}>
                  <Text style={styles.metricLabel}>Memory (MB)</Text>
                  <Text style={styles.metricValue}>
                    {performanceSummary.estimatedMemoryUsage}
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Recent Logs */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Logs</Text>
            {recentLogs.map((log, index) => (
              <View key={index} style={styles.logEntry}>
                <View style={styles.logHeader}>
                  <Text style={[styles.logLevel, { color: getLogLevelColor(log.level) }]}>
                    {log.level.toUpperCase()}
                  </Text>
                  <Text style={styles.logTime}>
                    {formatTimestamp(log.timestamp)}
                  </Text>
                </View>
                <Text style={styles.logComponent}>[{log.component}]</Text>
                <Text style={styles.logMessage}>{log.message}</Text>
                {log.data && (
                  <Text style={styles.logData}>
                    {JSON.stringify(log.data, null, 2)}
                  </Text>
                )}
              </View>
            ))}
          </View>

          {/* Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <View style={styles.actionButtons}>
              <Pressable 
                style={styles.actionButton}
                onPress={() => {
                  debugLogger.clearLogs();
                  setRecentLogs([]);
                }}
              >
                <Text style={styles.actionButtonText}>Clear Logs</Text>
              </Pressable>
              
              <Pressable 
                style={styles.actionButton}
                onPress={() => {
                  const logs = debugLogger.exportLogs();
                  console.log('Exported logs:', logs);
                }}
              >
                <Text style={styles.actionButtonText}>Export Logs</Text>
              </Pressable>
              
              <Pressable 
                style={styles.actionButton}
                onPress={() => {
                  debugLogger.disable();
                }}
              >
                <Text style={styles.actionButtonText}>Disable Logging</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 10,
    zIndex: 10000,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    borderRadius: 8,
    minWidth: 300,
    maxWidth: 400,
    maxHeight: 500,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.2)',
  },
  headerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statusIndicator: {
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: {
    maxHeight: 400,
  },
  section: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metric: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  metricLabel: {
    color: '#CCCCCC',
    fontSize: 10,
    marginBottom: 4,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  logEntry: {
    marginBottom: 8,
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 4,
  },
  logHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  logLevel: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  logTime: {
    color: '#CCCCCC',
    fontSize: 10,
  },
  logComponent: {
    color: '#2196F3',
    fontSize: 10,
    marginBottom: 2,
  },
  logMessage: {
    color: '#FFFFFF',
    fontSize: 11,
    marginBottom: 4,
  },
  logData: {
    color: '#CCCCCC',
    fontSize: 9,
    fontFamily: 'monospace',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FF3B30',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
}); 