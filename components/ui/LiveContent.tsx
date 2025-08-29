import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Animated, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import LiveScreenView from './LiveViewerScreen';

interface LiveKitchen {
  id: string;
  name: string;
  cuisine: string;
  viewers: number;
  isLive: boolean;
  image: string;
  description: string;
  chef: string;
}

const mockLiveKitchens: LiveKitchen[] = [
  {
    id: '1',
    name: 'Amara\'s Kitchen',
    cuisine: 'Nigerian',
    viewers: 156,
    isLive: true,
    image: 'https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop',
    description: 'Live cooking Nigerian Jollof Rice',
    chef: 'Chef Amara'
  },
  {
    id: '2',
    name: 'Bangkok Bites',
    cuisine: 'Thai',
    viewers: 89,
    isLive: true,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    description: 'Live Thai Green Curry preparation',
    chef: 'Chef Siriporn'
  },
  {
    id: '3',
    name: 'Marrakech Delights',
    cuisine: 'Moroccan',
    viewers: 234,
    isLive: true,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    description: 'Live Lamb Tagine cooking',
    chef: 'Chef Hassan'
  },
  {
    id: '4',
    name: 'Seoul Street',
    cuisine: 'Korean',
    viewers: 67,
    isLive: true,
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400&h=300&fit=crop',
    description: 'Live Bulgogi preparation',
    chef: 'Chef Min-jun'
  },
  {
    id: '5',
    name: 'Nonna\'s Table',
    cuisine: 'Italian',
    viewers: 189,
    isLive: true,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    description: 'Live Truffle Risotto cooking',
    chef: 'Chef Giuseppe'
  },
  {
    id: '6',
    name: 'Tokyo Dreams',
    cuisine: 'Japanese',
    viewers: 312,
    isLive: true,
    image: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=300&fit=crop',
    description: 'Live Sushi making session',
    chef: 'Chef Takeshi'
  }
];

interface LiveContentProps {
  scrollViewRef?: React.RefObject<ScrollView | null>;
  scrollY?: Animated.Value;
  isHeaderSticky?: boolean;
  contentFadeAnim?: Animated.Value;
  refreshing?: boolean;
  onRefresh?: () => void;
  onScroll?: (event: any) => void;
}

