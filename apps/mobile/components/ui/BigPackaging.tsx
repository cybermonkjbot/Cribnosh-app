import React from 'react';
import { Image, StyleSheet, View } from 'react-native';

/**
 * BigPackaging - A reusable component to display the big packaging image with transparent background.
 * Usage: <BigPackaging style={optionalStyle} />
 */
export default function BigPackaging({ style }: { style?: object }) {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={require('../../assets/images/cribnoshpackaging.png')}
        style={styles.image}
        resizeMode="contain"
        accessibilityLabel="Big packaging with noodles and chopsticks"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: 16,
  },
  image: {
    width: 220,
    height: 240,
  },
});
