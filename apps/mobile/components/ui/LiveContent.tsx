import { LinearGradient } from "expo-linear-gradient";
import { Eye } from "lucide-react-native";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { Image } from "expo-image";
import {
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import LiveScreenView from "./LiveViewerScreen";

// Customer API imports
import { getConvexClient, getSessionToken } from "@/lib/convexClient";
import { api } from "../../../../packages/convex/_generated/api";
import { LiveStream } from "@/types/customer";

// Global toast imports
import { showError, showInfo } from "../../lib/GlobalToastManager";

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


interface LiveContentProps {
  scrollViewRef?: React.RefObject<any>;
  scrollY?: SharedValue<number>;
  isHeaderSticky?: boolean;
  contentFadeAnim?: SharedValue<number>;
  refreshing?: boolean;
  onRefresh?: () => void;
  onScroll?: (event: any) => void;
  isAuthenticated?: boolean;
}

// Memoized Kitchen Card Component to prevent unnecessary re-renders
const KitchenCard = React.memo(({ 
  kitchen, 
  onPress, 
  formatNumber 
}: { 
  kitchen: LiveKitchen; 
  onPress: (kitchen: LiveKitchen) => void;
  formatNumber: (num: number) => string;
}) => (
  <TouchableOpacity
    style={styles.kitchenCard}
    onPress={() => onPress(kitchen)}
    activeOpacity={0.8}
  >
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: kitchen.image }}
        style={styles.kitchenImage}
        contentFit="cover"
      />
      <View style={styles.liveIndicator}>
        <View style={styles.liveDot} />
        <Text style={styles.liveText}>LIVE</Text>
      </View>
      <View style={styles.viewersContainer}>
        <Eye size={16} color="#fff" style={styles.eyeIcon} />
        <Text style={styles.viewersText}>
          {formatNumber(kitchen.viewers)}
        </Text>
      </View>
    </View>

    <View style={styles.kitchenInfo}>
      <Text style={styles.kitchenName}>{kitchen.name}</Text>
      <Text style={styles.kitchenCuisine}>
        {kitchen.cuisine}
      </Text>
      <Text style={styles.kitchenDescription}>
        {kitchen.description}
      </Text>
    </View>
  </TouchableOpacity>
));

KitchenCard.displayName = 'KitchenCard';

