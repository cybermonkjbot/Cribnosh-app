import React, { useCallback, useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
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
    <View style={styles.container}>
      {/* Main Content */}
      <ScrollView
        style={styles.scrollView}
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
          <View style={styles.header}>
            <Text style={styles.headerTitle}>
              Home Feed
            </Text>
            <Text style={styles.headerSubtitle}>
              Pull down to refresh and see the multi-step loader in action
            </Text>
            {refreshCount > 0 && (
              <Text style={styles.refreshCount}>
                Last refreshed: {refreshCount} time{refreshCount !== 1 ? 's' : ''} ago
              </Text>
            )}
          </View>

          {/* Sample Content */}
          <View style={styles.contentContainer}>
            {Array.from({ length: 10 }, (_, index) => (
              <View
                key={`${refreshCount}-${index}`}
                style={styles.contentCard}
              >
                <Text style={styles.contentTitle}>
                  Content Item {index + 1}
                </Text>
                <Text style={styles.contentText}>
                  This is sample content that would be refreshed when you pull down.
                  The multi-step loader will show the progress of the refresh operation.
                  {refreshCount > 0 && ` (Refreshed ${refreshCount} time${refreshCount !== 1 ? 's' : ''})`}
                </Text>
              </View>
            ))}
          </View>

          {/* Instructions */}
          <View style={styles.instructions}>
            <Text style={styles.instructionsTitle}>
              How to test the improved pull-to-refresh:
            </Text>
            <Text style={styles.instructionsText}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1, // flex-1
    backgroundColor: '#FFFFFF', // bg-white
  },
  scrollView: {
    flex: 1, // flex-1
  },
  header: {
    marginBottom: 24, // mb-6
  },
  headerTitle: {
    fontSize: 24, // text-2xl
    fontWeight: '700', // font-bold
    color: '#111827', // text-gray-900
    marginBottom: 8, // mb-2
  },
  headerSubtitle: {
    fontSize: 16, // text-base
    color: '#4B5563', // text-gray-600
    marginBottom: 8, // mb-2
  },
  refreshCount: {
    fontSize: 14, // text-sm
    color: '#FF3B30', // text-[#FF3B30]
    fontWeight: '500', // font-medium
  },
  contentContainer: {
    gap: 16, // space-y-4
  },
  contentCard: {
    backgroundColor: '#F9FAFB', // bg-gray-50
    padding: 16, // p-4
    borderRadius: 8, // rounded-lg
    borderWidth: 1, // border
    borderColor: '#E5E7EB', // border-gray-200
  },
  contentTitle: {
    fontWeight: '600', // font-semibold
    color: '#111827', // text-gray-900
    marginBottom: 4, // mb-1
  },
  contentText: {
    fontSize: 14, // text-sm
    color: '#4B5563', // text-gray-600
  },
  instructions: {
    marginTop: 32, // mt-8
    padding: 16, // p-4
    backgroundColor: '#FFF5F5', // bg-[#FFF5F5]
    borderRadius: 8, // rounded-lg
    borderWidth: 1, // border
    borderColor: '#FFE5E5', // border-[#FFE5E5]
  },
  instructionsTitle: {
    color: '#FF3B30', // text-[#FF3B30]
    fontWeight: '500', // font-medium
    marginBottom: 8, // mb-2
  },
  instructionsText: {
    fontSize: 14, // text-sm
    color: '#FF3B30', // text-[#FF3B30]
  },
}); 