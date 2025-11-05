import { useRouter } from 'expo-router';
import { Camera, Radio, X } from 'lucide-react-native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthContext } from '@/contexts/AuthContext';
import { showError, showSuccess } from '@/lib/GlobalToastManager';

const { width } = Dimensions.get('window');

interface LiveStreamModalProps {
  isVisible: boolean;
  onClose: () => void;
}

export function LiveStreamModal({ isVisible, onClose }: LiveStreamModalProps) {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthContext();
  const insets = useSafeAreaInsets();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  
  // Close handler
  const handleClose = useCallback(() => {
    setTitle('');
    setDescription('');
    setTags([]);
    onClose();
  }, [onClose]);
  
  // Handle tag input
  const handleTagInput = useCallback((text: string) => {
    if (text.includes(',')) {
      const newTags = text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      setTags(prev => [...prev, ...newTags]);
    }
  }, []);
  
  // Handle start live stream
  const handleStartLiveStream = useCallback(async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to start a live stream.');
      return;
    }
    
    if (!title.trim()) {
      showError('Title Required', 'Please add a title for your live stream.');
      return;
    }
    
    if (!description.trim()) {
      showError('Description Required', 'Please add a description for your live stream.');
      return;
    }
    
    try {
      setIsStarting(true);
      
      // TODO: Call the startLiveSession API
      // For now, we'll show a success message and close
      // const result = await startLiveSession({
      //   title: title.trim(),
      //   description: description.trim(),
      //   tags: tags,
      // });
      
      showSuccess('Live Stream Starting!', 'Your live stream is being set up...');
      handleClose();
      
      // Navigate to live stream view
      // router.push(`/live-stream/${result.sessionId}`);
    } catch (error: any) {
      console.error('Error starting live stream:', error);
      let errorMessage = 'Please try again.';
      if (error?.data?.message) {
        errorMessage = error.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      showError('Failed to Start Live Stream', errorMessage);
    } finally {
      setIsStarting(false);
    }
  }, [isAuthenticated, title, description, tags, handleClose]);
  
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="fullScreen"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.modalContainer, { paddingTop: insets.top }]}>
        <ScrollView style={styles.contentContainer} contentContainerStyle={styles.contentContainerStyle}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={handleClose} disabled={isStarting}>
              <X size={24} color="#333" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Start Live Stream</Text>
            <TouchableOpacity
              onPress={handleStartLiveStream}
              disabled={isStarting || !title.trim() || !description.trim()}
              style={[
                styles.startButton,
                (isStarting || !title.trim() || !description.trim()) && styles.startButtonDisabled,
              ]}
            >
              {isStarting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.startButtonText}>Start</Text>
              )}
            </TouchableOpacity>
          </View>
          
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Radio size={48} color="#FF3B30" />
            </View>
            <Text style={styles.iconLabel}>Go Live</Text>
          </View>
          
          {/* Title Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Title *</Text>
            <TextInput
              style={styles.titleInput}
              placeholder="What are you cooking today?"
              placeholderTextColor="#999"
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              editable={!isStarting}
              multiline={false}
            />
          </View>
          
          {/* Description Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Description *</Text>
            <TextInput
              style={styles.descriptionInput}
              placeholder="Tell your viewers what they can expect..."
              placeholderTextColor="#999"
              value={description}
              onChangeText={setDescription}
              maxLength={500}
              editable={!isStarting}
              multiline
              numberOfLines={4}
            />
          </View>
          
          {/* Tags Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Tags (comma-separated)</Text>
            <TextInput
              style={styles.tagInput}
              placeholder="e.g. italian, cooking, pasta"
              placeholderTextColor="#999"
              onChangeText={handleTagInput}
              editable={!isStarting}
            />
            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity
                      onPress={() => setTags(prev => prev.filter((_, i) => i !== index))}
                      disabled={isStarting}
                    >
                      <X size={14} color="#666" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
          
          {/* Info Section */}
          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>Live Stream Tips</Text>
            <Text style={styles.infoText}>
              • Make sure you have good lighting{'\n'}
              • Check your internet connection{'\n'}
              • Have your ingredients ready{'\n'}
              • Engage with your viewers
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  contentContainer: {
    flex: 1,
  },
  contentContainerStyle: {
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  startButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  iconContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF5F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  iconLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
  },
  inputContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  descriptionInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  tagInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#fff',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  tagText: {
    fontSize: 14,
    color: '#333',
  },
  infoContainer: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    backgroundColor: '#F9F9F9',
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

