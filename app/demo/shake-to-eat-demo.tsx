import { ShakeToEatFlow } from '@/components/ui/ShakeToEatFlow';
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CONFIG } from '../constants/config';

export default function ShakeToEatDemo() {
  const [showAIChat, setShowAIChat] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isShakeToEatVisible, setIsShakeToEatVisible] = useState(false);

  const handleAIChatLaunch = (prompt: string) => {
    console.log('🎯 AI Chat Launch:', prompt);
    setAiPrompt(prompt);
    setShowAIChat(true);
  };

  const handleCloseAIChat = () => {
    setShowAIChat(false);
    setAiPrompt('');
  };

  const handleShakeToEatLaunch = (prompt: string) => {
    console.log('🎯 Shake to Eat Launch:', prompt);
    setAiPrompt(prompt);
    setShowAIChat(true);
    setIsShakeToEatVisible(true);
  };

  const handleShakeToEatClose = () => {
    setIsShakeToEatVisible(false);
    setAiPrompt('');
  };

  const handleShakeToEatStart = () => {
    console.log('Shake to Eat flow started');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Shake to Eat Demo</Text>
        <Text style={styles.subtitle}>
          Shake your device continuously for 3 seconds to start the food discovery flow
        </Text>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={styles.instructionTitle}>How to Test:</Text>
        <Text style={styles.instruction}>1. Start shaking your device</Text>
        <Text style={styles.instruction}>2. Keep shaking continuously for 3 seconds</Text>
        <Text style={styles.instruction}>3. Watch for the progress overlay</Text>
        <Text style={styles.instruction}>4. Complete the mood selection and meal discovery</Text>
        <Text style={styles.instruction}>5. See the AI prompt generated</Text>
      </View>

      {/* Status */}
      <View style={styles.status}>
        <Text style={styles.statusTitle}>Status:</Text>
        <Text style={styles.statusText}>
          {showAIChat ? 'AI Chat Ready' : 'Waiting for shake...'}
        </Text>
      </View>

      {/* AI Chat Display */}
      {showAIChat && (
        <View style={styles.aiChatContainer}>
          <Text style={styles.aiChatTitle}>Generated AI Prompt:</Text>
          <Text style={styles.aiChatPrompt}>{aiPrompt}</Text>
          <Pressable style={styles.closeButton} onPress={handleCloseAIChat}>
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </View>
      )}

      {/* ShakeToEatFlow Component */}
      {CONFIG.SHAKE_TO_EAT_ENABLED ? (
        <ShakeToEatFlow
          isVisible={isShakeToEatVisible}
          onClose={handleShakeToEatClose}
          onAIChatLaunch={handleShakeToEatLaunch}
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
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#11181C',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#687076',
    textAlign: 'center',
    lineHeight: 22,
  },
  instructions: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 15,
  },
  instruction: {
    fontSize: 14,
    color: '#687076',
    marginBottom: 8,
    lineHeight: 20,
  },
  status: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 10,
  },
  statusText: {
    fontSize: 14,
    color: '#22c55e',
    fontWeight: '500',
  },
  aiChatContainer: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiChatTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#11181C',
    marginBottom: 10,
  },
  aiChatPrompt: {
    fontSize: 14,
    color: '#687076',
    lineHeight: 20,
    marginBottom: 15,
    fontStyle: 'italic',
  },
  closeButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  disabledContainer: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    textAlign: 'center',
  },
}); 