import React, { useCallback, useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, Text, View } from 'react-native';
import { MultiStepLoader } from './MultiStepLoader';

interface PullToRefreshExampleProps {
  children?: React.ReactNode;
}

export const PullToRefreshExample: React.FC<PullToRefreshExampleProps> = ({ 
  children 
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [showLoader, setShowLoader] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

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

  const simulateLoadingSteps = async () => {
    setShowLoader(true);
    
    // Simulate the time it takes for the loader to complete all 3 steps
    // 3 steps × 2 seconds each = 6 seconds total
    setTimeout(() => {
      setShowLoader(false);
      // Increment refresh count to show new content
      setRefreshCount(prev => prev + 1);
      
      // Fade in the content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 6000);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    
    // Fade out current content
    Animated.timing(fadeAnim, {
      toValue: 0.3,
      duration: 200,
      useNativeDriver: true,
    }).start();
    
    // Start the loading process
    await simulateLoadingSteps();
    setRefreshing(false);
  }, [fadeAnim]);

  return (
    <View className="flex-1 bg-white">
      {/* Main Content */}
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FF3B30"
            colors={['#FF3B30']}
            progressBackgroundColor="rgba(255, 255, 255, 0.8)"
          />
        }
      >
        <Animated.View 
          style={{ 
            opacity: fadeAnim,
            padding: 16,
          }}
        >
          {/* Content Header */}
          <View className="mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-2">
              Home Feed
            </Text>
            <Text className="text-gray-600 mb-2">
              Pull down to refresh and see the multi-step loader in action
            </Text>
            {refreshCount > 0 && (
              <Text className="text-sm text-[#FF3B30] font-medium">
                Last refreshed: {refreshCount} time{refreshCount !== 1 ? 's' : ''} ago
              </Text>
            )}
          </View>

          {/* Sample Content */}
          <View className="space-y-4">
            {Array.from({ length: 10 }, (_, index) => (
              <View
                key={`${refreshCount}-${index}`}
                className="bg-gray-50 p-4 rounded-lg border border-gray-200"
              >
                <Text className="font-semibold text-gray-900 mb-1">
                  Content Item {index + 1}
                </Text>
                <Text className="text-gray-600 text-sm">
                  This is sample content that would be refreshed when you pull down.
                  The multi-step loader will show the progress of the refresh operation.
                  {refreshCount > 0 && ` (Refreshed ${refreshCount} time${refreshCount !== 1 ? 's' : ''})`}
                </Text>
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View className="mt-8 p-4 bg-[#FFF5F5] rounded-lg border border-[#FFE5E5]">
            <Text className="text-[#FF3B30] font-medium mb-2">
              How to test the improved pull-to-refresh:
            </Text>
            <Text className="text-[#FF3B30] text-sm">
              • Pull down from the top of the screen to trigger refresh{'\n'}
              • Watch the full-screen multi-step loader with mascot{'\n'}
              • Content fades out during refresh for better UX{'\n'}
              • Each step takes 2 seconds with smooth transitions{'\n'}
              • Uses Cribnosh branding colors throughout
            </Text>
          </View>

          {children}
        </Animated.View>
      </ScrollView>

      {/* Full-screen MultiStepLoader */}
      <MultiStepLoader
        loadingStates={loadingStates}
        loading={showLoader}
        duration={2000}
        loop={false}
      />
    </View>
  );
}; 