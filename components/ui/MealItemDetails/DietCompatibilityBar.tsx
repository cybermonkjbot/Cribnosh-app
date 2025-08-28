import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, Text, View } from 'react-native';

interface DietCompatibilityBarProps {
  compatibility: number; // percentage
}

export function DietCompatibilityBar({ compatibility }: DietCompatibilityBarProps) {
  return (
    <View style={styles.container}>
      {/* Nosh Sentiment Bar Label */}
      <Text style={styles.sentimentBarLabel}>Nosh Sentiment Bar</Text>
      
      {/* Progress Bar Container */}
      <View style={styles.progressBarContainer}>
        {/* Progress Bar Track */}
        <View style={styles.progressBarTrack}>
          {/* Filled Progress Bar with Gradient */}
          <LinearGradient
            colors={['#105D38', '#FF0E00']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[
              styles.progressBarFilled,
              { width: `${compatibility}%` }
            ]}
          />
          
          {/* Triangular Indicator */}
          <View 
            style={[
              styles.progressIndicator,
              { left: `${compatibility}%` }
            ]} 
          />
        </View>
        
        {/* Percentage Display */}
        <Text style={styles.percentageText}>{compatibility}%</Text>
        
        {/* Fire Icon */}
        <View style={styles.fireIconContainer}>
          <Ionicons name="flame" size={20} color="#FF6B35" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginBottom: 25,
  },
  
  // Nosh Sentiment Bar Label
  sentimentBarLabel: {
    fontFamily: 'SF Pro',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    color: '#094327',
    marginBottom: 15,
  },
  
  // Progress Bar Container
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
  },
  
  // Progress Bar Track
  progressBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(120, 120, 128, 0.16)',
    borderRadius: 2,
    position: 'relative',
    marginRight: 15,
  },
  
  // Filled Progress Bar
  progressBarFilled: {
    height: 4,
    borderRadius: 2,
    position: 'absolute',
    left: 0,
    top: 0,
  },
  
  // Triangular Progress Indicator
  progressIndicator: {
    position: 'absolute',
    width: 0,
    height: 0,
    top: -6,
    marginLeft: -4,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#000000',
  },
  
  // Percentage Text
  percentageText: {
    fontFamily: 'SF Pro',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 20,
    color: '#000000',
    marginRight: 10,
    minWidth: 35,
  },
  
  // Fire Icon Container
  fireIconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Fire Icon
  fireIcon: {
    fontSize: 20,
  },
}); 