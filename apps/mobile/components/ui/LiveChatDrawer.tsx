import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { useAuthContext } from '../../contexts/AuthContext';
import { useSupportChat } from '../../hooks/useSupportChat';
import { useToast } from '../../lib/ToastContext';
import { useTopPosition } from '../../utils/positioning';
import { SupportMessage as SupportMessageType } from '../../types/customer';
import { Avatar } from './Avatar';
import { CribNoshLogo } from './CribNoshLogo';

// App color constants - enhanced for better UX
const COLORS = {
  primary: '#094327',      // Dark green - main brand color
  secondary: '#0B9E58',    // Green - secondary brand color
  lightGreen: '#E6FFE8',   // Light green - background
  white: '#FFFFFF',
  black: '#000000',        // Pure black
  darkGray: '#111827',     // Dark gray for active states
  gray: {
    50: '#FAFFFA',
    100: '#F7FAFC',
    200: '#F0F0F0',
    300: '#E2E8F0',
    400: '#A0AEC0',
    500: '#6B7280',
    600: '#374151',
    700: '#2D3748',
    800: '#1A202C',
  },
  red: '#FF3B30',        // CribNosh red
  orange: '#FF6B35',
  // Enhanced glass-like transparent colors
  glass: {
    white: 'rgba(255, 255, 255, 0.1)',
    white80: 'rgba(255, 255, 255, 0.9)',
    white20: 'rgba(255, 255, 255, 0.2)',
    white30: 'rgba(255, 255, 255, 0.3)',
    white95: 'rgba(255, 255, 255, 0.95)',
  },
  // New gradient colors for better visual appeal
  gradient: {
    start: '#FAFFFA',
    end: '#E6FFE8',
    chatBubble: '#F8F9FA',
    userBubble: '#FF3B30',
  },
};

// User Message Component (memoized)
interface UserMessageProps {
  message: string;
}

const UserMessage: React.FC<UserMessageProps> = React.memo(({ message }) => {
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 20,
      paddingHorizontal: 16,
    }}>
      <View style={{
        maxWidth: '80%',
        backgroundColor: COLORS.gradient.userBubble,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        shadowColor: COLORS.red,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
        borderWidth: 0,
      }}>
        <Text style={{
          color: COLORS.white,
          fontSize: 16,
          lineHeight: 22,
          fontWeight: '500',
          fontFamily: 'Inter',
        }}>
          {message}
        </Text>
      </View>
      
      <Avatar 
        source={require('../../assets/images/adaptive-icon.png')} 
        size="sm"
        glass={true}
        elevated={true}
      />
    </View>
  );
});

// Support Agent Message Component (memoized)
interface SupportMessageProps {
  message: string;
  agentName?: string;
}

const SupportMessage: React.FC<SupportMessageProps> = React.memo(({ message, agentName = "CribNosh Support" }) => {
  return (
    <View style={{
      marginBottom: 24,
      paddingHorizontal: 16,
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <Avatar 
          source={require('../../assets/images/adaptive-icon.png')} 
          size="md"
          glass={true}
          elevated={true}
        />
        <View style={{ marginLeft: 12 }}>
          <Text style={{
            fontSize: 16,
            fontWeight: '600',
            color: COLORS.gray[600],
            fontFamily: 'Inter',
          }}>
            {agentName}
          </Text>
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
          }}>
            <View style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: COLORS.secondary,
              marginRight: 6,
            }} />
            <Text style={{
              fontSize: 12,
              color: COLORS.gray[400],
              fontFamily: 'Inter',
            }}>
              Online now
            </Text>
          </View>
        </View>
      </View>
      
      <View style={{
        backgroundColor: COLORS.gradient.chatBubble,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginLeft: 48,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: COLORS.gray[200],
      }}>
        <Text style={{
          fontSize: 16,
          lineHeight: 24,
          color: COLORS.gray[700],
          fontFamily: 'Inter',
        }}>
          {message}
        </Text>
      </View>
    </View>
  );
});

// Quick Response Buttons Component (memoized)
interface QuickResponseProps {
  responses: string[];
  onSelect: (response: string) => void;
}

