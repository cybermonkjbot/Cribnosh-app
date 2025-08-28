import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';
import { Avatar } from './Avatar';
import { CribNoshLogo } from './CribNoshLogo';

// App color constants - matching the home page components exactly
const COLORS = {
  primary: '#094327',      // Dark green - main brand color
  secondary: '#0B9E58',    // Green - secondary brand color
  lightGreen: '#E6FFE8',   // Light green - background
  white: '#FFFFFF',
  black: '#000000',        // Pure black used in home components
  darkGray: '#111827',     // Dark gray for active states (from Header)
  gray: {
    50: '#FAFFFA',
    100: '#F7FAFC',
    200: '#F0F0F0',
    300: '#E2E8F0',
    400: '#A0AEC0',
    500: '#6B7280',        // Used in Header for muted text
    600: '#374151',        // Used in Header for button text
    700: '#2D3748',
    800: '#1A202C',
  },
  // Home page gradient colors for softer feel
  homePink: '#f8e6f0',     // Soft pink from home page
  homeCream: '#faf2e8',    // Soft cream from home page
  homePinkLight: '#f5e6f0', // Lighter pink from Header
  homeCreamLight: '#f9f2e8', // Lighter cream from Header
  accent: '#FF6B35',       // Orange accent for highlights
  // Glass-like transparent colors from home components
  glass: {
    white: 'rgba(255, 255, 255, 0.1)',      // From Header sticky state
    white80: 'rgba(255, 255, 255, 0.8)',    // From Header button states
    white20: 'rgba(255, 255, 255, 0.2)',    // From CategoryFilterChips
    white30: 'rgba(255, 255, 255, 0.3)',    // From CategoryFilterChips borders
  },
  red: '#dc2626',        // CribNosh red from logo
  orange: '#FF6B35',
};

// Badge Component
interface BadgeProps {
  text: string;
  type?: 'hot' | 'bestfit' | 'highprotein';
}

const Badge: React.FC<BadgeProps> = ({ text, type = 'hot' }) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'hot':
        return COLORS.red;        // CribNosh red
      case 'bestfit':
        return COLORS.red;        // CribNosh red instead of orange
      case 'highprotein':
        return COLORS.secondary;
      default:
        return COLORS.red;        // CribNosh red
    }
  };

  return (
    <View style={{
      backgroundColor: getBackgroundColor(),
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
      marginRight: 4,
    }}>
      <Text style={{
        color: COLORS.white,
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
      }}>
        {text}
      </Text>
    </View>
  );
};

// Product Card Component
interface ProductCardProps {
  name: string;
  price: string;
  image: any;
  badge?: { text: string; type?: 'hot' | 'bestfit' | 'highprotein' };
  hasFireEmoji?: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
  name, 
  price, 
  image, 
  badge,
  hasFireEmoji = false 
}) => {
  return (
    <View style={{
      width: 140,
      backgroundColor: COLORS.white,
      borderRadius: 16,
      padding: 12,
      marginRight: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: COLORS.gray[200],
    }}>
      <View style={{
        width: '100%',
        height: 80,
        borderRadius: 12,
        backgroundColor: COLORS.gray[100],
        marginBottom: 8,
        overflow: 'hidden',
      }}>
        <Image 
          source={image} 
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
      
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
        {badge && <Badge text={badge.text} type={badge.type} />}
        {hasFireEmoji && <Ionicons name="flame" size={12} color={COLORS.red} />}
      </View>
      
      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.black,
        marginBottom: 4,
      }}>
        {name}
      </Text>
      
      <Text style={{
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.red,
      }}>
        {price}
      </Text>
    </View>
  );
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
        backgroundColor: COLORS.glass.white80,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: COLORS.glass.white30,
        shadowColor: COLORS.black,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
        elevation: 3,
      }}>
        <Text style={{
          color: COLORS.darkGray,
          fontSize: 16,
          lineHeight: 22,
          fontWeight: '400',
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

// AI Message Component
interface AIMessageProps {
  message: string;
  products?: ProductCardProps[];
  title?: string;
}

const AIMessage: React.FC<AIMessageProps> = ({ message, products, title }) => {
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
      </View>
      
      {title && (
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: COLORS.gray[600],
          marginBottom: 12,
        }}>
          {title}
        </Text>
      )}
      
      {products && products.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 20 }}
          style={{ marginBottom: 16 }}
        >
          {products.map((product, index) => (
            <ProductCard
              key={index}
              name={product.name}
              price={product.price}
              image={product.image}
              badge={product.badge}
              hasFireEmoji={product.hasFireEmoji}
            />
          ))}
        </ScrollView>
      )}
      
      <Text style={{
        fontSize: 16,
        lineHeight: 24,
        color: COLORS.gray[700],
        marginBottom: 16,
      }}>
        {message}
      </Text>
      
      {products && products.length > 0 && (
        <TouchableOpacity style={{
          backgroundColor: COLORS.red,
          borderRadius: 25,
          paddingVertical: 12,
          paddingHorizontal: 24,
          alignSelf: 'flex-start',
        }}>
          <Text style={{
            color: COLORS.white,
            fontSize: 16,
            fontWeight: '600',
          }}>
            Add to cart with instructions
          </Text>
        </TouchableOpacity>
      )}
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
      backgroundColor: COLORS.glass.white80,
      borderTopWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.2)',
      shadowColor: COLORS.black,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 8,
    }}>
      <View style={{
        flex: 1,
        backgroundColor: COLORS.glass.white80,
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: COLORS.glass.white30,
      }}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Ask Cribnosh"
          placeholderTextColor={COLORS.gray[400]}
          style={{
            fontSize: 16,
            color: COLORS.gray[700],
          }}
          multiline
        />
      </View>
      
              <TouchableOpacity
          onPress={handleSend}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: COLORS.red,
            justifyContent: 'center',
            alignItems: 'center',
          }}
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

