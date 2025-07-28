import React, { useState } from 'react';
import { Image, Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { CancelButton } from './CancelButton';

// Badge Component
interface BadgeProps {
  text: string;
  type?: 'hot' | 'bestfit' | 'highprotein';
}

const Badge: React.FC<BadgeProps> = ({ text, type = 'hot' }) => {
  const getBackgroundColor = () => {
    switch (type) {
      case 'hot':
        return '#FF3B30';
      case 'bestfit':
        return '#FF6B35';
      case 'highprotein':
        return '#0B9E58';
      default:
        return '#FF3B30';
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
        color: 'white',
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
      backgroundColor: 'white',
      borderRadius: 16,
      padding: 12,
      marginRight: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 4,
      borderWidth: 1,
      borderColor: '#F0F0F0',
    }}>
      <View style={{
        width: '100%',
        height: 80,
        borderRadius: 12,
        backgroundColor: '#F8F9FA',
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
        {hasFireEmoji && <Text style={{ fontSize: 12 }}>🔥</Text>}
      </View>
      
      <Text style={{
        fontSize: 14,
        fontWeight: '600',
        color: '#1A202C',
        marginBottom: 4,
      }}>
        {name}
      </Text>
      
      <Text style={{
        fontSize: 16,
        fontWeight: '700',
        color: '#0B9E58',
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
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginBottom: 20,
      paddingHorizontal: 20,
    }}>
      <View style={{
        maxWidth: '80%',
        backgroundColor: '#0B9E58',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
      }}>
        <Text style={{
          color: 'white',
          fontSize: 16,
          lineHeight: 22,
          fontWeight: '400',
        }}>
          {message}
        </Text>
      </View>
      
      <View style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        overflow: 'hidden',
      }}>
        <Image 
          source={avatar} 
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </View>
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
      paddingHorizontal: 20,
    }}>
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <View style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: '#0B9E58',
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: 12,
        }}>
          <Text style={{ fontSize: 20, color: 'white' }}>🤖</Text>
        </View>
        <Text style={{
          fontSize: 18,
          fontWeight: '600',
          color: '#1A202C',
        }}>
          CribNosh
        </Text>
      </View>
      
      {title && (
        <Text style={{
          fontSize: 16,
          fontWeight: '600',
          color: '#4A5568',
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
        color: '#2D3748',
        marginBottom: 16,
      }}>
        {message}
      </Text>
      
      {products && products.length > 0 && (
        <TouchableOpacity style={{
          backgroundColor: '#0B9E58',
          borderRadius: 25,
          paddingVertical: 12,
          paddingHorizontal: 24,
          alignSelf: 'flex-start',
        }}>
          <Text style={{
            color: 'white',
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
      backgroundColor: 'white',
      borderTopWidth: 1,
      borderTopColor: '#E2E8F0',
    }}>
      <View style={{
        flex: 1,
        backgroundColor: '#F7FAFC',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginRight: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
      }}>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Ask Cribnosh"
          placeholderTextColor="#A0AEC0"
          style={{
            fontSize: 16,
            color: '#2D3748',
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
          backgroundColor: '#0B9E58',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path
            d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
            stroke="white"
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

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
      statusBarTranslucent={true}
      presentationStyle="fullScreen"
    >
      <View style={{
        flex: 1,
        backgroundColor: '#FAFFFA',
        paddingTop: 50, // Account for status bar
        zIndex: 99999, // High z-index but lower than bottom tabs (999999)
      }}>
        {/* Header */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingVertical: 16,
          borderBottomWidth: 1,
          borderBottomColor: '#E2E8F0',
          backgroundColor: '#FAFFFA',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#0B9E58',
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: 12,
            }}>
              <Text style={{ fontSize: 20, color: 'white' }}>🤖</Text>
            </View>
            <View>
              <Text style={{
                fontSize: 18,
                fontWeight: '600',
                color: '#1A202C',
              }}>
                Chat with CribNosh
              </Text>
              <Text style={{
                fontSize: 14,
                color: '#718096',
                fontWeight: '400',
              }}>
                AI-powered dining recommendations
              </Text>
            </View>
          </View>
          
          <CancelButton 
            onPress={onClose}
            color="#094327"
            size={32}
            style={{ opacity: 0.8 }}
          />
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
                  avatar={require('../../assets/images/adaptive-icon.png')}
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
      </View>
    </Modal>
  );
}; 