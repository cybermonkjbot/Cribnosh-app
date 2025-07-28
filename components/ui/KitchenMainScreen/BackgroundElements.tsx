import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

export const BackgroundElements: React.FC = () => {
  return (
    <View style={styles.container}>
      {/* Ellipse 3 - Pink */}
      <View style={[styles.ellipse, styles.ellipse3]} />
      
      {/* Ellipse 2 - Purple */}
      <View style={[styles.ellipse, styles.ellipse2]} />
      
      {/* Ellipse 1 - Orange */}
      <View style={[styles.ellipse, styles.ellipse1]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: width * 1.44, // 540px on 375px screen
    height: height,
    left: -width * 0.227, // -85px on 375px screen
    top: 0,
  },
  ellipse: {
    position: 'absolute',
    borderRadius: 1000, // Large value to make it circular
  },
  ellipse1: {
    width: width * 0.533, // 200px on 375px screen
    height: width * 0.533,
    left: width * 0.68, // 255px on 375px screen
    top: 0,
    backgroundColor: '#FF9900',
  },
  ellipse2: {
    width: width * 0.667, // 250px on 375px screen
    height: width * 0.667,
    left: width * 0.085, // 32px on 375px screen
    top: height * 0.234, // 190px on 812px screen
    backgroundColor: '#EA69FF',
  },
  ellipse3: {
    width: width * 0.533, // 200px on 375px screen
    height: width * 0.533,
    left: -width * 0.227, // -85px on 375px screen
    top: 0,
    backgroundColor: '#FC9FBB',
  },
}); 