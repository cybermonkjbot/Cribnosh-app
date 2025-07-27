import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MultiStepLoader } from './MultiStepLoader';
import { cn } from './utils';

export const MultiStepLoaderDemo: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const loadingStates = [
    { 
      text: 'Finding the best meals for you...',
      emotion: 'excited' as const
    },
    { 
      text: 'Preparing your fresh experience...',
      emotion: 'hungry' as const
    },
    { 
      text: 'Ready to serve!',
      emotion: 'satisfied' as const
    },
  ];

  const simulateLoading = async () => {
    setIsLoading(true);
    
    // The loader will automatically progress through states
    // We can stop it after a certain time or let it loop
    setTimeout(() => {
      setIsLoading(false);
    }, 8000); // 8 seconds total (3 steps × 2 seconds + 2 seconds buffer)
  };

  const handleStartLoading = () => {
    if (!isLoading) {
      simulateLoading();
    }
  };

  const handleStopLoading = () => {
    setIsLoading(false);
  };

  return (
    <ScrollView className="flex-1 bg-white p-4">
      <View className="space-y-6">
        {/* Header */}
        <View className="space-y-2">
          <Text className="text-2xl font-bold text-gray-900">
            Cribnosh Multi-Step Loader
          </Text>
          <Text className="text-gray-600">
            Polished loading experience with mascot and Cribnosh branding
          </Text>
        </View>

        {/* Current Status */}
        <View className="bg-gray-50 p-4 rounded-lg">
          <Text className="text-sm font-medium text-gray-700 mb-2">
            Current Status
          </Text>
          <Text className="text-lg font-semibold text-gray-900">
            {isLoading ? 'Loading in progress...' : 'Ready to start'}
          </Text>
          {isLoading && (
            <Text className="text-sm text-[#FF3B30] mt-1">
              The loader will automatically progress through {loadingStates.length} states
            </Text>
          )}
        </View>

        {/* Loading States Preview */}
        <View className="space-y-3">
          <Text className="text-sm font-medium text-gray-700">
            Loading States
          </Text>
          <View className="space-y-2">
            {loadingStates.map((state, index) => (
              <View
                key={index}
                className="p-3 rounded-lg border border-gray-200 bg-gray-50"
              >
                <Text className="text-gray-700 font-medium">
                  {index + 1}. {state.text}
                </Text>
                <Text className="text-sm text-gray-500 mt-1">
                  Mascot emotion: {state.emotion}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Controls */}
        <View className="space-y-3">
          <Text className="text-sm font-medium text-gray-700">
            Controls
          </Text>
          
          {/* Start Loading Button */}
          <TouchableOpacity
            onPress={handleStartLoading}
            disabled={isLoading}
            className={cn(
              'bg-[#FF3B30] p-4 rounded-lg items-center',
              isLoading && 'opacity-50'
            )}
          >
            <Text className="text-white font-semibold">
              {isLoading ? 'Loading...' : 'Start Loading'}
            </Text>
          </TouchableOpacity>

          {/* Stop Loading Button */}
          <TouchableOpacity
            onPress={handleStopLoading}
            disabled={!isLoading}
            className={cn(
              'bg-gray-500 p-4 rounded-lg items-center',
              !isLoading && 'opacity-50'
            )}
          >
            <Text className="text-white font-semibold">
              Stop Loading
            </Text>
          </TouchableOpacity>
        </View>

        {/* Instructions */}
        <View className="space-y-3">
          <Text className="text-sm font-medium text-gray-700">
            Features
          </Text>
          <View className="space-y-2">
            <Text className="text-gray-600 text-sm">
              • 3 polished loading states with Cribnosh branding
            </Text>
            <Text className="text-gray-600 text-sm">
              • Animated mascot that changes emotion for each step
            </Text>
            <Text className="text-gray-600 text-sm">
              • Cribnosh orange-red color scheme (#FF3B30)
            </Text>
            <Text className="text-gray-600 text-sm">
              • Glassmorphism backdrop with blur effect
            </Text>
            <Text className="text-gray-600 text-sm">
              • Smooth animations and transitions
            </Text>
            <Text className="text-gray-600 text-sm">
              • Each step takes 2 seconds to complete
            </Text>
          </View>
        </View>
      </View>

      {/* The MultiStepLoader component */}
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={isLoading}
        duration={2000}
        loop={true}
      />
    </ScrollView>
  );
}; 