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
    <View style={{ marginBottom: 16, marginTop: 8, overflow: "visible" }}>
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
}: DynamicSearchContentProps) {
  const router = useRouter();

  const handlePress = useCallback((item: DynamicContent) => {
    if (!item) return;

    if (item.onPress) {
      item.onPress();
    } else if (item.type === "promo" && item.offer) {
      // Handle promo actions
      const offer = item.offer;
      if (offer.action_type === "group_order") {
        router.push("/orders/group/create");
      } else if (offer.action_type === "navigate") {
        router.push(offer.action_target as any);
      }
    } else if (item.type === "feature_spotlight" && onFeatureDiscovery) {
      onFeatureDiscovery();
    }
  }, [onFeatureDiscovery, router]);

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
    
    return (
      <View style={{ width: SCREEN_WIDTH - 32, marginLeft: 0, marginRight: 12, marginTop: item.type === "notice" && item.badgeText ? 24 : 0, position: "relative", overflow: "visible" }}>
        {/* Badge - positioned above the card for notice type */}
        {item.type === "notice" && item.badgeText && (
          <View
            style={{
              position: "absolute",
              top: -24,
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
            <View style={{ position: "relative", minHeight: 100 }}>
              {item.backgroundImageUrl ? (
                <Image
                  source={{ uri: item.backgroundImageUrl }}
                  style={{ width: "100%", minHeight: 100 }}
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

              {/* Main content */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  justifyContent: "center",
                  paddingLeft: 16,
                  paddingRight: 16,
                  paddingVertical: 12,
                }}
              >
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 18,
                    fontWeight: "700",
                    marginBottom: 4,
                    letterSpacing: -0.2,
                  }}
                >
                  {item.title}
                </Text>
                <Text
                  style={{
                    color: "#fff",
                    fontSize: 13,
                    opacity: 0.95,
                    marginBottom: item.callToActionText ? 8 : 0,
                    lineHeight: 18,
                  }}
                >
                  {item.description}
                </Text>
                {item.callToActionText && (
                  <View
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      paddingHorizontal: 14,
                      paddingVertical: 6,
                      borderRadius: 18,
                      alignSelf: "flex-start",
                      marginTop: 4,
                    }}
                  >
                    <Text
                      style={{
                        color: "#fff",
                        fontSize: 12,
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

  return (
    <View style={{ marginBottom: 16 }}>
      <View style={{ position: "relative" }}>
        <TouchableOpacity
          style={{ borderRadius: 16, overflow: "hidden" }}
          onPress={() => handlePress(content)}
          activeOpacity={0.9}
        >
          <View style={{ position: "relative", minHeight: 100 }}>
            {content.backgroundImageUrl ? (
              <Image
                source={{ uri: content.backgroundImageUrl }}
                style={{ width: "100%", minHeight: 100 }}
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

            {/* Main content */}
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                justifyContent: "center",
                paddingHorizontal: 16,
                paddingVertical: 12,
              }}
            >
              {icon && content.type !== "notice" && (
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 8,
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
                  fontSize: 18,
                  fontWeight: "700",
                  marginBottom: 4,
                  letterSpacing: -0.2,
                }}
              >
                {content.title}
              </Text>
              <Text
                style={{
                  color: "#fff",
                  fontSize: 13,
                  opacity: 0.95,
                  marginBottom: content.callToActionText ? 8 : 0,
                  lineHeight: 18,
                }}
              >
                {content.description}
              </Text>
              {content.callToActionText && (
                <View
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.2)",
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: 18,
                    alignSelf: "flex-start",
                    marginTop: 4,
                  }}
                >
                  <Text
                    style={{
                      color: "#fff",
                      fontSize: 12,
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

        {/* Badge - positioned outside for notice type */}
        {content.type === "notice" && content.badgeText && (
          <View
            style={{
              position: "absolute",
              top: -8,
              left: 12,
              backgroundColor: "rgba(255, 255, 255, 0.95)",
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: 12,
              zIndex: 1,
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
      </View>
    </View>
  );
}

