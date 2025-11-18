import React, { useMemo } from 'react';
import { Modal as RNModal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Mascot } from '../Mascot';

interface PlayfulTooltipProps {
  isVisible: boolean;
  message: string;
  onClose: () => void;
  mascotEmotion?: 'happy' | 'sad' | 'excited' | 'hungry' | 'satisfied' | 'default';
  mascotSize?: number;
  bubblePosition?: 'left' | 'right';
}

export function PlayfulTooltip({
  isVisible,
  message,
  onClose,
  mascotEmotion = 'happy',
  mascotSize = 120,
  bubblePosition,
}: PlayfulTooltipProps) {
  // Auto-calculate bubble position based on message length if not provided
  const calculatedBubblePosition = useMemo(() => {
    if (bubblePosition) {
      return bubblePosition;
    }
    // Short messages (<= 5 words) go right, longer messages go left
    const wordCount = message.split(/\s+/).length;
    return wordCount <= 5 ? 'right' : 'left';
  }, [message, bubblePosition]);

  return (
    <RNModal
      visible={isVisible}
      onRequestClose={onClose}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <Pressable
        style={styles.overlay}
        onPress={onClose}
        activeOpacity={1}
      >
        <Pressable
          style={styles.contentContainer}
          onPress={(e) => e.stopPropagation()}
          activeOpacity={1}
        >
          <View style={styles.mascotContainer}>
            <View
              style={[
                styles.speechBubble,
                calculatedBubblePosition === 'left'
                  ? styles.speechBubbleLeft
                  : styles.speechBubbleRight,
              ]}
            >
              <Text style={styles.speechBubbleText}>{message}</Text>
            </View>
            <View style={styles.mascotZoom}>
              <Mascot emotion={mascotEmotion} size={mascotSize} />
            </View>
          </View>
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  contentContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  mascotContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    overflow: 'visible',
    position: 'relative',
  },
  mascotZoom: {
    transform: [{ scale: 2.0 }],
  },
  speechBubble: {
    position: 'absolute',
    top: -50,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    zIndex: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    maxWidth: 250,
  },
  speechBubbleRight: {
    right: -10,
  },
  speechBubbleLeft: {
    left: -10,
  },
  speechBubbleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#094327',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
});