export default function LiveContent({
  scrollViewRef: externalScrollViewRef,
  scrollY: externalScrollY,
  isHeaderSticky: externalIsHeaderSticky,
  contentFadeAnim: externalContentFadeAnim,
  refreshing: externalRefreshing,
  onRefresh: externalOnRefresh,
  onScroll: externalOnScroll,
}: LiveContentProps) {
  const [refreshing, setRefreshing] = useState(externalRefreshing || false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('All Cuisines');
  const [isHeaderSticky, setIsHeaderSticky] = useState(externalIsHeaderSticky || false);
  const [showLiveModal, setShowLiveModal] = useState(false);
  const scrollViewRef = externalScrollViewRef || useRef<ScrollView>(null);
  const contentFadeAnim = externalContentFadeAnim || useRef(new Animated.Value(0)).current;
  const router = useRouter();

  const handleKitchenPress = (kitchen: LiveKitchen) => {
    console.log('Joining live kitchen:', kitchen.name);
    setShowLiveModal(true);
  };

  const handleCloseLiveModal = () => {
    setShowLiveModal(false);
  };

  // Function to format numbers to K, M format
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
    }
    return num.toString();
  };

  const filteredKitchens = mockLiveKitchens.filter(kitchen => {
    if (activeCategoryFilter === 'All Cuisines') return true;
    return kitchen.cuisine.toLowerCase() === activeCategoryFilter.toLowerCase();
  });

  const handleRefresh = useCallback(async () => {
    if (externalOnRefresh) {
      externalOnRefresh();
    } else {
      setRefreshing(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRefreshing(false);
    }
  }, [externalOnRefresh]);

  const handleScroll = useCallback((event: any) => {
    if (externalOnScroll) {
      externalOnScroll(event);
    } else {
      const y = event.nativeEvent.contentOffset.y;
      setIsHeaderSticky(y > 0);
    }
  }, [externalOnScroll]);

  useEffect(() => {
    Animated.timing(contentFadeAnim, {
      toValue: 1,
      duration: 500,
      delay: 100,
      useNativeDriver: true,
    }).start();
  }, [contentFadeAnim]);

  return (
    <>
      <LinearGradient
        colors={['#f8e6f0', '#faf2e8']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <ScrollView
          ref={scrollViewRef}
          style={{ flex: 1 }}
          showsVerticalScrollIndicator={false}
          bounces={true}
          alwaysBounceVertical={true}
          contentContainerStyle={{ 
            paddingBottom: 100,
            paddingTop: isHeaderSticky ? 0 : 320, // Increased top padding to push content down more
          }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#FF3B30"
              colors={['#FF3B30']}
              progressBackgroundColor="rgba(255, 255, 255, 0.8)"
              progressViewOffset={0}
              title="Pull to refresh"
              titleColor="#FF3B30"
            />
          }
          onScroll={handleScroll}
          scrollEventThrottle={8}
        >
        {/* Main Content with fade animation */}
        <Animated.View style={{ opacity: contentFadeAnim }}>


          {/* Live Kitchens Grid - Two Column Layout */}
          <View style={styles.kitchensContainer}>
            {filteredKitchens.length > 0 ? (
              <View style={styles.kitchensGrid}>
                {filteredKitchens.map((kitchen) => (
                  <TouchableOpacity
                    key={kitchen.id}
                    style={styles.kitchenCard}
                    onPress={() => handleKitchenPress(kitchen)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.imageContainer}>
                      <Image
                        source={{ uri: kitchen.image }}
                        style={styles.kitchenImage}
                        resizeMode="cover"
                      />
                      <View style={styles.liveIndicator}>
                        <View style={styles.liveDot} />
                        <Text style={styles.liveText}>LIVE</Text>
                      </View>
                      <View style={styles.viewersContainer}>
                        <Text style={styles.viewersText}>{formatNumber(kitchen.viewers)} watching</Text>
                      </View>
                    </View>
                    
                    <View style={styles.kitchenInfo}>
                      <Text style={styles.kitchenName}>{kitchen.name}</Text>
                      <Text style={styles.kitchenCuisine}>{kitchen.cuisine}</Text>
                      <Text style={styles.kitchenDescription}>{kitchen.description}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateTitle}>No Live Kitchens</Text>
                <Text style={styles.emptyStateSubtitle}>
                  No kitchens are currently live for {activeCategoryFilter} cuisine
                </Text>
              </View>
            )}
          </View>

          {/* Coming Soon Section */}
          <View style={styles.comingSoonSection}>
            <Text style={styles.comingSoonTitle}>Coming Up Next</Text>
            <View style={styles.comingSoonCard}>
              <Text style={styles.comingSoonText}>
                More live cooking sessions will be available soon!
              </Text>
            </View>
          </View>
          
          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </Animated.View>
      </ScrollView>
      </LinearGradient>

      {/* Live Screen Modal */}
      {showLiveModal && (
        <LiveScreenView onClose={handleCloseLiveModal} />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8e6f0',
  },

  liveHeaderGradient: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  liveHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  liveIconContainer: {
    position: 'relative',
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveIconPulse: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
  },
  liveIconDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FFE5E5',
    shadowColor: '#FF3B30',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  liveHeaderText: {
    alignItems: 'flex-start',
    flex: 1,
    marginLeft: 6,
  },
  liveHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 3,
    letterSpacing: 1.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  liveHeaderSubtitle: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    fontWeight: '500',
  },
  liveStatsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 0,
  },
  statLabel: {
    fontSize: 8,
    color: '#fff',
    opacity: 0.7,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 6,
  },
  kitchensContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  kitchensGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  kitchenCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: '48%', // Two columns with gap
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    height: 200,
  },
  kitchenImage: {
    width: '100%',
    height: '100%',
  },
  liveIndicator: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 4,
  },
  liveText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  viewersContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  viewersText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  kitchenInfo: {
    padding: 16,
  },
  kitchenName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  kitchenCuisine: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  kitchenDescription: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  chefName: {
    fontSize: 12,
    color: '#16a34a',
    fontWeight: '500',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingBottom: 120,
    paddingTop: 40,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  comingSoonSection: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  comingSoonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  comingSoonCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  comingSoonText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  bottomSpacing: {
    height: 280,
  },
}); 