import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface StackedProgressCardsProps {
  caloriesProgress?: number; // 0-100
  noshPointsProgress?: number; // 0-100
  caloriesLabel?: string;
  noshPointsLabel?: string;
}

export const StackedProgressCards: React.FC<StackedProgressCardsProps> = ({
  caloriesProgress = 23,
  noshPointsProgress = 40,
  caloriesLabel = "Saving Progress",
  noshPointsLabel = "Nosh Points"
}) => {
  return (
    <View style={styles.container}>
      {/* Calories Data Card (bottom card) */}
      <View style={styles.caloriesCard}>
        <LinearGradient
          colors={['rgba(12, 168, 93, 0.5)', 'rgba(5, 66, 37, 0.5)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.caloriesGradient}
        >
          <View style={styles.caloriesContent}>
            <Text style={styles.caloriesLabel}>{caloriesLabel}</Text>
            
            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${caloriesProgress}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        </LinearGradient>
      </View>

      {/* Nosh Points Card (top card) */}
      <View style={styles.noshPointsCard}>
        <View style={styles.noshPointsBackground}>
          <View style={styles.noshPointsContent}>
            <View style={{ 
              flexDirection: 'row', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: 16, 
              paddingHorizontal: 16 
            }}>
              <Text style={styles.noshPointsLabel}>{noshPointsLabel}</Text>
              <View style={styles.arrowIcon}>
                <View style={styles.arrowLine1} />
                <View style={styles.arrowLine2} />
              </View>
            </View>
            
            {/* Progress bar */}
            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill, 
                    { width: `${noshPointsProgress}%` }
                  ]} 
                />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: 342,
    height: 150,
    left: 13,
    top: 267,
  },
  
  // Calories Data Card (bottom)
  caloriesCard: {
    position: 'absolute',
    width: 333,
    height: 92,
    left: 7,
    top: 0,
    borderRadius: 14,
    overflow: 'hidden',
  },
  caloriesGradient: {
    flex: 1,
    padding: 10,
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingLeft: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  caloriesContent: {
    width: 271,
    height: 32,
    alignItems: 'center',
  },
  caloriesLabel: {
    position: 'absolute',
    width: 89,
    height: 25,
    left: 0.17,
    top: -0.22,
    fontFamily: 'Mukta-ExtraBold',
    fontSize: 15,
    lineHeight: 25,
    color: '#E6FFE8',
  },
  
  // Nosh Points Card (top)
  noshPointsCard: {
    position: 'absolute',
    width: 342,
    height: 110,
    left: 0,
    top: 40,
    borderRadius: 14,
    overflow: 'hidden',
  },
  noshPointsBackground: {
    flex: 1,
    backgroundColor: 'rgba(9, 67, 39, 0.3)',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 55,
    elevation: 8,
    padding: 10,
    paddingHorizontal: 16,
    paddingBottom: 15,
    paddingLeft: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noshPointsContent: {
    width: 280.79,
    height: 25,
    position: 'relative',
  },
  noshPointsHeader: {
    position: 'absolute',
    width: 214,
    height: 32,
    left: 23,
    top: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 2,
  },
  noshPointsLabel: {
    width: 80,
    height: 25,
    left: 18,
    top: 5,
    fontFamily: 'Mukta-ExtraBold',
    fontSize: 15,
    lineHeight: 25,
    color: '#E6FFE8',
  },
  arrowIcon: {
    position: 'absolute',
    width: 20.95,
    height: 22,
    left: 271,
    top: 15.44,
    transform: [{ rotate: '-135deg' }],
    zIndex: 1,
  },
  arrowLine1: {
    position: 'absolute',
    width: 2,
    height: 15,
    backgroundColor: '#E6FFE8',
    top: 0,
    left: 9,
  },
  arrowLine2: {
    position: 'absolute',
    width: 2,
    height: 15,
    backgroundColor: '#E6FFE8',
    top: 0,
    left: 9,
    transform: [{ rotate: '90deg' }],
  },
  
  // Progress Bar Styles
  progressBarContainer: {
    position: 'absolute',
    width: 280.79,
    height: 25,
    left: 24.6,
    top: 56,
    zIndex: 0,
  },
  progressBarBackground: {
    width: '100%',
    height: 25,
    backgroundColor: '#000000',
    borderRadius: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 25,
    backgroundColor: '#EBA10F',
    borderRadius: 10,
  },
});

export default StackedProgressCards; 