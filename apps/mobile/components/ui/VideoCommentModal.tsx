import { Send } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext } from '@/contexts/AuthContext';
import { api } from '@/convex/_generated/api';
import { getConvexClient, getSessionToken } from '@/lib/convexClient';
import { showError, showSuccess, showWarning } from '../../lib/GlobalToastManager';
import { navigateToSignIn } from '../../utils/signInNavigationGuard';

interface VideoCommentModalProps {
  isVisible: boolean;
  onClose: () => void;
  videoId: string;
  videoTitle?: string;
  onCommentAdded?: () => void;
}

export function VideoCommentModal({
  isVisible,
  onClose,
  videoId,
  videoTitle,
  onCommentAdded,
}: VideoCommentModalProps) {
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isAuthenticated } = useAuthContext();

  // Debug log
  useEffect(() => {
    console.log('VideoCommentModal - isVisible:', isVisible, 'videoId:', videoId);
  }, [isVisible, videoId]);

  const handleSubmit = useCallback(async () => {
    if (!commentText.trim()) return;

    if (!isAuthenticated) {
      showWarning('Authentication Required', 'Please sign in to comment');
      navigateToSignIn();
      return;
    }

    try {
      setIsSubmitting(true);
      const convex = getConvexClient();
      const sessionToken = await getSessionToken();

      if (!sessionToken) {
        throw new Error('Not authenticated');
      }

      // Call the action to add comment
      const result = await convex.action(api.actions.search.customerAddVideoComment, {
        sessionToken,
        videoId,
        content: commentText.trim(),
      });

      if (result.success === false) {
        throw new Error(result.error || 'Failed to add comment');
      }

      showSuccess('Comment added!', 'Your comment has been posted');
      setCommentText('');
      onCommentAdded?.();
      onClose();
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to add comment';
      showError('Failed to add comment', errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [commentText, isAuthenticated, videoId, onCommentAdded, onClose]);

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent={true}
      hardwareAccelerated={true}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Comment</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>

          {videoTitle && (
            <View style={styles.videoTitleContainer}>
              <Text style={styles.videoTitle}>{videoTitle}</Text>
            </View>
          )}

          {/* Comment Input */}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Write a comment..."
              placeholderTextColor="#999"
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
              editable={!isSubmitting && isAuthenticated}
              autoFocus
            />
            <View style={styles.footer}>
              <Text style={styles.charCount}>
                {commentText.length}/500
              </Text>
              <Pressable
                onPress={handleSubmit}
                disabled={!commentText.trim() || isSubmitting || !isAuthenticated}
                style={[
                  styles.submitButton,
                  (!commentText.trim() || isSubmitting || !isAuthenticated) &&
                    styles.submitButtonDisabled,
                ]}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Send size={20} color="#FFFFFF" />
                )}
              </Pressable>
            </View>
          </View>

          {!isAuthenticated && (
            <View style={styles.authPrompt}>
              <Text style={styles.authPromptText}>
                Please sign in to add comments
              </Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '600',
  },
  videoTitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
  },
  videoTitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  inputContainer: {
    flex: 1,
    padding: 16,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
    textAlignVertical: 'top',
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#FAFAFA',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  charCount: {
    fontSize: 12,
    color: '#999',
  },
  submitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  authPrompt: {
    padding: 16,
    backgroundColor: '#FFF3E0',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  authPromptText: {
    fontSize: 14,
    color: '#E65100',
    textAlign: 'center',
  },
});

