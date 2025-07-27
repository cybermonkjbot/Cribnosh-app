import React, { useState } from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { PanGestureHandler, PanGestureHandlerGestureEvent } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { CancelButton } from './CancelButton';

// Badge Component for product tags
interface BadgeProps {
  text: string;
  type?: 'hot' | 'bestfit' | 'highprotein';
}

const Badge: React.FC<BadgeProps> = ({ text, type = 'hot' }) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'hot': return '#FF3B30';
      case 'bestfit': return 'rgba(255, 59, 48, 0.72)';
      case 'highprotein': return 'rgba(255, 59, 48, 0.72)';
      default: return '#FF3B30';
    }
  };

  return (
    <View style={{
      backgroundColor: getBackgroundColor(),
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 2,
      position: 'absolute',
      bottom: 17,
      right: 8,
    }}>
      <Text style={{
        fontFamily: 'Lato',
        fontWeight: '700',
        fontSize: 7,
        lineHeight: 22,
        textAlign: 'center',
        letterSpacing: 0.03,
        color: '#FFFFFF',
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
      width: 112.49,
      height: 147.5,
      marginRight: 18,
    }}>
      {/* Product Image Container */}
      <View style={{
        width: 107.96,
        height: 96.27,
        backgroundColor: '#FAFAFA',
        borderWidth: 1,
        borderColor: '#EAEAEA',
        borderRadius: 15,
        marginBottom: 4,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Image 
          source={image}
          style={{
            width: 80,
            height: 80,
            resizeMode: 'contain',
          }}
        />
        
        {/* Fire Emoji */}
        {hasFireEmoji && (
          <Text style={{
            position: 'absolute',
            bottom: -3,
            right: 8,
            fontSize: 20,
          }}>
            🔥
          </Text>
        )}
        
        {/* Badge */}
        {badge && (
          <Badge text={badge.text} type={badge.type} />
        )}
      </View>
      
      {/* Product Name */}
      <Text style={{
        fontFamily: 'Poppins',
        fontWeight: '600',
        fontSize: 14,
        lineHeight: 28,
        color: '#094327',
        marginBottom: 2,
      }}>
        {name}
      </Text>
      
      {/* Product Price */}
      <Text style={{
        fontFamily: 'Poppins',
        fontWeight: '600',
        fontSize: 15,
        lineHeight: 26,
        color: '#094327',
      }}>
        {price}
      </Text>
    </View>
  );
};

// User Message Component
interface UserMessageProps {
  message: string;
  avatar: any;
}

const UserMessage: React.FC<UserMessageProps> = ({ message, avatar }) => {
  return (
    <View style={{
      backgroundColor: '#F5FFF6',
      borderRadius: 16,
      padding: 18,
      marginHorizontal: 19,
      marginBottom: 16,
      position: 'relative',
      shadowColor: '#E6FFE8',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 55,
      elevation: 10,
    }}>
      {/* User Avatar and Label */}
      <View style={{
        position: 'absolute',
        top: -8,
        right: 25,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
      }}>
        <Text style={{
          fontFamily: 'Inter',
          fontWeight: '500',
          fontSize: 16,
          lineHeight: 24,
          color: '#094327',
        }}>
          You
        </Text>
        <View style={{
          width: 36,
          height: 36,
          backgroundColor: '#E6FFE8',
          borderRadius: 18,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <Image source={avatar} style={{ width: 32, height: 32, borderRadius: 16 }} />
        </View>
      </View>
      
      {/* Message Text */}
      <Text style={{
        fontFamily: 'Inter',
        fontStyle: 'italic',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 23,
        textAlign: 'right',
        color: '#094327',
        marginTop: 25,
      }}>
        {message}
      </Text>
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
      backgroundColor: 'rgba(245, 255, 246, 0.9)',
      borderRadius: 16,
      padding: 25,
      marginHorizontal: 17,
      marginBottom: 16,
    }}>
      {/* CribNosh Logo */}
      <View style={{ marginBottom: 16 }}>
        <Text style={{
          fontFamily: 'Inter',
          fontWeight: '600',
          fontSize: 16,
          color: '#0B9E58',
        }}>
          Crib<Text style={{ color: '#FF3B30' }}>Nosh</Text>
        </Text>
      </View>
      
      {/* Title if provided */}
      {title && (
        <Text style={{
          fontFamily: 'Poppins',
          fontWeight: '600',
          fontSize: 20,
          lineHeight: 16,
          color: '#094327',
          marginBottom: 16,
        }}>
          {title}
        </Text>
      )}
      
      {/* Message Text */}
      <Text style={{
        fontFamily: 'Inter',
        fontWeight: '400',
        fontSize: 14,
        lineHeight: 23,
        color: '#242524',
        marginBottom: products ? 20 : 0,
      }}>
        {message}
      </Text>
      
      {/* Products Section */}
      {products && products.length > 0 && (
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginTop: 10 }}
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
    </View>
  );
};

// Chat Input Component
const ChatInput: React.FC<{ onSend: (message: string) => void }> = ({ onSend }) => {
  const [inputText, setInputText] = useState('');
  
  return (
    <View style={{
      backgroundColor: '#FAFFFB',
      borderTopWidth: 1,
      borderTopColor: '#EBEBEA',
      paddingHorizontal: 5,
      paddingVertical: 17,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    }}>
      {/* Text Input */}
      <View style={{
        flex: 1,
        backgroundColor: '#F7F7F7',
        borderRadius: 14,
        paddingHorizontal: 16,
        paddingVertical: 11,
      }}>
        <Text style={{
          fontFamily: 'Inter',
          fontWeight: '400',
          fontSize: 16,
          lineHeight: 26,
          color: '#8C8D8B',
        }}>
          Ask Cribnosh
        </Text>
      </View>
      
      {/* Send Button */}
      <TouchableOpacity
        style={{
          width: 44,
          height: 44,
          backgroundColor: '#094327',
          opacity: 0.5,
          borderRadius: 22,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        onPress={() => {
          if (inputText.trim()) {
            onSend(inputText.trim());
            setInputText('');
          }
        }}
      >
        <Svg width={23} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 0L14.59 8.41L23 11L14.59 13.59L12 22L9.41 13.59L1 11L9.41 8.41L12 0Z"
            fill="#E6FFE8"
          />
          <Path
            d="M19 7L20.18 9.82L23 11L20.18 12.18L19 15L17.82 12.18L15 11L17.82 9.82L19 7Z"
            fill="#E6FFE8"
          />
        </Svg>
      </TouchableOpacity>
    </View>
  );
};

// Main AIChatDrawer Component
interface AIChatDrawerProps {
  isVisible: boolean;
  onClose: () => void;
}

export const AIChatDrawer: React.FC<AIChatDrawerProps> = ({ isVisible, onClose }) => {
  const insets = useSafeAreaInsets();
  
  const [messages, setMessages] = useState([
    {
      type: 'user',
      message: 'Just finished a workout — what should I eat to recover right?',
      avatar: require('../../assets/images/adaptive-icon.png'), // Replace with actual avatar
    },
    {
      type: 'ai',
      message: 'Alright, I\'ve found a few meals that match your vibe today — all under your calorie goal, no dairy, and still packed with flavor. Want something spicy or keep it mild?',
      title: 'I picked these for you',
      products: [
        {
          name: 'Hosomaki roll',
          price: '£19',
          image: require('../../assets/images/cribnoshpackaging.png'), // Replace with actual images
          badge: { text: 'Bussin', type: 'hot' as const },
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
          badge: { text: 'Best fit', type: 'bestfit' as const },
        },
      ],
    },
    {
      type: 'user',
      message: 'Make it something with grilled fish or turkey, lots of greens, maybe quinoa or sweet potatoes on the side. I want it balanced, high protein, clean, but not boring. No dairy, and please keep the oil light. Something I can eat and still feel sharp after.',
      avatar: require('../../assets/images/adaptive-icon.png'),
    },
    {
      type: 'ai',
      message: 'Got it. Here\'s what I\'m recommending based on what you asked for:\n\nGrilled herbed turkey with sautéed greens and roasted sweet potatoes on the side — clean, balanced, and flavorful. No dairy. Light on oil. High in protein, low on fuss',
      title: 'Fine Selected for you',
      products: [
        {
          name: 'Hosomaki roll',
          price: '£19',
          image: require('../../assets/images/cribnoshpackaging.png'),
          badge: { text: 'High Protein', type: 'highprotein' as const },
        },
      ],
    },
  ]);

  const handleSendMessage = (message: string) => {
    // Add user message and simulate AI response
    setMessages(prev => [...prev, {
      type: 'user',
      message,
      avatar: require('../../assets/images/adaptive-icon.png'),
    }]);
  };

  // Animation values for swipe back
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  // Swipe back gesture handler
  const gestureHandler = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: () => {
      // Reset any previous animations
    },
    onActive: (event) => {
      // Only allow swipe to the right (positive translationX)
      if (event.translationX > 0) {
        translateX.value = event.translationX;
        // Reduce opacity as user swipes
        opacity.value = Math.max(0.3, 1 - event.translationX / 300);
      }
    },
    onEnd: (event) => {
      const swipeThreshold = 100; // Minimum distance to trigger close
      const velocityThreshold = 500; // Minimum velocity to trigger close
      
      if (event.translationX > swipeThreshold || event.velocityX > velocityThreshold) {
        // Close the drawer
        translateX.value = withSpring(400, { damping: 15 });
        opacity.value = withSpring(0, { damping: 15 }, () => {
          runOnJS(onClose)();
        });
      } else {
        // Spring back to original position
        translateX.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    },
  });

  // Animated style for the drawer
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  if (!isVisible) return null;

  return (
    <PanGestureHandler onGestureEvent={gestureHandler}>
      <Animated.View style={[{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: '#FAFFFA',
        borderTopLeftRadius: 48,
        borderTopRightRadius: 48,
        shadowColor: 'rgba(23, 26, 31, 0.12)',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 2,
        elevation: 8,
      }, animatedStyle]}>
        {/* Header with Back Button */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: Math.max(insets.top + 15, 25), // Slightly more top padding since no handle
          paddingBottom: 15,
        }}>
          {/* Back Button */}
          <CancelButton 
            onPress={onClose}
            color="#094327"
            size={32}
            style={{ opacity: 0.8 }}
          />
          
          {/* Title */}
          <Text style={{
            fontFamily: 'Inter',
            fontWeight: '600',
            fontSize: 18,
            color: '#094327',
            flex: 1,
            textAlign: 'center',
            marginHorizontal: 20,
          }}>
            Chat with CribNosh
          </Text>
          
          {/* Spacer for balance */}
          <View style={{ width: 32 }} />
        </View>

        {/* Chat Messages */}
        <ScrollView 
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ 
            paddingBottom: 20,
            paddingTop: 10, // Add some top padding since handle is removed
          }}
        >
          {messages.map((msg, index) => (
            msg.type === 'user' ? (
              <UserMessage
                key={index}
                message={msg.message}
                avatar={msg.avatar}
              />
            ) : (
              <AIMessage
                key={index}
                message={msg.message}
                title={msg.title}
                products={msg.products}
              />
            )
          ))}
        </ScrollView>

        {/* Add to Cart Button */}
        <View style={{
          paddingHorizontal: 33,
          paddingBottom: 16,
        }}>
          <TouchableOpacity
            style={{
              backgroundColor: '#094327',
              borderRadius: 30,
              paddingVertical: 10,
              paddingHorizontal: 20,
            }}
          >
            <Text style={{
              fontFamily: 'Lato',
              fontWeight: '700',
              fontSize: 15,
              lineHeight: 22,
              textAlign: 'center',
              letterSpacing: 0.03,
              color: '#E6FFE8',
            }}>
              Add to cart with instructions
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chat Input - positioned to be flush with bottom navigation */}
        <View style={{
          paddingBottom: insets.bottom - 90, // Subtract 90px from safe area bottom
        }}>
          <ChatInput onSend={handleSendMessage} />
        </View>
      </Animated.View>
    </PanGestureHandler>
  );
};

export default AIChatDrawer; 