export default function LiveContent({
  scrollViewRef: externalScrollViewRef,
  scrollY: externalScrollY,
  isHeaderSticky: externalIsHeaderSticky,
  contentFadeAnim: externalContentFadeAnim,
  refreshing: externalRefreshing,
  onRefresh: externalOnRefresh,
  onScroll: externalOnScroll,
  isAuthenticated = false,
}: LiveContentProps) {
  const [refreshing, setRefreshing] = useState(externalRefreshing || false);
  const [isHeaderSticky, setIsHeaderSticky] = useState(
    externalIsHeaderSticky || false
  );
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [selectedKitchen, setSelectedKitchen] = useState<LiveKitchen | null>(null);
  const internalScrollViewRef = useRef<any>(null);
  const scrollViewRef = externalScrollViewRef || internalScrollViewRef;
  const internalContentFadeAnim = useRef({ value: 1 });
  const contentFadeAnim =
    externalContentFadeAnim || internalContentFadeAnim.current;

  // Live streams state
  const [liveStreamsData, setLiveStreamsData] = useState<any>(null);
  const [liveStreamsError, setLiveStreamsError] = useState<any>(null);

  // Fetch live streams from Convex
  useEffect(() => {
    const fetchLiveStreams = async () => {
      if (!isAuthenticated) return;

      try {
        setLiveStreamsError(null);
        const convex = getConvexClient();
        const sessionToken = await getSessionToken();

        if (!sessionToken) {
          return;
        }

        const result = await convex.action(api.actions.liveStreaming.customerGetLiveStreams, {
          sessionToken,
          page: 1,
          limit: 20,
        });

        if (result.success === false) {
          setLiveStreamsError(new Error(result.error || 'Failed to fetch live streams'));
          return;
        }

        // Transform to match expected format
        setLiveStreamsData({
          success: true,
          data: result.streams || [],
        });
      } catch (error: any) {
        setLiveStreamsError(error);
        console.error('Error fetching live streams:', error);
      }
    };

    fetchLiveStreams();
  }, [isAuthenticated]);

  // Transform API live streams to component format
  const transformLiveStreamsData = useCallback((apiStreams: LiveStream[]) => {
    return apiStreams.map((stream) => ({
      id: stream.id,
      name: stream.kitchen_name,
      cuisine: "Live Cooking", // Default cuisine since API doesn't provide it
      viewers: stream.viewer_count,
      isLive: stream.is_live,
      image:
        stream.thumbnail_url ||
        "https://images.unsplash.com/photo-1604329760661-e71dc83f8f26?w=400&h=300&fit=crop",
      description: stream.description || "Live cooking session",
      chef: stream.chef_name,
    }));
  }, []);

  // Process live streams data from API
  const liveKitchens = useMemo(() => {
    if (liveStreamsData?.success && liveStreamsData.data && isAuthenticated) {
      const transformedData = transformLiveStreamsData(liveStreamsData.data);
      // Show success toast when live streams are loaded
      if (transformedData.length > 0) {
        showInfo(
          `Found ${transformedData.length} live streams`,
          "Live Content"
        );
      }
      return transformedData;
    }

    // Return empty array when not authenticated or no API results
    return [];
  }, [liveStreamsData, isAuthenticated, transformLiveStreamsData]);

  // Error state is shown in UI - no toast needed

  const handleKitchenPress = useCallback((kitchen: LiveKitchen) => {
    // Pass session ID and kitchen data when opening live viewer
    setSelectedSessionId(kitchen.id);
    setSelectedKitchen(kitchen);
    setShowLiveModal(true);
  }, []);

  const handleCloseLiveModal = useCallback(() => {
    setShowLiveModal(false);
    setSelectedSessionId(null);
    setSelectedKitchen(null);
  }, []);

  // Function to format numbers to K, M format
  const formatNumber = useCallback((num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
  }, []);

  const filteredKitchens = useMemo(() => {
    return liveKitchens.filter((kitchen) => {
      // For now, show all kitchens since we removed the category filter
      return true;
    });
  }, [liveKitchens]);

  const handleRefresh = useCallback(async () => {
    if (externalOnRefresh) {
      externalOnRefresh();
    } else {
      setRefreshing(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setRefreshing(false);
    }
  }, [externalOnRefresh]);

  const handleScroll = useCallback(
    (event: any) => {
      if (externalOnScroll) {
        externalOnScroll(event);
      } else {
        const y = event.nativeEvent.contentOffset.y;
        setIsHeaderSticky(y > 0);
      }
    },
    [externalOnScroll]
  );

  const contentFadeStyle = useAnimatedStyle(() => {
    return {
      opacity: contentFadeAnim.value,
    };
  });

  return (
    <>
      <LinearGradient
        colors={["#f8e6f0", "#faf2e8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.container}
      >
        <Animated.ScrollView
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
              colors={["#FF3B30"]}
              progressBackgroundColor="rgba(255, 255, 255, 0.8)"
              progressViewOffset={0}
              title="Pull to refresh"
              titleColor="#FF3B30"
            />
          }
          onScroll={externalOnScroll || handleScroll}
          scrollEventThrottle={8}
        >
          {/* Main Content with fade animation */}
          <Animated.View style={contentFadeStyle}>
            {/* Live Kitchens Grid - Two Column Layout */}
            <View style={styles.kitchensContainer}>
              {filteredKitchens.length > 0 ? (
                <View style={styles.kitchensGrid}>
                  {filteredKitchens.map((kitchen) => (
                    <KitchenCard
                      key={kitchen.id}
                      kitchen={kitchen}
                      onPress={handleKitchenPress}
                      formatNumber={formatNumber}
                    />
                  ))}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyStateSubtitle}>
                    You&apos;ll be able to order meals right from the stove from here when anyone goes live
                  </Text>
                </View>
              )}
            </View>

            {/* Bottom Spacing */}
            <View style={styles.bottomSpacing} />
          </Animated.View>
        </Animated.ScrollView>
      </LinearGradient>

      {/* Live Screen Modal */}
      {showLiveModal && selectedSessionId && (
        <LiveScreenView 
          sessionId={selectedSessionId} 
          mockKitchenData={selectedKitchen}
          onClose={handleCloseLiveModal} 
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8e6f0",
  },

  liveHeaderGradient: {
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  liveHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  liveIconContainer: {
    position: "relative",
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  liveIconPulse: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.8)",
  },
  liveIconDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#FFE5E5",
    shadowColor: "#FF3B30",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 6,
  },
  liveHeaderText: {
    alignItems: "flex-start",
    flex: 1,
    marginLeft: 6,
  },
  liveHeaderTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 3,
    letterSpacing: 1.5,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  liveHeaderSubtitle: {
    fontSize: 12,
    color: "#fff",
    opacity: 0.9,
    fontWeight: "500",
  },
  liveStatsContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 0,
  },
  statLabel: {
    fontSize: 8,
    color: "#fff",
    opacity: 0.7,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  statDivider: {
    width: 1,
    height: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    marginHorizontal: 6,
  },
  kitchensContainer: {
    paddingHorizontal: 16,
    gap: 16,
  },
  kitchensGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 16,
  },
  kitchenCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    width: "47%", // Slightly reduced width to give more space between cards
    marginBottom: 16,
  },
  imageContainer: {
    position: "relative",
    height: 200,
  },
  kitchenImage: {
    width: "100%",
    height: "100%",
  },
  liveIndicator: {
    position: "absolute",
    top: 12,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FF3B30",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#fff",
    marginRight: 4,
  },
  liveText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  viewersContainer: {
    position: "absolute",
    top: 12,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  viewersText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  eyeIcon: {
    marginRight: 4,
  },
  kitchenInfo: {
    padding: 16,
  },
  kitchenName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  kitchenCuisine: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  kitchenDescription: {
    fontSize: 14,
    color: "#333",
    marginBottom: 8,
  },
  chefName: {
    fontSize: 12,
    color: "#16a34a",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 40,
    paddingBottom: 120,
    paddingTop: 40,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: "#999",
    textAlign: "center",
  },
  bottomSpacing: {
    height: 280,
  },
});
