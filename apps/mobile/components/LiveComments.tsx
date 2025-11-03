import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, StyleSheet, View } from 'react-native';
import { LiveCommentItem } from './LiveCommentItem';

interface LiveCommentsProps {
  comments: { name: string; comment: string }[];
}

const ITEM_HEIGHT = 44; // Adjust to match LiveCommentItem height
const VISIBLE_ITEMS = 4; // Show more items for better TikTok-like feel

const LiveComments: React.FC<LiveCommentsProps> = ({ comments }) => {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedComments, setDisplayedComments] = useState<{ name: string; comment: string }[]>([]);
  const [slideAnim] = useState(new Animated.Value(0));

  // Auto-scroll effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (comments.length > 0) {
        // Trigger slide-up animation
        slideAnim.setValue(ITEM_HEIGHT * 0.3);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();

        setCurrentIndex((prevIndex) => {
          const newIndex = (prevIndex + 1) % comments.length;
          return newIndex;
        });
      }
    }, 3000); // Scroll every 3 seconds

    return () => clearInterval(interval);
  }, [comments.length, slideAnim]);

  // Update displayed comments when currentIndex changes
  useEffect(() => {
    if (comments.length > 0) {
      const startIndex = currentIndex;
      const endIndex = Math.min(startIndex + VISIBLE_ITEMS, comments.length);
      const newDisplayedComments = comments.slice(startIndex, endIndex);
      
      // If we don't have enough comments to fill the view, add from the beginning
      if (newDisplayedComments.length < VISIBLE_ITEMS) {
        const remainingCount = VISIBLE_ITEMS - newDisplayedComments.length;
        const additionalComments = comments.slice(0, remainingCount);
        setDisplayedComments([...newDisplayedComments, ...additionalComments]);
      } else {
        setDisplayedComments(newDisplayedComments);
      }
    }
  }, [currentIndex, comments]);

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={displayedComments}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <Animated.View
            style={{
              transform: [
                {
                  translateY: slideAnim.interpolate({
                    inputRange: [0, ITEM_HEIGHT * 0.3],
                    outputRange: [0, -ITEM_HEIGHT * 0.2 * (VISIBLE_ITEMS - index)],
                  }),
                },
              ],
              opacity: slideAnim.interpolate({
                inputRange: [0, ITEM_HEIGHT * 0.3],
                outputRange: [1, 0.8],
              }),
            }}
          >
            <LiveCommentItem name={item.name} comment={item.comment} />
          </Animated.View>
        )}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={styles.contentContainer}
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        scrollEnabled={false}
      />
      {/* Top fade overlay for smooth transition */}
      <Animated.View pointerEvents="none" style={styles.topFade}>
        <LinearGradient
          colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0)"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Bottom fade overlay for smooth transition */}
      <Animated.View pointerEvents="none" style={styles.bottomFade}>
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.4)"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  list: {
    flex: 1,
  },
  contentContainer: {
    justifyContent: 'flex-end',
    paddingBottom: 0,
  },
  topFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.5,
    zIndex: 10,
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: ITEM_HEIGHT * 1.5,
    zIndex: 10,
  },
});

export default LiveComments;
