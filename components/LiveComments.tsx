import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, FlatList, StyleSheet, View } from 'react-native';
import { LiveCommentItem } from './LiveCommentItem';

interface LiveCommentsProps {
  comments: { name: string; comment: string }[];
}

const ITEM_HEIGHT = 44; // Adjust to match LiveCommentItem height
const VISIBLE_ITEMS = 3.5;

const LiveComments: React.FC<LiveCommentsProps> = ({ comments }) => {
  const flatListRef = useRef<FlatList>(null);
  // Removed unused scrollY variable

  useEffect(() => {
    if (comments.length > 0 && flatListRef.current) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [comments]);

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={comments}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => <LiveCommentItem name={item.name} comment={item.comment} />}
        showsVerticalScrollIndicator={false}
        style={styles.list}
        contentContainerStyle={styles.contentContainer}
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        scrollEnabled={false}
      />
      {/* Top fade overlay */}
      <Animated.View pointerEvents="none" style={styles.topFade}>
        <LinearGradient
          colors={["#fff", "#fff0"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      {/* Bottom fade overlay (optional, for symmetry) */}
      {/* <Animated.View pointerEvents="none" style={styles.bottomFade}>
        <LinearGradient
          colors={["#fff0", "#fff"]}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View> */}
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
    height: ITEM_HEIGHT * 1.2,
    zIndex: 10,
  },
  // Optional bottom fade
  // bottomFade: {
  //   position: 'absolute',
  //   bottom: 0,
  //   left: 0,
  //   right: 0,
  //   height: ITEM_HEIGHT * 0.7,
  //   zIndex: 10,
  // },
});

export default LiveComments;
