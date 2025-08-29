import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface KPICardsProps {
  // Food app specific props
  mealsLogged?: string;
  caloriesTracked?: string;
  streakDays?: string;
}

export const KPICards: React.FC<KPICardsProps> = ({
  mealsLogged = "24",
  caloriesTracked = "2,847",
  streakDays = "7",
}) => {
  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <View style={styles.headerLeft}>
          <Text style={styles.sectionTitle}>Monthly Overview</Text>
          <Text style={styles.sectionSubtitle}>Your food journey this month</Text>
        </View>
        <TouchableOpacity style={styles.headerButton}>
          <Text style={styles.headerButtonText}>View All</Text>
          <Text style={styles.headerButtonIcon}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Food Stats Cards Section */}
      <View style={styles.accountCardsContainer}>
        {/* Meals Logged Card */}
        <BlurView intensity={27.5} style={styles.accountCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Meals</Text>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardValue}>{mealsLogged}</Text>
          </View>
          <Text style={styles.cardSubtext}>This Month</Text>
        </BlurView>

        {/* Calories Tracked Card */}
        <BlurView intensity={27.5} style={styles.caloriesCard}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardLabel}>Calories</Text>
          </View>
          <View style={styles.cardFooter}>
            <Text style={styles.cardValue}>{caloriesTracked}</Text>
          </View>
          <Text style={styles.cardSubtext}>This Month</Text>
        </BlurView>

        {/* Streak Days Card */}
        <TouchableOpacity>
          <BlurView intensity={27.5} style={styles.streakCard}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardLabel}>Streak</Text>
            </View>
            <View style={styles.cardFooter}>
              <Text style={styles.cardValue}>{streakDays}</Text>
            </View>
            <Text style={styles.cardSubtext}>Current</Text>
          </BlurView>
        </TouchableOpacity>
      </View>




    </View>
  );
};

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
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  headerButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.2,
    fontFamily: 'Mukta',
  },
  headerButtonIcon: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 6,
    fontFamily: 'Mukta',
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 28,
  },
  accountCard: {
    width: 108,
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
  },
  caloriesCard: {
    width: 108,
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
    width: 108,
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

export default KPICards; 