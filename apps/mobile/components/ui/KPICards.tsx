import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface KPICardsProps {
  // Food app specific props
  mealsLogged?: string;
  caloriesTracked?: string;
  streakDays?: string;
}

// Memoize the component to prevent unnecessary re-renders
const MemoizedKPICards: React.FC<KPICardsProps> = React.memo(({
  mealsLogged,
  caloriesTracked,
  streakDays,
}) => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.sectionTitle}>Monthly Overview</Text>
          <Text style={styles.sectionSubtitle}>Your food journey this month</Text>
        </View>
      </View>

      {/* Food Stats Cards Section */}
      <View style={styles.accountCardsContainer}>
        {/* First Row: Meals and Calories */}
        <View style={styles.firstRow}>
          {/* Meals Logged Card */}
          <BlurView intensity={27.5} style={styles.accountCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Meals Logged</Text>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardValue}>{mealsLogged ?? "0"}</Text>
            </View>
            <Text style={styles.cardSubtext}>Total this month</Text>
          </BlurView>

          {/* Calories Tracked Card */}
          <BlurView intensity={27.5} style={styles.caloriesCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Calories Tracked</Text>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardValue}>{caloriesTracked ?? "0"}</Text>
            </View>
            <Text style={styles.cardSubtext}>Total this month</Text>
          </BlurView>
        </View>

        {/* Second Row: Streak Days Card */}
        <View style={styles.secondRow}>
          <TouchableOpacity style={styles.streakCardWrapper}>
            <BlurView intensity={27.5} style={styles.streakCard}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardLabel}>Day Streak</Text>
              </View>
              <View style={styles.cardFooter}>
                <Text style={styles.cardValue}>{streakDays ?? "0"}</Text>
              </View>
              <Text style={styles.cardSubtext}>Current streak</Text>
            </BlurView>
          </TouchableOpacity>
        </View>
      </View>




    </View>
  );
});

MemoizedKPICards.displayName = 'KPICards';

// Export the memoized component
export const KPICards = MemoizedKPICards;

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: 8,
    paddingTop: 16,
  },
  
  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    alignItems: 'flex-start',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 6,
    letterSpacing: -0.5,
    fontFamily: 'Mukta',
  },
  sectionSubtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: 0.1,
    fontFamily: 'Mukta',
  },
  
  // Food Stats Cards
  accountCardsContainer: {
    marginBottom: 28,
  },
  firstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  secondRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  streakCardWrapper: {
    width: '100%',
    alignItems: 'center',
  },
  accountCard: {
    flex: 1,
    maxWidth: 160,
    height: 72,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
    marginRight: 8,
  },
  caloriesCard: {
    flex: 1,
    maxWidth: 160,
    height: 72,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  streakCard: {
    width: '100%',
    height: 72,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 18,
    padding: 12,
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 28,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    overflow: 'hidden',
  },
  cardHeader: {
    alignItems: 'flex-start',
  },
  cardFooter: {
    alignItems: 'flex-start',
    marginTop: 4,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
    fontFamily: 'Mukta',
  },
  cardValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: -0.5,
    textAlign: 'left',
    fontFamily: 'Mukta',
  },
  cardSubtext: {
    fontSize: 9,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'left',
    fontWeight: '500',
    letterSpacing: 0.2,
    fontFamily: 'Mukta',
  },








}); 