interface AIChatDrawerProps {
  isVisible: boolean;
  onClose: () => void;
}

interface Message {
  id: number;
  type: 'user' | 'ai';
  content: string;
  products?: ProductCardProps[];
  title?: string;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ isVisible, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      type: 'user',
      content: 'Just finished a workout — what should I eat to recover right?'
    },
    {
      id: 2,
      type: 'ai',
      content: 'Alright, I\'ve found a few meals that match your vibe today — all under your calorie goal, no dairy, and still packed with flavor. Want something spicy or keep it mild?',
      title: 'I picked these for you',
      products: [
        {
          name: 'Hosomaki roll',
          price: '£19',
          image: require('../../assets/images/cribnoshpackaging.png'),
          badge: { text: 'Bussin', type: 'hot' },
          hasFireEmoji: true,
        },
        {
          name: 'Hosomaki roll',
          price: '£19',
          image: require('../../assets/images/cribnoshpackaging.png'),
        },
        {
          name: 'Hosomaki roll',
          price: '£19',
          image: require('../../assets/images/cribnoshpackaging.png'),
          badge: { text: 'Best fit', type: 'bestfit' },
        },
      ],
    },
    {
      id: 3,
      type: 'user',
      content: 'Make it something with grilled fish or turkey, lots of greens, maybe quinoa or sweet potatoes on the side. I want it balanced, high protein, clean, but not boring. No dairy, and please keep the oil light. Something I can eat and still feel sharp after.'
    },
    {
      id: 4,
      type: 'ai',
      content: 'Got it. Here\'s what I\'m recommending based on what you asked for:\n\nGrilled herbed turkey with sautéed greens and roasted sweet potatoes on the side — clean, balanced, and flavorful. No dairy. Light on oil. High in protein, low on fuss',
      title: 'Fine Selected for you',
      products: [
        {
          name: 'Hosomaki roll',
          price: '£19',
          image: require('../../assets/images/cribnoshpackaging.png'),
          badge: { text: 'High Protein', type: 'highprotein' },
        },
      ],
    }
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
      
      // Simulate AI response
      setTimeout(() => {
        const aiResponse: Message = {
          id: messages.length + 2,
          type: 'ai',
          content: 'Thanks for your message! I\'m here to help you discover amazing food options. What type of cuisine are you in the mood for today?'
        };
        setMessages(prev => [...prev, aiResponse]);
      }, 1000);
    }
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
        colors={[COLORS.homePink, COLORS.homeCream]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          flex: 1,
          paddingTop: 50, // Account for status bar
          zIndex: 99999, // High z-index but lower than bottom tabs (999999)
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
            borderBottomColor: 'rgba(255, 255, 255, 0.2)',
            backgroundColor: COLORS.glass.white,
            shadowColor: COLORS.black,
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 8,
          }}>
            <TouchableOpacity 
              style={{
                width: 50,
                height: 50,
                borderRadius: 25,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
          </View>

          {/* Messages */}
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingVertical: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {messages.map((message) => (
              <View key={message.id}>
                {message.type === 'user' ? (
                  <UserMessage
                    message={message.content}
                  />
                ) : (
                  <AIMessage
                    message={message.content}
                    products={message.products}
                    title={message.title}
                  />
                )}
              </View>
            ))}
          </ScrollView>

          {/* Chat Input */}
          <ChatInput onSend={handleSendMessage} />
        </Animated.View>
      </LinearGradient>
    </Modal>
  );
}; 