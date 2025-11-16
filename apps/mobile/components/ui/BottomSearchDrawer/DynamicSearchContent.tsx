import { SpecialOffer } from "@/types/customer";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Info, Sparkles } from "lucide-react-native";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Dimensions, FlatList, Text, TouchableOpacity, View } from "react-native";

export type DynamicContentType = "promo" | "notice" | "feature_spotlight";

export interface DynamicContent {
  type: DynamicContentType;
  id: string;
  title: string;
  description: string;
  callToActionText?: string;
  badgeText?: string;
  backgroundColor?: string;
  backgroundImageUrl?: string;
  onPress?: () => void;
  offer?: SpecialOffer;
}

interface DynamicSearchContentProps {
  content: DynamicContent | null;
  notices?: DynamicContent[];
  onFeatureDiscovery?: () => void;
  onFilterCardPress?: (filterId: string) => void;
  onNoticePress?: (noticeId: string, noticeType: string) => void;
  onInviteFriend?: () => void;
  onSetupFamily?: () => void;
  onGroupOrder?: () => void;
  onNoshHeaven?: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface NoticesCarouselProps {
  notices: DynamicContent[];
  renderNoticeItem: (item: DynamicContent) => React.ReactNode;
}

function NoticesCarousel({ notices, renderNoticeItem }: NoticesCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const autoScrollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isUserScrollingRef = useRef(false);
  const pauseAutoScrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const itemWidth = SCREEN_WIDTH - 32;

  // Start auto-scroll
  const startAutoScroll = useCallback(() => {
    if (notices.length <= 1) return;
    
    if (autoScrollTimerRef.current) {
      clearInterval(autoScrollTimerRef.current);
    }

    autoScrollTimerRef.current = setInterval(() => {
      if (!isUserScrollingRef.current) {
        setCurrentIndex((prevIndex) => {
          const nextIndex = (prevIndex + 1) % notices.length;
          flatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          return nextIndex;
        });
      }
    }, 4000); // Auto-scroll every 4 seconds
  }, [notices.length]);

  // Pause auto-scroll when user interacts
  const pauseAutoScroll = useCallback(() => {
    isUserScrollingRef.current = true;
    
    if (pauseAutoScrollTimeoutRef.current) {
      clearTimeout(pauseAutoScrollTimeoutRef.current);
    }
    
    // Resume auto-scroll after 6 seconds of no interaction
    pauseAutoScrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
      startAutoScroll();
    }, 6000);
  }, [startAutoScroll]);

  // Auto-scroll carousel
  useEffect(() => {
    startAutoScroll();

    return () => {
      if (autoScrollTimerRef.current) {
        clearInterval(autoScrollTimerRef.current);
      }
      if (pauseAutoScrollTimeoutRef.current) {
        clearTimeout(pauseAutoScrollTimeoutRef.current);
      }
    };
  }, [startAutoScroll]);

  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
      }
    },
    []
  );

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: itemWidth + 12, // item width + right margin
      offset: (itemWidth + 12) * index,
      index,
    }),
    [itemWidth]
  );

  const keyExtractor = useCallback((item: DynamicContent) => item.id, []);

  return (
    <View style={{ marginBottom: 16, marginTop: 8, overflow: "visible", paddingTop: 8 }}>
      <FlatList
        ref={flatListRef}
        data={notices}
        renderItem={({ item }) => renderNoticeItem(item) as React.ReactElement}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={itemWidth + 12}
        snapToAlignment="center"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        onScrollBeginDrag={pauseAutoScroll}
        onMomentumScrollEnd={() => {
          // Resume auto-scroll after user finishes scrolling
          if (pauseAutoScrollTimeoutRef.current) {
            clearTimeout(pauseAutoScrollTimeoutRef.current);
          }
          pauseAutoScrollTimeoutRef.current = setTimeout(() => {
            isUserScrollingRef.current = false;
            startAutoScroll();
          }, 2000);
        }}
        contentContainerStyle={{
          paddingLeft: 16,
          paddingRight: 8,
          paddingTop: 8,
          paddingBottom: 8,
        }}
        onScrollToIndexFailed={(info) => {
          // Fallback if scroll fails
          const wait = new Promise((resolve) => setTimeout(resolve, 500));
          wait.then(() => {
            flatListRef.current?.scrollToIndex({ index: info.index, animated: false });
          });
        }}
      />
      
      {/* Pagination dots */}
      {notices.length > 1 && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "center",
            alignItems: "center",
            marginTop: 12,
            gap: 6,
          }}
        >
          {notices.map((_, index) => (
            <View
              key={index}
              style={{
                width: currentIndex === index ? 24 : 8,
                height: 8,
                borderRadius: 4,
                backgroundColor: currentIndex === index ? "#ef4444" : "#d1d5db",
              }}
            />
          ))}
        </View>
      )}
    </View>
  );
}

