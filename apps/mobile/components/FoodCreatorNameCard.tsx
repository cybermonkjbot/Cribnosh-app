import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { TiltCard } from './ui/TiltCard';

interface FoodCreatorNameCardProps {
  avatarUri?: string | { uri: string };
  name?: string;
  description?: string;
  tiltEnabled?: boolean;
}

export function FoodCreatorNameCard({
  name,
  description,
  tiltEnabled = true,
}: FoodCreatorNameCardProps) {
  const displayName = typeof name === 'string' && name.trim() ? name : 'Stans FoodCreator';
  const displayDesc = typeof description === 'string' && description.trim() ? description : 'African cuisine (Top Rated)';

  const cardContent = (
    <View style={styles.container}>
      {/* Texts */}
      <View style={styles.textContainer}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.description}>{displayDesc}</Text>
      </View>
      {/* Details Button */}
      <TouchableOpacity style={styles.button}>
        <View style={styles.buttonInner}>
          <Svg width={16} height={16} viewBox="0 0 4 6" fill="none">
            <Path d="M0 5.5V0.5L4 3L0 5.5Z" fill="#FAFFFA" />
          </Svg>
        </View>
      </TouchableOpacity>
    </View>
  );

  // Wrap with TiltCard if enabled
  if (tiltEnabled) {
    return (
      <TiltCard
        intensity={4}
        enabled={tiltEnabled}
        springConfig={{
          damping: 25,
          stiffness: 180,
          mass: 0.7,
        }}
      >
        {cardContent}
      </TiltCard>
    );
  }

  return cardContent;
}


const styles = StyleSheet.create({
  container: {
    flex: 1, // flex-1
    minHeight: 74, // min-h-[74px]
    backgroundColor: '#FAFFFA', // bg-[#FAFFFA]
    borderRadius: 22, // rounded-[22px]
    flexDirection: 'row', // flex-row
    alignItems: 'center', // items-center
    shadowColor: '#383838', // shadow-[#383838]
    shadowOpacity: 0.05, // shadow-opacity-5
    shadowOffset: { width: 0, height: 10 }, // shadow-lg
    shadowRadius: 3,
    elevation: 5,
    marginVertical: 10, // my-2.5
    paddingHorizontal: 16, // px-4
  },
  textContainer: {
    flex: 1, // flex-1
    justifyContent: 'center', // justify-center
  },
  name: {
    fontFamily: 'Poppins', // font-['Poppins']
    fontWeight: '500', // font-medium
    fontSize: 18, // text-[18px]
    color: '#4C3F59', // text-[#4C3F59]
    marginBottom: 2, // mb-[2px]
  },
  description: {
    fontFamily: 'Lato', // font-['Lato']
    fontWeight: '400', // font-normal
    fontSize: 14, // text-[14px]
    color: '#53465E', // text-[#53465E]
    letterSpacing: 0.03, // tracking-[0.03em]
  },
  button: {
    width: 32, // w-8
    height: 32, // h-8
    justifyContent: 'center', // justify-center
    alignItems: 'center', // items-center
  },
  buttonInner: {
    width: 24, // w-6
    height: 24, // h-6
    borderRadius: 9999, // rounded-full
    backgroundColor: '#4C3F59', // bg-[#4C3F59]
    justifyContent: 'center', // justify-center
    alignItems: 'center', // items-center
  },
});

export default FoodCreatorNameCard;
