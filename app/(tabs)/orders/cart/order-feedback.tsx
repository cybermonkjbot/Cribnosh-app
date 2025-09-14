import { SuperButton } from '@/components/ui/SuperButton';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type FeedbackType = 'chefs-kiss' | 'hits-different' | 'meh' | 'not-great';

interface OrderFeedbackScreenProps {
  // Dynamic content props
  orderNumber?: number;
  kitchenName?: string;
  orderImage?: any;
  feedbackSubmitted?: boolean;
  recommendedKitchen?: {
    name: string;
    cuisine: string;
    rating: string;
    avatar: string;
  };
}

export default function OrderFeedbackScreen() {
  const [selectedFeedback, setSelectedFeedback] = useState<FeedbackType | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [emojiSelected, setEmojiSelected] = useState(false);

  // Dynamic content - can be passed as props or fetched from context
  const orderData = {
    orderNumber: 22,
    kitchenName: "Bob's Kitchen",
    orderImage: require("@/assets/images/demo/meals/sushi.png"),
    recommendedKitchen: {
      name: "Stans Kitchen",
      cuisine: "African cuisine",
      rating: "Top Rated",
      avatar: "https://avatar.iran.liara.run/public/44"
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleFeedbackSelect = (feedback: FeedbackType) => {
    setSelectedFeedback(feedback);
    setEmojiSelected(true);
  };

  const handleSubmitFeedback = () => {
    if (selectedFeedback) {
      setFeedbackSubmitted(true);
      // Here you would typically send feedback to your backend
      console.log('Feedback submitted:', selectedFeedback);
    }
  };

  const handleReOrder = () => {
    // TODO: Implement re-order functionality
    console.log('Re-order pressed');
  };

  const handleViewRecommendedKitchen = () => {
    // TODO: Navigate to recommended kitchen
    console.log('View recommended kitchen:', orderData.recommendedKitchen.name);
  };

  const renderFeedbackButtons = () => {
    if (feedbackSubmitted) {
      return (
        <View className="items-center mb-2">
          <Text className="text-white text-2xl font-bold mb-2">Thanks ✨</Text>
          <Text className="text-white text-sm text-center">
            Your review was saved, and added to preferences
          </Text>
        </View>
      );
    }

    if (emojiSelected) {
      // Show text feedback buttons after emoji is selected (like in the image)
      return (
        <View className="flex-row justify-center space-x-3 mb-2">
          <Pressable
            onPress={() => handleSubmitFeedback()}
            className={`px-4 py-2 rounded-full ${
              selectedFeedback === 'chefs-kiss' 
                ? 'bg-white' 
                : 'bg-red-500 border border-white'
            }`}
          >
            <Text className={`text-sm font-medium ${
              selectedFeedback === 'chefs-kiss' ? 'text-red-500' : 'text-white'
            }`}>
              Was Chef&apos;s Kiss
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => handleSubmitFeedback()}
            className={`px-4 py-2 rounded-full ${
              selectedFeedback === 'hits-different' 
                ? 'bg-white' 
                : 'bg-red-500 border border-white'
            }`}
          >
            <Text className={`text-sm font-medium ${
              selectedFeedback === 'hits-different' ? 'text-red-500' : 'text-white'
            }`}>
              Hits Different
            </Text>
          </Pressable>
          
          <Pressable
            onPress={() => handleSubmitFeedback()}
            className={`px-4 py-2 rounded-full ${
              selectedFeedback === 'meh' 
                ? 'bg-white' 
                : 'bg-red-500 border border-white'
            }`}
          >
            <Text className={`text-sm font-medium ${
              selectedFeedback === 'meh' ? 'text-red-500' : 'text-white'
            }`}>
              Meh
            </Text>
          </Pressable>
        </View>
      );
    }

    // Show emoji feedback state initially (like in image 3)
    return (
      <View className="flex-row justify-center space-x-4 mb-2">
        <Pressable
          onPress={() => handleFeedbackSelect('chefs-kiss')}
          className="w-12 h-12 bg-yellow-400 rounded-full items-center justify-center"
        >
          <Text className="text-2xl">🤤</Text>
        </Pressable>
        
        <Pressable
          onPress={() => handleFeedbackSelect('hits-different')}
          className="w-12 h-12 bg-yellow-400 rounded-full items-center justify-center"
        >
          <Text className="text-2xl">🥺</Text>
        </Pressable>
        
        <Pressable
          onPress={() => handleFeedbackSelect('meh')}
          className="w-12 h-12 bg-yellow-400 rounded-full items-center justify-center"
        >
          <Text className="text-2xl">😐</Text>
        </Pressable>
        
        <Pressable
          onPress={() => handleFeedbackSelect('not-great')}
          className="w-12 h-12 bg-yellow-400 rounded-full items-center justify-center"
        >
          <Text className="text-2xl">😰</Text>
        </Pressable>
      </View>
    );
  };

  const renderOrderDetails = () => {
    return (
      <View className="bg-transparent p-4 mb-2">
        <View className="flex-row items-center">
          <View className="bg-white rounded-lg px-4 py-4 mr-4">
            <Image
              source={orderData.orderImage}
              className="w-12 h-12 rounded-full"
            />
          </View>
          <View className="flex-1">
            <Text className="text-sm text-white">
              Your {orderData.orderNumber}th order from
            </Text>
            <Text className="text-lg font-bold text-white">
              {orderData.kitchenName}
            </Text>
            <Pressable className="flex-row items-center mt-1">
              <Feather name="message-circle" size={14} color="#9CA3AF" />
              <Text className="text-sm text-[#9CA3AF] ml-1">Add a comment</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  };

  const renderDynamicContent = () => {
    if (feedbackSubmitted) {
      // Show recommended kitchen after feedback submission (like in image 1)
      return (
        <View className="bg-white rounded-2xl p-4 mb-2">
          <View className="flex-row items-center">
            <Image
              source={{ uri: orderData.recommendedKitchen.avatar }}
              className="w-12 h-12 rounded-full mr-4"
            />
            <View className="flex-1">
              <Text className="text-lg font-bold text-gray-900">
                {orderData.recommendedKitchen.name}
              </Text>
              <Text className="text-sm text-gray-600">
                {orderData.recommendedKitchen.cuisine} ({orderData.recommendedKitchen.rating})
              </Text>
            </View>
            <Pressable
              onPress={handleViewRecommendedKitchen}
              className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
            >
              <Feather name="play" size={16} color="#666" />
            </Pressable>
          </View>
        </View>
      );
    }

    // Show recommended kitchen before feedback submission (like in image 2)
    return (
      <View className="bg-white rounded-2xl p-4 mb-2">
        <View className="flex-row items-center">
          <Image
            source={{ uri: orderData.recommendedKitchen.avatar }}
            className="w-12 h-12 rounded-full mr-4"
          />
          <View className="flex-1">
            <Text className="text-lg font-bold text-gray-900">
              {orderData.recommendedKitchen.name}
            </Text>
            <Text className="text-sm text-gray-600">
              {orderData.recommendedKitchen.cuisine} ({orderData.recommendedKitchen.rating})
            </Text>
          </View>
          <Pressable
            onPress={handleViewRecommendedKitchen}
            className="w-8 h-8 bg-gray-100 rounded-full items-center justify-center"
          >
            <Feather name="play" size={16} color="#666" />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#FF3B30]">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-1">
        <Pressable onPress={handleBack}>
          <Feather name="chevron-left" size={24} color="white" />
        </Pressable>
        <View className="w-10 h-10 bg-white rounded-full" />
      </View>

      {/* Main Content */}
      <View className="flex-1 px-6 pb-20">
        {/* Main Message Image */}
        <View className="items-center justify-center mb-4 -mt-4">
          <Image
            source={require("@/assets/images/We hope it was a Vibe.png")}
            className="w-full h-[300px]"
            resizeMode="contain"
          />
        </View>

        {/* Order Details - Always shown */}
        {renderOrderDetails()}

        {/* Dynamic Content Section - Shows additional content based on state */}
        {renderDynamicContent()}

        {/* Feedback Buttons */}
        {renderFeedbackButtons()}
      </View>

      {/* Bottom Action Button - Fixed positioning above tab bars */}
      <View className="absolute left-0 right-0 z-10" style={{ bottom: 0 }}>
        <SuperButton
          title={
            <View className="flex-row items-center justify-center w-full">
              <Text className="text-white text-lg font-semibold">
                Order this again
              </Text>
            </View>
          }
          onPress={handleReOrder}
          backgroundColor="#02120A"
          textColor="white"
          style={{
            borderTopLeftRadius: 50,
            borderTopRightRadius: 50,
            height: 70,
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 20, // Extra padding for tab bar clearance
            marginBottom: 0,
          }}
        />
      </View>
    </SafeAreaView>
  );
}
