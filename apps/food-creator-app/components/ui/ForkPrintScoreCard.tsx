import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Mascot } from '../Mascot';

const { width, height } = Dimensions.get('window');

interface ForkPrintScoreCardProps {
  score?: number;
  status?: string;
  pointsToNext?: number;
  nextLevel?: string;
}

export function ForkPrintScoreCard({ 
  score = 799, 
  status = "Tastemaker", 
  pointsToNext = 3, 
  nextLevel = "Food Influencer" 
}: ForkPrintScoreCardProps) {
  return (
    <View style={styles.container}>
      {/* Background */}
      <View style={styles.background} />
      
      {/* Score Label */}
      <Text style={styles.scoreLabel}>Score</Text>
      
      {/* ForkPrint Logo */}
      <View style={styles.forkPrintContainer}>
        <Text style={styles.forkPrintText}>ForkPrint</Text>
      </View>
      
      {/* Score Value */}
      <Text style={styles.scoreValue}>{score}</Text>
      
      {/* Mascot */}
      <View style={styles.mascotContainer}>
        <Mascot emotion="excited" size={120} />
      </View>
      
      {/* Status */}
      <Text style={styles.statusText}>{status}</Text>
      
      {/* Points to next level */}
      <Text style={styles.pointsText}>{pointsToNext} Points to {nextLevel}</Text>
      
      {/* Sparkles/Stars */}
      <Text style={[styles.sparkle, styles.sparkle1]}>✦</Text>
      <Text style={[styles.sparkle, styles.sparkle2]}>✦</Text>
      <Text style={[styles.sparkle, styles.sparkle3]}>✦</Text>
      <Text style={[styles.sparkle, styles.sparkle4]}>✦</Text>
      <Text style={[styles.sparkle, styles.sparkle5]}>✦</Text>
      <Text style={[styles.sparkle, styles.sparkle6]}>✦</Text>
      <Text style={[styles.sparkle, styles.sparkle7]}>✦</Text>
      <Text style={[styles.sparkle, styles.sparkle8]}>✦</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: width * 0.9,
    height: height * 0.3,
    backgroundColor: '#000000',
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  background: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#000000',
  },
  scoreLabel: {
    position: 'absolute',
    left: '27.16%',
    right: '60%',
    top: '25.66%',
    bottom: '63.77%',
    fontFamily: 'Mukta-ExtraBold',
    fontStyle: 'normal',
    fontWeight: '800',
    fontSize: 20,
    lineHeight: 33,
    color: '#FFFFFF',
  },
  forkPrintContainer: {
    position: 'absolute',
    left: '0%',
    right: '56.05%',
    top: '34.72%',
    bottom: '44.15%',
    borderWidth: 4,
    borderColor: '#E6FFE8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forkPrintText: {
    fontFamily: 'Protest Strike',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 40,
    lineHeight: 48,
    color: '#105D38',
  },
  scoreValue: {
    position: 'absolute',
    left: '0.25%',
    right: '69.63%',
    top: '56.98%',
    bottom: '19.25%',
    fontFamily: 'Inter-Bold',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 64,
    lineHeight: 77,
    color: '#FFFFFF',
  },
  mascotContainer: {
    position: 'absolute',
    left: '55.8%',
    right: '17.04%',
    top: '25%',
    bottom: '45%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    position: 'absolute',
    left: '55.8%',
    right: '17.04%',
    top: '71.32%',
    bottom: '18.11%',
    fontFamily: 'Mukta-ExtraBold',
    fontStyle: 'normal',
    fontWeight: '800',
    fontSize: 20,
    lineHeight: 33,
    color: '#FFFFFF',
  },
  pointsText: {
    position: 'absolute',
    left: '51.36%',
    right: '17.04%',
    top: '80.38%',
    bottom: '13.96%',
    fontFamily: 'Inter-Regular',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 12,
    color: '#EAEAEA',
  },
  sparkle: {
    position: 'absolute',
    color: '#FFFFFF',
    fontSize: 12,
    opacity: 0.8,
  },
  sparkle1: {
    top: '15%',
    left: '10%',
  },
  sparkle2: {
    top: '20%',
    left: '15%',
  },
  sparkle3: {
    top: '25%',
    left: '8%',
  },
  sparkle4: {
    top: '30%',
    left: '12%',
  },
  sparkle5: {
    top: '60%',
    right: '15%',
  },
  sparkle6: {
    top: '65%',
    right: '10%',
  },
  sparkle7: {
    top: '70%',
    right: '20%',
  },
  sparkle8: {
    top: '75%',
    right: '12%',
  },
}); 