import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
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

// User Message Component
interface UserMessageProps {
  message: string;
}

const UserMessage: React.FC<UserMessageProps> = ({ message }) => {
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
};

// Support Agent Message Component
interface SupportMessageProps {
  message: string;
  agentName?: string;
}

const SupportMessage: React.FC<SupportMessageProps> = ({ message, agentName = "CribNosh Support" }) => {
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
};

// Quick Response Buttons Component
interface QuickResponseProps {
  responses: string[];
  onSelect: (response: string) => void;
}

const QuickResponse: React.FC<QuickResponseProps> = ({ responses, onSelect }) => {
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
};

// Chat Input Component
const ChatInput: React.FC<{ onSend: (message: string) => void }> = ({ onSend }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
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
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: COLORS.red,
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
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
            stroke={COLORS.white}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );
};

interface LiveChatDrawerProps {
  isVisible: boolean;
  onClose: () => void;
}

interface Message {
  id: number;
  type: 'user' | 'support';
  content: string;
  agentName?: string;
}

export const LiveChatDrawer: React.FC<LiveChatDrawerProps> = ({ isVisible, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'support',
      content: 'Hi there! Welcome to CribNosh support. I\'m here to help you with any questions about our service, orders, or account. How can I assist you today?',
      agentName: 'Sarah',
    },
    {
      id: 2,
      type: 'user',
      content: 'Hi! I have a question about my recent order.',
    },
    {
      id: 3,
      type: 'support',
      content: 'Of course! I\'d be happy to help with your order. Could you please provide your order number or tell me more about what you need assistance with?',
      agentName: 'Sarah',
    },
  ]);

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

  const handleSendMessage = (message: string) => {
    if (message.trim()) {
      const newMessage: Message = {
        id: messages.length + 1,
        type: 'user',
        content: message
      };
      setMessages([...messages, newMessage]);
      
      // Simulate support agent response
      setTimeout(() => {
        const supportResponse: Message = {
          id: messages.length + 2,
          type: 'support',
          content: 'Thank you for your message! I\'m looking into this for you. Is there anything else I can help you with while we wait?',
          agentName: 'Sarah',
        };
        setMessages(prev => [...prev, supportResponse]);
      }, 1500);
    }
  };

  const handleQuickResponse = (response: string) => {
    handleSendMessage(response);
  };

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
      <LinearGradient
        colors={[COLORS.gradient.start, COLORS.gradient.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flex: 1,
          paddingTop: 50, // Account for status bar
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
              <View style={{
                width: 12,
                height: 12,
                borderRadius: 6,
                backgroundColor: COLORS.secondary,
              }} />
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingVertical: 20 }}
            showsVerticalScrollIndicator={false}
            automaticallyAdjustKeyboardInsets={true}
          >
            {messages.map((message) => (
              <View key={message.id}>
                {message.type === 'user' ? (
                  <UserMessage
                    message={message.content}
                  />
                ) : (
                  <SupportMessage
                    message={message.content}
                    agentName={message.agentName}
                  />
                )}
              </View>
            ))}
            
            {/* Quick Response Buttons */}
            <QuickResponse
              responses={[
                "Order status",
                "Payment issue",
                "Account problem",
                "Technical support"
              ]}
              onSelect={handleQuickResponse}
            />
          </ScrollView>

          {/* Chat Input */}
          <ChatInput onSend={handleSendMessage} />
        </Animated.View>
      </LinearGradient>
    </Modal>
  );
};
