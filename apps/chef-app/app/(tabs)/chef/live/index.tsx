import { LiveStreamDashboard } from '@/components/ui/LiveStreamDashboard';
import { useChefAuth } from '@/contexts/ChefAuthContext';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { useAgoraStream } from '@/hooks/useAgoraStream';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { CameraView } from 'expo-camera';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { X } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export default function LiveStreamScreen() {
  const router = useRouter();
  const { chef, sessionToken, isAuthenticated } = useChefAuth();
  const cameraRef = useRef<any>(null);
  const [cameraType, setCameraType] = useState<'front' | 'back'>('back');
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveSessionId, setLiveSessionId] = useState<Id<'liveSessions'> | null>(null);
  const [channelName, setChannelName] = useState<string | null>(null);

  // Setup form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedMealId, setSelectedMealId] = useState<string | null>(null);
  const [selectedMealName, setSelectedMealName] = useState<string>('');
  const [tags, setTags] = useState<string[]>([]);
  const [isStarting, setIsStarting] = useState(false);
  const [showMealPicker, setShowMealPicker] = useState(false);
  const [showContinueOption, setShowContinueOption] = useState(false);

  // Get chef's meals
  // @ts-ignore - Type instantiation is excessively deep (Convex type system limitation)
  const meals = useQuery(
    api.queries.meals.getByChefId,
    chef?._id ? { chefId: chef._id, limit: 50 } : 'skip'
  ) as any[] | undefined;

  // Check for active live sessions
  // @ts-ignore - Type instantiation is excessively deep (Convex type system limitation)
  const activeSessions = useQuery(
    api.queries.liveSessions.getByChefId,
    chef?._id ? { chefId: chef._id, status: 'live', limit: 1 } : 'skip'
  ) as any[] | undefined;

  // Also check for 'starting' status sessions
  // @ts-ignore - Type instantiation is excessively deep (Convex type system limitation)
  const startingSessions = useQuery(
    api.queries.liveSessions.getByChefId,
    chef?._id ? { chefId: chef._id, limit: 10 } : 'skip'
  ) as any[] | undefined;

  const createLiveSession = useMutation(api.mutations.liveSessions.createLiveSession);

  // Get live session data to retrieve channel name
  // @ts-ignore - Type instantiation is excessively deep (Convex type system limitation)
  const liveSession = useQuery(
    api.queries.liveSessions.getById,
    liveSessionId ? { sessionId: liveSessionId } : 'skip'
  ) as any;

  // Initialize Agora streaming when session is active
  const { isConnected, isPublishing, error: streamError, switchCamera: switchAgoraCamera } = useAgoraStream({
    channelName: channelName || '',
    enabled: isStreaming && !!channelName && !!liveSessionId,
    onStreamStarted: () => {
      console.log('Agora stream started successfully');
    },
    onStreamError: (error) => {
      console.error('Agora stream error:', error);
      Alert.alert('Streaming Error', error.message || 'Failed to start streaming. Please try again.');
    },
  });

  useEffect(() => {
    // Request camera permission
    (async () => {
      // @ts-ignore - Dynamic imports are only supported with certain module settings
      const { Camera } = await import('expo-camera');
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Check for active sessions to show continue option
  useEffect(() => {
    if (startingSessions && startingSessions.length > 0) {
      // Find sessions that are 'live' or 'starting' (not ended or cancelled)
      const active = startingSessions.find(
        (session: any) => session.status === 'live' || session.status === 'starting'
      );
      if (active) {
        setShowContinueOption(true);
      } else {
        setShowContinueOption(false);
      }
    } else {
      setShowContinueOption(false);
    }
  }, [startingSessions]);

  const handleContinueStream = () => {
    if (startingSessions && startingSessions.length > 0) {
      const activeSession = startingSessions.find(
        (session: any) => session.status === 'live' || session.status === 'starting'
      );
      if (activeSession) {
        setLiveSessionId(activeSession._id);
        setChannelName(activeSession.session_id || activeSession.channelName);
        setIsStreaming(true);
      }
    }
  };


  const handleStartLiveStream = async () => {
    if (!isAuthenticated || !chef?._id || !sessionToken) {
      Alert.alert('Sign In Required', 'Please sign in to start a live stream.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Title Required', 'Please add a title for your live stream.');
      return;
    }

    if (!selectedMealId) {
      Alert.alert('Meal Required', 'Please select a meal for your live stream.');
      return;
    }

    try {
      setIsStarting(true);
      // Generate a unique channel name
      const channelName = `chef-${chef._id}-${Date.now()}`;
      
      const sessionId = await createLiveSession({
        channelName,
        chefId: chef._id,
        title: title.trim(),
        description: description.trim() || 'Live cooking session',
        mealId: selectedMealId as any,
        tags: tags,
        sessionToken,
      });
      
      setLiveSessionId(sessionId);
      setChannelName(channelName);
      setIsStreaming(true);
    } catch (error: any) {
      console.error('Error starting live stream:', error);
      let errorMessage = 'Please try again.';
      if (error?.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      Alert.alert('Failed to Start Live Stream', errorMessage);
    } finally {
      setIsStarting(false);
    }
  };

  const handleEndStream = () => {
    setIsStreaming(false);
    setLiveSessionId(null);
    setChannelName(null);
    router.back();
  };

  const handleClose = () => {
    if (isStreaming) {
      Alert.alert(
        'End Live Stream',
        'Are you sure you want to leave? This will end your live stream.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'End Stream', style: 'destructive', onPress: handleEndStream },
        ]
      );
    } else {
      router.back();
    }
  };

  const handleFlipCamera = () => {
    setCameraType(prev => prev === 'back' ? 'front' : 'back');
    // Also switch Agora camera if streaming
    if (isPublishing) {
      switchAgoraCamera();
    }
  };

  // Update channel name from live session when it loads
  useEffect(() => {
    if (liveSession && liveSession.session_id && !channelName) {
      setChannelName(liveSession.session_id);
    }
  }, [liveSession, channelName]);

  const handleTagInput = (text: string) => {
    if (text.includes(',')) {
      const newTags = text.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
      setTags(prev => [...prev, ...newTags]);
    }
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <StatusBar barStyle="light-content" />
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <StatusBar barStyle="light-content" />
          <View style={styles.errorContent}>
            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorText}>Camera Permission Required</Text>
              <Text style={styles.errorSubtext}>
                Please enable camera access in your device settings to go live.
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Show setup form if not streaming
  if (!isStreaming) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar 
          hidden={false}
          backgroundColor="transparent"
          translucent={true}
          barStyle="light-content"
        />
        <View style={styles.setupContainer}>
          {/* Header */}
          <View style={styles.setupHeader}>
            <TouchableOpacity onPress={handleClose} disabled={isStarting}>
              <X size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.setupHeaderTitle}>Go Live</Text>
            <TouchableOpacity
              onPress={handleStartLiveStream}
              disabled={isStarting || !title.trim() || !selectedMealId}
              style={[
                styles.startLiveButton,
                (isStarting || !title.trim() || !selectedMealId) && styles.startLiveButtonDisabled,
              ]}
            >
              {isStarting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.startLiveButtonText}>Start Live</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.setupContent} 
            contentContainerStyle={styles.setupContentContainer}
            keyboardShouldPersistTaps="handled"
          >
            {/* Continue Previous Stream Option */}
            {showContinueOption && startingSessions && (() => {
              const activeSession = startingSessions.find(
                (session: any) => session.status === 'live' || session.status === 'starting'
              );
              if (!activeSession) return null;
              return (
                <TouchableOpacity
                  style={styles.continueContainer}
                  onPress={handleContinueStream}
                  activeOpacity={0.7}
                >
                  <View style={styles.continueCard}>
                    <View style={styles.continueCardGradient} />
                    <View style={styles.continueContent}>
                      <View style={styles.continueHeader}>
                        <View style={styles.liveIndicatorSmall}>
                          <View style={styles.liveDotSmall} />
                          <Text style={styles.continueTitle}>Continue Previous Stream</Text>
                        </View>
                        <View style={styles.continueArrow}>
                          <Ionicons name="arrow-forward" size={20} color="#FF3B30" />
                        </View>
                      </View>
                      <Text style={styles.continueSessionTitle} numberOfLines={1}>
                        {activeSession.title || 'Live Stream'}
                      </Text>
                      {activeSession.description && (
                        <Text style={styles.continueSessionDescription} numberOfLines={2}>
                          {activeSession.description}
                        </Text>
                      )}
                      <View style={styles.continueFooter}>
                        <View style={styles.continueBadge}>
                          <Ionicons name="time-outline" size={14} color="rgba(255, 255, 255, 0.8)" />
                          <Text style={styles.continueBadgeText}>
                            {activeSession.status === 'live' ? 'Live Now' : 'Starting...'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })()}

            {/* Title Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Live Stream Title *</Text>
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

            {/* Meal Selection */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Meal Being Cooked *</Text>
              <TouchableOpacity 
                style={styles.mealSelectButton} 
                disabled={isStarting || !meals}
                onPress={() => setShowMealPicker(!showMealPicker)}
              >
                <Text style={styles.mealSelectButtonText}>
                  {selectedMealName || 'Select a Meal'}
                </Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </TouchableOpacity>
              {showMealPicker && (
                <View style={styles.mealPickerContainer}>
                  <ScrollView style={styles.mealPickerScrollView} nestedScrollEnabled>
                    {!meals ? (
                      <View style={styles.mealPickerLoading}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.mealPickerLoadingText}>Loading meals...</Text>
                      </View>
                    ) : meals.length === 0 ? (
                      <View style={styles.mealPickerEmpty}>
                        <Text style={styles.mealPickerEmptyText}>No meals available</Text>
                        <Text style={styles.mealPickerEmptySubtext}>
                          Create a meal in your chef profile first
                        </Text>
                      </View>
                    ) : (
                      meals.map((meal) => (
                        <TouchableOpacity
                          key={meal._id}
                          style={[
                            styles.mealPickerItem,
                            selectedMealId === meal._id && styles.mealPickerItemSelected,
                          ]}
                          onPress={() => {
                            setSelectedMealId(meal._id);
                            setSelectedMealName(meal.name);
                            setShowMealPicker(false);
                          }}
                        >
                          {meal.image && (
                            <Image
                              source={{ uri: meal.image }}
                              style={styles.mealPickerItemImage}
                              contentFit="cover"
                            />
                          )}
                          <View style={styles.mealPickerItemContent}>
                            <Text style={styles.mealPickerItemName}>{meal.name}</Text>
                            {meal.description && (
                              <Text style={styles.mealPickerItemDescription} numberOfLines={1}>
                                {meal.description}
                              </Text>
                            )}
                            {meal.price && (
                              <Text style={styles.mealPickerItemPrice}>£{meal.price.toFixed(2)}</Text>
                            )}
                          </View>
                          {selectedMealId === meal._id && (
                            <Ionicons name="checkmark-circle" size={24} color="#FF3B30" />
                          )}
                        </TouchableOpacity>
                      ))
                    )}
                  </ScrollView>
                </View>
              )}
              <Text style={styles.mealSelectHint}>
                Link your live stream to a specific meal from your menu.
              </Text>
            </View>

            {/* Description Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Description (Optional)</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Tell us more about your live session..."
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
                placeholder="e.g. italian, pasta, cooking"
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
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  // Show camera and dashboard when streaming
  if (!liveSessionId) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFFFFF" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar 
        hidden={false}
        backgroundColor="transparent"
        translucent={true}
        barStyle="light-content"
      />
      
      {/* Camera View - Full Screen Background */}
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={cameraType}
      >
        {/* Streaming Status Indicator */}
        {isStreaming && (
          <View style={styles.streamingStatusContainer}>
            {isPublishing ? (
              <View style={styles.streamingIndicator}>
                <View style={styles.streamingDot} />
                <Text style={styles.streamingText}>LIVE STREAMING</Text>
              </View>
            ) : isConnected ? (
              <View style={styles.streamingIndicator}>
                <ActivityIndicator size="small" color="#FF3B30" />
                <Text style={styles.streamingText}>CONNECTING...</Text>
              </View>
            ) : (
              <View style={styles.streamingIndicator}>
                <ActivityIndicator size="small" color="#FF3B30" />
                <Text style={styles.streamingText}>INITIALIZING...</Text>
              </View>
            )}
          </View>
        )}

        {/* Live Stream Dashboard Overlay - Handles header, comments, orders, controls */}
        <LiveStreamDashboard
          sessionId={liveSessionId}
          onClose={handleClose}
          onEndStream={handleEndStream}
          onFlipCamera={handleFlipCamera}
        />
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#02120A',
  },
  setupContainer: {
    flex: 1,
    backgroundColor: '#02120A',
  },
  setupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 255, 232, 0.1)',
  },
  setupHeaderTitle: {
    color: '#E6FFE8',
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  setupContent: {
    flex: 1,
  },
  setupContentContainer: {
    padding: 20,
    paddingTop: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    color: '#E6FFE8',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  titleInput: {
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    padding: 14,
    color: '#E6FFE8',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
    fontFamily: 'Inter',
  },
  descriptionInput: {
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    padding: 14,
    color: '#E6FFE8',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
    minHeight: 100,
    textAlignVertical: 'top',
    fontFamily: 'Inter',
  },
  tagInput: {
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    padding: 14,
    color: '#E6FFE8',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
    fontFamily: 'Inter',
  },
  mealSelectButton: {
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
  },
  mealSelectButtonText: {
    color: '#E6FFE8',
    fontSize: 16,
    flex: 1,
    fontFamily: 'Inter',
  },
  mealSelectHint: {
    color: 'rgba(230, 255, 232, 0.7)',
    fontSize: 12,
    marginTop: 6,
    fontFamily: 'Inter',
  },
  mealPickerContainer: {
    marginTop: 8,
    backgroundColor: 'rgba(230, 255, 232, 0.1)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.2)',
    maxHeight: 200,
    overflow: 'hidden',
  },
  mealPickerScrollView: {
    maxHeight: 200,
  },
  mealPickerLoading: {
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  mealPickerLoadingText: {
    color: 'rgba(230, 255, 232, 0.7)',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  mealPickerEmpty: {
    padding: 20,
    alignItems: 'center',
  },
  mealPickerEmptyText: {
    color: '#E6FFE8',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  mealPickerEmptySubtext: {
    color: 'rgba(230, 255, 232, 0.7)',
    fontSize: 12,
    fontFamily: 'Inter',
  },
  mealPickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(230, 255, 232, 0.1)',
    gap: 12,
  },
  mealPickerItemSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  mealPickerItemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
  },
  mealPickerItemContent: {
    flex: 1,
    gap: 4,
  },
  mealPickerItemName: {
    color: '#E6FFE8',
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  mealPickerItemDescription: {
    color: 'rgba(230, 255, 232, 0.7)',
    fontSize: 12,
    fontFamily: 'Inter',
  },
  mealPickerItemPrice: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
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
    backgroundColor: 'rgba(230, 255, 232, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(230, 255, 232, 0.3)',
  },
  tagText: {
    color: '#E6FFE8',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  startLiveButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startLiveButtonDisabled: {
    backgroundColor: 'rgba(255, 59, 48, 0.5)',
  },
  startLiveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#02120A',
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#02120A',
  },
  errorContent: {
    flex: 1,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  errorTextContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  errorText: {
    color: '#E6FFE8',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  errorSubtext: {
    color: 'rgba(230, 255, 232, 0.7)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  continueContainer: {
    marginBottom: 20,
  },
  continueCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    position: 'relative',
  },
  continueCardGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    backgroundColor: 'rgba(255, 59, 48, 0.03)',
  },
  continueContent: {
    padding: 16,
    position: 'relative',
    zIndex: 1,
  },
  continueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  liveIndicatorSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  liveDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  continueTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: 'Inter',
  },
  continueArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueSessionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginBottom: 6,
  },
  continueSessionDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    fontFamily: 'Inter',
    marginBottom: 12,
    lineHeight: 18,
  },
  continueFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  continueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  continueBadgeText: {
    fontSize: 11,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.7)',
    fontFamily: 'Inter',
  },
  streamingStatusContainer: {
    position: 'absolute',
    top: 100,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  streamingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  streamingText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
    letterSpacing: 0.5,
  },
});

