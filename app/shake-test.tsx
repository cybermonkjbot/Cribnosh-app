import { ShakeToEatFlow } from '@/components/ui/ShakeToEatFlow';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { CONFIG } from '../constants/config';

export default function ShakeTest() {
  const [isShakeToEatVisible, setIsShakeToEatVisible] = useState(false);
  const [testLogs, setTestLogs] = useState<string[]>([]);

  // Add logging to verify component is mounting
  useEffect(() => {
    addLog('🚀 ShakeTest component mounted');
  }, []);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] ${message}`;
    setTestLogs(prev => [...prev.slice(-10), logMessage]); // Keep last 10 logs
  };

  const handleAIChatLaunch = (prompt: string) => {
    addLog(`🎯 AI Chat would launch with: "${prompt}"`);
    Alert.alert(
      'AI Chat Launch',
      `Prompt: "${prompt}"`,
      [{ text: 'OK' }]
    );
  };

  const handleOpenShakeToEat = () => {
    addLog('🎯 Manually opening Shake to Eat flow...');
    setIsShakeToEatVisible(true);
  };

  const handleCloseShakeToEat = () => {
    addLog('❌ Closing Shake to Eat flow...');
    setIsShakeToEatVisible(false);
  };

  const handleShakeToEatStart = () => {
    addLog('🎭 ShakeToEatFlow starting - making visible');
    setIsShakeToEatVisible(true);
  };

  const clearLogs = () => {
    setTestLogs([]);
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFF5F5', '#FFE8D6']}
        style={styles.gradientBackground}
      >
        <View style={styles.content}>
          <Text style={styles.title}>🧪 Shake Detection Test</Text>
          <Text style={styles.subtitle}>
            Testing the shake to eat functionality
          </Text>

          {/* Status Info */}
          <View style={styles.statusCard}>
            <Text style={styles.statusTitle}>Status:</Text>
            <Text style={styles.statusText}>
              ShakeToEat Visible: {isShakeToEatVisible ? 'YES' : 'NO'}
            </Text>
            <Text style={styles.statusText}>
              Component: Always mounted for shake detection
            </Text>
          </View>

          {/* Manual Test Button */}
          <Pressable
            style={styles.testButton}
            onPress={handleOpenShakeToEat}
          >
            <LinearGradient
              colors={['#FF3B30', '#FF6B6B']}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>🎯 Manual Test</Text>
            </LinearGradient>
          </Pressable>

          {/* Instructions */}
          <View style={styles.instructionsCard}>
            <Text style={styles.instructionsTitle}>How to test:</Text>
            <Text style={styles.instructionItem}>• Shake your device to trigger the flow</Text>
            <Text style={styles.instructionItem}>• Or use the manual test button above</Text>
            <Text style={styles.instructionItem}>• Watch the logs below for debug info</Text>
            <Text style={styles.instructionItem}>• Check console for detailed logs</Text>
          </View>

          {/* Logs Section */}
          <View style={styles.logsSection}>
            <View style={styles.logsHeader}>
              <Text style={styles.logsTitle}>Recent Logs:</Text>
              <Pressable onPress={clearLogs} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear</Text>
              </Pressable>
            </View>
            <View style={styles.logsContainer}>
              {testLogs.length === 0 ? (
                <Text style={styles.noLogsText}>No logs yet...</Text>
              ) : (
                testLogs.map((log, index) => (
                  <Text key={index} style={styles.logText}>
                    {log}
                  </Text>
                ))
              )}
            </View>
          </View>
        </View>
      </LinearGradient>

      {/* ShakeToEatFlow - Always mounted */}
      {CONFIG.SHAKE_TO_EAT_ENABLED ? (
        <ShakeToEatFlow
          isVisible={isShakeToEatVisible}
          onClose={handleCloseShakeToEat}
          onAIChatLaunch={handleAIChatLaunch}
          onStart={handleShakeToEatStart}
        />
      ) : (
        <View style={styles.disabledContainer}>
          <Text style={styles.disabledText}>Shake to Eat Feature Disabled</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#11181C',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#687076',
    textAlign: 'center',
    marginBottom: 30,
  },
  statusCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    color: '#687076',
    marginBottom: 4,
  },
  testButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    textAlign: 'center',
  },
  instructionsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#687076',
    marginBottom: 4,
    lineHeight: 20,
  },
  logsSection: {
    flex: 1,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
  },
  clearButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  logsContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 8,
    padding: 12,
    maxHeight: 200,
  },
  noLogsText: {
    fontSize: 14,
    color: '#687076',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  logText: {
    fontSize: 12,
    color: '#11181C',
    marginBottom: 2,
    fontFamily: 'monospace',
  },
  disabledContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  disabledText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    textAlign: 'center',
  },
}); 