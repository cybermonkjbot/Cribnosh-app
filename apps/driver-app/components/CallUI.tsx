import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ThemedText } from './ThemedText';
import { Colors } from '../constants/Colors';
import { callingService, CallState } from '../services/callingService';
import type { Id } from '../../packages/convex/_generated/dataModel';

interface CallUIProps {
  visible: boolean;
  isIncoming: boolean;
  remoteUserName: string | null | undefined;
  callId: Id<"callSessions"> | null;
  onEnd: () => void;
  onDecline?: () => void;
  onAnswer?: () => void;
}

export function CallUI({
  visible,
  isIncoming,
  remoteUserName,
  callId,
  onEnd,
  onDecline,
  onAnswer,
}: CallUIProps) {
  const [callState, setCallState] = useState<CallState | null>(null);
  const [isEnding, setIsEnding] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const unsubscribe = callingService.onCallStateChange((state) => {
      setCallState(state);
      
      if (state.status === 'ended' || state.status === 'declined' || state.status === 'missed') {
        setTimeout(() => {
          onEnd();
        }, 1000);
      }
    });

    const currentState = callingService.getCallState();
    setCallState(currentState);

    return unsubscribe;
  }, [visible, onEnd]);

  const handleEndCall = async () => {
    if (isEnding) return;
    setIsEnding(true);

    try {
      await callingService.endCall();
      onEnd();
    } catch (error) {
      Alert.alert('Error', 'Failed to end call. Please try again.');
    } finally {
      setIsEnding(false);
    }
  };

  const handleDecline = async () => {
    if (!callId || !onDecline) return;
    
    try {
      await callingService.declineCall(callId, callState?.remoteUserId!);
      onDecline();
    } catch (error) {
      Alert.alert('Error', 'Failed to decline call. Please try again.');
    }
  };

  const handleAnswer = async () => {
    if (!callId || !onAnswer) return;

    try {
      const result = await callingService.answerCall(callId);
      if (result.success) {
        onAnswer();
      } else {
        Alert.alert('Error', result.error || 'Failed to answer call');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to answer call. Please try again.');
    }
  };

  const getStatusText = () => {
    if (!callState) return isIncoming ? 'Incoming Call' : 'Connecting...';
    
    switch (callState.status) {
      case 'initiating':
        return 'Calling...';
      case 'ringing':
        return isIncoming ? 'Incoming Call' : 'Ringing...';
      case 'connected':
        return 'Connected';
      case 'ended':
        return 'Call Ended';
      case 'declined':
        return 'Call Declined';
      case 'missed':
        return 'Missed Call';
      default:
        return 'Connecting...';
    }
  };

  const isConnected = callState?.status === 'connected';

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={false}
      statusBarTranslucent
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <ThemedText style={styles.statusText}>{getStatusText()}</ThemedText>
        </View>

        <View style={styles.content}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Ionicons name="person" size={64} color={Colors.light.text} />
            </View>
          </View>

          <ThemedText type="title" style={styles.name}>
            {remoteUserName || 'Unknown'}
          </ThemedText>

          {isConnected && callState && (
            <ThemedText style={styles.duration}>00:00</ThemedText>
          )}
        </View>

        <View style={styles.controls}>
          {isIncoming ? (
            <>
              <TouchableOpacity
                style={[styles.controlButton, styles.declineButton]}
                onPress={handleDecline}
              >
                <Ionicons name="close-circle" size={32} color={Colors.light.background} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.controlButton, styles.answerButton]}
                onPress={handleAnswer}
              >
                <Ionicons name="call" size={32} color={Colors.light.background} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              <TouchableOpacity
                style={[styles.controlButton, styles.endButton]}
                onPress={handleEndCall}
                disabled={isEnding}
              >
                <Ionicons name="call" size={32} color={Colors.light.background} />
              </TouchableOpacity>
            </>
          )}
        </View>

        <View style={styles.bottomSpacing} />
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'space-between',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    color: Colors.light.icon,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  duration: {
    fontSize: 18,
    color: Colors.light.icon,
    marginTop: 8,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 32,
    paddingBottom: 40,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  answerButton: {
    backgroundColor: Colors.light.accent,
  },
  declineButton: {
    backgroundColor: Colors.light.error,
  },
  endButton: {
    backgroundColor: Colors.light.error,
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  bottomSpacing: {
    height: 32,
  },
});

