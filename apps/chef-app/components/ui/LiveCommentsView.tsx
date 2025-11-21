import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, FlatList, StyleSheet, View } from 'react-native';
import { Text } from 'react-native';

interface LiveComment {
  name: string;
  comment: string;
}

interface LiveCommentsViewProps {
  comments: LiveComment[];
}

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 4;

export function LiveCommentsView({ comments }: LiveCommentsViewProps) {
  const flatListRef = useRef<FlatList>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedComments, setDisplayedComments] = useState<LiveComment[]>([]);
  const [slideAnim] = useState(new Animated.Value(0));

  // Auto-scroll effect
  useEffect(() => {
    const interval = setInterval(() => {
      if (comments.length > 0) {
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
    }, 3000);

    return () => clearInterval(interval);
  }, [comments.length, slideAnim]);

  // Update displayed comments when currentIndex changes
  useEffect(() => {
    if (comments.length > 0) {
      const startIndex = currentIndex;
      const endIndex = Math.min(startIndex + VISIBLE_ITEMS, comments.length);
      const newDisplayedComments = comments.slice(startIndex, endIndex);
      
      if (newDisplayedComments.length < VISIBLE_ITEMS) {
        const remainingCount = VISIBLE_ITEMS - newDisplayedComments.length;
        const additionalComments = comments.slice(0, remainingCount);
        setDisplayedComments([...newDisplayedComments, ...additionalComments]);
      } else {
        setDisplayedComments(newDisplayedComments);
      }
    }
  }, [currentIndex, comments]);

  if (comments.length === 0) {
    return null;
  }

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
            <View style={styles.commentItem}>
              <Text style={styles.commentName}>{item.name}</Text>
              <Text style={styles.commentText} numberOfLines={2} ellipsizeMode="tail">
                {item.comment}
              </Text>
            </View>
          </Animated.View>
        )}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={styles.contentContainer}
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        scrollEnabled={false}
      />
      <Animated.View pointerEvents="none" style={styles.topFade}>
        <LinearGradient
          colors={["rgba(0,0,0,0.4)", "rgba(0,0,0,0)"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View pointerEvents="none" style={styles.bottomFade}>
        <LinearGradient
          colors={["rgba(0,0,0,0)", "rgba(0,0,0,0.4)"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

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
  commentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 2,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 20,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  commentName: {
    fontWeight: '600',
    marginRight: 8,
    color: '#E6FFE8',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  commentText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    lineHeight: 18,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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