export function DynamicSearchContent({
  content,
  notices,
  onFeatureDiscovery,
  onFilterCardPress,
  onNoticePress,
  onInviteFriend,
  onSetupFamily,
  onGroupOrder,
  onNoshHeaven,
}: DynamicSearchContentProps) {
  const router = useRouter();

  const handlePress = useCallback((item: DynamicContent) => {
    if (!item) return;

    // Priority 1: Custom onPress handler (highest priority)
    if (item.onPress) {
      item.onPress();
      return;
    }

    // Priority 2: Handle promo cards
    if (item.type === "promo" && item.offer) {
      const offer = item.offer;
      if (offer.action_type === "group_order") {
        if (onGroupOrder) {
          onGroupOrder();
        } else {
          router.push("/orders/group/create");
        }
      } else if (offer.action_type === "navigate") {
        router.push(offer.action_target as any);
      }
      return;
    }

    // Priority 3: Handle feature spotlight cards
    if (item.type === "feature_spotlight") {
      // Check if it's a filter-specific card
      if (item.id.startsWith("filter-")) {
        const filterId = item.id.replace("filter-", "");
        if (onFilterCardPress) {
          onFilterCardPress(filterId);
        }
        return;
      }

      // Check if it's a feature discovery card
      if (item.id.startsWith("feature-spotlight-")) {
        const featureIds = item.id.replace("feature-spotlight-", "").split("-");
        
        // Navigate to the first discovered feature or scroll to features section
        if (featureIds.includes("inviteFriend") && onInviteFriend) {
          onInviteFriend();
        } else if (featureIds.includes("setupFamily") && onSetupFamily) {
          onSetupFamily();
        } else if (featureIds.includes("groupOrder") && onGroupOrder) {
          onGroupOrder();
        } else if (featureIds.includes("noshHeaven") && onNoshHeaven) {
          onNoshHeaven();
        } else if (onFeatureDiscovery) {
          // Fallback: scroll to discovered features section
          onFeatureDiscovery();
        }
        return;
      }

      // Generic feature spotlight
      if (onFeatureDiscovery) {
        onFeatureDiscovery();
      }
      return;
    }

    // Priority 4: Handle notice cards
    if (item.type === "notice") {
      if (onNoticePress) {
        onNoticePress(item.id, item.type);
      }
      // Notices can be informational, so no action is also acceptable
      return;
    }
  }, [
    onFeatureDiscovery,
    onFilterCardPress,
    onNoticePress,
    onInviteFriend,
    onSetupFamily,
    onGroupOrder,
    onNoshHeaven,
    router,
  ]);

  const hexToRgba = useCallback((hex: string, alpha: number = 0.85) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }, []);

  const getGradientColors = useCallback((bgColor?: string): [string, string] => {
    if (!bgColor) return ["rgba(239, 68, 68, 0.85)", "rgba(239, 68, 68, 0.95)"];
    return [
      hexToRgba(bgColor, 0.85),
      hexToRgba(bgColor, 0.95),
    ];
  }, [hexToRgba]);

  const icon = useMemo(() => {
    switch (content?.type) {
      case "promo":
        return <Sparkles size={20} color="#fff" />;
      case "notice":
        return <Info size={20} color="#fff" />;
      case "feature_spotlight":
        return <Sparkles size={20} color="#fff" />;
      default:
        return null;
    }
  }, [content?.type]);

  // Render a single notice item
  const renderNoticeItem = useCallback((item: DynamicContent): React.ReactElement => {
    const gradientColors = getGradientColors(item.backgroundColor);
    const hasBadge = item.type === "notice" && item.badgeText;
    const badgeHeight = 32; // Height of badge including spacing
    
    return (
      <View style={{ 
        width: SCREEN_WIDTH - 32, 
        marginLeft: 0, 
        marginRight: 12, 
        marginTop: hasBadge ? badgeHeight : 0, 
        marginBottom: hasBadge ? 8 : 0,
        position: "relative", 
        overflow: "visible" 
      }}>
        {/* Badge - positioned above the card for notice type */}
        {hasBadge && (
          <View
            style={{
              position: "absolute",
              top: -badgeHeight + 8,
              left: 0,
              zIndex: 10,
              transform: [{ rotate: "-5deg" }],
            }}
          >
            <View
              style={{
                backgroundColor: item.backgroundColor || "#ef4444",
                paddingHorizontal: 10,
                paddingVertical: 4,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: "#fff",
                  fontSize: 10,
                  fontWeight: "700",
                  textTransform: "uppercase",
                }}
              >
                {item.badgeText}
              </Text>
            </View>
          </View>
        )}
        
        <View style={{ position: "relative" }}>
          <TouchableOpacity
            style={{ borderRadius: 16, overflow: "hidden" }}
            onPress={() => handlePress(item)}
            activeOpacity={0.9}
          >
            <View style={{ position: "relative" }}>
              {/* Background image - positioned absolutely to fill container */}
              {item.backgroundImageUrl ? (
                <Image
                  source={{ uri: item.backgroundImageUrl }}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    width: "100%",
                    height: "100%",
                  }}
                  contentFit="cover"
                />
              ) : null}

              {/* Gradient overlay for better text readability */}
              <LinearGradient
                colors={gradientColors}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
              />

              {/* Main content - using flexbox for natural height expansion */}
              <View
                style={{
                  flexDirection: "column",
                  paddingHorizontal: 14,
                  paddingTop: 12,
                  paddingBottom: 14, // Sufficient padding to ensure button visibility
                  minHeight: 90, // Compact minimum height
                }}
              >
                {/* Icon for promo type */}
                {item.type === "promo" && (
                  <View style={{ marginBottom: 4 }}>
                    <Sparkles size={16} color="#fff" />
                  </View>
                )}
                
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 15,
                    fontWeight: "700",
                    marginBottom: 2,
                    letterSpacing: -0.2,
                  }}
                  numberOfLines={2}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 11,
                    opacity: 0.95,
                    marginBottom: item.callToActionText ? 8 : 0,
                    lineHeight: 14,
                  }}
                  numberOfLines={2}
                >
                  {item.description}
                </Text>
                {item.callToActionText && (
                  <View
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      paddingHorizontal: 10,
                      paddingVertical: 5,
                      borderRadius: 14,
                      alignSelf: "flex-start",
                      marginTop: 2,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 10,
                        fontWeight: "600",
                      }}
                    >
                      {item.callToActionText}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );
  }, [getGradientColors, handlePress]);

  // If notices array is provided, render carousel notices
  if (notices && notices.length > 0) {
    return <NoticesCarousel notices={notices} renderNoticeItem={renderNoticeItem} />;
  }

  // Fallback to single content rendering
  if (!content) return null;

  const gradientColors = getGradientColors(content.backgroundColor);
  const hasBadge = content.type === "notice" && content.badgeText;
  const badgeHeight = 32;

  return (
    <View style={{ 
      marginBottom: 16, 
      marginTop: hasBadge ? badgeHeight : 0,
      overflow: "visible" 
    }}>
      <View style={{ position: "relative", overflow: "visible" }}>
        {/* Badge - positioned outside for notice type */}
        {hasBadge && (
          <View
            style={{
              position: "absolute",
              top: -badgeHeight + 8,
              left: 12,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              zIndex: 10,
            }}
          >
            <Text
              style={{
                color: content.backgroundColor || "#ef4444",
                fontSize: 10,
                fontWeight: "700",
                textTransform: "uppercase",
              }}
            >
              {content.badgeText}
            </Text>
          </View>
        )}
        
        <TouchableOpacity
          style={{ borderRadius: 16, overflow: "hidden" }}
          onPress={() => handlePress(content)}
          activeOpacity={0.9}
        >
          <View style={{ position: "relative" }}>
            {/* Background image - positioned absolutely to fill container */}
            {content.backgroundImageUrl ? (
              <Image
                source={{ uri: content.backgroundImageUrl }}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  width: "100%",
                  height: "100%",
                }}
                contentFit="cover"
              />
            ) : null}

            {/* Gradient overlay for better text readability */}
            <LinearGradient
              colors={gradientColors}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />

            {/* Main content - using flexbox for natural height expansion */}
            <View
              style={{
                flexDirection: "column",
                paddingHorizontal: 14,
                paddingTop: 12,
                paddingBottom: 14, // Sufficient padding to ensure button visibility
                minHeight: 90, // Compact minimum height
              }}
            >
              {icon && content.type !== "notice" && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  {icon}
                  {content.badgeText && (
                    <View
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.3)",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        marginLeft: 8,
                      }}
                    >
                      <Text
                        style={{
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: "700",
                          textTransform: "uppercase",
                        }}
                      >
                        {content.badgeText}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              <Text
                style={{
                  color: "#fff",
                  fontSize: 15,
                  fontWeight: "700",
                  marginBottom: 2,
                  letterSpacing: -0.2,
                }}
                numberOfLines={2}
              >
                {content.title}
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 11,
                  opacity: 0.95,
                  marginBottom: content.callToActionText ? 8 : 0,
                  lineHeight: 14,
                }}
                numberOfLines={2}
              >
                {content.description}
              </Text>
              {content.callToActionText && (
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 14,
                    alignSelf: "flex-start",
                    marginTop: 2,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 10,
                      fontWeight: "600",
                    }}
                  >
                    {content.callToActionText}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