const QuickResponse: React.FC<QuickResponseProps> = React.memo(({ responses, onSelect }) => {
  return (
    <View style={{
      flexDirection: 'row',
      flexWrap: 'wrap',
      paddingHorizontal: 16,
      marginBottom: 20,
    }}>
      {responses.map((response, index) => (
        <TouchableOpacity
          key={index}
          style={{
            backgroundColor: COLORS.white,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 10,
            marginRight: 8,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: COLORS.gray[200],
            shadowColor: COLORS.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
          }}
          onPress={() => onSelect(response)}
          activeOpacity={0.7}
        >
          <Text style={{
            color: COLORS.gray[700],
            fontSize: 14,
            fontWeight: '500',
            fontFamily: 'Inter',
          }}>
            {response}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
});

// Chat Input Component (memoized)
const ChatInput: React.FC<{ onSend: (message: string) => void; isSending?: boolean }> = React.memo(({ onSend, isSending = false }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !isSending) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: COLORS.white,
      borderTopWidth: 1,
      borderTopColor: COLORS.gray[200],
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: -4 },
      shadowOpacity: 0.1,
      shadowRadius: 12,
      elevation: 8,
    }}>
      <View style={{
        flex: 1,
        backgroundColor: COLORS.gray[50],
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: COLORS.gray[200],
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Type your message..."
          placeholderTextColor={COLORS.gray[400]}
          style={{
            fontSize: 16,
            color: COLORS.gray[700],
            fontFamily: 'Inter',
          }}
          multiline
        />
      </View>
      
      <TouchableOpacity
        onPress={handleSend}
        disabled={isSending || !message.trim()}
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: isSending || !message.trim() ? COLORS.gray[300] : COLORS.red,
          justifyContent: 'center',
          alignItems: 'center',
          shadowColor: COLORS.red,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 4,
        }}
        activeOpacity={0.8}
      >
        {isSending ? (
          <ActivityIndicator size="small" color={COLORS.white} />
        ) : (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
              stroke={COLORS.white}
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      </TouchableOpacity>
    </View>
  );
});

interface LiveChatDrawerProps {
  isVisible: boolean;
  onClose: () => void;
  caseId?: string; // Optional: specific support case ID to load
}

export const LiveChatDrawer: React.FC<LiveChatDrawerProps> = ({ isVisible, onClose, caseId }) => {
  const { showToast } = useToast();
  const { user } = useAuthContext();
  const scrollViewRef = useRef<ScrollView>(null);
  const topPosition = useTopPosition(0);
  
  // Use support chat hook
  const {
    messages,
    agent,
    quickReplies,
    isLoading,
    isLoadingMessages,
    isSendingMessage,
    error,
    sendMessage,
    refresh,
  } = useSupportChat({
    enabled: isVisible,
    pollingInterval: 5000,
    caseId,
    onNewMessage: () => {
      // Auto-scroll to bottom when new message arrives
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    },
  });

  // Convert API messages to UI format
  const uiMessages = messages.map((msg: SupportMessageType, index: number) => {
    // Determine if message is from user or support agent
    // User messages have senderId matching current user ID
    const currentUserId = user?._id || user?.id;
    const isUserMessage = currentUserId && msg.senderId === currentUserId;
    
    return {
      id: msg._id || `msg-${index}`,
      type: isUserMessage ? 'user' as const : 'support' as const,
      content: msg.content,
      agentName: !isUserMessage && agent ? agent.name : undefined,
    };
  });

  // Animation values
  const scaleValue = useSharedValue(1);
  const opacityValue = useSharedValue(1);
  const translateYValue = useSharedValue(0);
  const isClosing = useRef(false);

  // Handle smooth exit animation
  const handleCloseWithAnimation = () => {
    if (isClosing.current) return;
    isClosing.current = true;

    // Smooth exit animation
    scaleValue.value = withTiming(0.95, { duration: 200, easing: Easing.out(Easing.cubic) });
    opacityValue.value = withTiming(0, { duration: 300, easing: Easing.out(Easing.cubic) });
    translateYValue.value = withTiming(50, { duration: 300, easing: Easing.out(Easing.cubic) }, () => {
      runOnJS(onClose)();
    });
  };

  // Reset animation values when becoming visible
  useEffect(() => {
    if (isVisible) {
      isClosing.current = false;
      scaleValue.value = 1;
      opacityValue.value = 1;
      translateYValue.value = 0;
    }
  }, [isVisible, scaleValue, opacityValue, translateYValue]);

  const handleSendMessage = async (message: string) => {
    if (message.trim() && !isSendingMessage) {
      const success = await sendMessage(message);
      if (success) {
        // Auto-scroll to bottom after sending
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      } else {
        showToast('Failed to send message. Please try again.', 'error');
      }
    }
  };

  const handleQuickResponse = (response: string) => {
    handleSendMessage(response);
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (uiMessages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [uiMessages.length]);

  // Show error toast if there's an error
  useEffect(() => {
    if (error && isVisible) {
      showToast('Failed to load chat. Please try again.', 'error');
    }
  }, [error, isVisible, showToast]);

  // Animated styles
  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scaleValue.value },
      { translateY: translateYValue.value }
    ],
    opacity: opacityValue.value,
  }));

  return (
    <Modal
      visible={isVisible}
      animationType="none"
      transparent={false}
      onRequestClose={handleCloseWithAnimation}
      statusBarTranslucent={true}
      presentationStyle="fullScreen"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={[COLORS.gradient.start, COLORS.gradient.end]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            flex: 1,
            paddingTop: topPosition,
            zIndex: 99999,
          }}
        >
        <Animated.View style={[animatedContainerStyle, { flex: 1 }]}>
          {/* Header */}
          <View style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: 20,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: COLORS.gray[200],
            backgroundColor: COLORS.white,
            shadowColor: COLORS.black,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 12,
            elevation: 8,
          }}>
            <TouchableOpacity 
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: COLORS.gray[100],
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: COLORS.black,
                shadowOffset: {
                  width: 0,
                  height: 2,
                },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
              }} 
              onPress={handleCloseWithAnimation} 
              activeOpacity={0.8}
            >
              <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                <Path
                  d="M15 5L5 15M5 5L15 15"
                  stroke={COLORS.darkGray}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <CribNoshLogo size={120} variant="default" />
            </View>
            
            <View style={{
              width: 50,
              height: 50,
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              {agent ? (
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: agent.isOnline ? COLORS.secondary : COLORS.gray[400],
                }} />
              ) : isLoading ? (
                <ActivityIndicator size="small" color={COLORS.secondary} />
              ) : (
                <View style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: COLORS.gray[400],
                }} />
              )}
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollViewRef}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingVertical: 20 }}
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={true}
          >
            {isLoadingMessages && uiMessages.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                <ActivityIndicator size="large" color={COLORS.secondary} />
                <Text style={{ marginTop: 16, color: COLORS.gray[500], fontSize: 14 }}>
                  Loading messages...
                </Text>
              </View>
            ) : uiMessages.length === 0 ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ color: COLORS.gray[500], fontSize: 16, textAlign: 'center' }}>
                  {agent 
                    ? agent.name === 'CribNosh AI' || agent.id === 'ai'
                      ? 'Hi! CribNosh AI is here to help. Send a message to get started.'
                      : `Hi! A member of our support team is here to help. Send a message to get started.`
                    : 'Starting a new conversation...'
                  }
                </Text>
              </View>
            ) : (
              <>
                {uiMessages.map((message) => (
                  <View key={message.id}>
                    {message.type === 'user' ? (
                      <UserMessage
                        message={message.content}
                      />
                    ) : (
                      <SupportMessage
                        message={message.content}
                        agentName={message.agentName || agent?.name || 'Support Agent'}
                      />
                    )}
                  </View>
                ))}
                
                {/* Quick Response Buttons */}
                {quickReplies.length > 0 && (
                  <QuickResponse
                    responses={quickReplies}
                    onSelect={handleQuickResponse}
                  />
                )}
              </>
            )}
          </ScrollView>

          {/* Chat Input */}
          <ChatInput onSend={handleSendMessage} isSending={isSendingMessage} />
        </Animated.View>
      </LinearGradient>
      </KeyboardAvoidingView>
    </Modal>
  );
};
