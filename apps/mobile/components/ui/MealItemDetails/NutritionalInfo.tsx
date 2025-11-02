import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Image } from 'expo-image';

interface NutritionalInfoProps {
  calories: number;
  fat: string;
  protein: string;
  carbs: string;
  dietMessage: string;
}

export function NutritionalInfo({ 
  calories, 
  fat, 
  protein, 
  carbs, 
  dietMessage 
}: NutritionalInfoProps) {
  return (
    <View style={styles.container}>
      {/* Main Heading */}
      <Text style={styles.mainHeading}>Your Diet, Considered</Text>
      
      {/* Subtitle */}
      <Text style={styles.subtitle}>
        This meal would add the following numbers to your diet automatically !
      </Text>
      
      {/* Calories and Macros Section */}
      <View style={styles.nutritionSection}>
        {/* Left Side - Calories */}
        <View style={styles.caloriesSection}>
          <View style={styles.caloriesContainer}>
            <View style={styles.caloriesIcon}>
              <Ionicons name="flame" size={8.17} color="#FF6B35" />
            </View>
            <Text style={styles.caloriesLabel}>Calories</Text>
            <Text style={styles.caloriesValue}>{calories.toLocaleString()}</Text>
          </View>
        </View>
        
        {/* Right Side - Macronutrients with Circular Progress Rings */}
        <View style={styles.macrosSection}>
          {/* Fat Circle */}
          <View style={styles.macroItem}>
            <View style={styles.circleContainer}>
              {/* Background Circle */}
              <View style={styles.circleBackground} />
              {/* Progress Circle - Fat (30% filled) */}
              <View style={[styles.circleProgress, styles.fatProgress]} />
              {/* Text inside circle */}
              <View style={styles.circleTextContainer}>
                <Text style={styles.macroValue}>{fat}</Text>
                <Text style={styles.macroLabel}>Fat</Text>
              </View>
            </View>
          </View>
          
          {/* Protein Circle */}
          <View style={styles.macroItem}>
            <View style={styles.circleContainer}>
              {/* Background Circle */}
              <View style={styles.circleBackground} />
              {/* Progress Circle - Protein (70% filled) */}
              <View style={[styles.circleProgress, styles.proteinProgress]} />
              {/* Text inside circle */}
              <View style={styles.circleTextContainer}>
                <Text style={styles.macroValue}>{protein}</Text>
                <Text style={styles.macroLabel}>Pro</Text>
              </View>
            </View>
          </View>
          
          {/* Carbs Circle */}
          <View style={styles.macroItem}>
            <View style={styles.circleContainer}>
              {/* Background Circle */}
              <View style={styles.circleBackground} />
              {/* Progress Circle - Carbs (60% filled) */}
              <View style={[styles.circleProgress, styles.carbsProgress]} />
              {/* Text inside circle */}
              <View style={styles.circleTextContainer}>
                <Text style={styles.macroValue}>{carbs}</Text>
                <Text style={styles.macroLabel}>Carb</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      
      {/* Diet Message */}
      <View style={styles.dietMessageContainer}>
        <View style={styles.avatarContainer}>
          <Image 
            source={require('@/assets/images/livelogo.png')} 
            style={styles.avatar}
            resizeMode="cover"
          />
        </View>
        <View style={styles.messageBubble}>
          <Ionicons name="sparkles" size={12} color="#FFD700" style={styles.messageIcon} />
          <Text style={styles.dietMessage}>{dietMessage}</Text>
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
  
  // Main Heading
  mainHeading: {
    fontFamily: 'SF Pro',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#094327',
    marginBottom: 8,
  },
  
  // Subtitle
  subtitle: {
    fontFamily: 'SF Pro',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 22,
    color: '#000000',
    marginBottom: 20,
  },
  
  // Nutrition Section
  nutritionSection: {
    flexDirection: 'row',
    marginBottom: 15,
    alignItems: 'center',
  },
  
  // Calories Section
  caloriesSection: {
    marginRight: 15,
  },
  
  // Calories Container
  caloriesContainer: {
    position: 'relative',
    width: 80,
    height: 45,
  },
  
  // Calories Icon
  caloriesIcon: {
    position: 'absolute',
    width: 12,
    height: 12,
    left: 0,
    top: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Calories Label
  caloriesLabel: {
    position: 'absolute',
    width: 50,
    height: 15,
    left: 15,
    top: 0,
    fontFamily: 'SF Pro Rounded',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 15,
    color: '#6D6D6D',
  },
  
  // Calories Value
  caloriesValue: {
    position: 'absolute',
    width: 70,
    height: 30,
    left: 15,
    top: 15,
    fontFamily: 'ADLaM Display',
    fontWeight: '400',
    fontSize: 24,
    lineHeight: 30,
    color: '#000000',
  },
  
  // Macros Section
  macrosSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  
  // Macro Item
  macroItem: {
    alignItems: 'center',
  },
  
  // Circle Container
  circleContainer: {
    width: 50,
    height: 50,
    position: 'relative',
    marginBottom: 6,
  },
  
  // Background Circle (unfilled ring)
  circleBackground: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 6,
    borderColor: '#F3F3F3',
  },
  
  // Progress Circle (filled portion)
  circleProgress: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 6,
  },
  
  // Fat Progress (30% filled - yellow)
  fatProgress: {
    borderColor: '#FEC635',
    transform: [{ rotate: '-125.71deg' }],
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  
  // Protein Progress (70% filled - blue)
  proteinProgress: {
    borderColor: '#3585FE',
    transform: [{ rotate: '-125.71deg' }],
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  
  // Carbs Progress (60% filled - purple)
  carbsProgress: {
    borderColor: '#7876F5',
    transform: [{ rotate: '-125.71deg' }],
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  
  // Text Container inside circle
  circleTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Macro Value (number)
  macroValue: {
    fontFamily: 'SF Pro',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 14,
    textAlign: 'center',
    color: '#000000',
    marginBottom: 2,
  },
  
  // Macro Label (text)
  macroLabel: {
    fontFamily: 'SF Pro',
    fontWeight: '400',
    fontSize: 10,
    lineHeight: 12,
    textAlign: 'center',
    color: '#6D6D6D',
  },
  
  // Diet Message Container
  dietMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  // Avatar Container
  avatarContainer: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#C4C4C4',
    marginRight: 8,
  },
  
  // Avatar
  avatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#8E8E93',
  },
  
  // Message Bubble
  messageBubble: {
    flex: 1,
    backgroundColor: '#F3F3F3',
    borderRadius: 15,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  
  // Message Icon
  messageIcon: {
    marginRight: 6,
  },
  
  // Diet Message
  dietMessage: {
    fontFamily: 'SF Pro',
    fontWeight: '400',
    fontSize: 14,
    color: '#000000',
    flex: 1,
  },
}); 